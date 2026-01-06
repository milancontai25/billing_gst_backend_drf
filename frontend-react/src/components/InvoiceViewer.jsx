import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axiosConfig';
import { X, Printer, Download } from 'lucide-react';

const InvoiceViewer = ({ invoiceId, onClose }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/invoices/${invoiceId}/`);
        setInvoice(res.data);
        setLoading(false);
      } catch (err) {
        alert("Failed to load invoice details");
        onClose();
      }
    };
    if (invoiceId) fetchDetails();
  }, [invoiceId]);

  // Native Print Handler
  const handlePrint = () => {
    window.print(); // Just trigger the browser print dialog
  };

  if (loading) return <div className="modal-overlay"><div className="loading-screen">Loading Invoice...</div></div>;
  if (!invoice) return null;

  // Destructure for cleaner code
  const { business, items_details, customer_name, invoice_id, date, total_value, total_gst, net_payable, status } = invoice;

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ width: '800px', height:'95vh', display:'flex', flexDirection:'column' }}>
        
        {/* Header Actions (Not Printed) */}
        <div className="modal-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <h2>Invoice Preview</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-blue" onClick={handlePrint}>
              <Printer size={16} /> Print
            </button>
            <button className="close-btn" onClick={onClose}><X size={20}/></button>
          </div>
        </div>

        {/* --- PRINTABLE INVOICE AREA --- */}
        <div className="invoice-preview scrollable-form" ref={printRef} style={{ padding: '40px', background: 'white', color: '#111827', fontFamily: 'Inter, sans-serif' }}>
          
          {/* 1. Header: Business & Invoice Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
            
            {/* Left: Invoice Title & ID */}
            <div>
              <h1 style={{ margin: 0, fontSize: '32px', color: '#2563EB', letterSpacing: '-1px' }}>INVOICE</h1>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#6B7280' }}>#{invoice_id}</p>
              
              <div style={{ marginTop: '20px' }}>
                <span style={{ display: 'block', fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Billed To:</span>
                <strong style={{ fontSize: '16px', display: 'block', marginTop: '2px' }}>{customer_name}</strong>
                {/* Add customer address here if available in future updates */}
              </div>
            </div>

            {/* Right: Business Details (From API 'business' object) */}
            <div style={{ textAlign: 'right' }}>
              {business.logo_bucket_url ? (
                 <img src={business.logo_bucket_url} alt="Logo" style={{ height: '50px', marginBottom: '10px' }} />
              ) : (
                 <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{business.business_name}</h3>
              )}
              
              <div style={{ fontSize: '12px', color: '#4B5563', lineHeight: '1.5', marginTop: '5px' }}>
                <p style={{ margin: 0 }}>{business.address}</p>
                <p style={{ margin: 0 }}>{business.district}, {business.state} - {business.pin}</p>
                <p style={{ margin: 0 }}>{business.country}</p>
                {business.gst_number && (
                    <p style={{ margin: '5px 0 0 0', fontWeight: '600' }}>GSTIN: {business.gst_number}</p>
                )}
                <p style={{ margin: 0 }}>Phone: {business.owner_name}</p> {/* Using owner name as placeholder if phone missing */}
              </div>
            </div>
          </div>

          {/* 2. Meta Row (Date & Status) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #F3F4F6', borderBottom: '2px solid #F3F4F6', padding: '15px 0', marginBottom: '30px' }}>
            <div>
                <span style={{ fontSize: '12px', color: '#6B7280', marginRight: '10px' }}>Invoice Date:</span>
                <strong style={{ fontSize: '14px' }}>{new Date(date).toLocaleDateString()}</strong>
            </div>
            <div>
                <span style={{ fontSize: '12px', color: '#6B7280', marginRight: '10px' }}>Status:</span>
                <span style={{ 
                    fontSize: '12px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px',
                    background: status === 'Paid' ? '#DCFCE7' : '#FEE2E2',
                    color: status === 'Paid' ? '#166534' : '#991B1B'
                }}>
                    {status}
                </span>
            </div>
          </div>

          {/* 3. Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', color: '#4B5563', textTransform: 'uppercase' }}>Item Name</th>
                <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#4B5563', textTransform: 'uppercase' }}>Qty</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#4B5563', textTransform: 'uppercase' }}>Rate</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#4B5563', textTransform: 'uppercase' }}>GST</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', color: '#4B5563', textTransform: 'uppercase' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items_details.length > 0 ? (
                  items_details.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{item.item_name || 'Item'}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>{item.quantity}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>{item.rate}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px' }}>{item.gst_percent}%</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>{item.total_value}</td>
                    </tr>
                  ))
              ) : (
                  <tr>
                      <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic' }}>
                          No items in this invoice.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>

          {/* 4. Financials */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '280px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#4B5563' }}>
                <span>Subtotal:</span>
                <span>₹{total_value}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#4B5563' }}>
                <span>Total GST:</span>
                <span>+ ₹{total_gst}</span>
              </div>
              {parseFloat(invoice.discount_percent) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#16A34A' }}>
                    <span>Discount ({invoice.discount_percent}%):</span>
                    <span>Included</span>
                  </div>
              )}
              
              <div style={{ borderTop: '2px solid #E5E7EB', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>Net Payable:</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: '#2563EB' }}>₹{net_payable}</span>
              </div>
            </div>
          </div>

          {/* 5. Footer */}
          <div style={{ marginTop: '60px', paddingTop: '20px', borderTop: '1px solid #E5E7EB', textAlign: 'center', fontSize: '12px', color: '#9CA3AF' }}>
            <p style={{ margin: '0 0 5px 0' }}>Thank you for your business!</p>
            <p style={{ margin: 0 }}>This is a computer-generated invoice and does not require a signature.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InvoiceViewer;