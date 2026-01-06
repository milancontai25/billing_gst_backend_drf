import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import CreateInvoice from './CreateInvoice';
import InvoiceViewer from './InvoiceViewer'; // <--- IMPORT THE VIEWER
import { Plus, Printer, Eye, Filter, FileSpreadsheet } from 'lucide-react';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  
  // --- MODAL STATES ---
  const [showCreate, setShowCreate] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null); // Tracks which invoice to view
  
  // --- FILTER STATES ---
  const [filterStatus, setFilterStatus] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices/');
      setInvoices(res.data);
      setFilteredInvoices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  // --- FILTER LOGIC ---
  useEffect(() => {
    if (filterStatus === 'All') {
      setFilteredInvoices(invoices);
    } else {
      setFilteredInvoices(invoices.filter(inv => inv.status === filterStatus));
    }
  }, [filterStatus, invoices]);

  // --- EXPORT LOGIC ---
  const handleExport = () => {
    if (filteredInvoices.length === 0) return alert("No data to export");
    const headers = ["Date", "Invoice ID", "Customer", "Status", "Amount"];
    const rows = filteredInvoices.map(inv => [
      new Date(inv.created_at || Date.now()).toLocaleDateString(),
      inv.invoice_id,
      inv.customer_name,
      inv.status,
      inv.total_value || inv.total_amount
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `invoices_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const handlePrint = () => {
    window.print(); 
  };

  return (
    <div className="page-content">
      
      <div className="action-bar">
        <h2 className="section-title">Invoices & Bills</h2>
        <div className="action-buttons">
           {/* Export */}
           <button className="btn btn-gray" onClick={handleExport}>
             <FileSpreadsheet size={16} /> Export
           </button>

           {/* Filter */}
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

           {/* Create New */}
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
              <th>Status</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((inv) => (
              <tr key={inv.id}>
                <td>{new Date(inv.created_at || Date.now()).toLocaleDateString()}</td>
                <td>{inv.invoice_id}</td>
                <td>{inv.customer_name}</td>
                <td>
                    <span className={inv.status === 'Paid' ? 'text-green' : 'text-red'} style={{fontWeight:600}}>
                        {inv.status}
                    </span>
                </td>
                <td>₹{inv.total_value || inv.total_amount || 0}</td>
                
                <td className="action-cells">
                   {/* VIEW BUTTON */}
                   <button 
                     className="action-btn" 
                     onClick={() => setSelectedInvoiceId(inv.id)}
                     title="View Details"
                   >
                     <Eye size={16} color="#64748b"/>
                   </button>
                   
                   {/* PRINT BUTTON (Opens Viewer) */}
                   <button 
                     className="action-btn" 
                     onClick={handlePrint}
                     title="Print Invoice"
                   >
                     <Printer size={16} color="#3b82f6"/>
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- RENDER MODALS --- */}

      {/* 1. Create Invoice Modal */}
      {showCreate && (
        <CreateInvoice 
            onClose={() => setShowCreate(false)} 
            onSuccess={() => { setShowCreate(false); fetchInvoices(); }} 
        />
      )}

      {/* 2. View/Print Invoice Modal */}
      {selectedInvoiceId && (
        <InvoiceViewer 
            invoiceId={selectedInvoiceId} 
            onClose={() => setSelectedInvoiceId(null)} 
        />
      )}

    </div>
  );
};

export default Invoices;