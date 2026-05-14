import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axiosConfig';
import { Trash2, X, MapPin, Phone, Camera } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import '../assets/css/CreateInvoice.css'; // Make sure path is correct!

// --- CAMERA SCANNER COMPONENT ---
const CameraScannerModal = ({ onScan, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader", { fps: 10, qrbox: 250 }, false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear(); 
        onScan(decodedText);
      },
      (error) => {} 
    );

    return () => {
      try { scanner.clear(); } catch (e) { console.error(e); }
    };
  }, [onScan]);

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-box invoice-camera-modal">
        <div className="invoice-header-flex">
          <div>
              <h3>Scan Barcode</h3>
              <p>Hold barcode 6-10 inches from camera.</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div id="reader"></div>
      </div>
    </div>
  );
};

const CreateInvoice = ({ onClose, onSuccess }) => {
  const { data: dashboardData } = useOutletContext();
  const activeBusiness = dashboardData?.active_business;
  const isTaxEnabled = activeBusiness?.tax_type && activeBusiness.tax_type !== 'NONE';

  const [formData, setFormData] = useState({
    invoice_id: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
    date: new Date().toISOString().split('T')[0],
    customer_id: null,
    customer_name: '',
    payment_mode: 'Cash',
    status: 'Paid',
    note: ''
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null); 
  const [items, setItems] = useState([
    { item_id: null, name: '', hsn: '', qty: 1, rate: '', discount_percent: '', tax_percent: '', tax_type: 'GST', price_includes_tax: false, baseAmt: '0.00', discAmt: '0.00', taxableAmt: '0.00', taxAmt: '0.00', amount: '0.00' }
  ]);

  const [custSearch, setCustSearch] = useState('');
  const [custResults, setCustResults] = useState([]);
  const [prodResults, setProdResults] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);

  const [showAddCust, setShowAddCust] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scannerTargetIndex, setScannerTargetIndex] = useState(null);
  
  const initialCustData = { 
      name: '', category: '', email: '', phone: '', customer_type: 'Regular', 
      gstin: '', date: new Date().toISOString().split('T')[0], country: 'India', 
      state: '', district: '', pin: '', address: '', note: '', password: '' 
  };
  const [newCustData, setNewCustData] = useState(initialCustData);

  const calculateRowValues = (qty, baseRate, discPct, taxPct) => {
    const q = parseFloat(qty) || 0;
    const r = parseFloat(baseRate) || 0; 
    const d = parseFloat(discPct) || 0;
    const t = parseFloat(taxPct) || 0;

    const baseAmt = q * r;
    const discAmt = baseAmt * (d / 100);
    const taxableAmt = baseAmt - discAmt;
    const taxAmt = taxableAmt * (t / 100);
    const totalAmt = taxableAmt + taxAmt;

    return {
        baseAmt: baseAmt.toFixed(2),
        discAmt: discAmt.toFixed(2),
        taxableAmt: taxableAmt.toFixed(2),
        taxAmt: taxAmt.toFixed(2),
        totalAmt: totalAmt.toFixed(2)
    };
  };

  const summary = items.reduce((acc, item) => {
    acc.totalBase += parseFloat(item.baseAmt || 0);
    acc.totalDisc += parseFloat(item.discAmt || 0);
    acc.totalTaxable += parseFloat(item.taxableAmt || 0);
    acc.totalTax += parseFloat(item.taxAmt || 0);
    acc.totalValue += parseFloat(item.amount || 0);
    return acc;
  }, { totalBase: 0, totalDisc: 0, totalTaxable: 0, totalTax: 0, totalValue: 0 });

  const netPayable = Math.round(summary.totalValue);
  const roundOff = netPayable - summary.totalValue;

  const handleCustSearch = async (val) => {
    setCustSearch(val);
    if (val.length > 1) {
      try {
        const res = await api.get(`/search/customers/?search=${val}`);
        setCustResults(res.data);
      } catch (err) { console.error(err); }
    } else {
      setCustResults([]);
    }
  };

  const selectCustomer = (cust) => {
    setFormData({ ...formData, customer_id: cust.id, customer_name: cust.name });
    setSelectedCustomer(cust);
    setCustSearch('');
    setCustResults([]);
  };

  const removeCustomer = () => {
    setFormData({ ...formData, customer_id: null, customer_name: '' });
    setSelectedCustomer(null);
    setCustSearch('');
  };

  const handleNewCustChange = (e) => {
      const { name, value } = e.target;
      setNewCustData({ ...newCustData, [name]: value });
  };

  const handleSaveNewCustomer = async (e) => {
    e.preventDefault(); 
    if(!newCustData.name) return alert("Name is required");
    
    const payload = { ...newCustData };
    if (payload.pin) payload.pin = parseInt(payload.pin, 10);
    if (!payload.password) delete payload.password;

    try {
        const res = await api.post('/customers/', payload);
        alert("Customer Added Successfully!");
        selectCustomer(res.data); 
        setShowAddCust(false);
        setNewCustData(initialCustData); 
    } catch(err) { 
        if (err.response && err.response.data) {
            const errorData = err.response.data;
            if (typeof errorData === 'string' && errorData.startsWith('<!DOCTYPE html>')) {
                alert("Server Error: Database conflict.");
                return;
            }
            let errorMessage = "Failed to add customer:\n";
            for (const [field, messages] of Object.entries(errorData)) {
               const msgString = Array.isArray(messages) ? messages.join(" ") : messages;
               errorMessage += `- ${field.charAt(0).toUpperCase() + field.slice(1)}: ${msgString}\n`;
            }
            alert(errorMessage);
        } else {
            alert("Network error or failed to add customer."); 
        }
    }
  };

  const handleProdSearch = async (val, index) => {
    const newItems = [...items];
    newItems[index].name = val;
    setItems(newItems);

    if (val.length > 1) {
      setActiveSearchIndex(index);
      try {
        const res = await api.get(`/search/products/?search=${val}`);
        const results = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setProdResults(results);
      } catch (err) { console.error(err); }
    } else {
      setProdResults([]);
    }
  };

  const handleBarcodeSearch = async (barcodeVal, index) => {
    if (!barcodeVal || barcodeVal.trim() === '') return;
    try {
      const res = await api.get(`/items/by-barcode/?barcode=${barcodeVal}`);
      const product = res.data; 
      if (product && product.id) {
          selectProduct(product, index);
          if (index === items.length - 1) setTimeout(() => addItem(), 50); 
      }
    } catch (err) {
      console.error("Barcode search error:", err);
    }
  };

  const onCameraScanResult = (decodedText) => {
    setShowCameraScanner(false);
    if (scannerTargetIndex !== null) {
      handleBarcodeSearch(decodedText, scannerTargetIndex);
    }
  };

  const selectProduct = (prod, index) => {
    setItems(prevItems => {
        const newItems = [...prevItems];
        const grossRate = parseFloat(prod.gross_amount) || parseFloat(prod.mrp_baseprice) || 0;
        
        let taxPct = isTaxEnabled ? (parseFloat(prod.tax_percent) || 0) : 0; 
        const discPct = parseFloat(prod.discount_percent) || 0;
        const includesTax = prod.price_includes_tax || false;
        const taxType = prod.tax_type || 'GST';

        let baseRate = grossRate;
        if (includesTax && taxPct > 0) {
            baseRate = grossRate / (1 + taxPct / 100);
        }

        const calc = calculateRowValues(newItems[index].qty, baseRate, discPct, taxPct);

        newItems[index] = {
          ...newItems[index],
          item_id: prod.id, 
          name: prod.item_name, 
          hsn: prod.hsn_sac_code_product || '',
          rate: baseRate.toFixed(2), 
          tax_percent: taxPct || '', 
          tax_type: taxType, 
          price_includes_tax: includesTax, 
          discount_percent: discPct || '', 
          baseAmt: calc.baseAmt, 
          discAmt: calc.discAmt, 
          taxableAmt: calc.taxableAmt, 
          taxAmt: calc.taxAmt, 
          amount: calc.totalAmt
        };
        return newItems;
    });

    setProdResults([]);
    setActiveSearchIndex(null);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    const item = newItems[index];
    
    const calc = calculateRowValues(item.qty, item.rate, item.discount_percent, item.tax_percent);
    newItems[index].baseAmt = calc.baseAmt;
    newItems[index].discAmt = calc.discAmt;
    newItems[index].taxableAmt = calc.taxableAmt;
    newItems[index].taxAmt = calc.taxAmt;
    newItems[index].amount = calc.totalAmt;
    
    setItems(newItems);
  };

  const addItem = () => setItems(prev => [...prev, { item_id: null, name: '', qty: 1, rate: '', discount_percent: '', tax_percent: '', tax_type: 'GST', price_includes_tax: false, baseAmt: '0.00', discAmt: '0.00', taxableAmt: '0.00', taxAmt: '0.00', amount: '0.00' }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!formData.customer_id) return alert("Please select a customer first.");
    const validItems = items.filter(item => item.item_id !== null);
    if (validItems.length === 0) return alert("Please add at least one valid product.");

    const payload = {
      customer: formData.customer_id,
      customer_name: formData.customer_name, 
      invoice_id: formData.invoice_id,
      date: formData.date,                   
      payment_mode: formData.payment_mode,
      status: formData.status,
      note: formData.note,
      invoice_items: validItems.map(item => ({
        item: item.item_id,
        quantity: parseInt(item.qty) || 1,
        rate: parseFloat(item.rate || 0).toFixed(2),
        discount_percent: parseFloat(item.discount_percent || 0).toFixed(2),
        tax_percent: isTaxEnabled ? parseFloat(item.tax_percent || 0).toFixed(2) : "0.00",
        tax_type: item.tax_type || "GST",
        price_includes_tax: false 
      }))
    };

    try {
      await api.post('/invoices/', payload);
      alert("Invoice Created Successfully!");
      onSuccess();
    } catch (err) {
      console.error("Invoice Error:", err);
      if (err.response && err.response.data) alert(`Error: ${JSON.stringify(err.response.data)}`);
      else alert("Failed to create invoice.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box invoice-modal-box">
        <div className="modal-header">
          <h2>Create New Invoice</h2>
          <button className="close-btn" onClick={onClose}><X size={20}/></button>
        </div>

        <div className="invoice-form-body scrollable-form">
          
          {/* Customer / Header Setup */}
          <div className="invoice-panel">
             <div className="form-row">
               <div className="form-group">
                 <label>Invoice ID</label>
                 <input className="form-input" value={formData.invoice_id} onChange={e => setFormData({...formData, invoice_id: e.target.value})} />
               </div>
               <div className="form-group">
                 <label>Date</label>
                 <input className="form-input" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
               </div>
             </div>

             <div className="form-group relative">
               <label>Customer Details*</label>
               {!selectedCustomer ? (
                   <div className="customer-search-wrapper">
                       <div className="customer-search-input-box">
                           <input className="form-input" type="text" placeholder="Search Customer..." value={custSearch} onChange={(e) => handleCustSearch(e.target.value)}/>
                           {custResults.length > 0 && (
                               <div className="search-dropdown">
                                   {custResults.map(c => (
                                       <div key={c.id} className="search-item" onClick={() => selectCustomer(c)}>
                                           <div style={{fontWeight:'bold'}}>{c.name}</div>
                                           <div style={{fontSize:'12px', color:'#666'}}>{c.phone_number}</div>
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                       <button className="btn btn-blue btn-new-customer" onClick={() => setShowAddCust(true)}>+ New</button>
                   </div>
               ) : (
                   <div className="selected-customer-card">
                       <div className="selected-customer-header">
                           <div className="selected-customer-name">
                               <div className="selected-customer-avatar">{selectedCustomer.name.charAt(0)}</div>
                               <div style={{fontWeight:'bold', fontSize:'15px'}}>{selectedCustomer.name}</div>
                           </div>
                           <button className="btn-icon-small text-danger" onClick={removeCustomer}><X size={18}/></button>
                       </div>
                       <div className="selected-customer-info">
                           <div className="info-badge"><Phone size={14}/> {selectedCustomer.phone || 'N/A'}</div>
                           <div className="info-badge"><MapPin size={14}/> {selectedCustomer.address || 'No Address'}</div>
                       </div>
                   </div>
               )}
             </div>
          </div>

          {/* RESPONSIVE ITEM TABLE */}
          <div className="invoice-panel">
            <div className="table-responsive-wrapper">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', minWidth: '200px' }}>Item Details</th>
                    <th className="text-right" style={{ width: '90px' }}>Rate</th>
                    <th className="text-center" style={{ width: '70px' }}>Qty</th>
                    <th className="text-right" style={{ minWidth: '80px' }}>BaseAmt</th>
                    <th className="text-center" style={{ width: '90px' }}>Disc %</th>
                    <th className="text-center bg-highlight" style={{ minWidth: '80px' }}>Taxable</th>
                    <th className="text-center" style={{ width: '90px' }}>Tax %</th>
                    <th className="text-right" style={{ minWidth: '80px' }}>Total</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td>
                                <div className="table-input-group">
                                  <input 
                                    className="form-input"
                                    value={item.name} 
                                    onChange={(e) => handleProdSearch(e.target.value, index)} 
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleBarcodeSearch(item.name, index);
                                        }
                                    }}
                                    autoFocus={index === items.length - 1}
                                    placeholder="Search or Scan..." 
                                  />
                                  <button
                                    type="button"
                                    className="btn-camera"
                                    onClick={() => {
                                      setScannerTargetIndex(index);
                                      setShowCameraScanner(true);
                                    }}
                                  >
                                    <Camera size={18} />
                                  </button>
                                </div>

                                {activeSearchIndex === index && prodResults.length > 0 && (
                                    <div className="search-dropdown" style={{top:'100%', left:0, width:'100%', zIndex:100}}>
                                        {prodResults.map(p => (
                                            <div key={p.id} className="search-item" onClick={() => selectProduct(p, index)}>
                                                {p.item_name} (₹{p.gross_amount || p.mrp_baseprice})
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </td>
                            <td>
                                <input className="form-input text-right" type="number" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)}/>
                            </td>
                            <td>
                                <input className="form-input text-center" type="number" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)}/>
                            </td>
                            <td className="text-right table-base-amt">
                                ₹{item.baseAmt}
                            </td>
                            <td>
                                <div className="table-input-col">
                                    <input className="form-input text-center" type="number" value={item.discount_percent} onChange={(e) => handleItemChange(index, 'discount_percent', e.target.value)} placeholder="0"/>
                                    <div className="table-sub-text text-danger">
                                        {parseFloat(item.discAmt) > 0 ? `-₹${item.discAmt}` : ''}
                                    </div>
                                </div>
                            </td>
                            <td className="text-center table-taxable-amt">
                                {item.taxableAmt}
                            </td>
                            <td>
                                <div className="table-input-col">
                                    <input 
                                      className="form-input text-center"
                                      type="number" 
                                      value={item.tax_percent} 
                                      onChange={(e) => handleItemChange(index, 'tax_percent', e.target.value)} 
                                      placeholder="0" 
                                      disabled={!isTaxEnabled}
                                    />
                                    <div className="table-sub-text text-muted">
                                        {parseFloat(item.taxAmt) > 0 ? `₹${item.taxAmt}` : ''}
                                    </div>
                                </div>
                            </td>
                            <td className="text-right table-total-amt">
                                {item.amount}
                            </td>
                            <td className="text-center">
                                <button className="btn-remove-row" onClick={() => removeItem(index)}><Trash2 size={16}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
              </table>
            </div>
            
            <button type="button" className="btn-add-row" onClick={addItem}>
                + Add Item
            </button>
          </div>

          {/* RESPONSIVE SUMMARY BOX */}
          <div className="invoice-summary-row">
              <div className="invoice-notes-col">
                <div className="invoice-panel">
                   <label className="elegant-overline">Notes</label>
                   <textarea className="form-input" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} rows="2" placeholder="Thanks for your business!"></textarea>
                </div>
                
                <div className="invoice-panel form-row" style={{margin: 0}}>
                   <div className="form-group">
                      <label className="elegant-overline">Payment Mode</label>
                      <select className="form-input" value={formData.payment_mode} onChange={e => setFormData({...formData, payment_mode: e.target.value})}>
                          <option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option>
                      </select>
                   </div>
                   <div className="form-group">
                      <label className="elegant-overline">Status</label>
                      <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                          <option>Paid</option><option>Unpaid</option>
                      </select>
                   </div>
                </div>
              </div>

              <div className="invoice-totals-col">
                <div className="summary-line">
                  <span>Total Base Amount</span><span>₹{summary.totalBase.toFixed(2)}</span>
                </div>
                {summary.totalDisc > 0 && (
                  <div className="summary-line">
                    <span>Total Discount</span><span className="text-danger">-₹{summary.totalDisc.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-line">
                  <span>Total Taxable Amount</span><span>₹{summary.totalTaxable.toFixed(2)}</span>
                </div>
                {summary.totalTax > 0 && (
                  <div className="summary-line">
                    <span>Total Tax</span><span>₹{summary.totalTax.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-line">
                  <span>Round Off</span><span>{roundOff.toFixed(2)}</span>
                </div>
                
                <div className="summary-divider"></div>

                <div className="summary-net">
                  <span className="summary-net-label">Net Payable</span>
                  <span className="summary-net-value">{netPayable.toFixed(2)}</span>
                </div>
                <div className="summary-footer">
                  <span>Payments ({formData.payment_mode})</span>
                  <span>(₹{formData.status === 'Paid' ? netPayable.toFixed(2) : '0.00'})</span>
                </div>
              </div>
          </div>

          <div className="invoice-actions">
             <button className="btn btn-gray" onClick={onClose}>Cancel</button>
             <button className="btn btn-blue" onClick={handleSubmit}>Save Invoice</button>
          </div>
        </div>
      </div>
      
      {/* QUICK ADD CUSTOMER MODAL */}
      {showAddCust && (
        <div className="modal-overlay" style={{zIndex: 1100}}>
            <div className="modal-box extended-modal" style={{width:'800px', maxWidth: '90vw'}}>
                <div className="modal-header">
                    <h2>Quick Add Customer</h2>
                    <button className="close-btn" onClick={() => setShowAddCust(false)}><X size={20}/></button>
                </div>
                <form onSubmit={handleSaveNewCustomer} className="setup-form scrollable-form" style={{padding:'20px'}}>
                    <div className="form-section-title">Basic Information</div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Customer Name*</label>
                        <input className="form-input" type="text" name="name" value={newCustData.name} onChange={handleNewCustChange} required placeholder="Full Name" />
                      </div>
                      <div className="form-group">
                        <label>Customer Type</label>
                        <select className="form-input" name="customer_type" value={newCustData.customer_type} onChange={handleNewCustChange}>
                          <option value="Regular">Regular</option>
                          <option value="Special">Special</option>
                          <option value="Wholesale">Wholesale</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                       <div className="form-group">
                        <label>Category</label>
                        <input className="form-input" type="text" name="category" value={newCustData.category} onChange={handleNewCustChange} placeholder="e.g. Business, Personal" />
                      </div>
                      <div className="form-group">
                         <label>Joining Date</label>
                         <input className="form-input" type="date" name="date" value={newCustData.date} onChange={handleNewCustChange} />
                      </div>
                    </div>
                    <div className="form-section-title">Contact Details</div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Email Address</label>
                        <input className="form-input" type="email" name="email" value={newCustData.email} onChange={handleNewCustChange} />
                      </div>
                      <div className="form-group">
                        <label>Phone Number*</label>
                        <input className="form-input" type="text" name="phone" value={newCustData.phone} onChange={handleNewCustChange} required />
                      </div>
                    </div>
                    <div className="form-row">
                       <div className="form-group">
                        <label>GSTIN (Optional)</label>
                        <input className="form-input" type="text" name="gstin" value={newCustData.gstin} onChange={handleNewCustChange} placeholder="GST Number" />
                      </div>
                       <div className="form-group">
                        <label>Password (Login)</label>
                        <input className="form-input" type="password" name="password" value={newCustData.password} onChange={handleNewCustChange} placeholder="Optional" />
                      </div>
                    </div>
                    <div className="form-section-title">Address & Location</div>
                    <div className="form-group" style={{marginBottom: '15px'}}>
                       <label>Street Address</label>
                       <input className="form-input" type="text" name="address" value={newCustData.address} onChange={handleNewCustChange} placeholder="Building, Street, Area" />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>District/City</label>
                        <input className="form-input" type="text" name="district" value={newCustData.district} onChange={handleNewCustChange} />
                      </div>
                      <div className="form-group">
                        <label>State</label>
                        <input className="form-input" type="text" name="state" value={newCustData.state} onChange={handleNewCustChange} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Country</label>
                        <input className="form-input" type="text" name="country" value={newCustData.country} onChange={handleNewCustChange} />
                      </div>
                      <div className="form-group">
                        <label>Pincode</label>
                        <input className="form-input" type="number" name="pin" value={newCustData.pin} onChange={handleNewCustChange} />
                      </div>
                    </div>
                     <div className="form-group">
                        <label>Notes</label>
                        <input className="form-input" type="text" name="note" value={newCustData.note} onChange={handleNewCustChange} placeholder="Internal notes..." />
                      </div>
                    <button type="submit" className="btn-primary" style={{marginTop:'10px', width:'100%'}}>
                       Save & Select
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* 📸 CAMERA SCANNER MODAL */}
      {showCameraScanner && (
        <CameraScannerModal 
          onScan={onCameraScanResult} 
          onClose={() => setShowCameraScanner(false)} 
        />
      )}
    </div>
  );
};

export default CreateInvoice;