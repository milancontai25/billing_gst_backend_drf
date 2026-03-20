import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axiosConfig';
import { X, Download, Loader } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  return `${API_BASE_URL}${imagePath}`;
};

const InvoiceViewer = ({ invoiceId, onClose }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
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
  }, [invoiceId, onClose]);

  const handleDownload = async () => {
    const element = printRef.current;
    if (!element) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const ratio = Math.min(pdf.internal.pageSize.getWidth() / canvas.width, pdf.internal.pageSize.getHeight() / canvas.height);
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * ratio, canvas.height * ratio);
      pdf.save(`Invoice_${invoice.invoice_id}.pdf`);
      setDownloading(false);
    } catch (error) {
      alert("Download failed");
      setDownloading(false);
    }
  };

  if (loading) return <div className="modal-overlay"><div className="loading-screen">Loading Invoice...</div></div>;
  if (!invoice) return null;

  const { 
    business, items_details, invoice_items,
    customer_name, customer_email, customer_phone, customer_address, customer, 
    invoice_id, date, created_at, status, payment_mode, note,
    total_base_amount, discount_amount, total_taxable_amount, 
    total_gst, total_value, round_off, net_payable 
  } = invoice;

  const items = items_details || invoice_items || [];
  const isPaid = ['paid', 'completed'].includes(status?.toLowerCase());
  const statusColor = isPaid ? '#16A34A' : '#DC2626'; 
  const statusText = isPaid ? 'PAID' : 'UNPAID';
  const displayDate = date || created_at || Date.now();

  return (
    <div className="modal-overlay" style={{zIndex: 1000}}>
      <div className="modal-box" style={{ width: '900px', height: '95vh', display: 'flex', flexDirection: 'column', background:'#f3f4f6' }}>
        
        <div className="modal-header" style={{ background:'white', borderBottom: '1px solid #e5e7eb', padding: '15px 25px' }}>
          <h2 style={{ fontSize: '18px', fontWeight:'600' }}>Invoice Preview</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-blue" onClick={handleDownload} disabled={downloading} style={{ minWidth: '140px' }}>
              {downloading ? <><Loader size={16} className="animate-spin"/> Generating...</> : <><Download size={16}/> Download PDF</>}
            </button>
            <button className="close-btn" onClick={onClose}><X size={20}/></button>
          </div>
        </div>

        <div className="scrollable-form" style={{ flex: 1, padding: '20px', display:'flex', justifyContent:'center' }}>
          
          <div 
            ref={printRef} 
            style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '50px 40px', color: '#4B5563', fontFamily: '"Inter", sans-serif', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', position: 'relative' }}
          >
            
            {/* 1. HEADER SECTION */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div style={{ maxWidth: '50%' }}>
                <div style={{ marginBottom: '15px' }}>
                   {business?.logo_bucket_url ? (
                      <img src={getImageUrl(business.logo_bucket_url)} alt="Logo" style={{ height: '40px', objectFit: 'contain', objectPosition: 'left' }}/>
                   ) : (
                      <div style={{ width: '45px', height: '45px', background: '#673DE6', color: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                        {business?.business_name?.charAt(0) || 'B'}
                      </div>
                   )}
                </div>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {business?.business_name || 'Your Business Name'}
                </h2>
                <div style={{ lineHeight: '1.5', fontSize: '12px' }}>
                  {business?.owner_name && <div>{business.owner_name}</div>}
                  {business?.address}
                  {(business?.district || business?.state) && <div>{business.district}, {business.state} {business.pin}</div>}
                  {business?.country && <div>{business.country}</div>}
                  {business?.gst_number && <div style={{ marginTop:'6px' }}>GST Reg #: {business.gst_number}</div>}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#2C2C2C', margin: '0 0 20px 0', letterSpacing: '1px' }}>INVOICE</h1>
                <table style={{ borderCollapse: 'collapse', float: 'right', fontSize: '12px' }}>
                  <tbody>
                    <tr><td style={{ padding: '3px 15px 3px 0', color: '#6B7280' }}>Invoice #</td><td style={{ padding: '3px 0', fontWeight: '600', color: '#111827' }}>{invoice_id}</td></tr>
                    <tr><td style={{ padding: '3px 15px 3px 0', color: '#6B7280' }}>Invoice Date</td><td style={{ padding: '3px 0', fontWeight: '600', color: '#111827' }}>{new Date(displayDate).toLocaleDateString()}</td></tr>
                    <tr><td style={{ padding: '3px 15px 3px 0', color: '#6B7280' }}>Payment Mode</td><td style={{ padding: '3px 0', fontWeight: '600', color: '#111827' }}>{payment_mode || 'N/A'}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. STATUS & BILLED TO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div style={{ marginTop: '10px' }}>
                 <div style={{ fontSize: '28px', fontWeight: '900', color: statusColor, border: `4px solid ${statusColor}`, padding: '5px 20px', borderRadius: '6px', display: 'inline-block', letterSpacing: '2px', transform: 'rotate(-5deg)', opacity: 0.25 }}>
                    {statusText}
                 </div>
              </div>
              <div style={{ minWidth: '220px', textAlign: 'right' }}>
                <h3 style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>BILLED TO</h3>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>{customer_name || `Customer ID: ${customer}`}</div>
                <div style={{ lineHeight: '1.6', fontSize: '12px' }}>{customer_address || "Address Not Provided"}<br/>{customer_email}<br/>{customer_phone}</div>
              </div>
            </div>

            {/* 3. DETAILED TABLE WITH ALL MATH BREAKDOWNS */}
            <div style={{ marginBottom: '30px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                    <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: '11px', color: '#4B5563', textTransform: 'uppercase' }}>Item Details</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: '11px', color: '#4B5563', textTransform: 'uppercase' }}>Rate</th>
                    <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: '11px', color: '#4B5563', textTransform: 'uppercase' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: '11px', color: '#4B5563', textTransform: 'uppercase' }}>BaseAmt</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: '11px', color: '#4B5563', textTransform: 'uppercase' }}>Disc</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: '11px', color: '#4B5563', textTransform: 'uppercase', background: '#eef2ff' }}>Taxable</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: '11px', color: '#4B5563', textTransform: 'uppercase' }}>GST</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: '11px', color: '#111827', textTransform: 'uppercase' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '600', color: '#1F2937', fontSize: '12px' }}>{item.item_name || `Item ID: ${item.item}`}</div>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', verticalAlign: 'top', color: '#4B5563' }}>₹{item.rate}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'center', verticalAlign: 'top', color: '#4B5563' }}>{item.quantity}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', verticalAlign: 'top', color: '#4B5563' }}>₹{item.base_amount}</td>
                      
                      <td style={{ padding: '12px 8px', textAlign: 'right', verticalAlign: 'top', color: '#EF4444' }}>
                          -₹{item.discount_amount} <br/><span style={{fontSize:'9px', color:'#9CA3AF'}}>({parseFloat(item.discount_percent).toFixed(1)}%)</span>
                      </td>
                      
                      <td style={{ padding: '12px 8px', textAlign: 'right', verticalAlign: 'top', color: '#1D4ED8', fontWeight: '600', background: '#eef2ff' }}>
                        ₹{item.taxable_amount}
                      </td>
                      
                      <td style={{ padding: '12px 8px', textAlign: 'right', verticalAlign: 'top', color: '#4B5563' }}>
                          ₹{item.gst_amount} <br/><span style={{fontSize:'9px', color:'#9CA3AF'}}>({parseFloat(item.gst_percent).toFixed(1)}%)</span>
                      </td>
                      
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '700', verticalAlign: 'top', color: '#111827' }}>₹{item.total_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. NOTES & TOTALS SECTION */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '45%', paddingRight: '20px' }}>
                {note && (
                  <>
                    <h4 style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Notes</h4>
                    <p style={{ color: '#4B5563', fontSize: '12px', lineHeight: '1.5', background: '#F9FAFB', padding: '10px', borderRadius: '6px' }}>{note}</p>
                  </>
                )}
              </div>

              <div style={{ width: '280px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#4B5563' }}>
                  <span>Total Base Amount</span><span>₹{total_base_amount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#4B5563' }}>
                  <span>Total Discount</span><span style={{ color: '#DC2626' }}>-₹{discount_amount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#1D4ED8', fontWeight: '600' }}>
                  <span>Total Taxable Amount</span><span>₹{total_taxable_amount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#4B5563' }}>
                  <span>Total GST</span><span>₹{total_gst}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#4B5563' }}>
                  <span>Round Off</span><span>{round_off}</span>
                </div>
                
                <div style={{ borderTop: '2px solid #E5E7EB', margin: '15px 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>Net Payable</span>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: '#111827' }}>₹{net_payable}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', color: '#6B7280' }}>
                  <span>Payments ({payment_mode || 'Cash'})</span>
                  <span>(₹{isPaid ? net_payable : '0.00'})</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', background: '#F9FAFB', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>Amount Due</span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: isPaid ? '#16A34A' : '#DC2626' }}>
                    ₹{isPaid ? '0.00' : net_payable}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', borderTop: '1px solid #E5E7EB', paddingTop: '15px', color: '#9CA3AF', fontSize: '11px', textAlign: 'center' }}>
              <p style={{ margin:0 }}>Thank you for your business!</p>
              <p style={{ margin:'5px 0 0 0' }}>{business?.owner_name ? `Questions? Contact ${business.owner_name}` : 'Generated by StatGrow'}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewer;