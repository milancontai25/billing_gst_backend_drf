import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { Plus, Filter, Edit, Trash2, X, Save, UploadCloud, Film, Download, Upload } from 'lucide-react';

// Helper to fix image paths (from backend relative path to full URL)
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; 
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  return `${API_BASE_URL}${imagePath}`;
};

const Products = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false); // New State for Import Loading
  
  // Refs
  const fileInputRef = useRef(null); // Ref for hidden file input

  // ... (Modal, Filter, Form states remain same) ...
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const initialFormState = {
    item_type: 'Goods',
    item_name: '',
    item_image: null, 
    item_image_1: null, item_image_2: null, item_image_3: null, item_video_link: '',
    brand_product: '', hsn_sac_code_product: '', unit_product: 'Pcs',
    quantity_product: 0, cost_price_product: 0, min_stock_product: 0,
    min_order_quantity_product: 1,
    max_order_quantity_product: 1,
    availability_status_service: 'Available',
    category: '', description: '', mrp_baseprice: 0, gross_amount: 0, 
    gst_percent: 0, includes_gst: false,
    area: '', customer_view: 'Special', isShow: false,
  };
  
  const [formData, setFormData] = useState(initialFormState);

  // --- API CALLS ---
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/');
      setItems(res.data);
      setFilteredItems(res.data); 
      setLoading(false);
    } catch (err) {
      console.error("Error fetching inventory", err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  // --- FILTER LOGIC (Same as before) ---
  useEffect(() => {
    let result = items;
    if (typeFilter !== 'All') result = result.filter(item => item.item_type === typeFilter);
    if (categoryFilter !== 'All') result = result.filter(item => item.category === categoryFilter);
    setFilteredItems(result);
  }, [items, typeFilter, categoryFilter]);

  const categories = ['All', ...new Set(items.map(item => item.category).filter(Boolean))];

  // --- EXPORT FUNCTION ---
  const handleExport = () => {
    if (filteredItems.length === 0) return alert("No items to export.");

    // Define CSV Headers
    const headers = [
        "Item Type", "Name", "Category", "Brand", "HSN Code", 
        "Price", "Gross", "GST%", "Cost Price", 
        "Quantity", "Unit", "Min Stock", "Service Status", 
        "Area", "Description"
    ];

    // Map Data to CSV Rows
    const rows = filteredItems.map(item => {
        const isService = item.item_type === 'Service';
        return [
            item.item_type,
            `"${item.item_name}"`, // Quote to handle commas in name
            item.category,
            isService ? 'NA' : (item.brand_product || '-'),
            isService ? 'NA' : (item.hsn_sac_code_product || '-'),
            item.mrp_baseprice,
            item.gross_amount,
            item.gst_percent,
            isService ? 0 : item.cost_price_product,
            isService ? 0 : item.quantity_product,
            isService ? 'NA' : item.unit_product,
            isService ? 0 : item.min_stock_product,
            isService ? item.availability_status_service : 'NA',
            item.area,
            `"${item.description || ''}"`
        ].join(",");
    });

    // Create File
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  // --- IMPORT FUNCTION ---
  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
        const text = evt.target.result;
        // Split by new line, remove header row (index 0)
        const rows = text.split("\n").slice(1).filter(r => r.trim() !== '');
        
        let successCount = 0;
        let errors = [];

        // Loop through rows and create items
        for (let i = 0; i < rows.length; i++) {
            const cols = rows[i].split(","); // Simple split (Production apps should use a CSV parser lib)
            
            // Basic Mapping (Assuming order matches Export headers)
            // 0:Type, 1:Name, 2:Cat, 3:Brand, 4:HSN, 5:Price, 6:Gross, 7:GST, 
            // 8:Cost, 9:Qty, 10:Unit, 11:MinStock, 12:Status, 13:Area, 14:Desc

            // Clean quotes from Name/Desc
            const name = cols[1]?.replace(/"/g, "").trim();
            const type = cols[0]?.trim();

            if (!name || !type) continue; // Skip invalid rows

            const isService = type === 'Service';

            const payload = new FormData();
            payload.append('item_type', type);
            payload.append('item_name', name);
            payload.append('category', cols[2] || 'General');
            payload.append('mrp_baseprice', cols[5] || 0);
            payload.append('gross_amount', cols[6] || 0);
            payload.append('gst_percent', cols[7] || 0);
            payload.append('area', cols[13] || 'Store');
            payload.append('description', cols[14]?.replace(/"/g, "") || '');
            payload.append('customer_view', 'Special'); // Default

            // CONDITIONAL FIELDS LOGIC
            if (isService) {
                payload.append('availability_status_service', cols[12] || 'Available');
                // Goods fields can be empty or 0
                payload.append('quantity_product', 0);
                payload.append('brand_product', 'NA');
            } else {
                payload.append('brand_product', cols[3] || 'Generic');
                payload.append('hsn_sac_code_product', cols[4] || '');
                payload.append('cost_price_product', cols[8] || 0);
                payload.append('quantity_product', cols[9] || 0);
                payload.append('unit_product', cols[10] || 'Pcs');
                payload.append('min_stock_product', cols[11] || 5);
            }

            try {
                // Post one by one
                await api.post('/products/', payload, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                successCount++;
            } catch (err) {
                console.error(`Failed to import row ${i+1}`, err);
                errors.push(`Row ${i+1}: ${name}`);
            }
        }

        setImporting(false);
        alert(`Import Finished.\nSuccess: ${successCount}\nFailed: ${errors.length}`);
        fetchInventory();
        e.target.value = null; // Reset input
    };

    reader.readAsText(file);
  };

  // ... (Handlers: handleInputChange, handleFileChange, openAddModal, openEditModal, handleSubmit, handleDelete same as previous) ...
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
        ...formData, 
        [name]: type === 'checkbox' ? checked : value // <--- UPDATED LOGIC
    });
  };

  const handleFileChange = (e, fieldName) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, [fieldName]: e.target.files[0] });
    }
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setFormData({
        ...initialFormState,
        ...item,
        mrp_baseprice: item.mrp_baseprice || 0,
        gross_amount: item.gross_amount || 0,
        gst_percent: item.gst_percent || 0,
        includes_gst: item.includes_gst || false,
        min_order_quantity_product: item.min_order_quantity_product || 1,
        max_order_quantity_product: item.max_order_quantity_product || 1,
        isShow: item.isShow || false
    });
    setEditId(item.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    const isService = formData.item_type === 'Service';

    const fields = [
        'item_type', 'item_name', 'category', 'description', 
        'mrp_baseprice', 'gross_amount', 'gst_percent', 'includes_gst', 'area', 'customer_view',
        'item_video_link', 'isShow'
    ];

    if (isService) {
        fields.push('availability_status_service');
    } else {
        fields.push('brand_product', 'hsn_sac_code_product', 'unit_product', 
                    'quantity_product', 'cost_price_product', 'min_stock_product', 'min_order_quantity_product', 'max_order_quantity_product');
    }

    fields.forEach(key => {
        let value = formData[key];
        if (value === null || value === undefined) value = '';
        submitData.append(key, value);
    });

    ['item_image', 'item_image_1', 'item_image_2', 'item_image_3'].forEach(imgKey => {
        if (formData[imgKey] instanceof File) {
            submitData.append(imgKey, formData[imgKey]);
        }
    });

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (isEditing) {
        await api.put(`/products/${editId}/`, submitData, config);
        alert("Inventory Updated!");
      } else {
        await api.post('/products/', submitData, config);
        alert("Inventory Added!");
      }
      setShowModal(false);
      fetchInventory(); 
    } catch (err) {
      console.error(err);
      alert("Error saving item.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this item?")) {
      try {
        await api.delete(`/products/${id}/`);
        fetchInventory(); 
      } catch (err) { alert("Failed to delete item"); }
    }
  };

  // Helper Variables
  const isService = formData.item_type === 'Service';

  // Clear Filter Helper
  const clearFilters = () => {
    setTypeFilter('All');
    setCategoryFilter('All');
    setShowFilter(false);
  };

  return (
    <div className="page-content">
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        style={{display:'none'}} 
        onChange={handleImportFile} 
      />

      <div className="action-bar">
        <h2 className="section-title">Inventory Management</h2>
        
        <div className="action-buttons">
          {/* IMPORT/EXPORT BUTTONS */}
          <button className="btn btn-gray" onClick={handleExport}>
             <Download size={16} /> Export
          </button>
          <button className="btn btn-gray" onClick={handleImportClick} disabled={importing}>
             <Upload size={16} /> {importing ? "Importing..." : "Import"}
          </button>

          <button className="btn btn-blue" onClick={openAddModal}>
            <Plus size={16} /> Add Inventory
          </button>
          
          {/* FILTER DROPDOWN */}
          <div style={{ position: 'relative' }}>
            <button 
                className={`btn btn-outline ${typeFilter !== 'All' || categoryFilter !== 'All' ? 'text-blue-600 border-blue-200 bg-blue-50' : ''}`}
                onClick={() => setShowFilter(!showFilter)}
            >
               <Filter size={16} /> 
               {typeFilter === 'All' && categoryFilter === 'All' ? 'Filter' : 'Filters Active'}
            </button>

            {showFilter && (
                <div className="dropdown-menu wide-dropdown" style={{ width: '280px', right: 0, display:'flex', flexDirection:'column' }}>
                  <div style={{ display: 'flex' }}>
                      <div className="dropdown-section" style={{ flex: 1, borderRight: '1px solid #eee' }}>
                          <div className="dropdown-label">Type</div>
                          {['All', 'Goods', 'Service'].map(type => (
                              <div key={type} className={`dropdown-option ${typeFilter === type ? 'active' : ''}`} onClick={() => setTypeFilter(type)}>{type}</div>
                          ))}
                      </div>
                      <div className="dropdown-section" style={{ flex: 1, maxHeight:'200px', overflowY:'auto' }}>
                          <div className="dropdown-label">Category</div>
                          {categories.map(cat => (
                              <div key={cat} className={`dropdown-option ${categoryFilter === cat ? 'active' : ''}`} onClick={() => setCategoryFilter(cat)}>{cat}</div>
                          ))}
                      </div>
                  </div>
                  <div className="dropdown-footer" onClick={clearFilters}>Clear All Filters</div>
                </div>
            )}
          </div>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="p-10 text-center text-gray">Loading Inventory...</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Type</th>
                <th>Category</th>
                <th>Stock / Status</th>
                <th>Price</th>
                <th>Gross</th>
                <th>Online</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-5">No items found matching your filters.</td></tr>
              ) : (
                filteredItems.map((row) => (
                    <tr key={row.id}>
                      <td className="fw-600 text-dark">
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            {row.item_image ? (
                                <img src={getImageUrl(row.item_image)} alt="img" style={{width:'30px', height:'30px', borderRadius:'4px', objectFit:'cover'}} />
                            ) : <div style={{width:'30px', height:'30px', background:'#eee', borderRadius:'4px'}}></div>}
                            {row.item_name}
                        </div>
                      </td>
                      <td>
                          <span className={`badge ${row.item_type === 'Service' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                              {row.item_type}
                          </span>
                      </td>
                      <td>{row.category}</td>
                      <td>
                          {row.item_type === 'Goods' 
                            ? `${row.quantity_product} ${row.unit_product}` 
                            : <span className="text-green-600 font-medium">{row.availability_status_service}</span>
                          }
                      </td>
                      <td>₹{row.mrp_baseprice}</td>
                      <td>₹{row.gross_amount}</td>
                      <td>
                          {row.isShow ? (
                              <span className="badge bg-green-50 text-green-600">Visible</span>
                          ) : (
                              <span className="badge bg-gray-100 text-gray-500">Hidden</span>
                          )}
                      </td>
                      <td className="action-cells">
                        <button className="action-btn edit" onClick={() => openEditModal(row)}><Edit size={16} /></button>
                        <button className="action-btn delete" onClick={() => handleDelete(row.id)}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL SECTION (Same logic as before, just kept for context) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box extended-modal product-edit-modal">
            <div className="modal-header">
              <h2>{isEditing ? "Edit Item" : "Add Inventory Item"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="setup-form scrollable-form">
              <div style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6', marginBottom: '15px' }}>
                <label className="flex items-center gap-2 cursor-pointer" style={{fontSize: '14px', fontWeight: '500', color:'#374151'}}>
                    <input 
                        type="checkbox" 
                        name="isShow" 
                        checked={formData.isShow} 
                        onChange={handleInputChange} 
                        style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                    />
                    Show this item in Online Store
                </label>
              </div>

              <div className="form-group">
                  <label>Item Type*</label>
                  <select name="item_type" value={formData.item_type} onChange={handleInputChange} disabled={isEditing}>
                      <option value="Goods">Goods (Product)</option>
                      <option value="Service">Service</option>
                  </select>
              </div>

              {/* ... Rest of the form remains identical to previous version ... */}
              <div className="form-row">
                <div className="form-group half-width">
                  <label>Item Name*</label>
                  <input type="text" name="item_name" value={formData.item_name} onChange={handleInputChange} required />
                </div>
                <div className="form-group half-width">
                  <label>Category*</label>
                  <input type="text" name="category" value={formData.category} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="form-row">
                 {!isService && (
                    <div className="form-group half-width">
                        <label>Brand*</label>
                        <input type="text" name="brand_product" value={formData.brand_product} onChange={handleInputChange} required />
                    </div>
                 )}
                 {isService && (
                    <div className="form-group half-width">
                        <label>Availability Status</label>
                        <select name="availability_status_service" value={formData.availability_status_service} onChange={handleInputChange}>
                            <option value="Available">Available</option>
                            <option value="Busy">Busy</option>
                            <option value="Offline">Offline</option>
                        </select>
                    </div>
                 )}
                 {!isService && (
                    <div className="form-group half-width">
                        <label>HSN/SAC Code*</label>
                        <input type="text" name="hsn_sac_code_product" value={formData.hsn_sac_code_product} onChange={handleInputChange} required />
                    </div>
                 )}
              </div>

              {/* 4. Pricing & Tax (UPDATED) */}
              <div className="form-section-title">Pricing & Tax</div>
              
              {/* Row 1: Base Price & GST % */}
              <div className="form-row">
                <div className="form-group half-width">
                  <label>{isService ? 'Base Price (Fees)*' : 'MRP (Base Price)*'}</label>
                  <input type="number" name="mrp_baseprice" value={formData.mrp_baseprice} onChange={handleInputChange} required />
                </div>
                <div className="form-group half-width">
                  <label>GST %*</label>
                  <input type="number" name="gst_percent" value={formData.gst_percent} onChange={handleInputChange} required />
                </div>
              </div>

              {/* Row 2: Gross Amount & Includes GST? */}
              <div className="form-row">
                 <div className="form-group half-width">
                    <label>Gross Amount*</label>
                    <input type="number" name="gross_amount" value={formData.gross_amount} onChange={handleInputChange} required />
                 </div>
                 
                 {/* --- NEW DROPDOWN --- */}
                 <div className="form-group half-width">
                    <label>GA includes GST?</label>
                    <select 
                        name="includes_gst" 
                        value={String(formData.includes_gst)} // Cast to string to match options
                        onChange={handleInputChange}
                    >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                    </select>
                 </div>
              </div>

              {/* Row 3: Cost Price (Only for Goods) */}
              {!isService && (
                  <div className="form-row">
                    <div className="form-group half-width">
                        <label>Cost Price*</label>
                        <input type="number" name="cost_price_product" value={formData.cost_price_product} onChange={handleInputChange} required />
                    </div>
                    <div className="half-width"></div> {/* Spacer */}
                  </div>
              )}

              {/* 5. Inventory (Only for Goods) */}
              {!isService && (
                  <>
                    <div className="form-section-title">Inventory Details</div>
                    <div className="form-row">
                        <div className="form-group half-width">
                            <label>Quantity*</label>
                            <input type="number" name="quantity_product" value={formData.quantity_product} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group half-width">
                            <label>Unit*</label>
                            <select name="unit_product" value={formData.unit_product} onChange={handleInputChange} required>
                                <option value="Pcs">Pieces (Pcs)</option>
                                <option value="kg">Kilogram (KG)</option>
                                <option value="liter">Liter (L)</option>
                                <option value="meter">Meter (M)</option>
                                <option value="box">Box</option>
                            </select>
                        </div>
                    </div>

                    {/* --- NEW ROW FOR ORDER LIMITS --- */}
                    <div className="form-row">
                        <div className="form-group half-width">
                            <label>Min Order Qty*</label>
                            <input type="number" name="min_order_quantity_product" value={formData.min_order_quantity_product} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group half-width">
                            <label>Max Order Qty*</label>
                            <input type="number" name="max_order_quantity_product" value={formData.max_order_quantity_product} onChange={handleInputChange} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Min Stock Alert*</label>
                        <input type="number" name="min_stock_product" value={formData.min_stock_product} onChange={handleInputChange} required />
                    </div>
                  </>
              )}

              <div className="form-section-title">Media & Extras</div>
              <div className="form-group">
                 <label className="block fw-600" style={{fontSize:'13px', marginBottom:'6px'}}>Main Item Image</label>
                 <input type="file" onChange={(e) => handleFileChange(e, 'item_image')} accept="image/*" />
              </div>
              <div className="form-row">
                 <div className="form-group" style={{flex:1}}>
                    <label style={{fontSize:'12px'}}>Image 1</label>
                    <input type="file" onChange={(e) => handleFileChange(e, 'item_image_1')} accept="image/*" className="file-input-small"/>
                 </div>
                 <div className="form-group" style={{flex:1}}>
                    <label style={{fontSize:'12px'}}>Image 2</label>
                    <input type="file" onChange={(e) => handleFileChange(e, 'item_image_2')} accept="image/*" className="file-input-small"/>
                 </div>
                 <div className="form-group" style={{flex:1}}>
                    <label style={{fontSize:'12px'}}>Image 3</label>
                    <input type="file" onChange={(e) => handleFileChange(e, 'item_image_3')} accept="image/*" className="file-input-small"/>
                 </div>
              </div>
              <div className="form-group">
                 <label>Video Link (Optional)</label>
                 <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <Film size={18} color="#6b7280" />
                    <input type="url" name="item_video_link" value={formData.item_video_link} onChange={handleInputChange} placeholder="https://youtube.com/..." style={{flex:1}} />
                 </div>
              </div>

              <div className="form-section-title">Additional Info</div>
              <div className="form-row">
                 <div className="form-group half-width">
                    <label>Area / Location*</label>
                    <input type="text" name="area" value={formData.area} onChange={handleInputChange} required />
                 </div>
                 <div className="form-group half-width">
                    <label>Customer View</label>
                    <select name="customer_view" value={formData.customer_view} onChange={handleInputChange}>
                        <option value="General">General</option>
                        <option value="Special">Special</option>
                    </select>
                 </div>
              </div>

              <div className="form-group">
                 <label>Description</label>
                 <textarea name="description" value={formData.description} onChange={handleInputChange} className="form-control" rows="2"></textarea>
              </div>

              <button type="submit" className="btn-primary">
                 <Save size={16} style={{marginRight:8}}/> {isEditing ? "Update Item" : "Save Item"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


export default Products;