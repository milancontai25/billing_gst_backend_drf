import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig'; // Ensure this matches your folder structure
import { Plus, Filter, Edit, Trash2, X, Save } from 'lucide-react';

const Products = () => {
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State
  const initialFormState = {
    item_type: 'Goods',
    item_name: '',
    hsn_sac_code: '',
    category: '',
    unit_product: 'Pcs',
    quantity_product: 0,
    mrp_baseprice: 0,
    cost_price: 0,
    discount_percent: 0,
    gst_percent: 0,
    min_stock: 5,
    description: '',
    customer_view: 'General',
    area: ''
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

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

    // --- FIX FOR 400 ERROR: SANITIZE DATA ---
    const payload = { ...formData };
    const numberFields = [
      'quantity_product', 'mrp_baseprice', 'cost_price', 
      'discount_percent', 'gst_percent', 'min_stock'
    ];

    // Ensure numbers are numbers, not empty strings
    numberFields.forEach(field => {
      if (payload[field] === '' || payload[field] === null) {
        payload[field] = 0; 
      } else {
        payload[field] = parseFloat(payload[field]);
      }
    });

    try {
      if (isEditing) {
        await api.put(`/products/${editId}/`, payload);
        alert("Product Updated Successfully!");
      } else {
        await api.post('/products/', payload);
        alert("Product Added Successfully!");
      }
      setShowModal(false);
      fetchProducts(); 
    } catch (err) {
      console.error(err);
      // Detailed error alerting
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
      {/* Top Action Bar */}
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

      {/* Products Table */}
      <div className="table-container">
        {loading ? (
          <div className="p-10 text-center text-gray">Loading Products...</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>HSN Code</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>MRP</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="8" className="text-center p-5">No products found. Add one!</td></tr>
              ) : (
                products.map((row) => {
                  const status = getStockStatus(row.quantity_product, row.min_stock);
                  return (
                    <tr key={row.id}>
                      <td className="fw-600 text-dark">{row.item_name}</td>
                      <td>{row.category}</td>
                      <td>{row.hsn_sac_code}</td>
                      <td>{row.quantity_product}</td>
                      <td>{row.unit_product}</td>
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
          <div className="modal-box extended-modal">
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
                  <label>Category</label>
                  <input type="text" name="category" value={formData.category} onChange={handleInputChange} placeholder="e.g. Grocery" />
                </div>
              </div>

              <div className="form-row">
                 <div className="form-group half-width">
                  <label>Item Type</label>
                  <select name="item_type" value={formData.item_type} onChange={handleInputChange}>
                    <option value="Goods">Goods</option>
                    <option value="Services">Services</option>
                  </select>
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
                  <label>Cost Price</label>
                  <input type="number" name="cost_price" value={formData.cost_price} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label>GST %</label>
                  <input type="number" name="gst_percent" value={formData.gst_percent} onChange={handleInputChange} />
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
                  <label>Min Stock Alert</label>
                  <input type="number" name="min_stock" value={formData.min_stock} onChange={handleInputChange} />
                </div>
                <div className="form-group half-width">
                  <label>Area / Location</label>
                  <input type="text" name="area" value={formData.area} onChange={handleInputChange} />
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