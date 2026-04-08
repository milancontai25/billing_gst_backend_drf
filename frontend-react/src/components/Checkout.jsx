import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Loader2, CheckCircle, User, Phone, Mail, Upload, FileText, ShieldCheck } from 'lucide-react';
import '../assets/css/storefront.css';

const Checkout = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  
  // Form State
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' or 'ONLINE'
  const [onlineType, setOnlineType] = useState('UPI'); // 'GATEWAY' or 'UPI'
  const [specialNotes, setSpecialNotes] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  const getHeaders = () => {
    const token = localStorage.getItem('customer_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : null;
  };

  useEffect(() => {
    const fetchPreview = async () => {
      const config = getHeaders();
      if (!config) return navigate(`/${slug}`);

      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/v1/customer/cart/checkout/preview/`, config);
        const data = res.data;
        setPreview(data);

        // Smart Defaults based on available_methods array
        const availableMethods = data?.payment?.available_methods || [];
        
        if (availableMethods.includes('CASH') || availableMethods.length === 0) {
            setPaymentMethod('CASH');
        } else if (availableMethods.includes('GATEWAY') || availableMethods.includes('UPI')) {
            setPaymentMethod('ONLINE');
            if (availableMethods.includes('GATEWAY')) setOnlineType('GATEWAY');
            else setOnlineType('UPI');
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        alert("Failed to load checkout preview.");
        navigate(`/${slug}`);
      }
    };
    fetchPreview();
  }, [slug, navigate]);

  // --- RAZORPAY INTEGRATION ---
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleGatewayPayment = async () => {
    const res = await loadRazorpayScript();
    if (!res) {
      alert('Failed to load Payment Gateway SDK.');
      setPlacingOrder(false);
      return;
    }

    const token = localStorage.getItem('customer_token');
    try {
      const orderRes = await axios.post(
        `${API_BASE_URL}/api/v1/customer/cart/checkout/create-gateway-order/`,
        { special_notes: specialNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { rzp_order_id, amount, currency } = orderRes.data;
      const options = {
        key: preview.payment.gateway.public_key, // Exact path from your API
        amount: amount,
        currency: currency,
        name: preview.customer.name,
        description: "Store Purchase",
        order_id: rzp_order_id, 
        handler: async function (response) {
          try {
             await axios.post(
                `${API_BASE_URL}/api/v1/customer/cart/checkout/verify-gateway/`,
                {
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature
                },
                { headers: { Authorization: `Bearer ${token}` } }
             );
             alert("Payment Successful!");
             navigate(`/${slug}/orders`);
          } catch (verifyErr) {
             alert("Payment verification failed! Please contact support.");
             setPlacingOrder(false);
          }
        },
        prefill: {
          name: preview.customer.name,
          email: preview.customer.email,
          contact: preview.customer.phone,
        },
        theme: { color: "#0EA5E9" } // Light Blue theme
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      
      paymentObject.on('payment.failed', function (response){
          alert("Payment Failed: " + response.error.description);
          setPlacingOrder(false);
      });
    } catch (err) {
      console.error(err);
      alert("Failed to initiate payment gateway.");
      setPlacingOrder(false);
    }
  };

// --- MASTER SUBMIT HANDLER ---
  const handlePlaceOrder = async () => {
    // 1. FRONTEND VALIDATION: Prevent 400 error if user forgets screenshot
    if (paymentMethod === 'ONLINE' && onlineType === 'UPI' && !paymentProof) {
      alert("Please upload your payment screenshot before confirming the order.");
      return;
    }

    setPlacingOrder(true);
    
    // 2. GATEWAY FLOW
    if (paymentMethod === 'ONLINE' && onlineType === 'GATEWAY') {
        await handleGatewayPayment();
        return; 
    }

    const token = localStorage.getItem('customer_token');
    if (!token) {
        setPlacingOrder(false);
        return;
    }

    try {
      const formData = new FormData();
      
      // ✅ THE FIX: Send the exact method Django expects ('CASH' or 'UPI')
      const finalMethodToSend = paymentMethod === 'ONLINE' ? onlineType : 'CASH';
      formData.append('payment_method', finalMethodToSend); 
      
      formData.append('special_notes', specialNotes);
      
      if (attachment) {
          formData.append('attachment', attachment); 
      }
      
      if (finalMethodToSend === 'UPI' && paymentProof) {
          formData.append('payment_proof', paymentProof); 
      }

      await axios.post(
        `${API_BASE_URL}/api/v1/customer/cart/checkout/process/`, 
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("Order Placed Successfully!");
      navigate(`/${slug}/orders`);
      
    } catch (err) {
      console.error("Backend Error Details:", err.response?.data || err);
      
      // ✅ BETTER ERROR ALERT: Show exactly what Django is complaining about
      const errorData = err.response?.data;
      if (errorData && typeof errorData === 'object') {
          // Extracts Django error like: "payment_proof: This field is required."
          const errorMessages = Object.entries(errorData)
              .map(([key, msg]) => `${key.replace('_', ' ')}: ${msg}`)
              .join('\n');
          alert(`Failed to place order. Please fix the following:\n\n${errorMessages}`);
      } else {
          alert("Failed to place order. Please check your inputs.");
      }
      
      setPlacingOrder(false);
    }
  };

  const handleFileChange = (e, setFile) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  if (loading) return <div className="loading-container"><Loader2 className="animate-spin" /> Loading...</div>;

  // Clean data extraction based on your 4 API cases
  const availableMethods = preview?.payment?.available_methods || [];
  const allowCash = availableMethods.includes('CASH') || availableMethods.length === 0;
  const allowGateway = availableMethods.includes('GATEWAY') && !!preview?.payment?.gateway;
  const allowUpi = availableMethods.includes('UPI') && !!preview?.payment?.upi;
  const hasOnlineOptions = allowGateway || allowUpi;

  const qrCodeUrl = preview?.payment?.upi?.upi_qrcode_url;
  const upiId = preview?.payment?.upi?.upi_id;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        
        <div className="checkout-header">
           <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20}/></button>
           <h2>Checkout</h2>
        </div>

        <div className="checkout-grid">
           
           {/* LEFT COLUMN: Customer & Payment */}
           <div className="checkout-main">
              <div className="section-card">
                 <div className="card-header"><User size={18} /> Customer Details</div>
                 <div className="card-body">
                    <p className="info-row"><User size={16} color="#6B7280" /> <strong>{preview?.customer?.name}</strong></p>
                    <p className="info-row"><Phone size={16} color="#6B7280" /> {preview?.customer?.phone}</p>
                    <p className="info-row"><Mail size={16} color="#6B7280" /> {preview?.customer?.email}</p>
                    {preview?.customer?.address && (
                        <p className="info-row"><CheckCircle size={16} color="#6B7280" /> {preview.customer.address}</p>
                    )}
                 </div>
              </div>

              <div className="section-card">
                 <div className="card-header"><CreditCard size={18} /> Payment Method</div>
                 <div className="card-body">
                    
                    {/* Pay at Store Option */}
                    {allowCash && (
                        <label className={`payment-option ${paymentMethod === 'CASH' ? 'active' : ''}`}>
                           <input type="radio" name="payment" checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} />
                           <span>Payment at Store (Cash)</span>
                        </label>
                    )}

                    {/* Online Payment Master Toggle */}
                    {hasOnlineOptions && (
                        <label className={`payment-option ${paymentMethod === 'ONLINE' ? 'active' : ''}`}>
                           <input type="radio" name="payment" checked={paymentMethod === 'ONLINE'} onChange={() => {
                               setPaymentMethod('ONLINE');
                               if (allowGateway) setOnlineType('GATEWAY');
                               else if (allowUpi) setOnlineType('UPI');
                           }} />
                           <span>Pay Online</span>
                        </label>
                    )}

                    {/* Online Sub-Options & Upload Box */}
                    {paymentMethod === 'ONLINE' && hasOnlineOptions && (
                        <div className="online-sub-options" style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '10px' }}>
                            
                            {allowGateway && (
                                <label className={`payment-option ${onlineType === 'GATEWAY' ? 'active' : ''}`} style={{ background: 'white', marginBottom: '12px' }}>
                                    <input type="radio" name="online_type" checked={onlineType === 'GATEWAY'} onChange={() => setOnlineType('GATEWAY')} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ShieldCheck size={18} color="#0EA5E9" />
                                        <span>Cards, UPI, Netbanking (Instant)</span>
                                    </div>
                                </label>
                            )}

                            {allowUpi && (
                                <label className={`payment-option ${onlineType === 'UPI' ? 'active' : ''}`} style={{ background: 'white', marginBottom: '0' }}>
                                    <input type="radio" name="online_type" checked={onlineType === 'UPI'} onChange={() => setOnlineType('UPI')} />
                                    <span>Manual UPI Transfer</span>
                                </label>
                            )}

                            {onlineType === 'UPI' && qrCodeUrl && (
                                <div className="qr-payment-box">
                                    <div className="qr-wrapper">
                                        <img src={qrCodeUrl} alt="Pay via UPI" className="upi-qr-img" />
                                    </div>
                                    <p className="qr-instruction">
                                        Scan to pay <strong>₹{preview?.summary?.net_payable || preview?.net_payable || preview?.summary?.total_value || preview?.total_value || 0}</strong> 
                                        {upiId ? ` to ${upiId}` : ''}
                                    </p>
                                    
                                    <div className="file-upload-box">
                                        <label className="upload-label">Upload Payment Screenshot <span className="req">*</span></label>
                                        <div className="custom-file-input">
                                            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setPaymentProof)} />
                                            <div className="file-display">
                                                <Upload size={16} /> 
                                                <span>{paymentProof ? paymentProof.name : "Choose File"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                 </div>
              </div>
           </div>

           {/* RIGHT COLUMN: Additional Info & Summary */}
           <div className="checkout-sidebar">
              <div className="section-card" style={{ marginBottom: '24px' }}>
                 <div className="card-header"><FileText size={18} /> Additional Information</div>
                 <div className="card-body">
                    <div className="form-group">
                        <label>Special Notes (Optional)</label>
                        <textarea className="checkout-textarea" placeholder="Any instructions for your order..." rows="3" value={specialNotes} onChange={(e) => setSpecialNotes(e.target.value)}></textarea>
                    </div>
                    <div className="form-group">
                        <label>Attach Document (Optional)</label>
                        <div className="custom-file-input">
                            <input type="file" onChange={(e) => handleFileChange(e, setAttachment)} />
                            <div className="file-display">
                                <Upload size={16} /> 
                                <span>{attachment ? attachment.name : "Upload File"}</span>
                            </div>
                        </div>
                        <small className="hint-text">Any prescription or reference document.</small>
                    </div>
                 </div>
              </div>

              {/* DETAILED ORDER SUMMARY */}
              <div className="summary-card">
                 <h3>Order Summary</h3>
                 <div className="summary-items">
                    {preview?.items?.map((item, idx) => (
                      <div key={idx} className="summary-item">
                        <span>{item.qty || item.quantity} x {item.name || item.item_name}</span>
                        <span>₹{item.total_value || item.price}</span>
                      </div>
                    ))}
                 </div>
                 
                 <div className="summary-divider"></div>

                 <div className="summary-breakdown">
                    <div className="summary-row">
                        <span>Item Total</span>
                        <span>₹{preview?.summary?.total_base_amount || preview?.total_base_amount || preview?.total_amount || 0}</span>
                    </div>

                    {(preview?.summary?.discount_amount || preview?.discount_amount) && parseFloat(preview?.summary?.discount_amount || preview?.discount_amount) > 0 ? (
                        <div className="summary-row text-success">
                            <span>Discount</span>
                            <span>- ₹{preview?.summary?.discount_amount || preview?.discount_amount}</span>
                        </div>
                    ) : null}

                    {(preview?.summary?.total_tax || preview?.total_tax || preview?.total_gst) && parseFloat(preview?.summary?.total_tax || preview?.total_tax || preview?.total_gst) > 0 ? (
                        <div className="summary-row">
                            <span>Taxes</span>
                            <span>+ ₹{preview?.summary?.total_tax || preview?.total_tax || preview?.total_gst}</span>
                        </div>
                    ) : null}

                    {(preview?.summary?.round_off || preview?.round_off) && parseFloat(preview?.summary?.round_off || preview?.round_off) !== 0 ? (
                        <div className="summary-row text-muted">
                            <span>Round Off</span>
                            <span>{parseFloat(preview?.summary?.round_off || preview?.round_off) > 0 ? '+' : ''} ₹{preview?.summary?.round_off || preview?.round_off}</span>
                        </div>
                    ) : null}
                 </div>

                 <div className="summary-divider"></div>
                 
                 <div className="summary-total">
                    <span>Net Payable</span>
                    <span>₹{preview?.summary?.net_payable || preview?.net_payable || preview?.summary?.total_value || preview?.total_value || 0}</span>
                 </div>
                 
                 <button className="place-order-btn" onClick={handlePlaceOrder} disabled={placingOrder}>
                    {placingOrder ? <Loader2 className="animate-spin" /> : "Confirm Order"}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;