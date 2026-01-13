import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Plus, Filter, Edit, Trash2, X, Save, Search, Mail, Phone, MapPin } from 'lucide-react';

const Customers = () => {
  // --- STATE ---
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form State - Matches your API payload
  const initialFormState = {
    name: '',
    category: '',
    email: '',
    phone: '',
    customer_type: 'Regular', // Default value
    gstin: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    country: 'India',
    state: '',
    district: '',
    pin: '',
    address: '',
    note: '',
    password: '' // Optional
  };
  
  const [formData, setFormData] = useState(initialFormState);

  // --- API CALLS ---
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers/'); // GET
      setCustomers(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching customers", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
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

  const openEditModal = (customer) => {
    // Populate form, handle nulls gracefully
    setFormData({
      ...customer,
      gstin: customer.gstin || '',
      note: customer.note || '',
      pin: customer.pin || '',
      password: '' // Don't pre-fill password for security/logic reasons usually
    });
    setEditId(customer.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sanitize payload
    const payload = { ...formData };
    
    // Convert pin to number if it exists
    if (payload.pin) payload.pin = parseInt(payload.pin, 10);
    // Remove password if empty (so we don't send empty string to backend if optional)
    if (!payload.password) delete payload.password;

    try {
      if (isEditing) {
        await api.put(`/customers/${editId}/`, payload); // PUT
        alert("Customer Updated Successfully!");
      } else {
        await api.post('/customers/', payload); // POST
        alert("Customer Added Successfully!");
      }
      setShowModal(false);
      fetchCustomers(); 
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        alert(`Server Error: ${JSON.stringify(err.response.data)}`);
      } else {
        alert("Error saving customer.");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this customer? This cannot be undone.")) {
      try {
        await api.delete(`/customers/${id}/`); // DELETE
        fetchCustomers(); 
      } catch (err) {
        alert("Failed to delete customer");
      }
    }
  };

  return (
    <div className="page-content">
      {/* Top Action Bar */}
      <div className="action-bar">
        <h2 className="section-title">Customers</h2>
        <div className="action-buttons">
          <button className="btn btn-blue" onClick={openAddModal}>
            <Plus size={16} strokeWidth={3} /> Add Customer
          </button>
          <button className="btn btn-gray">Import/Export</button>
           <button className="btn-link">
             Filter <Filter size={16} className="filter-icon" fill="currentColor" />
           </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="table-container">
        {loading ? (
          <div className="p-10 text-center text-gray">Loading Customers...</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Contact Info</th>
                <th>Type / Category</th>
                <th>Location</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-5">No customers found. Add your first one!</td></tr>
              ) : (
                customers.map((row) => (
                  <tr key={row.id}>
                    <td>
                        <div className="fw-600 text-dark">{row.name}</div>
                        {row.gstin && <div className="text-xs text-gray">GST: {row.gstin}</div>}
                    </td>
                    <td>
                        <div className="flex items-center gap-1 text-sm"><Mail size={12}/> {row.email}</div>
                        <div className="flex items-center gap-1 text-sm text-gray"><Phone size={12}/> {row.phone}</div>
                    </td>
                    <td>
                        <span className="badge badge-blue">{row.customer_type}</span>
                        <div className="text-xs text-gray mt-1">{row.category}</div>
                    </td>
                    <td>
                       <div className="flex items-center gap-1"><MapPin size={12}/> {row.district}, {row.state}</div>
                    </td>
                    <td>{row.date}</td>
                    <td className="action-cells">
                      <button className="action-btn edit" onClick={() => openEditModal(row)}>
                         <Edit size={16} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(row.id)}>
                         <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
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
              <h2>{isEditing ? "Edit Customer" : "Add New Customer"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="setup-form scrollable-form">
              
              {/* Basic Info Section */}
              <div className="form-section-title">Basic Information</div>
              <div className="form-row">
                <div className="form-group half-width">
                  <label>Customer Name*</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Full Name" />
                </div>
                <div className="form-group half-width">
                  <label>Customer Type</label>
                  <select name="customer_type" value={formData.customer_type} onChange={handleInputChange}>
                    <option value="Regular">Regular</option>
                    <option value="Special">Special</option>
                    <option value="Wholesale">Wholesale</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                 <div className="form-group half-width">
                  <label>Category</label>
                  <input type="text" name="category" value={formData.category} onChange={handleInputChange} placeholder="e.g. Business, Personal" />
                </div>
                <div className="form-group half-width">
                   <label>Joining Date</label>
                   <input type="date" name="date" value={formData.date} onChange={handleInputChange} />
                </div>
              </div>

              {/* Contact Section */}
              <div className="form-section-title">Contact Details</div>
              <div className="form-row">
                <div className="form-group half-width">
                  <label>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                </div>
                <div className="form-group half-width">
                  <label>Phone Number*</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="form-row">
                 <div className="form-group half-width">
                  <label>GSTIN (Optional)</label>
                  <input type="text" name="gstin" value={formData.gstin} onChange={handleInputChange} placeholder="GST Number" />
                </div>
                 <div className="form-group half-width">
                  <label>Password (Login)</label>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder={isEditing ? "Leave blank to keep same" : "Optional"} />
                </div>
              </div>

              {/* Address Section */}
              <div className="form-section-title">Address & Location</div>
              <div className="form-group">
                 <label>Street Address</label>
                 <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Building, Street, Area" />
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label>District/City</label>
                  <input type="text" name="district" value={formData.district} onChange={handleInputChange} />
                </div>
                <div className="form-group half-width">
                  <label>State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label>Country</label>
                  <input type="text" name="country" value={formData.country} onChange={handleInputChange} />
                </div>
                <div className="form-group half-width">
                  <label>Pincode</label>
                  <input type="number" name="pin" value={formData.pin} onChange={handleInputChange} required/>
                </div>
              </div>

               <div className="form-group">
                  <label>Notes</label>
                  <input type="text" name="note" value={formData.note} onChange={handleInputChange} placeholder="Internal notes..." />
                </div>

              <button type="submit" className="btn-primary">
                 <Save size={16} style={{marginRight:8}}/> {isEditing ? "Update Customer" : "Save Customer"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;