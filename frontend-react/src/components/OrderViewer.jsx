import React, { useRef, useState } from 'react';
import { X, Download, Loader } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  return `${API_BASE_URL}${imagePath}`;
};

const OrderViewer = ({ order, onClose }) => {
  const printRef = useRef();
  const [downloading, setDownloading] = useState(false);

  if (!order) return null;

  // Extract business from the order object (based on your API JSON)
  const { business } = order;

  // --- DOWNLOAD PDF LOGIC ---
  const handleDownload = async () => {
    const element = printRef.current;
    if (!element) return;

    try {
      setDownloading(true);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Invoice_${order.order_number}.pdf`);
      setDownloading(false);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed");
      setDownloading(false);
    }
  };

  // Status Logic (Green for Paid, Red for Unpaid)
  const isPaid = ['paid', 'completed', 'received', 'shipped', 'confirmed'].includes(order.status.toLowerCase());
  const statusColor = isPaid ? '#16A34A' : '#DC2626'; 
  const statusText = isPaid ? 'PAID' : 'UNPAID';

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ width: '850px', height: '95vh', display: 'flex', flexDirection: 'column', background:'#f3f4f6' }}>
        
        {/* --- ACTIONS HEADER --- */}
        <div className="modal-header" style={{ background:'white', borderBottom: '1px solid #e5e7eb', padding: '15px 25px' }}>
          <h2 style={{ fontSize: '18px', fontWeight:'600' }}>Invoice Preview</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-blue" 
              onClick={handleDownload} 
              disabled={downloading}
              style={{ minWidth: '140px' }}
            >
              {downloading ? <><Loader size={16} className="animate-spin"/> Generating...</> : <><Download size={16}/> Download PDF</>}
            </button>
            <button className="close-btn" onClick={onClose}><X size={20}/></button>
          </div>
        </div>

        {/* --- PRINTABLE INVOICE (HOSTINGER STYLE) --- */}
        <div className="scrollable-form" style={{ flex: 1, padding: '20px', display:'flex', justifyContent:'center' }}>
          
          <div 
            ref={printRef} 
            style={{ 
              width: '210mm', 
              minHeight: '297mm', 
              background: 'white', 
              padding: '50px 60px',
              color: '#4B5563', 
              fontFamily: '"Inter", sans-serif',
              fontSize: '13px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
          >
            
            {/* 1. HEADER SECTION [cite: 1-12] */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              
              {/* Left: Company Details [cite: 1-6] */}
              <div style={{ maxWidth: '50%' }}>
                <div style={{ marginBottom: '15px' }}>
                   {business?.logo_bucket_url ? (
                      <img 
                        src={getImageUrl(business.logo_bucket_url)} 
                        alt="Logo" 
                        style={{ height: '40px', objectFit: 'contain', objectPosition: 'left' }}
                      />
                   ) : (
                      // Fallback Logo Style (The "H" in reference) [cite: 1]
                      <div style={{ 
                          width: '45px', height: '45px', background: '#673DE6', color: 'white', 
                          borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          fontSize: '24px', fontWeight: 'bold' 
                      }}>
                        {business?.business_name?.charAt(0) || 'H'}
                      </div>
                   )}
                </div>

                <h2 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: '800', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {business?.business_name}
                </h2>
                
                <div style={{ lineHeight: '1.5', fontSize: '13px' }}>
                  {business?.owner_name && <div>{business.owner_name}</div>}
                  {business?.address}
                  {(business?.district || business?.state) && (
                    <div>{business.district}, {business.state} {business.pin}</div>
                  )}
                  {business?.country && <div>{business.country}</div>}
                  {business?.gst_number && (
                      <div style={{ marginTop:'6px' }}>GST Reg #: {business.gst_number}</div>
                  )}
                </div>
              </div>

              {/* Right: Invoice Meta [cite: 7-12] */}
              <div style={{ textAlign: 'right' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#2C2C2C', margin: '0 0 20px 0', letterSpacing: '1px' }}>INVOICE</h1>
                
                <table style={{ borderCollapse: 'collapse', float: 'right', fontSize: '13px' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '3px 15px 3px 0', color: '#6B7280' }}>Invoice #</td>
                      <td style={{ padding: '3px 0', fontWeight: '600', color: '#111827' }}>{order.order_number}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 15px 3px 0', color: '#6B7280' }}>Invoice Issued #</td>
                      <td style={{ padding: '3px 0', fontWeight: '600', color: '#111827' }}>{new Date(order.date).toLocaleDateString()}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 15px 3px 0', color: '#6B7280' }}>Invoice Amount #</td>
                      <td style={{ padding: '3px 0', fontWeight: '600', color: '#111827' }}>₹{order.total_amount}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '3px 15px 3px 0', color: '#6B7280' }}>Order Nr. #</td>
                      <td style={{ padding: '3px 0', fontWeight: '600', color: '#111827' }}>{order.id}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. STATUS & BILLED TO [cite: 13-21] */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '50px', marginTop: '20px' }}>
              
              {/* PAID STAMP  */}
              <div style={{ marginTop: '10px' }}>
                 <div style={{ 
                    fontSize: '28px', fontWeight: '900', color: statusColor, 
                    border: `4px solid ${statusColor}`, padding: '5px 20px', 
                    borderRadius: '6px', display: 'inline-block', letterSpacing: '2px',
                    transform: 'rotate(-5deg)', opacity: 0.25
                 }}>
                    {statusText}
                 </div>
              </div>

              {/* Billed To Section  */}
              <div style={{ minWidth: '220px' }}>
                <h3 style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  BILLED TO
                </h3>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                  {order.customer_name}
                </div>
                <div style={{ lineHeight: '1.6', fontSize: '13px' }}>
                  {order.customer_address || order.customer_district || "Address Not Provided"}<br/>
                  {order.customer_state} {order.customer_phone}<br/>
                  {order.customer_email}<br/>
                </div>
              </div>
            </div>

            {/* 3. TABLE  */}
            <div style={{ marginBottom: '40px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', padding: '10px 0', fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</th>
                    <th style={{ textAlign: 'right', padding: '10px 0', fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</th>
                    <th style={{ textAlign: 'center', padding: '10px 0', fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '10px 0', fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Excl. Tax</th>
                    {/* Add Tax column here if available in your item data */}
                    <th style={{ textAlign: 'right', padding: '10px 0', fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '15px 0', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '600', color: '#1F2937', fontSize: '13px' }}>{item.product_name}</div>
                      </td>
                      <td style={{ padding: '15px 0', textAlign: 'right', verticalAlign: 'top', color: '#4B5563' }}>₹{item.price}</td>
                      <td style={{ padding: '15px 0', textAlign: 'center', verticalAlign: 'top', color: '#4B5563' }}>{item.quantity}</td>
                      <td style={{ padding: '15px 0', textAlign: 'right', verticalAlign: 'top', color: '#4B5563' }}>₹{item.subtotal}</td>
                      <td style={{ padding: '15px 0', textAlign: 'right', fontWeight: '700', verticalAlign: 'top', color: '#111827' }}>₹{item.subtotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. TOTALS SECTION [cite: 23-33] */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: '#4B5563' }}>
                  <span>Total excl. Tax</span>
                  <span>₹{order.total_amount}</span>
                </div>
                
                {/* Placeholder for IGST/Tax if you calculate it separately later [cite: 26] */}
                {/* <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: '#4B5563' }}>
                  <span>IGST @ 18%</span>
                  <span>₹0.00</span>
                </div> */}
                
                <div style={{ borderTop: '2px solid #E5E7EB', margin: '15px 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>Total</span>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>₹{order.total_amount}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: '#6B7280' }}>
                  <span>Payments</span>
                  <span>(₹{isPaid ? order.total_amount : '0.00'})</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', background: '#F9FAFB', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Amount Due</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: isPaid ? '#16A34A' : '#DC2626' }}>
                    ₹{isPaid ? '0.00' : order.total_amount}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. FOOTER */}
            <div style={{ position: 'absolute', bottom: '50px', left: '60px', right: '60px', borderTop: '1px solid #E5E7EB', paddingTop: '20px', color: '#9CA3AF', fontSize: '12px', textAlign: 'center' }}>
              <p style={{ margin:0 }}>Thank you for your business!</p>
              <p style={{ margin:'5px 0 0 0' }}>{business?.owner_name ? `Questions? Contact ${business.owner_name}` : 'Generated by StatGrow'}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderViewer;