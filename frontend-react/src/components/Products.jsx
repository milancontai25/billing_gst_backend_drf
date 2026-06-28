import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { Plus, Filter, Edit, Trash2, X, Save, Film, Download, Upload, Barcode, Layers } from 'lucide-react';
import VariantManagerModal from './VariantManagerModal'; 
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; 
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  return `${API_BASE_URL}${imagePath}`;
};

const Products = () => {
  const { data: dashboardData } = useOutletContext();
  const activeBusiness = dashboardData?.active_business;
  const navigate = useNavigate(); 
  
  const isTaxEnabled = activeBusiness?.tax_type && activeBusiness.tax_type !== 'NONE';

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false); 
  
  const fileInputRef = useRef(null); 

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [managingVariantsFor, setManagingVariantsFor] = useState(null);

  // 🚨 ADDED: URL fields to the initial state
  const initialFormState = {
    item_type: 'Goods',
    item_name: '',
    
    item_image: null, item_image_url: '', 
    image_1: null, item_image_1: '', 
    image_2: null, item_image_2: '', 
    image_3: null, item_image_3: '', 
    category_image: null, category_image_url: '', 
    subcategory_image: null, subcategory_image_url: '', 
    
    item_video_link: '',
    brand_product: '', hsn_sac_code_product: '', unit_product: 'Pcs',
    quantity_product: 0, cost_price_product: 0, min_stock_product: 0,
    min_order_quantity_product: 1,
    max_order_quantity_product: 1,
    availability_status_service: 'Available',
    category: '', 
    subcategory: '', 
    description: '', mrp_baseprice: 0, gross_amount: 0, 
    tax_percent: 0, 
    area: '', customer_view: 'Special', 
    isShow: false,
    best_selling: false,
    trending: false,
    has_variants: false, 
  };
  
  const [formData, setFormData] = useState(initialFormState);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/');
      const dataArray = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setItems(dataArray);
      setFilteredItems(dataArray); 
      setLoading(false);
    } catch (err) {
      console.error("Error fetching inventory", err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  useEffect(() => {
    let result = items;
    if (typeFilter !== 'All') result = result.filter(item => item.item_type === typeFilter);
    if (categoryFilter !== 'All') result = result.filter(item => item.category === categoryFilter);
    setFilteredItems(result);
  }, [items, typeFilter, categoryFilter]);

  const categories = ['All', ...new Set(items.map(item => item.category).filter(Boolean))];

  
  // --- 1. FULL FLATTENED EXPORT LOGIC ---
  const handleExport = () => {
    if (filteredItems.length === 0) return alert("No items to export.");

    // The exact columns requested, plus 'Item Slug' for safe parent-child linking
    const headers = [
        "Item Slug", "Item Name", "Item Type", "Has Variants", "Description", 
        "Category", "Subcategory", "Brand", "HSN", "Unit", "Area", "Customer View", 
        "Availability Status", "Tax %", "Best Selling", "Trending", "Show", 
        "Main Image", "Image 1", "Image 2", "Image 3", "Video URL", 
        "Category Image", "Subcategory Image", 
        "Stock", "Minimum Stock", "MRP", "Selling Price", "Cost Price", "Minimum Order", "Maximum Order", 
        
        "Variant SKU", "Variant Name", "Variant Stock", "Variant Minimum Stock", 
        "Variant MRP", "Variant Selling Price", "Variant Cost Price", 
        "Variant Minimum Order", "Variant Maximum Order", "Variant Active", 
        
        ...Array.from({length: 10}, (_, i) => `Variant Image ${i+1}`),
        ...Array.from({length: 10}, (_, i) => [`Attr ${i+1} Name`, `Attr ${i+1} Value`]).flat()
    ];

    const rows = [];
    const safeText = (text) => `"${(text || '').toString().replace(/"/g, '""')}"`;

    filteredItems.forEach(item => {
        const isService = item.item_type === 'Service';
        
        // Map the Base Item Data
        const baseData = {
            "Item Slug": safeText(item.slug),
            "Item Name": safeText(item.item_name),
            "Item Type": item.item_type,
            "Has Variants": item.has_variants ? 'TRUE' : 'FALSE',
            "Description": safeText(item.description),
            "Category": safeText(item.category),
            "Subcategory": safeText(item.subcategory),
            "Brand": isService ? 'NA' : safeText(item.brand_product),
            "HSN": isService ? 'NA' : safeText(item.hsn_sac_code_product),
            "Unit": isService ? 'NA' : safeText(item.unit_product || 'Pcs'),
            "Area": safeText(item.area),
            "Customer View": safeText(item.customer_view || 'General'),
            "Availability Status": isService ? safeText(item.availability_status_service) : 'NA',
            "Tax %": item.tax_percent || 0,
            "Best Selling": item.best_selling ? 'TRUE' : 'FALSE',
            "Trending": item.trending ? 'TRUE' : 'FALSE',
            "Show": item.isShow ? 'TRUE' : 'FALSE',
            
            "Main Image": safeText(item.item_image_url),
            "Image 1": safeText(item.item_image_1),
            "Image 2": safeText(item.item_image_2),
            "Image 3": safeText(item.item_image_3),
            "Video URL": safeText(item.item_video_link),
            "Category Image": safeText(item.category_image_url),
            "Subcategory Image": safeText(item.subcategory_image_url),
            
            "Stock": isService ? 0 : (item.quantity_product || 0),
            "Minimum Stock": isService ? 0 : (item.min_stock_product || 0),
            "MRP": item.mrp_baseprice || 0,
            "Selling Price": item.gross_amount || 0,
            "Cost Price": isService ? 0 : (item.cost_price_product || 0),
            "Minimum Order": isService ? 1 : (item.min_order_quantity_product || 1),
            "Maximum Order": isService ? 1 : (item.max_order_quantity_product || 1)
        };

        // SCENARIO A: No Variants (Export 1 Row)
        if (!item.has_variants || !item.variants || item.variants.length === 0) {
            const row = headers.map(h => baseData[h] !== undefined ? baseData[h] : "");
            rows.push(row.join(","));
        } 
        // SCENARIO B: Has Variants (Export Multiple Rows)
        else {
            item.variants.forEach((variant, index) => {
                const row = headers.map(h => {
                    // 1. Variant Data
                    if (h === "Variant SKU") return safeText(variant.sku);
                    if (h === "Variant Name") return safeText(variant.variant_name);
                    if (h === "Variant Stock") return variant.stock || 0;
                    if (h === "Variant Minimum Stock") return variant.min_stock || 0;
                    if (h === "Variant MRP") return variant.mrp_base || 0;
                    if (h === "Variant Selling Price") return variant.selling_price || 0;
                    if (h === "Variant Cost Price") return variant.cost_price || 0;
                    if (h === "Variant Minimum Order") return variant.min_order_quantity || 1;
                    if (h === "Variant Maximum Order") return variant.max_order_quantity || 1;
                    if (h === "Variant Active") return variant.is_active !== false ? 'TRUE' : 'FALSE';

                    // 2. Variant Images (1 through 10)
                    if (h.startsWith("Variant Image ")) {
                        const imgIndex = parseInt(h.replace("Variant Image ", "")) - 1;
                        return variant.images && variant.images[imgIndex] ? safeText(variant.images[imgIndex].image_url) : "";
                    }

                    // 3. Variant Attributes (1 through 10)
                    if (h.startsWith("Attr ")) {
                        const isName = h.endsWith("Name");
                        const attrIndex = parseInt(h.split(" ")[1]) - 1;
                        const attr = variant.attributes && variant.attributes[attrIndex];
                        if (!attr) return "";
                        return safeText(isName ? attr.attribute_name : attr.attribute_value);
                    }

                    // 4. Base Data Linking
                    if (baseData[h] !== undefined) {
                        // Print full base data on the 1st variant row. 
                        // On row 2+, only print the Slug so they stay linked.
                        if (index === 0) return baseData[h];
                        if (h === "Item Slug") return baseData["Item Slug"]; 
                        return "";
                    }
                    return "";
                });
                rows.push(row.join(","));
            });
        }
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8-sig;" }); // Added BOM for safe Excel opening
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const handleImportClick = () => fileInputRef.current.click();

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file); 

    try {
        // 🚨 THE FIX: Force multipart/form-data to override your global JSON default
        const res = await api.post('/products/bulk-import/', formData, {
            headers: { 
                'Content-Type': 'multipart/form-data' 
            }
        });
        
        alert(
            `Import Finished!\n` +
            `Items Created: ${res.data.items_created || 0}\n` +
            `Items Updated: ${res.data.items_updated || 0}\n` +
            `Variants Created: ${res.data.variants_created || 0}\n` +
            `Variants Updated: ${res.data.variants_updated || 0}`
        );
        fetchInventory();
        
    } catch (err) {
        console.error(err);
        alert(`Import Failed: ${JSON.stringify(err.response?.data || err.message)}`);
    } finally {
        setImporting(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = null; 
        }
    }
  };

  const handleDownloadBarcode = async (itemId, itemName) => {
    try {
      const response = await api.get(`/items/${itemId}/barcode/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Barcode_${itemName.replace(/\s+/g, '_')}.png`); 
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Error downloading barcode", err);
      alert("Failed to download barcode. Please check if the barcode exists.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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
      // Clear physical file instances so they aren't incorrectly sent
      item_image: null, image_1: null, image_2: null, image_3: null,
      category_image: null, subcategory_image: null,
      
      // 🚨 Ensure URLs map correctly when opening an existing item
      item_image_url: item.item_image_url || '',
      item_image_1: item.item_image_1 || '',
      item_image_2: item.item_image_2 || '',
      item_image_3: item.item_image_3 || '',
      category_image_url: item.category_image_url || '',
      subcategory_image_url: item.subcategory_image_url || '',
      
      mrp_baseprice: item.mrp_baseprice || 0,
      gross_amount: item.gross_amount || 0,
      tax_percent: item.tax_percent || 0,
      min_order_quantity_product: item.min_order_quantity_product || 1,
      max_order_quantity_product: item.max_order_quantity_product || 1,
      
      isShow: item.isShow || false,
      best_selling: item.best_selling || false, 
      trending: item.trending || false,
      has_variants: item.has_variants || false 
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
        'item_type', 'item_name', 'category', 'subcategory', 'description', 
        'mrp_baseprice', 'gross_amount', 'tax_percent',
        'area', 'customer_view', 'item_video_link'
    ];

    submitData.append('isShow', formData.isShow ? 'true' : 'false');
    submitData.append('best_selling', formData.best_selling ? 'true' : 'false');
    submitData.append('trending', formData.trending ? 'true' : 'false');
    
    if (isService) {
        submitData.append('has_variants', 'false');
    } else {
        submitData.append('has_variants', formData.has_variants ? 'true' : 'false');
    }

    if (isService) {
        fields.push('availability_status_service');
    } else {
        fields.push('brand_product', 'hsn_sac_code_product', 'unit_product', 
                    'quantity_product', 'cost_price_product', 'min_stock_product',
                    'min_order_quantity_product', 'max_order_quantity_product');
    }

    fields.forEach(key => {
        let value = formData[key];
        if (value === null || value === undefined) value = '';
        submitData.append(key, value);
    });

    // 🚨 Send physical files if the user uploaded them
    ['item_image', 'image_1', 'image_2', 'image_3', 'category_image', 'subcategory_image'].forEach(imgKey => {
        if (formData[imgKey] instanceof File) {
            submitData.append(imgKey, formData[imgKey]);
        }
    });

    // 🚨 Send URL strings if the user pasted them
    const urlFields = ['item_image_url', 'item_image_1', 'item_image_2', 'item_image_3', 'category_image_url', 'subcategory_image_url'];
    urlFields.forEach(urlKey => {
        if (formData[urlKey] && typeof formData[urlKey] === 'string') {
            submitData.append(urlKey, formData[urlKey]);
        }
    });

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (isEditing) {
        await api.patch(`/products/${editId}/`, submitData, config); 
        alert("Inventory Updated!");
      } else {
        await api.post('/products/', submitData, config);
        alert("Inventory Added!");
      }
      setShowModal(false);
      fetchInventory(); 
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
          alert(`Error: ${JSON.stringify(err.response.data)}`);
      } else {
          alert("Error saving item.");
      }
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

  const clearFilters = () => { setTypeFilter('All'); setCategoryFilter('All'); setShowFilter(false); };

  const quillModules = {
    toolbar: [
      [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['clean'] 
    ],
  };

  const handleDescriptionChange = (content) => setFormData({ ...formData, description: content });

  const isService = formData.item_type === 'Service';
  
  return (
    <div className="page-content smart-mobile-stack">
      <input type="file" accept=".csv" ref={fileInputRef} style={{display:'none'}} onChange={handleImportFile} />

      <div className="action-bar">
        <h2 className="section-title">Inventory Management</h2>
        <div className="action-buttons">
          <button className="btn btn-gray" onClick={handleExport}><Download size={16} /> Export</button>
          <button className="btn btn-gray" onClick={handleImportClick} disabled={importing}><Upload size={16} /> {importing ? "Importing..." : "Import"}</button>
          <button className="btn btn-blue" onClick={openAddModal}><Plus size={16} /> Add Inventory</button>
          
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
                <th>Gross</th>
                {isTaxEnabled && <th>Includes Tax</th>}
                <th>Online</th>
                <th>Barcode</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr><td colSpan={isTaxEnabled ? "9" : "8"} className="text-center p-5">No items found matching your filters.</td></tr>
              ) : (
                filteredItems.map((row) => (
                    <tr key={row.id}>
                      <td className="fw-600 text-dark">
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            {row.item_image_url ? (
                                <img src={getImageUrl(row.item_image_url)} alt="img" style={{width:'30px', height:'30px', borderRadius:'4px', objectFit:'cover'}} />
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
                            ? (row.has_variants ? <span className="badge bg-indigo-50 text-indigo-700" title="Check Variant Tab for Stock"><Layers size={12} className="inline mr-1"/> Multiple Variants</span> : `${row.quantity_product} ${row.unit_product}`) 
                            : <span className="text-green-600 font-medium">{row.availability_status_service}</span>
                          }
                      </td>
                      
                      <td>{row.has_variants ? '-' : `${row.currency_symbol}${row.gross_amount}`}</td>
                      
                      {isTaxEnabled && <td>{row.price_includes_tax ? "Yes" : "No"}</td>}
                      
                      <td>
                          {row.isShow ? (
                              <span className="badge bg-green-50 text-green-600">Visible</span>
                          ) : (
                              <span className="badge bg-gray-100 text-gray-500">Hidden</span>
                          )}
                      </td>

                      <td>
                        {row.item_type?.toLowerCase() === 'goods' && !row.has_variants ? (
                          <button 
                            className="action-btn" 
                            onClick={() => handleDownloadBarcode(row.id, row.item_name)}
                            title="Download Barcode"
                            style={{ color: '#4f46e5' }}
                          >
                            <Barcode size={18} />
                          </button>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>

                      <td className="action-cells">
                        {row.has_variants && (
                        <button 
                            className="action-btn" 
                            onClick={() => setManagingVariantsFor(row)} 
                            title="Manage Variants" 
                            style={{ color: '#6d28d9' }}
                        >
                          <Layers size={16} />
                        </button>
                      )}
                        <button className="action-btn edit" onClick={() => openEditModal(row)} title="Edit"><Edit size={16} /></button>
                        <button className="action-btn delete" onClick={() => handleDelete(row.id)} title="Delete"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box extended-modal product-edit-modal">
            <div className="modal-header">
              <h2>{isEditing ? "Edit Item" : "Add Inventory Item"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="setup-form scrollable-form">
              
              <div style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6', marginBottom: '15px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <label className="flex items-center gap-2 cursor-pointer" style={{fontSize: '14px', fontWeight: '500', color:'#374151'}}>
                    <input type="checkbox" name="isShow" checked={formData.isShow} onChange={handleInputChange} style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }} /> Show in Online Store
                </label>
                <label className="flex items-center gap-2 cursor-pointer" style={{fontSize: '14px', fontWeight: '500', color:'#374151'}}>
                    <input type="checkbox" name="best_selling" checked={formData.best_selling} onChange={handleInputChange} style={{ width: '18px', height: '18px', accentColor: '#10b981' }} /> Best Selling
                </label>
                <label className="flex items-center gap-2 cursor-pointer" style={{fontSize: '14px', fontWeight: '500', color:'#374151'}}>
                    <input type="checkbox" name="trending" checked={formData.trending} onChange={handleInputChange} style={{ width: '18px', height: '18px', accentColor: '#f59e0b' }} /> Trending
                </label>
              </div>

              <div className="form-group">
                  <label>Item Type*</label>
                  <select name="item_type" value={formData.item_type} onChange={handleInputChange} disabled={isEditing}>
                      <option value="Goods">Goods (Product)</option>
                      <option value="Service">Service</option>
                  </select>
              </div>

              <div className="form-group">
                <label>Item Name*</label>
                <input type="text" name="item_name" value={formData.item_name} onChange={handleInputChange} className="form-input" style={{ width: '100%' }} required />
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label>Category*</label>
                  <input type="text" name="category" value={formData.category} onChange={handleInputChange} required />
                </div>
                <div className="form-group half-width">
                  <label>Subcategory</label>
                  <input type="text" name="subcategory" value={formData.subcategory} onChange={handleInputChange} />
                </div>
              </div>

              {/* 🚨 UPDATED UI: Category / Subcategory Image Links */}
              <div className="form-row" style={{ borderBottom: '1px dashed #e5e7eb', paddingBottom: '15px', marginBottom: '15px' }}>
                 <div className="form-group half-width">
                     <label style={{ fontSize:'13px', color: '#6b7280' }}>Category Image (Optional)</label>
                     <input type="file" onChange={(e) => handleFileChange(e, 'category_image')} accept="image/*" className="file-input-small mb-2" style={{width:'100%'}}/>
                     <input type="url" name="category_image_url" value={formData.category_image_url} onChange={handleInputChange} placeholder="Or paste Image URL" className="form-input" style={{fontSize:'12px', padding:'6px'}}/>
                 </div>
                 <div className="form-group half-width">
                     <label style={{ fontSize:'13px', color: '#6b7280' }}>Subcategory Image (Optional)</label>
                     <input type="file" onChange={(e) => handleFileChange(e, 'subcategory_image')} accept="image/*" className="file-input-small mb-2" style={{width:'100%'}}/>
                     <input type="url" name="subcategory_image_url" value={formData.subcategory_image_url} onChange={handleInputChange} placeholder="Or paste Image URL" className="form-input" style={{fontSize:'12px', padding:'6px'}}/>
                 </div>
              </div>

              {!isService && (
                 <div className="form-group" style={{ marginBottom: '15px' }}>
                   <label className="flex items-center gap-2 cursor-pointer" style={{fontSize: '14px', fontWeight: '600', color:'#4f46e5', backgroundColor: '#f5f3ff', padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd6fe'}}>
                       <input 
                           type="checkbox" 
                           name="has_variants" 
                           checked={formData.has_variants} 
                           onChange={handleInputChange} 
                           disabled={isEditing}
                           style={{ width: '18px', height: '18px', accentColor: '#6d28d9' }}
                       />
                       This product has multiple variants (e.g., Sizes, Colors, RAM)
                   </label>
                 </div>
              )}

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

              {(!formData.has_variants || isService) ? (
                 <>
                    <div className="form-section-title">Pricing & Tax</div>
                    <div className="form-row">
                      <div className="form-group half-width">
                        <label>{isService ? 'Base Price (Fees)*' : 'MRP (Base Price)*'}</label>
                        <input type="number" name="mrp_baseprice" value={formData.mrp_baseprice} onChange={handleInputChange} required />
                      </div>
                      
                      {isTaxEnabled ? (
                          <div className="form-group half-width">
                            <label>Tax %*</label>
                            <input type="number" name="tax_percent" value={formData.tax_percent} onChange={handleInputChange} required />
                          </div>
                      ) : (
                          <div className="half-width"></div>
                      )}
                    </div>

                    <div className="form-row">
                       <div className="form-group half-width">
                          <label>Gross Amount*</label>
                          <input type="number" name="gross_amount" value={formData.gross_amount} onChange={handleInputChange} required />
                       </div>
                       <div className="half-width"></div>
                    </div>

                    {!isService && (
                        <div className="form-row">
                          <div className="form-group half-width">
                              <label>Cost Price*</label>
                              <input type="number" name="cost_price_product" value={formData.cost_price_product} onChange={handleInputChange} required />
                          </div>
                          <div className="half-width"></div> 
                        </div>
                    )}

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
                 </>
              ) : (
                  <div style={{ padding: '16px', backgroundColor: '#eff6ff', color: '#1e3a8a', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bfdbfe' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '15px', marginBottom: '6px' }}>
                          <Layers size={18} /> Variant System Active
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5' }}>
                          Because this item has variants, its pricing, stock quantities, and SKU barcodes will be managed individually for each variant. 
                          <strong> You can set these up on the next screen after saving this base item.</strong>
                      </p>
                  </div>
              )}

              <div className="form-section-title">Media & Extras</div>
              
              {/* 🚨 UPDATED UI: Main Item Image */}
              <div className="form-group">
                 <label className="block fw-600" style={{fontSize:'13px', marginBottom:'6px'}}>Main Item Image</label>
                 <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                     <input type="file" onChange={(e) => handleFileChange(e, 'item_image')} accept="image/*" style={{flex: 1, minWidth: '200px'}} />
                     <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 'bold' }}>OR</span>
                     <input type="url" name="item_image_url" value={formData.item_image_url} onChange={handleInputChange} placeholder="Paste Image URL" className="form-input" style={{flex: 1, minWidth: '200px'}} />
                 </div>
              </div>

              {/* 🚨 UPDATED UI: Images 1, 2, 3 */}
              <div className="form-row">
                 <div className="form-group" style={{flex:1}}>
                    <label style={{fontSize:'12px'}}>Image 1</label>
                    <input type="file" onChange={(e) => handleFileChange(e, 'image_1')} accept="image/*" className="file-input-small mb-2" style={{width:'100%'}}/>
                    <input type="url" name="item_image_1" value={formData.item_image_1} onChange={handleInputChange} placeholder="Or paste URL" className="form-input" style={{fontSize:'12px', padding:'6px'}}/>
                 </div>
                 <div className="form-group" style={{flex:1}}>
                    <label style={{fontSize:'12px'}}>Image 2</label>
                    <input type="file" onChange={(e) => handleFileChange(e, 'image_2')} accept="image/*" className="file-input-small mb-2" style={{width:'100%'}}/>
                    <input type="url" name="item_image_2" value={formData.item_image_2} onChange={handleInputChange} placeholder="Or paste URL" className="form-input" style={{fontSize:'12px', padding:'6px'}}/>
                 </div>
                 <div className="form-group" style={{flex:1}}>
                    <label style={{fontSize:'12px'}}>Image 3</label>
                    <input type="file" onChange={(e) => handleFileChange(e, 'image_3')} accept="image/*" className="file-input-small mb-2" style={{width:'100%'}}/>
                    <input type="url" name="item_image_3" value={formData.item_image_3} onChange={handleInputChange} placeholder="Or paste URL" className="form-input" style={{fontSize:'12px', padding:'6px'}}/>
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

              <div className="form-group" style={{ marginBottom: '60px' }}>
                 <label>Description</label>
                 <ReactQuill 
                     theme="snow" 
                     value={formData.description} 
                     onChange={handleDescriptionChange} 
                     modules={quillModules}
                     style={{ height: '150px' }} 
                 />
              </div>

              <button type="submit" className="btn-primary">
                 <Save size={16} style={{marginRight:8}}/> {isEditing ? "Update Item" : "Save Item"}
              </button>
            </form>
          </div>
        </div>
      )}

      {managingVariantsFor && (
          <VariantManagerModal 
              item={managingVariantsFor} 
              onClose={() => setManagingVariantsFor(null)} 
          />
      )}
    </div>
  );
};

export default Products;