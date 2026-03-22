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
    total_gst, round_off, net_payable 
  } = invoice;

  const items = items_details || invoice_items || [];
  const isPaid = ['paid', 'completed'].includes(status?.toLowerCase());
  const badgeBg = isPaid ? '#D1FAE5' : '#FEE2E2';
  const badgeText = isPaid ? '#059669' : '#DC2626';
  const statusText = isPaid ? 'PAID' : 'UNPAID';
  const displayDate = date || created_at || Date.now();

  // --- CHECK IF ANY DISCOUNT EXISTS ---
  const hasAnyDiscount = parseFloat(discount_amount || 0) > 0 || items.some(item => parseFloat(item.discount_amount || 0) > 0);

  return (
    <div className="modal-overlay" style={{zIndex: 1000}}>
      <div className="modal-box" style={{ width: '950px', height: '95vh', display: 'flex', flexDirection: 'column', background:'#f3f4f6' }}>
        
        <div className="modal-header" style={{ background:'white', borderBottom: '1px solid #e5e7eb', padding: '15px 25px' }}>
          <h2 style={{ fontSize: '18px', fontWeight:'600' }}>Tax Invoice Preview</h2>
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
            style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '50px', color: '#374151', fontFamily: '"Inter", sans-serif', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', position: 'relative' }}
          >
            
            {/* --- 1. BUSINESS HEADER & DOCUMENT TITLE --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E5E7EB', paddingBottom: '30px', marginBottom: '30px' }}>
              <div style={{ maxWidth: '60%' }}>
                <div style={{ marginBottom: '15px' }}>
                   {business?.logo_bucket_url ? (
                      <img src={getImageUrl(business.logo_bucket_url)} alt="Logo" style={{ height: '45px', objectFit: 'contain', objectPosition: 'left' }}/>
                   ) : (
                      <div style={{ width: '45px', height: '45px', background: '#2563EB', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                        {business?.business_name?.charAt(0) || 'B'}
                      </div>
                   )}
                </div>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {business?.business_name || 'Your Business Name'}
                </h2>
                <div style={{ lineHeight: '1.6', fontSize: '13px', color: '#6B7280' }}>
                  {business?.owner_name && <div>{business.owner_name}</div>}
                  {business?.address}
                  {(business?.district || business?.state) && <div>{business.district}, {business.state} {business.pin}</div>}
                  {business?.country && <div>{business.country}</div>}
                  {business?.gst_number && <div style={{ marginTop:'4px', fontWeight: '600', color: '#374151' }}>GSTIN: {business.gst_number}</div>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', letterSpacing: '1px', margin: 0 }}>TAX INVOICE</h1>
              </div>
            </div>

            {/* --- 2. BILLED TO & META INFO --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              
              <div style={{ minWidth: '250px' }}>
                <h3 style={{ fontSize: '12px', color: '#2563EB', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  BILLED TO
                </h3>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                  {customer_name || `Customer ID: ${customer}`}
                </div>
                <div style={{ lineHeight: '1.6', fontSize: '14px', color: '#6B7280' }}>
                  {customer_address || "Address Not Provided"}<br/>
                  {customer_phone && <span>{customer_phone}<br/></span>}
                  {customer_email}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                   <div style={{ background: badgeBg, color: badgeText, padding: '4px 16px', borderRadius: '9999px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px' }}>
                      {statusText}
                   </div>
                </div>
                <table style={{ borderCollapse: 'collapse', float: 'right', fontSize: '14px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '6px 20px 6px 0', color: '#6B7280', textAlign: 'left' }}>Invoice #:</td>
                      <td style={{ padding: '6px 0', fontWeight: '600', color: '#111827', textAlign: 'right' }}>{invoice_id}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 20px 6px 0', color: '#6B7280', textAlign: 'left' }}>Invoice Date:</td>
                      <td style={{ padding: '6px 0', fontWeight: '600', color: '#111827', textAlign: 'right' }}>{new Date(displayDate).toLocaleDateString('en-GB')}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 20px 6px 0', color: '#6B7280', textAlign: 'left' }}>Payment Mode:</td>
                      <td style={{ padding: '6px 0', fontWeight: '600', color: '#111827', textAlign: 'right' }}>{payment_mode || 'Cash'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* --- 3. DETAILED TABLE --- */}
            <div style={{ marginBottom: '30px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #2563EB' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Item Details</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Rate</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>BaseAmt</th>
                    {/* CONDITIONALLY RENDER DISCOUNT COLUMN */}
                    {hasAnyDiscount && (
                      <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Disc</th>
                    )}
                    <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', background: '#eef2ff' }}>Taxable</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>GST</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '16px 8px', verticalAlign: 'middle', fontWeight: '600', color: '#111827', fontSize: '14px' }}>
                        {item.item_name || `Item ID: ${item.item}`}
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right', verticalAlign: 'middle', color: '#4B5563', fontSize: '14px' }}>₹{parseFloat(item.rate).toFixed(2)}</td>
                      <td style={{ padding: '16px 8px', textAlign: 'center', verticalAlign: 'middle', color: '#4B5563', fontSize: '14px' }}>{item.quantity}</td>
                      <td style={{ padding: '16px 8px', textAlign: 'right', verticalAlign: 'middle', color: '#4B5563', fontSize: '14px' }}>₹{parseFloat(item.base_amount).toFixed(2)}</td>
                      
                      {/* CONDITIONALLY RENDER DISCOUNT CELL */}
                      {hasAnyDiscount && (
                        <td style={{ padding: '16px 8px', textAlign: 'right', verticalAlign: 'middle', color: '#6B7280', fontSize: '14px' }}>
                            {parseFloat(item.discount_amount) > 0 ? (
                                <>-₹{parseFloat(item.discount_amount).toFixed(2)} ({parseFloat(item.discount_percent).toFixed(1)}%)</>
                            ) : (
                                "-"
                            )}
                        </td>
                      )}

                      <td style={{ padding: '16px 8px', textAlign: 'right', verticalAlign: 'middle', color: '#4B5563', fontSize: '14px' }}>
                        {parseFloat(item.taxable_amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right', verticalAlign: 'middle', color: '#6B7280', fontSize: '14px' }}>
                          ₹{parseFloat(item.gst_amount).toFixed(2)} ({parseFloat(item.gst_percent).toFixed(1)}%)
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right', verticalAlign: 'middle', color: '#4B5563', fontSize: '14px' }}>{parseFloat(item.total_value).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --- 4. NOTES & TOTALS CARD --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              
              <div style={{ width: '45%', paddingRight: '20px' }}>
                {note && (
                  <>
                    <h4 style={{ fontSize: '12px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</h4>
                    <p style={{ color: '#4B5563', fontSize: '13px', lineHeight: '1.6' }}>{note}</p>
                  </>
                )}
              </div>

              {/* Totals Rounded Box */}
              <div style={{ width: '320px', background: '#F9FAFB', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#4B5563' }}>
                  <span>Total Base Amount</span><span>₹{parseFloat(total_base_amount).toFixed(2)}</span>
                </div>

                {/* CONDITIONALLY RENDER TOTAL DISCOUNT */}
                {parseFloat(discount_amount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#4B5563' }}>
                    <span>Total Discount</span><span>-₹{parseFloat(discount_amount).toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#4B5563' }}>
                  <span>Total Taxable Amount</span><span>₹{parseFloat(total_taxable_amount).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#4B5563' }}>
                  <span>Total GST</span><span>₹{parseFloat(total_gst).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#4B5563' }}>
                  <span>Round Off</span><span>{parseFloat(round_off).toFixed(2)}</span>
                </div>
                
                <div style={{ borderTop: '1px dashed #D1D5DB', margin: '16px 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: '#2563EB' }}>Net Payable</span>
                  <span style={{ fontSize: '22px', fontWeight: '800', color: '#2563EB' }}>{parseFloat(net_payable).toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280', fontStyle: 'italic' }}>
                  <span>Payments ({payment_mode || 'Cash'})</span>
                  <span>(₹{isPaid ? parseFloat(net_payable).toFixed(2) : '0.00'})</span>
                </div>
              </div>
            </div>

            {/* --- 5. FOOTER --- */}
            <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', borderTop: '1px solid #E5E7EB', paddingTop: '15px', color: '#9CA3AF', fontSize: '12px', textAlign: 'center' }}>
              <p style={{ margin:0 }}>Thank you for your business!</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewer;