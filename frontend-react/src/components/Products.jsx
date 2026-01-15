import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Plus, Filter, Edit, Trash2, X, Save, UploadCloud } from 'lucide-react';

// Helper to fix image paths (from backend relative path to full URL)
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; 
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  return `${API_BASE_URL}${imagePath}`;
};

const Products = () => {
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State (Updated keys to match your API)
  const initialFormState = {
    item_name: '',
    item_type: 'Goods',
    brand_product: '', // <--- NEW FIELD
    category: '',
    mrp_baseprice: 0,
    gst_percent: 0,
    area: '',
    item_image: null, // <--- RENAMED from 'image'
    
    // Keeping these as they are likely still needed for logic or display
    hsn_sac_code: '',
    unit_product: 'Pcs',
    quantity_product: 0,
    cost_price: 0,
    discount_percent: 0,
    min_stock: 5,
    description: '',
    customer_view: 'General',
  };
  
  const [formData, setFormData] = useState(initialFormState);

  // --- API CALLS ---
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/');
      setProducts(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching products", err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      // Set 'item_image' specifically
      setFormData({ ...formData, item_image: e.target.files[0] });
    }
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setFormData(product);
    setEditId(product.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = new FormData();
    const numberFields = [
      'quantity_product', 'mrp_baseprice', 'cost_price', 
      'discount_percent', 'gst_percent', 'min_stock'
    ];

    Object.keys(formData).forEach(key => {
        if (key === 'item_image') {
            // Only append if it's a new File object
            if (formData.item_image instanceof File) {
                submitData.append('item_image', formData.item_image);
            }
        } 
        else {
            let value = formData[key];
            
            // Sanitize Numbers
            if (numberFields.includes(key)) {
                value = (value === '' || value === null) ? 0 : parseFloat(value);
            }
            // Sanitize Nulls
            if (value === null) value = '';

            submitData.append(key, value);
        }
    });

    try {
      // Force Multipart header for File Upload
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (isEditing) {
        await api.put(`/products/${editId}/`, submitData, config);
        alert("Product Updated Successfully!");
      } else {
        await api.post('/products/', submitData, config);
        alert("Product Added Successfully!");
      }
      setShowModal(false);
      fetchProducts(); 
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        alert(`Server Error: ${JSON.stringify(err.response.data)}`);
      } else {
        alert("Error saving product.");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this product?")) {
      try {
        await api.delete(`/products/${id}/`);
        fetchProducts(); 
      } catch (err) {
        alert("Failed to delete product");
      }
    }
  };

  const getStockStatus = (qty, minStock) => {
    if (qty <= 0) return { label: 'Out of Stock', color: 'text-red' };
    if (qty <= minStock) return { label: 'Low Stock', color: 'text-orange' };
    return { label: 'In Stock', color: 'text-green' };
  };

  return (
    <div className="page-content">
      <div className="action-bar">
        <h2 className="section-title">Products Inventory</h2>
        <div className="action-buttons">
          <button className="btn btn-blue" onClick={openAddModal}>
            <Plus size={16} strokeWidth={3} /> Add Product
          </button>
          <button className="btn btn-gray">Import/Export</button>
           <button className="btn-link">
             Filter <Filter size={16} className="filter-icon" fill="currentColor" />
           </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="p-10 text-center text-gray">Loading Products...</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Brand</th> 
                <th>Category</th>
                <th>Qty</th>
                <th>MRP</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-5">No products found. Add one!</td></tr>
              ) : (
                products.map((row) => {
                  const status = getStockStatus(row.quantity_product, row.min_stock);
                  return (
                    <tr key={row.id}>
                      <td className="fw-600 text-dark">
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            {/* Use 'item_image' from backend data */}
                            {row.item_image && (
                                <img 
                                    src={getImageUrl(row.item_image)} 
                                    alt="prod" 
                                    style={{width:'30px', height:'30px', borderRadius:'4px', objectFit:'cover'}}
                                />
                            )}
                            {row.item_name}
                        </div>
                      </td>
                      <td>{row.brand_product || '-'}</td>
                      <td>{row.category}</td>
                      <td>{row.quantity_product} {row.unit_product}</td>
                      <td>₹{row.mrp_baseprice}</td>
                      <td className={status.color} style={{fontWeight:600}}>{status.label}</td>
                      <td className="action-cells">
                        <button className="action-btn edit" onClick={() => openEditModal(row)}>
                           <Edit size={16} />
                        </button>
                        <button className="action-btn delete" onClick={() => handleDelete(row.id)}>
                           <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* === ADD/EDIT MODAL === */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box extended-modal product-edit-modal">
            <div className="modal-header">
              <h2>{isEditing ? "Edit Product" : "Add New Product"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="setup-form scrollable-form">
              
              <div className="form-row">
                <div className="form-group half-width">
                  <label>Item Name*</label>
                  <input type="text" name="item_name" value={formData.item_name} onChange={handleInputChange} required />
                </div>
                <div className="form-group half-width">
                  <label>Brand</label>
                  <input type="text" name="brand_product" value={formData.brand_product} onChange={handleInputChange} placeholder="e.g. Nike, Apple" />
                </div>
              </div>

              {/* Product Image Section (Updated for item_image) */}
              <div className="form-group">
                <label className="block fw-600" style={{fontSize:'13px', marginBottom:'6px'}}>Product Image</label>

                {!formData.item_image && (
                  <div className="image-upload-zone">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden-file-input-overlay"
                    />
                    <div className="upload-placeholder-content">
                      <UploadCloud size={24} className="upload-icon-large" />
                      <p className="upload-hint-text"><span className="upload-link">Upload</span> or drag</p>
                    </div>
                  </div>
                )}

                {formData.item_image && (
                  <div className="image-preview-area">
                     <div className="preview-left">
                        <img
                            src={formData.item_image instanceof File ? URL.createObjectURL(formData.item_image) : getImageUrl(formData.item_image)}
                            alt="preview"
                            className="preview-thumb-large"
                        />
                        <div className="preview-info">
                            <span className="preview-filename">
                                {formData.item_image instanceof File ? formData.item_image.name : 'Current Image'}
                            </span>
                        </div>
                     </div>
                     <div>
                       <input type="file" accept="image/*" onChange={handleFileChange} id="change-image-input" style={{display:'none'}} />
                       <label htmlFor="change-image-input" className="change-image-btn" style={{fontSize:'12px', padding:'4px 8px'}}>Change</label>
                     </div>
                  </div>
                )}
              </div>

              {/* Rest of Form Fields */}
              <div className="form-row">
                 <div className="form-group half-width">
                  <label>Category</label>
                  <input type="text" name="category" value={formData.category} onChange={handleInputChange} />
                </div>
                <div className="form-group half-width">
                  <label>HSN/SAC Code</label>
                  <input type="text" name="hsn_sac_code" value={formData.hsn_sac_code} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-section-title">Pricing & Tax</div>
              <div className="form-row">
                <div className="form-group half-width">
                  <label>MRP (Base Price)</label>
                  <input type="number" name="mrp_baseprice" value={formData.mrp_baseprice} onChange={handleInputChange} required />
                </div>
                <div className="form-group half-width">
                  <label>GST %</label>
                  <input type="number" name="gst_percent" value={formData.gst_percent} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label>Cost Price</label>
                  <input type="number" name="cost_price" value={formData.cost_price} onChange={handleInputChange} />
                </div>
                <div className="form-group half-width">
                  <label>Discount %</label>
                  <input type="number" name="discount_percent" value={formData.discount_percent} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-section-title">Inventory</div>
              <div className="form-row">
                <div className="form-group half-width">
                  <label>Quantity</label>
                  <input type="number" name="quantity_product" value={formData.quantity_product} onChange={handleInputChange} required />
                </div>
                 <div className="form-group half-width">
                  <label>Unit</label>
                  <select name="unit_product" value={formData.unit_product} onChange={handleInputChange}>
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
                  <label>Area / Location</label>
                  <input type="text" name="area" value={formData.area} onChange={handleInputChange} />
                </div>
                <div className="form-group half-width">
                  <label>Min Stock Alert</label>
                  <input type="number" name="min_stock" value={formData.min_stock} onChange={handleInputChange} />
                </div>
              </div>

               <div className="form-group">
                  <label>Description</label>
                  <input type="text" name="description" value={formData.description} onChange={handleInputChange} />
                </div>

              <button type="submit" className="btn-primary">
                 <Save size={16} style={{marginRight:8}}/> {isEditing ? "Update Product" : "Save Product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;