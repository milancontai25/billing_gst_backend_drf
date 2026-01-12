import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
  Search, Eye, X, Download, Filter, FileSpreadsheet, Check 
} from 'lucide-react';

const Orders = () => {
  // --- STATE ---
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, completed: 0 });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  // Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

    // 1. Status Filter
    if (statusFilter !== 'All') {
      result = result.filter(o => o.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // 2. Payment Filter
    if (paymentFilter !== 'All') {
      result = result.filter(o => o.payment_status.toLowerCase() === paymentFilter.toLowerCase());
    }

    // 3. Search Filter
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
    
    const headers = ["Order #", "Customer", "Date", "Amount", "Payment", "Status"];
    const rows = filteredOrders.map(o => [
      o.order_number,
      o.customer_name,
      new Date(o.date).toLocaleDateString(),
      o.total_amount,
      o.payment_status,
      o.status
    ]);

    const csvContent = [
        headers.join(","), 
        ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  // Handle Status Update
  const handleStatusUpdate = async (orderNumber, newStatus) => {
    try {
      const updatedOrders = orders.map(o => 
        o.order_number === orderNumber ? { ...o, status: newStatus } : o
      );
      setOrders(updatedOrders);
      calculateStats(updatedOrders);

      await api.patch(`/orders/${orderNumber}/update-status/`, {
        status: newStatus,
        payment_status: updatedOrders.find(o => o.order_number === orderNumber).payment_status
      });
    } catch (err) {
      alert("Failed to update status");
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
        <div className="stat-card bg-blue-50">
          <div className="stat-content">
            <span className="stat-title">Total Orders</span>
            <span className="stat-number">{stats.total}</span>
          </div>
        </div>
        <div className="stat-card bg-yellow-50">
          <div className="stat-content">
            <span className="stat-title">Pending</span>
            <span className="stat-number">{stats.pending}</span>
          </div>
        </div>
        <div className="stat-card bg-purple-50">
          <div className="stat-content">
            <span className="stat-title">Processing</span>
            <span className="stat-number">{stats.processing}</span>
          </div>
        </div>
        <div className="stat-card bg-white-50">
          <div className="stat-content">
            <span className="stat-title">Shipped</span>
            <span className="stat-number">{stats.shipped}</span>
          </div>
        </div>
        <div className="stat-card bg-green-50">
          <div className="stat-content">
            <span className="stat-title">Completed</span>
            <span className="stat-number">{stats.completed}</span>
          </div>
        </div>
      </div>

      {/* 2. ORDER LIST CARD */}
      <div className="card-box mt-6">
        <div className="card-header-row">
          <h3>Order Management</h3>
          <p className="text-sm text-gray-500">Manage and track all customer orders</p>
        </div>

        {/* --- TOOLBAR --- */}
        <div className="table-toolbar">
          
          {/* A. SEARCH (Left - Grows automatically) */}
          <div className="search-box">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search order # or customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* B. ACTION BUTTONS (Right - Export & Filter) */}
          <div className="action-buttons">
            
            {/* Export Button */}
            <button className="btn btn-gray" onClick={handleExport}>
               <FileSpreadsheet size={16} /> Export
            </button>

            {/* Filter Button */}
            <div style={{ position: 'relative' }}>
              <button 
                  className={`btn btn-outline ${statusFilter !== 'All' || paymentFilter !== 'All' ? 'text-blue-600 border-blue-200 bg-blue-50' : ''}`} 
                  onClick={() => setShowFilter(!showFilter)}
              >
                  <Filter size={16} /> 
                  {statusFilter === 'All' && paymentFilter === 'All' ? 'Filter' : 'Filters Active'}
              </button>

              {/* Filter Dropdown */}
              {showFilter && (
                <div className="dropdown-menu wide-dropdown" style={{ width: '280px', right: 0, display:'flex', flexDirection:'column' }}>
                  <div style={{ display: 'flex' }}>
                      <div className="dropdown-section" style={{ flex: 1, borderRight: '1px solid #eee' }}>
                          <div className="dropdown-label">Status</div>
                          {['All', 'Pending', 'Confirmed', 'Processing', 'Received', 'Cancelled'].map(status => (
                              <div key={status} className={`dropdown-option ${statusFilter === status ? 'active' : ''}`} onClick={() => setStatusFilter(status)}>
                                  {status}
                              </div>
                          ))}
                      </div>
                      
                      <div className="dropdown-section" style={{ flex: 1 }}>
                          <div className="dropdown-label">Payment</div>
                          {['All', 'Paid', 'Unpaid'].map(pmt => (
                              <div key={pmt} className={`dropdown-option ${paymentFilter === pmt ? 'active' : ''}`} onClick={() => setPaymentFilter(pmt)}>
                                  {pmt}
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="dropdown-footer" onClick={clearFilters} style={{ padding: '8px', textAlign: 'center', borderTop: '1px solid #eee', color: '#EF4444', cursor: 'pointer', fontSize:'12px', fontWeight:'600' }}>
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
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                 <tr><td colSpan="7" className="text-center p-6 text-gray-500">No orders found.</td></tr>
              ) : (
                 filteredOrders.map((order) => (
                   <OrderRow 
                     key={order.order_number} 
                     order={order} 
                     onStatusUpdate={handleStatusUpdate} 
                     onView={openOrderDetails} 
                   />
                 ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. ORDER DETAILS MODAL */}
      {showModal && selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

// --- SUB-COMPONENTS ---

const OrderRow = ({ order, onStatusUpdate, onView }) => {
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

  const getPaymentColor = (s) => s.toLowerCase() === 'paid' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';

  return (
    <tr>
      <td className="text-blue-600 font-medium">{order.order_number}</td>
      <td>
        <div className="font-medium text-dark">{order.customer_name}</div>
        <div className="text-xs text-gray-500">{order.customer_email}</div>
      </td>
      <td>{new Date(order.date).toLocaleDateString()}</td>
      <td className="font-bold">₹{order.total_amount}</td>
      <td>
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getPaymentColor(order.payment_status)}`}>
          {order.payment_status}
        </span>
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

const OrderDetailsModal = ({ order, onClose }) => (
  <div className="modal-overlay">
    <div className="modal-box order-modal">
      <div className="modal-header-simple">
        <div>
          <h2 className="text-xl font-bold">Order Details</h2>
          <p className="text-sm text-gray-500">#{order.order_number} • {new Date(order.date).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
           <button className="btn btn-blue flex items-center gap-2">
              <Download size={16} /> Bill
           </button>
           <button className="close-btn-simple" onClick={onClose}>
              <X size={24} />
           </button>
        </div>
      </div>

      <div className="modal-content scrollable-form">
        <div className="info-section bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Customer</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p> <p className="font-medium">{order.customer_name}</p>
            </div>
            <div>
              <p className="text-gray-500">Contact</p> <p className="font-medium">{order.customer_phone}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500">Address</p> 
              <p className="font-medium">{order.customer_address || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="items-section mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3">Items</h4>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="p-2">Item</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Price</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 font-medium">{item.product_name}</td>
                  <td className="p-2 text-center">{item.quantity}</td>
                  <td className="p-2 text-right">₹{item.price}</td>
                  <td className="p-2 text-right font-bold">₹{item.subtotal}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="p-3 text-right font-bold text-lg">Total</td>
                <td className="p-3 text-right font-bold text-lg text-blue-600">₹{order.total_amount}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {order.special_notes && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800 border border-blue-100">
            <strong>Note:</strong> {order.special_notes}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default Orders;