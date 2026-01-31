import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, ArrowRight, Loader2, Plus, Minus, Trash2 } from 'lucide-react';
import '../assets/css/storefront.css';

const CartDrawer = ({ isOpen, onClose, slug }) => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  const getHeaders = () => {
    const token = localStorage.getItem('customer_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : null;
  };

  const fetchCart = async () => {
    const config = getHeaders();
    if (!config) return; 
    try {
      if (!cart) setLoading(true); 
      const res = await axios.get(`${API_BASE_URL}/api/v1/customer/cart/`, config);
      setCart(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, action) => {
    const config = getHeaders();
    if (!config) return;
    try {
      setUpdatingId(itemId); 
      await axios.post(
        `${API_BASE_URL}/api/v1/customer/cart/update/`,
        { item: itemId, action: action },
        config
      );
      await fetchCart();
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update cart");
    } finally {
      setUpdatingId(null); 
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
              {cart.items.map((item) => {
                 // --- PRICE LOGIC ---
                 // Use gross_amount as selling price (fallback to price)
                 console.log(item)
                 const sellingPrice = item.gross_amount ? parseFloat(item.gross_amount) : parseFloat(item.mrp_baseprice);
                 // Use mrp_baseprice as MRP (fallback to sellingPrice if no MRP exists)
                 const mrp = item.mrp_baseprice ? parseFloat(item.mrp_baseprice) : sellingPrice;
                 const hasDiscount = mrp > sellingPrice;

                 return (
                    <div key={item.id} className="cart-item-card">
                        
                        {/* 1. LEFT: IMAGE */}
                        <div className="cart-item-image">
                            {item.item_image ? (
                                <img src={item.item_image} alt={item.item_name} />
                            ) : (
                                <div className="placeholder-cart-img">{item.item_name ? item.item_name.charAt(0) : 'P'}</div>
                            )}
                        </div>

                        {/* 2. RIGHT: DETAILS */}
                        <div className="cart-item-details">
                            
                            {/* TOP ROW: Title & Delete */}
                            <div className="cart-item-top">
                                <h4 className="cart-item-title">{item.item_name}</h4>
                                <button 
                                    className="delete-item-btn" 
                                    onClick={() => handleUpdateQuantity(item.item, 'remove')} 
                                    disabled={updatingId === item.item}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* BOTTOM ROW: Price & Quantity */}
                            <div className="cart-item-bottom">
                                {/* Price Section */}
                                <div className="cart-price-group">
                                    <span className="cart-price-selling">₹{sellingPrice}</span>
                                    {hasDiscount && (
                                        <span className="cart-price-mrp">₹{mrp}</span>
                                    )}
                                </div>

                                {/* Quantity Control (Pill Style) */}
                                <div className="cart-qty-wrapper">
                                    <button 
                                        className="qty-btn-sm" 
                                        disabled={updatingId === item.item}
                                        onClick={() => handleUpdateQuantity(item.item, 'decrease')}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    
                                    <span className="qty-val-sm">
                                        {updatingId === item.item ? <Loader2 size={12} className="animate-spin"/> : item.quantity}
                                    </span>
                                    
                                    <button 
                                        className="qty-btn-sm" 
                                        disabled={updatingId === item.item}
                                        onClick={() => handleUpdateQuantity(item.item, 'increase')}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                 );
              })}
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
              onClick={() => { onClose(); navigate(`/${slug}/checkout`); }}
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