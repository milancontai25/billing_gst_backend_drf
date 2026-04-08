import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
  Search, Eye, X, Download, Filter, FileSpreadsheet, Image as ImageIcon, ExternalLink 
} from 'lucide-react';
import OrderViewer from './OrderViewer';

const Orders = () => {
  // --- STATE ---
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, completed: 0, shipped: 0 });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Image Preview State
  const [previewImage, setPreviewImage] = useState(null);

  // --- API CALLS ---
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/');
      setOrders(res.data);
      calculateStats(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching orders", err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // --- FILTER & SEARCH LOGIC ---
  useEffect(() => {
    let result = orders;

    if (statusFilter !== 'All') {
      result = result.filter(o => o.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (paymentFilter !== 'All') {
      result = result.filter(o => o.payment_status.toLowerCase() === paymentFilter.toLowerCase());
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(o => 
        o.order_number.toLowerCase().includes(lowerTerm) || 
        o.customer_name.toLowerCase().includes(lowerTerm)
      );
    }
    setFilteredOrders(result);
  }, [searchTerm, statusFilter, paymentFilter, orders]);

  // Calculate Stats
  const calculateStats = (data) => {
    setStats({
      total: data.length,
      pending: data.filter(o => o.status.toLowerCase() === 'pending').length,
      shipped: data.filter(o => o.status.toLowerCase() === 'shipped').length,
      processing: data.filter(o => ['confirmed', 'processing'].includes(o.status.toLowerCase())).length,
      completed: data.filter(o => ['received', 'delivered', 'completed'].includes(o.status.toLowerCase())).length
    });
  };

  // --- EXPORT LOGIC ---
  const handleExport = () => {
    if (filteredOrders.length === 0) return alert("No data to export");
    
    const headers = ["Order #", "Customer", "Date", "Net Payable", "Payment", "Status", "Notes"];
    const rows = filteredOrders.map(o => [
      o.order_number,
      o.customer_name,
      new Date(o.date).toLocaleDateString(),
      o.net_payable, 
      o.payment_status,
      o.status,
      `"${o.special_notes || ''}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  // --- HANDLE UPDATES ---
  const handleStatusUpdate = async (orderNumber, newStatus) => {
    try {
      await api.patch(`/orders/${orderNumber}/update-status/`, { status: newStatus });
      const updatedOrders = orders.map(o => o.order_number === orderNumber ? { ...o, status: newStatus } : o);
      setOrders(updatedOrders);
      calculateStats(updatedOrders);
    } catch (err) { 
      alert("Failed to update status"); 
      fetchOrders(); 
    }
  };

  const handlePaymentUpdate = async (orderNumber, newPaymentStatus) => {
    try {
      await api.patch(`/orders/${orderNumber}/update-payment/`, { status: newPaymentStatus });
      const updatedOrders = orders.map(o => o.order_number === orderNumber ? { ...o, payment_status: newPaymentStatus } : o);
      setOrders(updatedOrders);
    } catch (err) { 
      // ✅ GRACEFULLY HANDLE THE BACKEND 404 ERROR
      const errorMsg = err.response?.data?.error || "Failed to update payment status.";
      alert(`Action Failed: ${errorMsg}\n\nYou can only update the status of an existing payment.`); 
      
      // Re-fetch to reset the dropdown back to its original state
      fetchOrders(); 
    }
  };

  const openOrderDetails = async (orderNumber) => {
    try {
      const res = await api.get(`/orders/${orderNumber}/`);
      setSelectedOrder(res.data);
      setShowModal(true);
    } catch (err) { console.error(err); }
  };

  const clearFilters = () => {
    setStatusFilter('All');
    setPaymentFilter('All');
    setShowFilter(false);
  };

  return (
    <div className="page-content">
      {/* 1. STATS CARDS */}
      <div className="stats-grid orders-stats">
        <StatBox title="Total Orders" value={stats.total} color="bg-blue-50" />
        <StatBox title="Pending" value={stats.pending} color="bg-yellow-50" />
        <StatBox title="Processing" value={stats.processing} color="bg-purple-50" />
        <StatBox title="Shipped" value={stats.shipped} color="bg-gray-100" />
        <StatBox title="Completed" value={stats.completed} color="bg-green-50" />
      </div>

      {/* 2. ORDER LIST CARD */}
      <div className="card-box mt-6">
        <div className="card-header-row">
          <h3>Order Management</h3>
          <p className="text-sm text-gray-500">Manage and track all customer orders</p>
        </div>

        {/* TOOLBAR */}
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search order # or customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="action-buttons">
            <button className="btn btn-gray" onClick={handleExport}>
               <FileSpreadsheet size={16} /> Export
            </button>

            <div style={{ position: 'relative' }}>
              <button 
                  className={`btn btn-outline ${statusFilter !== 'All' || paymentFilter !== 'All' ? 'text-blue-600 border-blue-200 bg-blue-50' : ''}`} 
                  onClick={() => setShowFilter(!showFilter)}
              >
                  <Filter size={16} /> 
                  {statusFilter === 'All' && paymentFilter === 'All' ? 'Filter' : 'Filters Active'}
              </button>

              {showFilter && (
                <div className="dropdown-menu wide-dropdown" style={{ width: '280px', right: 0, display:'flex', flexDirection:'column' }}>
                  <div style={{ display: 'flex' }}>
                      <div className="dropdown-section" style={{ flex: 1, borderRight: '1px solid #eee' }}>
                          <div className="dropdown-label">Status</div>
                          {['All', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Received', 'Cancelled'].map(status => (
                              <div key={status} className={`dropdown-option ${statusFilter === status ? 'active' : ''}`} onClick={() => setStatusFilter(status)}>
                                  {status}
                              </div>
                          ))}
                      </div>
                      <div className="dropdown-section" style={{ flex: 1 }}>
                          <div className="dropdown-label">Payment</div>
                          {['All', 'Paid', 'Unpaid', 'Pending', 'Refunded'].map(pmt => (
                              <div key={pmt} className={`dropdown-option ${paymentFilter === pmt ? 'active' : ''}`} onClick={() => setPaymentFilter(pmt)}>
                                  {pmt}
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="dropdown-footer" onClick={clearFilters}>
                      Clear All Filters
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-container no-shadow">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Proof</th>
                <th>Attach</th>
                <th>Notes</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                 <tr><td colSpan="10" className="text-center p-6 text-gray-500">No orders found.</td></tr>
              ) : (
                 filteredOrders.map((order) => (
                   <OrderRow 
                     key={order.order_number} 
                     order={order} 
                     onStatusUpdate={handleStatusUpdate} 
                     onPaymentUpdate={handlePaymentUpdate}
                     onView={openOrderDetails} 
                     onPreviewImage={(url) => setPreviewImage(url)}
                   />
                 ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. ORDER VIEWER */}
      {showModal && selectedOrder && (
        <OrderViewer order={selectedOrder} onClose={() => setShowModal(false)} />
      )}

      {/* 4. IMAGE PREVIEW MODAL */}
      {previewImage && (
        <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
      )}

    </div>
  );
};

// --- HELPER SUB-COMPONENTS ---

const StatBox = ({ title, value, color }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-content">
      <span className="stat-title">{title}</span>
      <span className="stat-number">{value}</span>
    </div>
  </div>
);

const OrderRow = ({ order, onStatusUpdate, onPaymentUpdate, onView, onPreviewImage }) => {
  
  const getStatusColor = (s) => {
    const status = s.toLowerCase();
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (status === 'confirmed') return 'bg-blue-100 text-blue-800';
    if (status === 'processing') return 'bg-purple-100 text-purple-800';
    if (status === 'shipped') return 'bg-indigo-100 text-indigo-800';
    if (['received', 'delivered', 'completed'].includes(status)) return 'bg-green-100 text-green-800';
    if (status === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getPaymentColor = (s) => {
      const status = s.toLowerCase();
      if (status === 'paid' || status === 'success') return 'bg-green-50 text-green-700 border-green-200';
      if (status === 'refunded') return 'bg-gray-100 text-gray-700 border-gray-300';
      if (status === 'pending') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      return 'bg-red-50 text-red-700 border-red-200'; // unpaid/failed
  };

  const latestPayment = order.payments && order.payments.length > 0 
        ? order.payments[order.payments.length - 1] 
        : null;

  return (
    <tr>
      <td className="text-blue-600 font-medium">{order.order_number}</td>
      <td>
        <div className="font-medium text-dark">{order.customer_name}</div>
        <div className="text-xs text-gray-500">{order.customer_email}</div>
      </td>
      <td>{new Date(order.date).toLocaleDateString()}</td>
      
      <td className="font-bold">₹{order.net_payable}</td>
      
      <td>
        <select 
          className={`status-select ${getPaymentColor(order.payment_status)}`}
          value={order.payment_status}
          onChange={(e) => onPaymentUpdate(order.order_number, e.target.value)}
          style={{ paddingRight: '20px' }} 
        >
          <option value="Failed">Unpaid</option>
          <option value="Pending">Pending</option>
          <option value="Success">Paid</option>
          <option value="Refunded">Refunded</option>
        </select>
      </td>

      <td className="text-center">
        {latestPayment?.payment_proof_url ? (
            <div 
                className="cursor-pointer hover:opacity-80 inline-flex items-center justify-center bg-blue-50 text-blue-600 p-2 rounded-md"
                onClick={() => onPreviewImage(latestPayment.payment_proof_url)}
                title="View Payment Proof"
            >
                <ImageIcon size={18} />
            </div>
        ) : (
            <span className="text-gray-300">-</span>
        )}
      </td>

      <td className="text-center">
        {order.attachment_url ? (
            <div 
                className="cursor-pointer hover:opacity-80 inline-flex items-center justify-center bg-purple-50 text-purple-600 p-2 rounded-md"
                onClick={() => onPreviewImage(order.attachment_url)}
                title="View Attachment"
            >
                <ImageIcon size={18} />
            </div>
        ) : (
            <span className="text-gray-300">-</span>
        )}
      </td>

      <td style={{ maxWidth: '150px' }}>
        {order.special_notes ? (
            <div className="truncate text-xs text-gray-600" title={order.special_notes}>
                {order.special_notes}
            </div>
        ) : (
            <span className="text-gray-300 text-xs">-</span>
        )}
      </td>
      
      <td>
        <select 
          className={`status-select ${getStatusColor(order.status)}`}
          value={order.status}
          onChange={(e) => onStatusUpdate(order.order_number, e.target.value)}
        >
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Received">Received</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </td>
      
      <td>
        <button className="btn-sm-outline" onClick={() => onView(order.order_number)}>
          <Eye size={14} className="mr-1 inline"/> View
        </button>
      </td>
    </tr>
  );
};

const ImagePreviewModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.target = "_blank";
        link.download = "Order_Attachment";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className="preview-modal-box"
                onClick={(e) => e.stopPropagation()} 
            >
                <button onClick={onClose} className="preview-close-btn">
                    <X size={20} />
                </button>

                <h3 className="preview-title">Image Preview</h3>

                <div className="preview-image-container">
                    <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="preview-image-full"
                    />
                </div>

                <div className="preview-actions">
                    <a 
                        href={imageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-outline"
                    >
                        <ExternalLink size={16} style={{marginRight:'8px'}} /> Open in New Tab
                    </a>
                    <button onClick={handleDownload} className="btn btn-primary">
                        <Download size={16} style={{marginRight:'8px'}} /> Download
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Orders;