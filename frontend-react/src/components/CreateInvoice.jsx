import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/axiosConfig';
import { Trash2, X, Search, MapPin, Phone } from 'lucide-react';

const CreateInvoice = ({ onClose, onSuccess }) => {
  // --- GET BUSINESS TAX SETTINGS ---
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
  const [newCustData, setNewCustData] = useState({ name: '', phone_number: '', email: '', address: '', gst_number: '' });

  // --- EXACT LINEAR MATH (EXCLUSIVE BASE) ---
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

  // --- DYNAMIC SUMMARY ---
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

  // --- HANDLERS ---
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

  const handleSaveNewCustomer = async () => {
    if(!newCustData.name) return alert("Name is required");
    try {
        const res = await api.post('/customers/', newCustData);
        alert("Customer Added!");
        selectCustomer(res.data);
        setShowAddCust(false);
        setNewCustData({ name: '', phone_number: '', email: '', address: '', gst_number: '' });
    } catch(err) { alert("Failed to add customer."); }
  };

  const handleProdSearch = async (val, index) => {
    const newItems = [...items];
    newItems[index].name = val;
    setItems(newItems);
    if (val.length > 1) {
      setActiveSearchIndex(index);
      try {
        const res = await api.get(`/search/products/?search=${val}`);
        setProdResults(res.data);
      } catch (err) { console.error(err); }
    } else {
      setProdResults([]);
    }
  };

  const selectProduct = (prod, index) => {
    const newItems = [...items];
    const grossRate = parseFloat(prod.gross_amount) || parseFloat(prod.mrp_baseprice) || 0;
    
    // ✅ FORCE TAX TO 0 IF BUSINESS TAX IS DISABLED
    let taxPct = isTaxEnabled ? (parseFloat(prod.tax_percent) || 0) : 0; 
    
    const discPct = parseFloat(prod.discount_percent) || 0;
    const includesTax = prod.price_includes_tax || false;
    const taxType = prod.tax_type || 'GST';

    // EXTRACT BASE RATE
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
    setItems(newItems);
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

  const addItem = () => setItems([...items, { item_id: null, name: '', qty: 1, rate: '', discount_percent: '', tax_percent: '', tax_type: 'GST', price_includes_tax: false, baseAmt: '0.00', discAmt: '0.00', taxableAmt: '0.00', taxAmt: '0.00', amount: '0.00' }]);
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
      <div className="modal-box" style={{width: '1100px', maxWidth: '98vw', background:'#f8fafc'}}>
        <div className="modal-header" style={{ background:'white', borderBottom: '1px solid #e2e8f0', padding: '15px 25px' }}>
          <h2 style={{ fontSize: '18px', fontWeight:'600' }}>Create New Invoice</h2>
          <button className="close-btn" onClick={onClose}><X size={20}/></button>
        </div>

        <div className="invoice-form scrollable-form" style={{padding: '20px', display:'flex', flexDirection:'column', gap:'20px'}}>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
             <div className="form-row" style={{marginBottom: '15px'}}>
               <div className="form-group"><label>Invoice ID</label><input value={formData.invoice_id} onChange={e => setFormData({...formData, invoice_id: e.target.value})} style={{border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px'}} /></div>
               <div className="form-group"><label>Date</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px'}} /></div>
             </div>

             <div className="form-group relative">
               <label>Customer Details*</label>
               {!selectedCustomer ? (
                   <div style={{display:'flex', gap:'10px'}}>
                       <div style={{flex:1, position:'relative'}}>
                           <input type="text" placeholder="Search Customer..." value={custSearch} onChange={(e) => handleCustSearch(e.target.value)} style={{border: '1px solid #cbd5e1', borderRadius: '6px', padding: '8px', width: '100%'}}/>
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
                       <button className="btn btn-blue" style={{width:'auto', padding:'0 20px'}} onClick={() => setShowAddCust(true)}>+ New</button>
                   </div>
               ) : (
                   <div className="customer-info-card" style={{border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc'}}>
                       <div className="info-header">
                           <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                               <div className="avatar-circle" style={{background:'#3b82f6'}}>{selectedCustomer.name.charAt(0)}</div>
                               <div><div style={{fontWeight:'bold', fontSize:'15px'}}>{selectedCustomer.name}</div></div>
                           </div>
                           <button className="btn-icon-small" onClick={removeCustomer}><X size={16}/></button>
                       </div>
                       <div className="info-grid">
                           <div className="info-item"><Phone size={14}/> {selectedCustomer.phone || 'N/A'}</div>
                           <div className="info-item"><MapPin size={14}/> {selectedCustomer.address || 'No Address'}</div>
                       </div>
                   </div>
               )}
             </div>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #3b82f6' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Item Details</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '90px' }}>Rate</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '70px' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>BaseAmt</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '100px' }}>Disc %</th>
                  <th style={{ textAlign: 'center', padding: '12px 12px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', background: '#eef2ff' }}>Taxable</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '100px' }}>Tax %</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase' }}>Total</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                  {items.map((item, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '15px 8px', verticalAlign: 'middle', position:'relative'}}>
                              <input value={item.name} onChange={(e) => handleProdSearch(e.target.value, index)} placeholder="Search Item..." style={{width:'100%', padding:'8px', border: '1px solid #cbd5e1', borderRadius: '4px'}}/>
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
                          <td style={{ padding: '15px 8px', textAlign: 'right', verticalAlign: 'middle' }}>
                              <input type="number" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} style={{width:'100%', padding:'8px', textAlign:'right', border: '1px solid #cbd5e1', borderRadius: '4px'}}/>
                          </td>
                          <td style={{ padding: '15px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                              <input type="number" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} style={{width:'100%', padding:'8px', textAlign:'center', border: '1px solid #cbd5e1', borderRadius: '4px'}}/>
                          </td>
                          <td style={{ padding: '15px 8px', textAlign: 'right', verticalAlign: 'middle', color: '#475569', fontSize: '14px' }}>
                              ₹{item.baseAmt}
                          </td>
                          
                          <td style={{ padding: '15px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                              <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'4px'}}>
                                  <input type="number" value={item.discount_percent} onChange={(e) => handleItemChange(index, 'discount_percent', e.target.value)} placeholder="0" style={{width:'100%', textAlign:'center', padding:'6px', fontSize:'13px', border: '1px solid #cbd5e1', borderRadius: '4px'}} title="Disc %"/>
                                  <div style={{fontSize:'12px', color:'#ef4444', height: '16px'}}>
                                      {parseFloat(item.discAmt) > 0 ? `-₹${item.discAmt}` : ''}
                                  </div>
                              </div>
                          </td>

                          <td style={{ padding: '15px 12px', textAlign: 'center', verticalAlign: 'middle', color: '#2563eb', fontSize: '15px', fontWeight: '600', background: '#eef2ff' }}>
                              {item.taxableAmt}
                          </td>

                          <td style={{ padding: '15px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                              <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'4px'}}>
                                  {/* ✅ DISABLED AND LOCKED IF NO TAX ENALBED IN SETTINGS */}
                                  <input 
                                    type="number" 
                                    value={item.tax_percent} 
                                    onChange={(e) => handleItemChange(index, 'tax_percent', e.target.value)} 
                                    placeholder="0" 
                                    disabled={!isTaxEnabled}
                                    style={{
                                        width:'100%', 
                                        textAlign:'center', 
                                        padding:'6px', 
                                        fontSize:'13px', 
                                        border: '1px solid #cbd5e1', 
                                        borderRadius: '4px',
                                        backgroundColor: !isTaxEnabled ? '#f1f5f9' : 'white',
                                        cursor: !isTaxEnabled ? 'not-allowed' : 'auto'
                                    }} 
                                    title="Tax %"
                                  />
                                  <div style={{fontSize:'12px', color:'#64748b', height: '16px'}}>
                                      {parseFloat(item.taxAmt) > 0 ? `₹${item.taxAmt}` : ''}
                                  </div>
                              </div>
                          </td>

                          <td style={{ padding: '15px 8px', textAlign: 'right', verticalAlign: 'middle', color: '#0f172a', fontSize: '15px', fontWeight: '700' }}>
                              {item.amount}
                          </td>
                          <td style={{ padding: '15px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                              <button onClick={() => removeItem(index)} style={{ border: '1px solid #fca5a5', background: '#fef2f2', color: '#ef4444', padding: '6px', borderRadius: '4px', cursor: 'pointer' }}><Trash2 size={16}/></button>
                          </td>
                      </tr>
                  ))}
              </tbody>
            </table>
            
            <button type="button" onClick={addItem} style={{marginTop:'15px', fontSize:'14px', color: '#3b82f6', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', width:'100%', padding:'10px', border:'1px dashed #cbd5e1', borderRadius:'8px'}}>
                + Add Item
            </button>
          </div>

          {/* --- SUMMARY BOX --- */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                   <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', display: 'block'}}>Notes</label>
                   <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} style={{width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px'}} rows="2" placeholder="Thanks for your business!"></textarea>
                </div>
                
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', display: 'flex', gap:'15px', border: '1px solid #e2e8f0'}}>
                   <div style={{flex:1}}>
                      <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', display: 'block'}}>Payment Mode</label>
                      <select style={{width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px'}} value={formData.payment_mode} onChange={e => setFormData({...formData, payment_mode: e.target.value})}>
                          <option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option>
                      </select>
                   </div>
                   <div style={{flex:1}}>
                      <label style={{fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', display: 'block'}}>Status</label>
                      <select style={{width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px'}} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                          <option>Paid</option><option>Unpaid</option>
                      </select>
                   </div>
                </div>
              </div>

              <div style={{ width: '320px', background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
                  <span>Total Base Amount</span><span>₹{summary.totalBase.toFixed(2)}</span>
                </div>

                {summary.totalDisc > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
                    <span>Total Discount</span><span style={{color:'#ef4444'}}>-₹{summary.totalDisc.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
                  <span>Total Taxable Amount</span><span>₹{summary.totalTaxable.toFixed(2)}</span>
                </div>

                {summary.totalTax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
                    <span>Total Tax</span><span>₹{summary.totalTax.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
                  <span>Round Off</span><span>{roundOff.toFixed(2)}</span>
                </div>
                
                <div style={{ borderTop: '1px dashed #cbd5e1', margin: '16px 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: '#3b82f6' }}>Net Payable</span>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: '#3b82f6' }}>{netPayable.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                  <span>Payments ({formData.payment_mode})</span>
                  <span>(₹{formData.status === 'Paid' ? netPayable.toFixed(2) : '0.00'})</span>
                </div>
              </div>
          </div>

          <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'10px', padding:'20px 0'}}>
             <button className="btn btn-gray" onClick={onClose} style={{padding:'10px 30px'}}>Cancel</button>
             <button className="btn btn-blue" onClick={handleSubmit} style={{padding:'10px 30px'}}>Save Invoice</button>
          </div>
        </div>
      </div>
      
      {/* QUICK ADD CUSTOMER MODAL */}
      {showAddCust && (
        <div className="modal-overlay" style={{zIndex: 1100}}>
            <div className="modal-box" style={{width:'400px'}}>
                <div className="modal-header">
                    <h3>Quick Add Customer</h3>
                    <button className="close-btn" onClick={() => setShowAddCust(false)}><X size={18}/></button>
                </div>
                <div className="setup-form" style={{padding:'20px'}}>
                    <div className="form-group"><label>Name*</label><input value={newCustData.name} onChange={e=>setNewCustData({...newCustData, name:e.target.value})} /></div>
                    <div className="form-group"><label>Phone</label><input value={newCustData.phone_number} onChange={e=>setNewCustData({...newCustData, phone_number:e.target.value})} /></div>
                    <div className="form-group"><label>Address</label><input value={newCustData.address} onChange={e=>setNewCustData({...newCustData, address:e.target.value})} /></div>
                    <div className="form-group"><label>GSTIN</label><input value={newCustData.gst_number} onChange={e=>setNewCustData({...newCustData, gst_number:e.target.value})} /></div>
                    <button className="btn btn-blue" onClick={handleSaveNewCustomer} style={{marginTop:'10px', width:'100%'}}>Save & Select</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CreateInvoice;