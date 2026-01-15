import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, ArrowRight, Loader2, Plus, Minus, Trash2 } from 'lucide-react';
import '../assets/css/storefront.css';

const CartDrawer = ({ isOpen, onClose, slug }) => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Track which specific item is currently updating to show a spinner on just that item
  const [updatingId, setUpdatingId] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  // const API_BASE = 

  // Helper for Auth Headers
  const getHeaders = () => {
    const token = localStorage.getItem('customer_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : null;
  };

  const fetchCart = async () => {
    const config = getHeaders();
    if (!config) return; 

    try {
      // Don't set full loading on refresh to prevent flickering
      if (!cart) setLoading(true); 
      const res = await axios.get(`${API_BASE_URL}/api/v1/customer/cart/`, config);
      setCart(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // --- NEW: UPDATE QUANTITY HANDLER ---
  const handleUpdateQuantity = async (itemId, action) => {
    const config = getHeaders();
    if (!config) return;

    try {
      setUpdatingId(itemId); // Lock buttons for this item
      
      await axios.post(
        `${API_BASE_URL}/api/v1/customer/cart/update/`,
        { item: itemId, action: action },
        config
      );

      // Refresh cart to get updated totals/subtotals from backend
      await fetchCart();
      
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update cart");
    } finally {
      setUpdatingId(null); // Unlock buttons
    }
  };

  useEffect(() => {
    if (isOpen) fetchCart();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose}></div>
      <div className="drawer-content">
        <div className="drawer-header">
          <h3>Your Cart ({cart?.items?.length || 0})</h3>
          <button className="close-btn" onClick={onClose}><X size={24}/></button>
        </div>

        <div className="drawer-body">
          {loading ? (
            <div className="loading-state"><Loader2 className="animate-spin" /> Loading Cart...</div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={48} color="#D1D5DB"/>
              <p>Your cart is empty.</p>
              <button className="btn-text" onClick={onClose}>Start Shopping</button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.items.map((item) => (
                <div key={item.id} className="cart-item">
                   
                   {/* Left: Info */}
                   <div className="item-info">
                     <h4>{item.item_name}</h4>
                     <p className="item-unit-price">₹{item.price} / unit</p>
                     
                     {/* QUANTITY CONTROLS */}
                     <div className="qty-controls">
                        <button 
                          className="qty-btn" 
                          disabled={updatingId === item.item}
                          onClick={() => handleUpdateQuantity(item.item, 'decrease')}
                        >
                          <Minus size={14} />
                        </button>
                        
                        <span className="qty-val">
                            {updatingId === item.item ? <Loader2 size={12} className="animate-spin"/> : item.quantity}
                        </span>
                        
                        <button 
                          className="qty-btn"
                          disabled={updatingId === item.item}
                          onClick={() => handleUpdateQuantity(item.item, 'increase')}
                        >
                          <Plus size={14} />
                        </button>
                     </div>
                   </div>

                   {/* Right: Price */}
                   <div className="item-price">
                     ₹{item.subtotal}
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart && cart.items.length > 0 && (
          <div className="drawer-footer">
            <div className="total-row">
              <span>Total Amount</span>
              <span className="total-val">₹{cart.total_amount}</span>
            </div>
            <button 
              className="checkout-btn" 
              onClick={() => { onClose(); navigate(`/store/${slug}/checkout`); }}
            >
              Proceed to Checkout <ArrowRight size={18}/>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;