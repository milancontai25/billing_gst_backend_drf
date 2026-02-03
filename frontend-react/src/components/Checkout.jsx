import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Loader2, CheckCircle, User, Phone, Mail, QrCode } from 'lucide-react';
import '../assets/css/storefront.css';

const Checkout = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH' or 'ONLINE'

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
        // Ensure your backend returns 'upi_qrcode_url' in this response
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
    const config = getHeaders();
    try {
      setPlacingOrder(true);
      
      // Using a generic 'process' endpoint. Ensure your backend supports this URL
      // or allows the 'payment_method' field to dictate logic.
      await axios.post(
        `${API_BASE_URL}/api/v1/customer/cart/checkout/process/`, 
        { payment_method: paymentMethod },
        config
      );
      
      alert("Order Placed Successfully!");
      navigate(`/${slug}/orders`);
    } catch (err) {
      console.error(err);
      alert("Failed to place order. Please try again.");
      setPlacingOrder(false);
    }
  };

  if (loading) return <div className="loading-container"><Loader2 className="animate-spin" /> Loading...</div>;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        
        {/* Header */}
        <div className="checkout-header">
           <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20}/></button>
           <h2>Checkout</h2>
        </div>

        <div className="checkout-grid">
           
           {/* LEFT: Details & Payment */}
           <div className="checkout-main">
              
              {/* Customer Details */}
              <div className="section-card">
                 <div className="card-header"><User size={18} /> Customer Details</div>
                 <div className="card-body">
                    <p className="info-row">
                      <User size={16} color="#6B7280" /> <strong>{preview?.customer?.name}</strong>
                    </p>
                    <p className="info-row">
                      <Phone size={16} color="#6B7280" /> {preview?.customer?.phone}
                    </p>
                    <p className="info-row">
                      <Mail size={16} color="#6B7280" /> {preview?.customer?.email}
                    </p>
                 </div>
              </div>

              {/* Payment Method */}
              <div className="section-card">
                 <div className="card-header"><CreditCard size={18} /> Payment Method</div>
                 <div className="card-body">
                    
                    {/* Option 1: Pay at Store */}
                    <label className={`payment-option ${paymentMethod === 'CASH' ? 'active' : ''}`}>
                       <input 
                         type="radio" 
                         name="payment" 
                         checked={paymentMethod === 'CASH'} 
                         onChange={() => setPaymentMethod('CASH')} 
                       />
                       <span>Payment at Store (Cash/UPI)</span>
                    </label>

                    {/* Option 2: Online Payment */}
                    <label className={`payment-option ${paymentMethod === 'ONLINE' ? 'active' : ''}`}>
                       <input 
                         type="radio" 
                         name="payment" 
                         checked={paymentMethod === 'ONLINE'} 
                         onChange={() => setPaymentMethod('ONLINE')} 
                       />
                       <span>Online Payment (UPI QR)</span>
                    </label>

                    {/* QR Code Display Area */}
                    {paymentMethod === 'ONLINE' && (
                        <div className="qr-payment-box">
                            {preview?.upi_qrcode_url ? (
                                <>
                                    <div className="qr-wrapper">
                                        <img src={preview.upi_qrcode_url} alt="Pay via UPI" className="upi-qr-img" />
                                    </div>
                                    <p className="qr-instruction">Scan this QR code with any UPI App (GPay, PhonePe, Paytm) to pay <strong>₹{preview.total_amount}</strong></p>
                                    <div className="qr-note">
                                        <CheckCircle size={14} /> Click "Confirm Order" after payment.
                                    </div>
                                </>
                            ) : (
                                <p className="error-text">QR Code not available. Please select Payment at Store.</p>
                            )}
                        </div>
                    )}

                 </div>
              </div>
           </div>

           {/* RIGHT: Order Summary */}
           <div className="checkout-sidebar">
              <div className="summary-card">
                 <h3>Order Summary</h3>
                 <div className="summary-items">
                    {preview?.items?.map((item, idx) => (
                      <div key={idx} className="summary-item">
                        <span>{item.qty || item.quantity} x {item.name || item.item_name}</span>
                        <span>₹{item.subtotal}</span>
                      </div>
                    ))}
                 </div>
                 <div className="summary-divider"></div>
                 <div className="summary-total">
                    <span>Total Amount</span>
                    <span>₹{preview?.total_amount}</span>
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