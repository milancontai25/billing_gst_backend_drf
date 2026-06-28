import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axiosConfig';
import { Plus, Edit, Trash2, X, Package, Tag, Image as ImageIcon } from 'lucide-react';

const VariantManagerModal = ({ item, onClose }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeVariant, setActiveVariant] = useState(null); 

  const fileInputRef = useRef(null);

  const initialFormState = {
    variant_name: '', sku: '', stock: 0, min_stock: 0,
    mrp_base: 0, selling_price: 0, cost_price: 0,
    min_order_quantity: 1, max_order_quantity: 1, is_active: true
  };
  const [formData, setFormData] = useState(initialFormState);
  
  const [newAttr, setNewAttr] = useState({ attribute_name: '', attribute_value: '' });
  
  // 🚨 NEW STATE: For the Image URL text input
  const [imageUrl, setImageUrl] = useState('');

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/items/${item.slug}/variants/`);
      const dataArray = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setVariants(dataArray);
      
      if (activeVariant) {
          const updatedActive = dataArray.find(v => v.uid === activeVariant.uid);
          if (updatedActive) setActiveVariant(updatedActive);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { if (item?.slug) fetchVariants(); }, [item]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setActiveVariant(null);
    setIsEditing(false);
    setShowFormModal(true);
  };

  const openEditModal = (variant) => {
    setFormData({
      variant_name: variant.variant_name || '', sku: variant.sku || '',
      stock: variant.stock || 0, min_stock: variant.min_stock || 0,
      mrp_base: variant.mrp_base || 0, selling_price: variant.selling_price || 0,
      cost_price: variant.cost_price || 0, min_order_quantity: variant.min_order_quantity || 1,
      max_order_quantity: variant.max_order_quantity || 1, is_active: variant.is_active ?? true
    });
    setActiveVariant(variant);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
        let value = formData[key];
        if (typeof value === 'boolean') value = value ? 'true' : 'false';
        submitData.append(key, value);
    });

    const config = { headers: { 'Content-Type': 'multipart/form-data' } };

    try {
      if (isEditing) {
        await api.patch(`/variants/${activeVariant.uid}/`, submitData, config);
        alert("Variant Updated!");
        fetchVariants();
      } else {
        const res = await api.post(`/items/${item.slug}/variants/`, submitData, config);
        alert("Variant Created! You can now add multiple attributes and images below.");
        openEditModal(res.data);
        fetchVariants();
      }
    } catch (err) {
      if (err.response && err.response.data) {
          alert(`Error: ${JSON.stringify(err.response.data)}`);
      } else {
          alert("Error saving variant. Please ensure the SKU is unique!");
      }
    }
  };

  const handleAddAttribute = async () => {
      if (!newAttr.attribute_name || !newAttr.attribute_value) return;
      try {
          await api.post(`/variants/${activeVariant.uid}/attributes/`, newAttr);
          setNewAttr({ attribute_name: '', attribute_value: '' }); 
          fetchVariants(); 
      } catch (err) { alert("Failed to add attribute."); }
  };

  const handleDeleteAttribute = async (attrId) => {
      try {
          await api.delete(`/variant-attributes/${attrId}/`);
          fetchVariants();
      } catch (err) { alert("Failed to delete attribute."); }
  };

  // --- 3A. IMAGE MANAGERS (FILE UPLOAD) ---
  const handleImageUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      
      let hasError = false;

      for (const file of files) {
          const imgData = new FormData();
          // We use 'image' here because this is a physical file
          imgData.append('image', file); 
          
          try {
              await api.post(`/variants/${activeVariant.uid}/images/`, imgData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
              });
          } catch (err) { 
              console.error(err);
              hasError = true;
          }
      }

      if (hasError) alert("Some files failed to upload.");
      fetchVariants(); 
      if (fileInputRef.current) fileInputRef.current.value = null; 
  };

  // --- 3B. IMAGE MANAGERS (URL PASTE) ---
  const handleAddImageUrl = async () => {
      if (!imageUrl) return;
      
      try {
          // 🚨 Ensure the key here ('image_url') matches the key in your Serializer
          const payload = { image_url: imageUrl };
          
          await api.post(`/variants/${activeVariant.uid}/images/`, payload);
          
          setImageUrl(''); // Clear input
          fetchVariants(); // Refresh to show the new image
      } catch (err) {
          // If this triggers, check the console for the exact error message
          console.error("Failed to add URL:", err.response?.data);
          alert("Failed to save image URL. Check console for details.");
      }
  };

  const handleDeleteImage = async (imgId) => {
      try {
          await api.delete(`/variant-images/${imgId}/`);
          fetchVariants();
      } catch (err) { alert("Failed to delete image."); }
  };

  const handleDeleteVariant = async (uid) => {
    if (window.confirm("Delete this variant? This cannot be undone.")) {
      try {
        await api.delete(`/variants/${uid}/`);
        fetchVariants(); 
      } catch (err) { alert("Failed to delete variant"); }
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1050 }}>
      <div className="modal-box extended-modal" style={{ width: '900px', maxWidth: '95vw' }}>
        <div className="modal-header">
          <div>
              <h2 style={{ margin: 0 }}>Manage Variants</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Base Product: <strong>{item.item_name}</strong></p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20}/></button>
        </div>

        <div className="scrollable-form" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                <button className="btn btn-blue" onClick={openAddModal}><Plus size={16} /> Add Variant</button>
            </div>

            <div className="table-responsive-wrapper">
                <table className="invoice-table" style={{ width: '100%' }}>
                <thead>
                    <tr>
                    <th style={{ textAlign: 'left' }}>Variant Info</th>
                    <th style={{ textAlign: 'left' }}>SKU</th>
                    <th style={{ textAlign: 'center' }}>Stock</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Loading Variants...</td></tr>
                    ) : variants.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>No variants found. Add one above!</td></tr>
                    ) : (
                    variants.map((row) => (
                        <tr key={row.uid}>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                                    {row.images?.length > 0 ? (
                                        <img src={row.images[0].image_url} alt="var" style={{width: 24, height: 24, borderRadius: 4, objectFit: 'cover'}}/>
                                    ) : <Package size={16} style={{ color: '#9ca3af' }}/> }
                                    {row.display_name}
                                </div>
                            </td>
                            <td><span style={{ fontFamily: 'monospace', color: '#4b5563', fontSize: '13px' }}>{row.sku}</span></td>
                            <td style={{ textAlign: 'center' }}>
                                <span className={row.stock <= row.min_stock ? "text-danger fw-600" : ""}>{row.stock}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>₹{row.selling_price}</td>
                            <td style={{ textAlign: 'center' }}>
                                {row.is_active ? <span className="badge bg-green-50 text-green-600">Active</span> : <span className="badge bg-gray-100 text-gray-500">Inactive</span>}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                <button className="action-btn edit" onClick={() => openEditModal(row)}><Edit size={16} /></button>
                                <button className="action-btn delete" onClick={() => handleDeleteVariant(row.uid)}><Trash2 size={16} /></button>
                            </td>
                        </tr>
                    ))
                    )}
                </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* --- SUB-MODAL: ADD/EDIT VARIANT FORM --- */}
      {showFormModal && (
        <div className="modal-overlay" style={{ zIndex: 1100, backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-box extended-modal" style={{ width: '800px', maxWidth: '90vw' }}>
            <div className="modal-header">
              <h2>{isEditing ? "Edit Variant Details" : "Add New Variant"}</h2>
              <button className="close-btn" onClick={() => setShowFormModal(false)}><X size={20}/></button>
            </div>
            
            <div className="scrollable-form" style={{ padding: '20px' }}>
                <form onSubmit={handleSubmit}>
                <div style={{ padding: '0 0 10px 0', marginBottom: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color:'#374151', cursor: 'pointer' }}>
                        <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }} /> 
                        Variant is Active
                    </label>
                </div>

                <div className="form-row">
                    <div className="form-group half-width">
                    <label>Variant Name (Optional)</label>
                    <input type="text" name="variant_name" value={formData.variant_name} onChange={handleInputChange} className="form-input" placeholder="e.g. Red / XL" />
                    </div>
                    <div className="form-group half-width">
                    <label>SKU*</label>
                    <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} className="form-input" placeholder="Unique SKU" required />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Base MRP*</label>
                        <input type="number" name="mrp_base" value={formData.mrp_base} onChange={handleInputChange} className="form-input" required />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Selling Price*</label>
                        <input type="number" name="selling_price" value={formData.selling_price} onChange={handleInputChange} className="form-input" required />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Cost Price*</label>
                        <input type="number" name="cost_price" value={formData.cost_price} onChange={handleInputChange} className="form-input" required />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group half-width">
                        <label>Current Stock*</label>
                        <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} className="form-input" required />
                    </div>
                    <div className="form-group half-width">
                        <label>Min Stock Alert*</label>
                        <input type="number" name="min_stock" value={formData.min_stock} onChange={handleInputChange} className="form-input" required />
                    </div>
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                    {isEditing ? "Update Variant Data" : "Save to Add Attributes & Images"}
                </button>
                </form>

                {/* --- ATTRIBUTES & IMAGES (ONLY SHOW IF SAVED) --- */}
                {isEditing && activeVariant && (
                    <div style={{ marginTop: '30px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                        
                        {/* --- ATTRIBUTES SECTION --- */}
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Tag size={14} /> VARIANT ATTRIBUTES
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '15px' }}>
                            <input 
                                type="text" 
                                placeholder="Name (e.g. Color)" 
                                value={newAttr.attribute_name} 
                                onChange={e => setNewAttr({...newAttr, attribute_name: e.target.value})} 
                                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            />
                            <input 
                                type="text" 
                                placeholder="Value (e.g. Red)" 
                                value={newAttr.attribute_value} 
                                onChange={e => setNewAttr({...newAttr, attribute_value: e.target.value})} 
                                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            />
                            <button 
                                type="button" 
                                onClick={handleAddAttribute}
                                style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                            >
                                Add Attribute
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '30px' }}>
                            {activeVariant.attributes?.length > 0 ? (
                                activeVariant.attributes.map(attr => (
                                    <div key={attr.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '6px 12px', borderRadius: '20px', fontSize: '13px' }}>
                                        <span style={{ fontWeight: '700' }}>{attr.attribute_name}:</span> {attr.attribute_value}
                                        <button onClick={() => handleDeleteAttribute(attr.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                                            <X size={14}/>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <span style={{ color: '#6b7280', fontSize: '14px' }}>No attributes added yet.</span>
                            )}
                        </div>

                        {/* --- IMAGES SECTION (URL OR FILE) --- */}
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ImageIcon size={14} /> VARIANT IMAGES
                        </div>
                        
                        {/* 🚨 NEW UI: Flex container for File Upload OR URL Paste */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                            
                            {/* Option 1: File Upload */}
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current.click()}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '13px', color: '#374151', whiteSpace: 'nowrap' }}
                            >
                                <Plus size={14}/> Upload File(s)
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', color: '#9ca3af', fontSize: '12px', padding: '0 5px' }}>OR</div>

                            {/* Option 2: URL Paste */}
                            <div style={{ display: 'flex', flex: 1, minWidth: '300px', gap: '5px' }}>
                                <input 
                                    type="url" 
                                    placeholder="Paste image link (https://...)" 
                                    value={imageUrl} 
                                    onChange={e => setImageUrl(e.target.value)} 
                                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                                />
                                <button 
                                    type="button" 
                                    onClick={handleAddImageUrl}
                                    style={{ padding: '8px 16px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}
                                >
                                    Add URL
                                </button>
                            </div>
                        </div>
                        
                        {/* The Hidden File Input */}
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload} 
                            style={{ display: 'none' }} 
                        />

                        {/* Display Multiple Images */}
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            {activeVariant.images?.length > 0 ? (
                                activeVariant.images.map(img => (
                                    <div key={img.id} style={{ position: 'relative', width: '80px', height: '80px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <img src={img.image_url} alt="variant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button onClick={() => handleDeleteImage(img.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,0.9)', color: '#ef4444', border: 'none', borderRadius: '50%', padding: '2px', cursor: 'pointer', display: 'flex' }}>
                                            <X size={14}/>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <span style={{ color: '#6b7280', fontSize: '14px' }}>No images added yet.</span>
                            )}
                        </div>

                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantManagerModal;