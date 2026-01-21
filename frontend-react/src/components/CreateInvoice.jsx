import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { Trash2, X, Search, MapPin, Phone, CreditCard, User } from 'lucide-react';

const CreateInvoice = ({ onClose, onSuccess }) => {
  // --- MAIN STATE ---
  const [formData, setFormData] = useState({
    invoice_id: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    customer_id: null,
    customer_name: '',
    discount_percent: 0,
    gst_percent: 0,
    payment_mode: 'Cash',
    status: 'Unpaid',
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null); 

  const [items, setItems] = useState([
    { item_id: null, name: '', hsn: '', qty: 1, rate: 0, discount: 0, gst: 0, amount: 0 }
  ]);

  // Search States
  const [custSearch, setCustSearch] = useState('');
  const [custResults, setCustResults] = useState([]);
  const [prodResults, setProdResults] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(null);

  // --- NEW CUSTOMER MODAL STATE ---
  const [showAddCust, setShowAddCust] = useState(false);
  const [newCustData, setNewCustData] = useState({ name: '', phone_number: '', email: '', address: '', gst_number: '' });

  // --- CALCULATIONS ---
  const calculateTotal = () => items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  const calculateRowTotal = (qty, rate, disc, gst) => {
    const q = parseFloat(qty) || 0;
    const r = parseFloat(rate) || 0;
    const d = parseFloat(disc) || 0;
    const g = parseFloat(gst) || 0;

    const base = q * r;
    const withDisc = base - (base * (d / 100));
    const withTax = withDisc + (withDisc * (g / 100));
    return withTax.toFixed(2);
  };

  // --- HANDLERS ---
  const handleCustSearch = async (val) => {
    setCustSearch(val);
    if (val.length > 1) {
      try {
        const res = await api.get(`/search/customers/?search=${val}`);
        setCustResults(res.data);
      } catch (err) { console.error("Search error", err); }
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
    } catch(err) {
        alert("Failed to add customer. Check console.");
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
        setProdResults(res.data);
      } catch (err) { console.error(err); }
    } else {
      setProdResults([]);
    }
  };

  const selectProduct = (prod, index) => {
    const newItems = [...items];
    // Default values to prevent NaN
    const rate = parseFloat(prod.mrp_baseprice) || 0;
    const gst = parseFloat(prod.gst_percent) || 0;
    const disc = parseFloat(prod.discount_percent) || 0;

    newItems[index] = {
      ...newItems[index],
      item_id: prod.id,
      name: prod.item_name,
      hsn: prod.hsn_sac_code || '',
      rate: rate,
      gst: gst,
      discount: disc,
      amount: calculateRowTotal(newItems[index].qty, rate, disc, gst)
    };
    setItems(newItems);
    setProdResults([]);
    setActiveSearchIndex(null);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    const item = newItems[index];
    newItems[index].amount = calculateRowTotal(item.qty, item.rate, item.discount, item.gst);
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { item_id: null, name: '', qty: 1, rate: 0, discount: 0, gst: 0, amount: 0 }]);
  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  // --- SUBMIT LOGIC ---
  const handleSubmit = async () => {
    // 1. Basic Validation
    if (!formData.customer_id) return alert("Please select a customer first.");
    
    // 2. Filter out invalid rows
    const validItems = items.filter(item => item.item_id !== null);
    
    if (validItems.length === 0) {
        return alert("Please add at least one valid product to the invoice.");
    }

    // 3. Construct Payload
    const payload = {
      customer: formData.customer_id,
      customer_name: formData.customer_name, // <--- ADD THIS LINE HERE
      invoice_id: formData.invoice_id,
      date: formData.date,                   // <--- Make sure Date is also sent
      discount_percent: parseFloat(formData.discount_percent) || 0,
      payment_mode: formData.payment_mode,
      status: formData.status,
      // Map valid items to API structure
      invoice_items: validItems.map(item => ({
        item: item.item_id,
        quantity: parseInt(item.qty) || 1,
        rate: parseFloat(item.rate).toFixed(2),
        gst_percent: parseFloat(item.gst).toFixed(2),
        total_value: parseFloat(item.amount).toFixed(2)
      }))
    };

    console.log("Sending Payload:", payload); 

    try {
      await api.post('/invoices/', payload);
      alert("Invoice Created Successfully!");
      onSuccess();
    } catch (err) {
      console.error("Invoice Error:", err);
      if (err.response && err.response.data) {
         const serverErrors = err.response.data;
         if (serverErrors.invoice_items) {
             alert(`Item Error: ${JSON.stringify(serverErrors.invoice_items)}`);
         } else {
             alert(`Server Error: ${JSON.stringify(serverErrors)}`);
         }
      } else {
         alert("Failed to create invoice. Server unreachable.");
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{width: '900px', maxWidth: '95vw'}}>
        <div className="modal-header">
          <h2>Create New Invoice</h2>
          <button className="close-btn" onClick={onClose}><X size={20}/></button>
        </div>

        <div className="invoice-form scrollable-form" style={{padding: '20px'}}>
          
          <div className="form-row">
            <div className="form-group"><label>Invoice ID</label><input value={formData.invoice_id} readOnly style={{background: '#f3f4f6'}} /></div>
            <div className="form-group"><label>Date</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
          </div>

          <div className="form-group relative">
            <label>Customer Details*</label>
            {!selectedCustomer ? (
                <div style={{display:'flex', gap:'10px'}}>
                    <div style={{flex:1, position:'relative'}}>
                        <input 
                            type="text" 
                            placeholder="Search Customer..." 
                            value={custSearch}
                            onChange={(e) => handleCustSearch(e.target.value)}
                        />
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
                    <button className="btn btn-blue" style={{width:'auto', padding:'0 15px'}} onClick={() => setShowAddCust(true)}>+ New</button>
                </div>
            ) : (
                <div className="customer-info-card">
                    <div className="info-header">
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <div className="avatar-circle">{selectedCustomer.name.charAt(0)}</div>
                            <div>
                                <div style={{fontWeight:'bold', fontSize:'15px'}}>{selectedCustomer.name}</div>
                            </div>
                        </div>
                        <button className="btn-icon-small" onClick={removeCustomer}><X size={16}/></button>
                    </div>
                    <div className="info-grid">
                        <div className="info-item"><Phone size={14}/> {selectedCustomer.phone || 'N/A'}</div>
                        <div className="info-item"><MapPin size={14}/> {selectedCustomer.address || 'No Address'}</div>
                        <div className="info-item"><CreditCard size={14}/> GST: {selectedCustomer.gst_number || 'N/A'}</div>
                        <div className="info-item"><User size={14}/> {selectedCustomer.email || 'N/A'}</div>
                    </div>
                </div>
            )}
          </div>

          <table className="custom-table" style={{marginTop:'20px'}}>
            <thead><tr><th width="30%">Item</th><th>Qty</th><th>Rate</th><th>Disc%</th><th>GST%</th><th>Amount</th><th>Action</th></tr></thead>
            <tbody>
                {items.map((item, index) => (
                    <tr key={index}>
                        <td style={{position:'relative'}}>
                            <input value={item.name} onChange={(e) => handleProdSearch(e.target.value, index)} placeholder="Search Item..." style={{width:'100%'}}/>
                            {activeSearchIndex === index && prodResults.length > 0 && (
                                <div className="search-dropdown" style={{top:'100%', left:0, width:'100%'}}>
                                    {prodResults.map(p => (
                                        <div key={p.id} className="search-item" onClick={() => selectProduct(p, index)}>
                                            {p.item_name} (₹{p.mrp_baseprice})
                                        </div>
                                    ))}
                                </div>
                            )}
                        </td>
                        <td><input type="number" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} style={{width:'50px'}}/></td>
                        <td><input type="number" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} style={{width:'70px'}}/></td>
                        <td><input type="number" value={item.discount} onChange={(e) => handleItemChange(index, 'discount', e.target.value)} style={{width:'50px'}}/></td>
                        <td><input type="number" value={item.gst} onChange={(e) => handleItemChange(index, 'gst', e.target.value)} style={{width:'50px'}}/></td>
                        <td>{item.amount}</td>
                        <td><button onClick={() => removeItem(index)} className="text-red"><Trash2 size={16}/></button></td>
                    </tr>
                ))}
            </tbody>
          </table>
          <button className="btn btn-gray" onClick={addItem} style={{marginTop:'10px'}}>+ Add Item</button>

          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:'20px'}}>
             <div style={{width:'200px'}}>
                <label>Payment Mode</label>
                <select value={formData.payment_mode} onChange={e => setFormData({...formData, payment_mode: e.target.value})}>
                    <option>Cash</option><option>UPI</option><option>Card</option>
                </select>
             </div>
             <div style={{width:'200px'}}>
                <label>Payment Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option>Paid</option>
                </select>
             </div>
             <div style={{fontSize:'20px', fontWeight:'bold'}}>
                Total: ₹{Math.round(calculateTotal())}
             </div>
          </div>

          <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'20px'}}>
             <button className="btn btn-gray" onClick={onClose}>Cancel</button>
             <button className="btn btn-blue" onClick={handleSubmit}>Save Invoice</button>
          </div>
        </div>
      </div>

      {showAddCust && (
        <div className="modal-overlay" style={{zIndex: 110}}>
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
                    <button className="btn btn-blue" onClick={handleSaveNewCustomer} style={{marginTop:'10px'}}>Save & Select</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CreateInvoice;