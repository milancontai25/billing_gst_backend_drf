import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Loader2, CheckCircle, User, Phone, Mail, Upload, FileText } from 'lucide-react';
import '../assets/css/storefront.css';

const Checkout = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  
  // Form State
  const [paymentMethod, setPaymentMethod] = useState('CASH'); 
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
        setPreview(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        alert("Failed to load checkout preview.");
        navigate(`/${slug}`);
      }
    };
    fetchPreview();
  }, [slug, navigate]);

  const handlePlaceOrder = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) return;

    try {
      setPlacingOrder(true);
      
      const formData = new FormData();
      formData.append('payment_method', paymentMethod);
      formData.append('special_notes', specialNotes);
      
      if (attachment) {
        formData.append('attachment', attachment); 
      }
      
      if (paymentMethod === 'ONLINE' && paymentProof) {
        formData.append('payment_proof', paymentProof); 
      }

      await axios.post(
        `${API_BASE_URL}/api/v1/customer/cart/checkout/process/`, 
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      alert("Order Placed Successfully!");
      navigate(`/${slug}/orders`);
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Failed to place order. Please check your inputs.");
      setPlacingOrder(false);
    }
  };

  const handleFileChange = (e, setFile) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  if (loading) return <div className="loading-container"><Loader2 className="animate-spin" /> Loading...</div>;

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
                 </div>
              </div>

              <div className="section-card">
                 <div className="card-header"><CreditCard size={18} /> Payment Method</div>
                 <div className="card-body">
                    
                    <label className={`payment-option ${paymentMethod === 'CASH' ? 'active' : ''}`}>
                       <input type="radio" name="payment" checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} />
                       <span>Payment at Store (Cash/UPI)</span>
                    </label>

                    <label className={`payment-option ${paymentMethod === 'ONLINE' ? 'active' : ''}`}>
                       <input type="radio" name="payment" checked={paymentMethod === 'ONLINE'} onChange={() => setPaymentMethod('ONLINE')} />
                       <span>Online Payment (UPI QR)</span>
                    </label>

                    {paymentMethod === 'ONLINE' && (
                        <div className="qr-payment-box">
                            {preview?.upi_qrcode_url ? (
                                <>
                                    <div className="qr-wrapper">
                                        <img src={preview.upi_qrcode_url} alt="Pay via UPI" className="upi-qr-img" />
                                    </div>
                                    <p className="qr-instruction">Scan to pay <strong>₹{preview.net_payable || preview.total_amount}</strong></p>
                                    
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
                                </>
                            ) : (
                                <p className="error-text">QR Code unavailable.</p>
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
                        <textarea 
                            className="checkout-textarea" 
                            placeholder="Any instructions for your order..." 
                            rows="3"
                            value={specialNotes}
                            onChange={(e) => setSpecialNotes(e.target.value)}
                        ></textarea>
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

              {/* --- 2. DETAILED ORDER SUMMARY --- */}
              <div className="summary-card">
                 <h3>Order Summary</h3>
                 
                 {/* Item List */}
                 <div className="summary-items">
                    {preview?.items?.map((item, idx) => (
                      <div key={idx} className="summary-item">
                        <span>{item.qty || item.quantity} x {item.name || item.item_name}</span>
                        {/* Fallback to subtotal or price if total_value isn't present */}
                        <span>₹{item.total_value || item.subtotal || item.price}</span>
                      </div>
                    ))}
                 </div>
                 
                 <div className="summary-divider"></div>

                 {/* Calculations Breakdown */}
                 <div className="summary-breakdown">
                    {/* Item Total */}
                    <div className="summary-row">
                        <span>Item Total</span>
                        <span>₹{preview?.total_base_amount || preview?.total_amount}</span>
                    </div>

                    {/* Discount */}
                    {preview?.discount_amount && parseFloat(preview.discount_amount) > 0 && (
                        <div className="summary-row text-success">
                            <span>Discount</span>
                            <span>- ₹{preview.discount_amount}</span>
                        </div>
                    )}

                    {/* GST/Taxes */}
                    {preview?.total_gst && parseFloat(preview.total_gst) > 0 && (
                        <div className="summary-row">
                            <span>Taxes (GST)</span>
                            <span>+ ₹{preview.total_gst}</span>
                        </div>
                    )}

                    {/* Round Off */}
                    {preview?.round_off && parseFloat(preview.round_off) !== 0 && (
                        <div className="summary-row text-muted">
                            <span>Round Off</span>
                            <span>{parseFloat(preview.round_off) > 0 ? '+' : ''} ₹{preview.round_off}</span>
                        </div>
                    )}
                 </div>

                 <div className="summary-divider"></div>
                 
                 {/* Final Total */}
                 <div className="summary-total">
                    <span>Net Payable</span>
                    <span>₹{preview?.net_payable || preview?.total_amount}</span>
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