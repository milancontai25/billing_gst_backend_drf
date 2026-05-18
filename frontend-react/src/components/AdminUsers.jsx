import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { Search, Plus, Edit, Trash2, Eye, X, Download } from 'lucide-react';
import '../assets/css/dashboard.css'; // Assuming this is your global CSS

const AdminUsers = () => {
  // --- STATE ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [roleFilter, setRoleFilter] = useState('All Types');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form State
  const initialFormState = {
    name: '', email: '', phone: '', password: '', 
    role: 'user', status: 'active', is_active: true
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- API LOGIC ---

  // 1. Fetch & Filter Users
  // 1. Fetch & Filter Users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Build query string based on filters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'All Status') params.append('status', statusFilter.toLowerCase());
      if (roleFilter !== 'All Types') params.append('role', roleFilter.toLowerCase());

      const res = await api.get(`/admin/users/?${params.toString()}`);
      
      // 🚨 THE FIX IS HERE 🚨
      // If Django paginates the response, the array is inside res.data.results
      // If it doesn't paginate, it's just res.data
      const userData = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setUsers(userData);
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users", err);
      setLoading(false);
    }
  };

  // Debounce search so it doesn't spam the API on every keystroke
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 400); // 400ms delay
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter, roleFilter]);


  // 2. Form Handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'status' && { is_active: value === 'active' }) // Auto-sync is_active with status
    });
  };

  const openCreateModal = () => {
    setFormData(initialFormState);
    setIsEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '', // Leave blank for edit
      role: user.role || 'user',
      status: user.status || 'active',
      is_active: user.is_active ?? true
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  // 3. Create / Update API Call
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        // PATCH /api/v1/admin/users/{id}/
        const payload = { status: formData.status, phone: formData.phone, role: formData.role };
        await api.patch(`/admin/users/${selectedUser.id}/`, payload);
        alert("User updated successfully!");
      } else {
        // POST /api/v1/admin/users/
        await api.post('/admin/users/', formData);
        alert("User created successfully!");
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      alert("Error saving user: " + (err.response?.data?.detail || JSON.stringify(err.response?.data) || "Unknown error"));
    }
  };

  // 4. Delete API Call
  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
      try {
        await api.delete(`/admin/users/${userId}/`);
        fetchUsers();
      } catch (err) {
        alert("Failed to delete user. They might have dependent data.");
      }
    }
  };

  // 5. Export Logic (Simple CSV generator)
  const handleExport = () => {
    if (users.length === 0) return alert("No data to export");
    const headers = ["ID", "Email", "Full Name", "Business Name", "Business Type", "Phone", "Role", "Status"];
    const rows = users.map(u => [
      u.id, u.email, u.name, u.business_name, u.business_type, u.phone, u.role, u.status
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };


  return (
    <div className="page-content smart-mobile-stack">
      
      {/* HEADER */}
      <div className="action-bar flex justify-between items-center mb-6">
        <h2 className="section-title text-2xl font-bold text-gray-800">User Management</h2>
        <div className="action-buttons flex gap-3">
          <button className="btn btn-outline flex items-center gap-2" onClick={handleExport}>
            <Download size={16}/> Export
          </button>
          <button className="btn btn-blue flex items-center gap-2" onClick={openCreateModal}>
            <Plus size={16}/> Create User
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="card-box mb-6 p-4 flex gap-4 items-center bg-white border border-gray-100 rounded-lg shadow-sm">
        <div className="search-box flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-md">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Email, Business, or Name..." 
            className="w-full bg-transparent border-none outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="form-input w-40 h-10 text-sm cursor-pointer"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="All Types">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>

        <select 
          className="form-input w-40 h-10 text-sm cursor-pointer"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All Status">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="table-container bg-white border border-gray-100 rounded-lg shadow-sm">
        <table className="custom-table w-full text-left">
          <thead>
            <tr>
              <th>Email ID</th>
              <th>Business Name</th>
              <th>Full Name</th>
              <th>Business Type</th>
              <th>Phone</th>
              <th>Password</th>
              <th>Status</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center p-8 text-gray-500">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="8" className="text-center p-8 text-gray-500">No users found.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="text-blue-600 font-medium whitespace-nowrap">{user.email}</td>
                  <td className="font-semibold text-gray-800">{user.business_name || '-'}</td>
                  <td className="text-gray-700">{user.name}</td>
                  <td>
                    {user.business_type ? (
                      <span className="badge bg-gray-100 text-gray-600 border border-gray-200">
                        {user.business_type}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="text-gray-600">{user.phone ? `+91 ${user.phone}` : '-'}</td>
                  
                  {/* Password Dummy UI (Matches Screenshot) */}
                  <td className="text-gray-400 flex items-center gap-2 mt-3">
                    <span className="tracking-[0.2em] font-bold text-lg leading-none mt-1">........</span> 
                    <Eye size={14} className="cursor-pointer hover:text-gray-600"/>
                  </td>
                  
                  <td>
                    <span className={`badge ${user.status === 'active' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  
                  <td className="action-cells justify-center">
                    <button className="action-btn border border-gray-200 bg-white" title="View User">
                      <Eye size={16} className="text-blue-500"/>
                    </button>
                    <button className="action-btn border border-gray-200 bg-white" onClick={() => openEditModal(user)} title="Edit User">
                      <Edit size={16} className="text-orange-400"/>
                    </button>
                    
                    {/* Hide delete button for the primary Super Admin to prevent accidental self-deletion */}
                    {user.id !== 1 && (
                      <button className="action-btn border border-gray-200 bg-white" onClick={() => handleDelete(user.id)} title="Delete User">
                        <Trash2 size={16} className="text-red-500"/>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- CREATE / EDIT MODAL --- */}
      {showModal && (
        <div className="modal-overlay" style={{zIndex: 1000}}>
          <div className="modal-box" style={{maxWidth: '600px', width: '90%'}}>
            <div className="modal-header border-b border-gray-100 pb-4 mb-4">
              <h2 className="text-xl font-bold">{isEditMode ? "Edit User Details" : "Create New User"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              <div className="form-row flex gap-4">
                <div className="form-group flex-1">
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Full Name*</label>
                  <input type="text" name="name" className="form-input w-full" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-group flex-1">
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Email Address*</label>
                  <input type="email" name="email" className="form-input w-full bg-gray-50" value={formData.email} onChange={handleInputChange} required disabled={isEditMode} />
                  {isEditMode && <span className="text-xs text-gray-400">Email cannot be changed</span>}
                </div>
              </div>

              <div className="form-row flex gap-4">
                <div className="form-group flex-1">
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Phone Number*</label>
                  <input type="text" name="phone" className="form-input w-full" value={formData.phone} onChange={handleInputChange} required />
                </div>
                
                {!isEditMode && (
                  <div className="form-group flex-1">
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Temporary Password*</label>
                    <input type="password" name="password" className="form-input w-full" value={formData.password} onChange={handleInputChange} required minLength={8} />
                  </div>
                )}
              </div>

              <div className="form-row flex gap-4 mt-2">
                <div className="form-group flex-1">
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">System Role</label>
                  <select name="role" className="form-input w-full" value={formData.role} onChange={handleInputChange}>
                    <option value="user">Business User</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
                
                <div className="form-group flex-1">
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Account Status</label>
                  <select name="status" className="form-input w-full" value={formData.status} onChange={handleInputChange}>
                    <option value="active">Active (Can Login)</option>
                    <option value="inactive">Inactive (Suspended)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                 <button type="button" className="btn btn-gray px-6" onClick={() => setShowModal(false)}>Cancel</button>
                 <button type="submit" className="btn btn-blue px-6">{isEditMode ? "Update User" : "Create User"}</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;