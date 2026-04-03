import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import CreateInvoice from './CreateInvoice';
import InvoiceViewer from './InvoiceViewer'; 
import { Plus, Printer, Eye, Filter, FileSpreadsheet } from 'lucide-react';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  
  const [showCreate, setShowCreate] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null); 
  
  const [filterStatus, setFilterStatus] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices/');
      setInvoices(res.data);
      setFilteredInvoices(res.data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  useEffect(() => {
    if (filterStatus === 'All') {
      setFilteredInvoices(invoices);
    } else {
      setFilteredInvoices(invoices.filter(inv => inv.status === filterStatus));
    }
  }, [filterStatus, invoices]);

  const handleExport = () => {
    if (filteredInvoices.length === 0) return alert("No data to export");
    
    const headers = ["Date", "Invoice ID", "Customer", "Payment Mode", "Status", "Amount", "Notes"];
    
    const rows = filteredInvoices.map(inv => [
      new Date(inv.created_at || inv.date || Date.now()).toLocaleDateString(),
      inv.invoice_id,
      inv.customer_name || `Customer ID: ${inv.customer}`, 
      inv.payment_mode || 'N/A',
      inv.status,
      inv.net_payable, 
      `"${(inv.note || '').substring(0, 50)}"` 
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invoices_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <div className="page-content">
      <div className="action-bar">
        <h2 className="section-title">Invoices & Bills</h2>
        <div className="action-buttons">
           <button className="btn btn-gray" onClick={handleExport}>
             <FileSpreadsheet size={16} /> Export
           </button>

           <div style={{position: 'relative'}}>
             <button className="btn btn-outline" onClick={() => setShowFilter(!showFilter)}>
               <Filter size={16} /> {filterStatus === 'All' ? 'Filter' : filterStatus}
             </button>
             {showFilter && (
               <div className="dropdown-menu">
                 <div onClick={() => {setFilterStatus('All'); setShowFilter(false)}}>All</div>
                 <div onClick={() => {setFilterStatus('Paid'); setShowFilter(false)}}>Paid</div>
                 <div onClick={() => {setFilterStatus('Unpaid'); setShowFilter(false)}}>Unpaid</div>
               </div>
             )}
           </div>

           <button className="btn btn-blue" onClick={() => setShowCreate(true)}>
             <Plus size={16}/> New Invoice
           </button>
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice ID</th>
              <th>Customer</th>
              <th>Payment Mode</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
               <tr><td colSpan="7" className="text-center p-5 text-gray-500">No invoices found.</td></tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id || inv.invoice_id}>
                  <td>{new Date(inv.created_at || inv.date || Date.now()).toLocaleDateString()}</td>
                  <td className="font-medium text-blue-600">{inv.invoice_id}</td>
                  <td>{inv.customer_name || `Customer #${inv.customer}`}</td>
                  
                  <td>
                      <span className="badge bg-gray-100 text-gray-700">
                          {inv.payment_mode || 'N/A'}
                      </span>
                  </td>

                  <td>
                      <span className={`badge ${inv.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {inv.status}
                      </span>
                  </td>
                  
                  <td className="font-bold">₹{inv.net_payable}</td>
                  
                  <td className="action-cells">
                     <button className="action-btn" onClick={() => setSelectedInvoiceId(inv.id || inv.invoice_id)} title="View Details">
                       <Eye size={16} color="#64748b"/>
                     </button>
                     <button className="action-btn" onClick={() => setSelectedInvoiceId(inv.id || inv.invoice_id)} title="Open & Print">
                       <Printer size={16} color="#3b82f6"/>
                     </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateInvoice onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); fetchInvoices(); }} />
      )}

      {selectedInvoiceId && (
        <InvoiceViewer invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />
      )}

    </div>
  );
};

export default Invoices;