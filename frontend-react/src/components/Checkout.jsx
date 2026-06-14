import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; 
import { ArrowLeft, CreditCard, Loader2, CheckCircle, User, Phone, Mail, Upload, FileText, ShieldCheck, MapPin, Edit3 } from 'lucide-react';
import '../assets/css/storefront.css';

const Checkout = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 

  const isBuyNow = location.state?.isBuyNow || false;
  const buyNowItem = location.state?.buyNowItems?.[0] || null;

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  
  // --- ADDRESS STATE ---
  const [addressData, setAddressData] = useState({
    name: '', phone: '', email: '', address: '',
    country: '', state: '', district: '', pin: '', gstin: ''
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // --- FORM STATE ---
  const [paymentMethod, setPaymentMethod] = useState('CASH'); 
  const [onlineType, setOnlineType] = useState('UPI'); 
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
        
        let previewUrl = `${API_BASE_URL}/api/v1/customer/cart/checkout/preview/`;
        if (isBuyNow && buyNowItem) {
            previewUrl += `?is_buy_now=true&item_id=${buyNowItem.product_id}&quantity=${buyNowItem.quantity}`;
        }

        const res = await axios.get(previewUrl, config);
        const data = res.data;
        setPreview(data);

        // --- EXTRACT & VALIDATE ADDRESS ---
        const cust = data?.customer || {};
        const initialAddress = {
            name: cust.name || '',
            phone: cust.phone || '',
            email: cust.email || '',
            address: cust.address || '',
            country: cust.country || '',
            state: cust.state || '',
            district: cust.district || '',
            pin: cust.pin || '',
            gstin: cust.gstin || ''
        };
        setAddressData(initialAddress);

        // If any required field is missing, force Edit Mode
        const isComplete = initialAddress.name && initialAddress.phone && 
                           initialAddress.address && initialAddress.country && 
                           initialAddress.state && initialAddress.district && 
                           initialAddress.pin && String(initialAddress.pin).length === 6;
        
        setIsEditingAddress(!isComplete);

        // --- PAYMENT DEFAULTS ---
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
        alert(err.response?.data?.error || "Failed to load checkout preview.");
        navigate(`/${slug}`);
      }
    };
    fetchPreview();
  }, [slug, navigate, isBuyNow, buyNowItem]); 

  // --- ADDRESS HANDLERS ---
  const handleAddressChange = (e) => {
      setAddressData({ ...addressData, [e.target.name]: e.target.value });
  };

  const handleSaveAddress = async () => {
      // Basic Frontend Validation matching your Serializer
      if (!addressData.name || !addressData.phone || !addressData.address || 
          !addressData.country || !addressData.state || !addressData.district || !addressData.pin) {
          return alert("Please fill in all required address fields.");
      }
      if (String(addressData.pin).length !== 6) {
          return alert("PIN must be exactly 6 digits.");
      }

      setSavingAddress(true);
      try {
          // Adjust this URL if your Django route is strictly '/customer/profile/address/' without api/v1
          await axios.patch(
              `${API_BASE_URL}/api/v1/customer/profile/address/`, 
              addressData, 
              getHeaders()
          );
          alert("Address updated successfully!");
          setIsEditingAddress(false);
      } catch (err) {
          console.error(err);
          alert("Failed to update address. Please check your inputs.");
      } finally {
          setSavingAddress(false);
      }
  };


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
      const payload = { special_notes: specialNotes };
      if (isBuyNow && buyNowItem) {
          payload.is_buy_now = true;
          payload.item_id = buyNowItem.product_id;
          payload.quantity = buyNowItem.quantity;
      }

      const orderRes = await axios.post(
        `${API_BASE_URL}/api/v1/customer/cart/checkout/create-gateway-order/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { rzp_order_id, amount, currency } = orderRes.data;
      const options = {
        key: preview.payment.gateway.public_key, 
        amount: amount,
        currency: currency,
        name: addressData.name,
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
          name: addressData.name,
          email: addressData.email,
          contact: addressData.phone,
        },
        theme: { color: "#0EA5E9" } 
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      
      paymentObject.on('payment.failed', function (response){
          alert("Payment Failed: " + response.error.description);
          setPlacingOrder(false);
      });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to initiate payment gateway.");
      setPlacingOrder(false);
    }
  };

  // --- MASTER SUBMIT HANDLER ---
  const handlePlaceOrder = async () => {
    // 1. FRONTEND VALIDATION
    if (isEditingAddress) {
        return alert("Please save your address details before confirming the order.");
    }

    if (paymentMethod === 'ONLINE' && onlineType === 'UPI' && !paymentProof) {
      return alert("Please upload your payment screenshot before confirming the order.");
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
      
      const finalMethodToSend = paymentMethod === 'ONLINE' ? onlineType : 'CASH';
      formData.append('payment_method', finalMethodToSend); 
      formData.append('special_notes', specialNotes);
      
      if (isBuyNow && buyNowItem) {
          formData.append('is_buy_now', 'true');
          formData.append('item_id', buyNowItem.product_id);
          formData.append('quantity', buyNowItem.quantity);
      }

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
      
      const errorData = err.response?.data;
      if (errorData && typeof errorData === 'object' && !errorData.error) {
          const errorMessages = Object.entries(errorData)
              .map(([key, msg]) => `${key.replace('_', ' ')}: ${msg}`)
              .join('\n');
          alert(`Failed to place order. Please fix the following:\n\n${errorMessages}`);
      } else {
          alert(errorData?.error || "Failed to place order. Please check your inputs.");
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
              
              {/* --- 🌟 DYNAMIC CUSTOMER DETAILS CARD --- */}
              <div className="section-card">
                 <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div><MapPin size={18} /> Shipping & Contact Details</div>
                     {!isEditingAddress && (
                         <button className="btn-edit-text" onClick={() => setIsEditingAddress(true)}>
                             <Edit3 size={14} /> Edit
                         </button>
                     )}
                 </div>
                 
                 <div className="card-body">
                    {isEditingAddress ? (
                        <div className="address-edit-form">
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>Full Name <span className="req">*</span></label>
                                    <input type="text" name="name" value={addressData.name} onChange={handleAddressChange} className="checkout-input" />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number <span className="req">*</span></label>
                                    <input type="text" name="phone" value={addressData.phone} onChange={handleAddressChange} className="checkout-input" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" name="email" value={addressData.email} onChange={handleAddressChange} className="checkout-input" />
                            </div>
                            <div className="form-group">
                                <label>Full Address <span className="req">*</span></label>
                                <textarea name="address" value={addressData.address} onChange={handleAddressChange} className="checkout-textarea" rows="2"></textarea>
                            </div>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>District / City <span className="req">*</span></label>
                                    <input type="text" name="district" value={addressData.district} onChange={handleAddressChange} className="checkout-input" />
                                </div>
                                <div className="form-group">
                                    <label>State <span className="req">*</span></label>
                                    <input type="text" name="state" value={addressData.state} onChange={handleAddressChange} className="checkout-input" />
                                </div>
                            </div>
                            <div className="form-grid-3">
                                <div className="form-group">
                                    <label>Country <span className="req">*</span></label>
                                    <input type="text" name="country" value={addressData.country} onChange={handleAddressChange} className="checkout-input" />
                                </div>
                                <div className="form-group">
                                    <label>PIN Code <span className="req">*</span></label>
                                    <input type="text" name="pin" value={addressData.pin} onChange={handleAddressChange} maxLength="6" className="checkout-input" />
                                </div>
                                <div className="form-group">
                                    <label>GSTIN (Optional)</label>
                                    <input type="text" name="gstin" value={addressData.gstin} onChange={handleAddressChange} className="checkout-input" />
                                </div>
                            </div>
                            <button className="btn-save-address" onClick={handleSaveAddress} disabled={savingAddress}>
                                {savingAddress ? <Loader2 size={16} className="animate-spin" /> : 'Save Details'}
                            </button>
                        </div>
                    ) : (
                        <div className="address-view-mode">
                            <p className="info-row"><User size={16} color="#6B7280" /> <strong>{addressData.name}</strong></p>
                            <p className="info-row"><Phone size={16} color="#6B7280" /> {addressData.phone}</p>
                            {addressData.email && <p className="info-row"><Mail size={16} color="#6B7280" /> {addressData.email}</p>}
                            <div className="address-block">
                                <p>{addressData.address}</p>
                                <p>{addressData.district}, {addressData.state}</p>
                                <p>{addressData.country} - <strong>{addressData.pin}</strong></p>
                                {addressData.gstin && <p className="gst-text">GSTIN: {addressData.gstin}</p>}
                            </div>
                        </div>
                    )}
                 </div>
              </div>

              {/* PAYMENT SECTION */}
              <div className="section-card">
                 <div className="card-header"><CreditCard size={18} /> Payment Method</div>
                 <div className="card-body">
                    
                    {allowCash && (
                        <label className={`payment-option ${paymentMethod === 'CASH' ? 'active' : ''}`}>
                           <input type="radio" name="payment" checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} />
                           <span>Payment at Store (Cash)</span>
                        </label>
                    )}

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
                 
                 <button 
                     className="place-order-btn" 
                     onClick={handlePlaceOrder} 
                     disabled={placingOrder || isEditingAddress} /* DISABLED IF EDITING ADDRESS */
                     style={{ opacity: (placingOrder || isEditingAddress) ? 0.6 : 1, cursor: (placingOrder || isEditingAddress) ? 'not-allowed' : 'pointer' }}
                 >
                    {placingOrder ? <Loader2 className="animate-spin" /> : "Confirm Order"}
                 </button>
                 {isEditingAddress && (
                     <p style={{ color: '#EF4444', fontSize: '13px', textAlign: 'center', marginTop: '12px' }}>
                         Please save your address details before ordering.
                     </p>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;