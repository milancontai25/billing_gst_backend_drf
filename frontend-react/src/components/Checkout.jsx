import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CreditCard, Loader2, CheckCircle, User, Phone, Mail } from 'lucide-react';
import '../assets/css/storefront.css';

const Checkout = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // Default to CASH

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  const getHeaders = () => {
    const token = localStorage.getItem('customer_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : null;
  };

  useEffect(() => {
    const fetchPreview = async () => {
      const config = getHeaders();
      if (!config) return navigate(`/store/${slug}`); // Redirect if not logged in

      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/v1/customer/cart/checkout/preview/`, config);
        setPreview(res.data);
        setLoading(false);
      } catch (err) {
        alert("Failed to load checkout preview.");
        navigate(`/store/${slug}`);
      }
    };
    fetchPreview();
  }, [slug, navigate]);

  const handlePlaceOrder = async () => {
    const config = getHeaders();
    try {
      setPlacingOrder(true);
      await axios.post(
        `${API_BASE_URL}/api/v1/customer/cart/checkout/cash/`, 
        { payment_method: paymentMethod },
        config
      );
      alert("Order Placed Successfully!");
      navigate(`/store/${slug}/orders`); // Redirect to history
    } catch (err) {
      alert("Failed to place order.");
      setPlacingOrder(false);
    }
  };

  if (loading) return <div className="loading-container">Loading Checkout...</div>;

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Header */}
        <div className="checkout-header">
           <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={20}/></button>
           <h2>Checkout</h2>
        </div>

        <div className="checkout-grid">
           {/* LEFT: Shipping & Payment */}
           <div className="checkout-main">
              {/* Address Section */}
              <div className="section-card">
                 {/* <div className="card-header"><MapPin size={18} /> Delivery Address</div> */}
                 <div className="card-body">
                    <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <User size={16} color="#6B7280" />
                      <strong>{preview.customer.name}</strong>
                    </p>

                    <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Phone size={16} color="#6B7280" />
                      {preview.customer.phone}
                    </p>
                    
                    <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={16} color="#6B7280" />
                      {preview.customer.email}
                    </p>
  
                    {/* <p>{preview.customer.address || "No address provided (Defaulting to Store Pickup/Default)"}</p> */}
                 </div>
              </div>

              {/* Payment Section */}
              <div className="section-card">
                 <div className="card-header"><CreditCard size={18} /> Payment Method</div>
                 <div className="card-body">
                    <label className={`payment-option ${paymentMethod === 'CASH' ? 'active' : ''}`}>
                       <input 
                         type="radio" 
                         name="payment" 
                         checked={paymentMethod === 'CASH'} 
                         onChange={() => setPaymentMethod('CASH')} 
                       />
                       <span>Payment at Store</span>
                    </label>
                    {/* Placeholder for future Online Payment */}
                    <label className="payment-option disabled">
                       <input type="radio" name="payment" disabled />
                       <span>Online Payment</span>
                    </label>
                 </div>
              </div>
           </div>

           {/* RIGHT: Order Summary */}
           <div className="checkout-sidebar">
              <div className="summary-card">
                 <h3>Order Summary</h3>
                 <div className="summary-items">
                    {preview.items.map((item, idx) => (
                      <div key={idx} className="summary-item">
                        <span>{item.qty} x {item.name}</span>
                        <span>₹{item.subtotal}</span>
                      </div>
                    ))}
                 </div>
                 <div className="summary-divider"></div>
                 <div className="summary-total">
                    <span>Total Amount</span>
                    <span>₹{preview.total_amount}</span>
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