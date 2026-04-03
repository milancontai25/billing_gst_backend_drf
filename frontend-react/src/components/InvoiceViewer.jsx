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
    round_off, net_payable 
  } = invoice;

  const items = items_details || invoice_items || [];
  const isPaid = ['paid', 'completed'].includes(status?.toLowerCase());
  const badgeBg = isPaid ? '#d1fae5' : '#fee2e2';
  const badgeText = isPaid ? '#059669' : '#dc2626';
  const statusText = isPaid ? 'PAID' : 'UNPAID';
  const displayDate = date || created_at || Date.now();

  // --- RECONSTRUCT TRUE LINEAR MATH USING DATABASE VALUES ---
  let trueTotalBase = 0;
  let trueTotalDisc = 0;
  let trueTotalTaxable = 0;
  let trueTotalTax = 0;

  const processedItems = items.map(item => {
      // CreateInvoice saved the true base rate to the DB, so we just use it
      const displayRate = parseFloat(item.rate || 0); 
      const qty = parseInt(item.quantity || 1);
      
      const displayBaseAmt = displayRate * qty;
      
      // ✅ FIX: Read the exact discount amount saved by the backend
      const displayDiscAmount = parseFloat(item.discount_amount || 0);
      
      // ✅ FIX: Taxable is simply Base - Discount
      const displayTaxable = displayBaseAmt - displayDiscAmount;
      
      const displayTaxAmt = parseFloat(item.tax_amount || 0);

      trueTotalBase += displayBaseAmt;
      trueTotalDisc += displayDiscAmount;
      trueTotalTaxable += displayTaxable;
      trueTotalTax += displayTaxAmt;

      return {
          ...item,
          displayRate,
          displayBaseAmt,
          displayTaxable,
          displayDiscAmount,
          displayTaxAmt
      };
  });

  const hasAnyDiscount = trueTotalDisc > 0;
  const hasAnyTax = trueTotalTax > 0;

  return (
    <div className="modal-overlay" style={{zIndex: 1000}}>
      <div className="modal-box" style={{ width: '950px', height: '95vh', display: 'flex', flexDirection: 'column', background:'#f8fafc' }}>
        
        <div className="modal-header" style={{ background:'white', borderBottom: '1px solid #e2e8f0', padding: '15px 25px' }}>
          <h2 style={{ fontSize: '18px', fontWeight:'600' }}>Tax Invoice Preview</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-blue" onClick={handleDownload} disabled={downloading} style={{ minWidth: '140px' }}>
              {downloading ? <><Loader size={16} className="animate-spin"/> Generating...</> : <><Download size={16}/> Download PDF</>}
            </button>
            <button className="close-btn" onClick={onClose}><X size={20}/></button>
          </div>
        </div>

        <div className="scrollable-form" style={{ flex: 1, padding: '20px', display:'flex', justifyContent:'center' }}>
          
          <div ref={printRef} style={{ width: '210mm', minHeight: '297mm', background: 'white', padding: '50px', color: '#334155', fontFamily: '"Inter", sans-serif', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', position: 'relative' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '30px', marginBottom: '30px' }}>
              <div style={{ maxWidth: '60%' }}>
                <div style={{ marginBottom: '15px' }}>
                   {business?.logo_bucket_url ? (
                      <img src={getImageUrl(business.logo_bucket_url)} alt="Logo" style={{ height: '45px', objectFit: 'contain', objectPosition: 'left' }}/>
                   ) : (
                      <div style={{ width: '45px', height: '45px', background: '#3b82f6', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                        {business?.business_name?.charAt(0) || 'B'}
                      </div>
                   )}
                </div>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {business?.business_name || 'Your Business Name'}
                </h2>
                <div style={{ lineHeight: '1.6', fontSize: '13px', color: '#64748b' }}>
                  {business?.owner_name && <div>{business.owner_name}</div>}
                  {business?.address}
                  {(business?.district || business?.state) && <div>{business.district}, {business.state} {business.pin}</div>}
                  {business?.country && <div>{business.country}</div>}
                  {business?.gst_number && <div style={{ marginTop:'4px', fontWeight: '600', color: '#475569' }}>GSTIN: {business.gst_number}</div>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '1px', margin: 0 }}>TAX INVOICE</h1>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div style={{ minWidth: '250px' }}>
                <h3 style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  BILLED TO
                </h3>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                  {customer_name || `Customer ID: ${customer}`}
                </div>
                <div style={{ lineHeight: '1.6', fontSize: '14px', color: '#64748b' }}>
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
                      <td style={{ padding: '6px 20px 6px 0', color: '#64748b', textAlign: 'left' }}>Invoice #:</td>
                      <td style={{ padding: '6px 0', fontWeight: '600', color: '#0f172a', textAlign: 'right' }}>{invoice_id}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 20px 6px 0', color: '#64748b', textAlign: 'left' }}>Invoice Date:</td>
                      <td style={{ padding: '6px 0', fontWeight: '600', color: '#0f172a', textAlign: 'right' }}>{new Date(displayDate).toLocaleDateString('en-GB')}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 20px 6px 0', color: '#64748b', textAlign: 'left' }}>Payment Mode:</td>
                      <td style={{ padding: '6px 0', fontWeight: '600', color: '#0f172a', textAlign: 'right' }}>{payment_mode || 'Cash'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #3b82f6' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Item Details</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Rate</th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>BaseAmt</th>
                    {hasAnyDiscount && (
                      <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Disc</th>
                    )}
                    <th style={{ textAlign: 'center', padding: '12px 12px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', background: '#eef2ff' }}>Taxable</th>
                    {hasAnyTax && (
                      <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Tax</th>
                    )}
                    <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {processedItems.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px 8px', verticalAlign: 'middle', fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>
                        {item.item_name || `Item ID: ${item.item}`}
                        {parseFloat(item.tax_percent) > 0 && <div style={{fontSize: '11px', color: '#94a3b8', fontWeight: 'normal', marginTop: '2px'}}>{item.tax_type || 'Tax'}</div>}
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right', verticalAlign: 'middle', color: '#475569', fontSize: '14px' }}>₹{item.displayRate.toFixed(2)}</td>
                      <td style={{ padding: '16px 8px', textAlign: 'center', verticalAlign: 'middle', color: '#475569', fontSize: '14px' }}>{item.quantity}</td>
                      <td style={{ padding: '16px 8px', textAlign: 'right', verticalAlign: 'middle', color: '#475569', fontSize: '14px' }}>₹{item.displayBaseAmt.toFixed(2)}</td>
                      
                      {hasAnyDiscount && (
                        <td style={{ padding: '16px 8px', textAlign: 'right', verticalAlign: 'middle', color: '#64748b', fontSize: '14px' }}>
                            {item.displayDiscAmount > 0 ? (
                                <>-₹{item.displayDiscAmount.toFixed(2)} <span style={{fontSize:'12px'}}>({parseFloat(item.discount_percent).toFixed(1)}%)</span></>
                            ) : (
                                "-"
                            )}
                        </td>
                      )}

                      <td style={{ padding: '16px 12px', textAlign: 'center', verticalAlign: 'middle', color: '#2563eb', fontSize: '15px', background: '#eef2ff', fontWeight: '600' }}>
                        {item.displayTaxable.toFixed(2)}
                      </td>

                      {hasAnyTax && (
                        <td style={{ padding: '16px 8px', textAlign: 'right', verticalAlign: 'middle', color: '#64748b', fontSize: '14px' }}>
                            {item.displayTaxAmt > 0 ? (
                                <>₹{item.displayTaxAmt.toFixed(2)} <span style={{fontSize:'12px'}}>({parseFloat(item.tax_percent).toFixed(1)}%)</span></>
                            ) : (
                                "-"
                            )}
                        </td>
                      )}

                      <td style={{ padding: '16px 8px', textAlign: 'right', verticalAlign: 'middle', color: '#0f172a', fontSize: '15px', fontWeight: '700' }}>{parseFloat(item.total_value || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              
              <div style={{ width: '45%', paddingRight: '20px' }}>
                {note && (
                  <>
                    <h4 style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</h4>
                    <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.6' }}>{note}</p>
                  </>
                )}
              </div>

              <div style={{ width: '320px', background: '#f8fafc', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
                  <span>Total Base Amount</span><span>₹{trueTotalBase.toFixed(2)}</span>
                </div>

                {hasAnyDiscount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
                    <span>Total Discount</span><span style={{color:'#ef4444'}}>-₹{trueTotalDisc.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
                  <span>Total Taxable Amount</span><span>₹{trueTotalTaxable.toFixed(2)}</span>
                </div>
                
                {hasAnyTax && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
                    <span>Total Tax</span><span>₹{trueTotalTax.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
                  <span>Round Off</span><span>{parseFloat(round_off || 0).toFixed(2)}</span>
                </div>
                
                <div style={{ borderTop: '1px dashed #cbd5e1', margin: '16px 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: '#3b82f6' }}>Net Payable</span>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: '#3b82f6' }}>{parseFloat(net_payable || 0).toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                  <span>Payments ({payment_mode || 'Cash'})</span>
                  <span>(₹{isPaid ? parseFloat(net_payable || 0).toFixed(2) : '0.00'})</span>
                </div>
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '15px', color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>
              <p style={{ margin:0 }}>Thank you for your business!</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewer;