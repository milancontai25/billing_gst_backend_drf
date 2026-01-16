import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { 
  Search, Eye, X, Download, Filter, FileSpreadsheet 
} from 'lucide-react';
// IMPORT THE NEW VIEWER
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
    
    const headers = ["Order #", "Customer", "Date", "Amount", "Payment", "Status"];
    const rows = filteredOrders.map(o => [
      o.order_number,
      o.customer_name,
      new Date(o.date).toLocaleDateString(),
      o.total_amount,
      o.payment_status,
      o.status
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
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

        {/* TOOLBAR (Search & Actions) */}
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

      {/* 3. ORDER VIEWER (Replaces the old Modal) */}
      {showModal && selectedOrder && (
        <OrderViewer 
            order={selectedOrder} 
            // No business prop needed here anymore!
            onClose={() => setShowModal(false)} 
        />
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

export default Orders;