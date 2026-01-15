import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Clock, CheckCircle } from 'lucide-react';
import '../assets/css/storefront.css';

const OrderHistory = () => {
  const { slug } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  
  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('customer_token');
      if (!token) return;

      try {
        setLoading(true);
        const res = await axios.get(
            `${API_BASE_URL}/api/v1/customer/orders/`, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrders(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchOrders();
  }, [slug]);

  if (loading) return <div className="loading-container">Loading Orders...</div>;

  return (
    <div className="history-page">
      <div className="history-container">
        <div className="history-header">
           <Link to={`/store/${slug}`} className="back-link"><ArrowLeft size={18}/> Back to Store</Link>
           <h1>My Orders</h1>
        </div>

        {orders.length === 0 ? (
           <div className="no-orders">
             <Package size={48} color="#9CA3AF"/>
             <p>No orders found.</p>
           </div>
        ) : (
           <div className="orders-list">
             {orders.map(order => (
               <div key={order.order_number} className="order-card">
                  <div className="order-card-header">
                     <div>
                       <span className="order-id">#{order.order_number}</span>
                       <span className="order-date">{new Date(order.date).toLocaleDateString()}</span>
                     </div>
                     <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>
                  </div>
                  
                  <div className="order-items-preview">
                     {order.order_items.map((item, i) => (
                        <div key={i} className="history-item">
                           <span>{item.quantity} x {item.product_name}</span>
                           <span>₹{item.subtotal}</span>
                        </div>
                     ))}
                  </div>
                  
                  <div className="order-card-footer">
                     <span>Total: <strong>₹{order.total_amount}</strong></span>
                     <span className="payment-status">{order.payment_status}</span>
                  </div>
               </div>
             ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;