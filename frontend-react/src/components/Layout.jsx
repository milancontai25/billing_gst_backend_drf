import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';
import Sidebar from './Sidebar';
import UserProfile from './UserProfile'; 
import { X, Menu } from 'lucide-react'; // Import Menu icon
import '../assets/css/dashboard.css';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- UI STATE ---
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  
  // Sidebar State
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop Minimize
  const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobile Drawer

  // --- BUSINESS FORM STATE ---
  const [setupForm, setSetupForm] = useState({
    business_name: '', owner_name: '', business_type: 'Retailer',
    gst_status: 'Unregister', gst_number: '', address: '',
    country: 'India', state: '', district: '', pin: '',
    kyc_doc_type: 'Pan', logo_file: null, kyc_file: null
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/');
      setData(res.data);
      if (res.data.requires_setup) setShowSetupModal(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const handleSwitchBusiness = async (businessId) => {
    try {
      await api.post('/business/switch/', { business_id: businessId });
      setShowSwitcher(false);
      fetchDashboard(); 
      navigate('/dashboard'); 
    } catch (err) { alert("Failed to switch business"); }
  };

  const handleInputChange = (e) => setSetupForm({ ...setupForm, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setSetupForm({ ...setupForm, [e.target.name]: e.target.files[0] });

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    // ... existing submit logic ...
    // Manually append text fields to ensure control
    formData.append('business_name', setupForm.business_name);
    formData.append('owner_name', setupForm.owner_name);
    formData.append('business_type', setupForm.business_type);
    formData.append('gst_status', setupForm.gst_status);
    formData.append('address', setupForm.address);
    formData.append('country', setupForm.country);
    formData.append('state', setupForm.state);
    formData.append('district', setupForm.district);
    formData.append('kyc_doc_type', setupForm.kyc_doc_type);

    if (setupForm.gst_status === 'Registered' && setupForm.gst_number) {
        formData.append('gst_number', setupForm.gst_number);
    }
    if (setupForm.pin) {
        formData.append('pin', setupForm.pin);
    }
    if (setupForm.logo_file) {
        formData.append('logo_file', setupForm.logo_file);
    }
    if (setupForm.kyc_file) {
        formData.append('kyc_file', setupForm.kyc_file);
    }

    try {
      await api.post('/business/setup/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      alert("Business Saved Successfully!");
      setShowSetupModal(false);
      fetchDashboard();
    } catch (err) {
      if (err.response && err.response.data) {
          alert(`Validation Error: ${JSON.stringify(err.response.data)}`);
      } else {
          alert("Error saving business details.");
      }
    }
  };

  const currentPath = location.pathname.split('/')[1] || 'dashboard';

  if (loading) return <div className="loading-screen">Loading StatGrow...</div>;

  return (
    <div className="app-container">
      
      {/* 1. SIDEBAR (Passed props for collapse/mobile) */}
      <Sidebar 
        data={data}
        activeTab={currentPath}
        showSwitcher={showSwitcher}
        setShowSwitcher={setShowSwitcher}
        handleSwitchBusiness={handleSwitchBusiness}
        setShowSetupModal={setShowSetupModal}
        
        // NEW PROPS
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Mobile Overlay (Click to close sidebar) */}
      <div 
        className={`mobile-overlay ${isMobileOpen ? 'show' : ''}`} 
        onClick={() => setIsMobileOpen(false)}
      />

      {/* 2. MAIN CONTENT AREA */}
      <main className="main-content">
        
        {/* Inject Hamburger Menu into UserProfile area or creating a Top Bar wrapper */}
        <div style={{ display:'flex', alignItems:'center', marginBottom: '20px' }}>
            
            {/* Mobile Menu Button */}
            <button className="mobile-menu-btn" onClick={() => setIsMobileOpen(true)}>
                <Menu size={24} />
            </button>

            {/* Existing User Profile Component */}
            <div style={{ flex: 1 }}>
                <UserProfile 
                    user={data?.user} 
                    handleLogout={handleLogout} 
                    activeTab={currentPath} 
                />
            </div>
        </div>
        
        <Outlet context={{ data, fetchDashboard }} />
      </main>

      {/* 3. BUSINESS SETUP MODAL (Same as before) */}
      {showSetupModal && (
        <div className="modal-overlay">
          <div className="modal-box extended-modal">
            <div className="modal-header">
              <h2>{data?.requires_setup ? "Setup Your Business" : "Add New Business"}</h2>
              <p>Please complete your business profile below.</p>
              {!data?.requires_setup && (
                 <button className="close-btn" onClick={() => setShowSetupModal(false)}><X size={20}/></button>
              )}
            </div>
            
            <form onSubmit={handleSetupSubmit} className="setup-form scrollable-form">
              
              {/* --- SECTION 1: BASIC DETAILS --- */}
              <div className="form-section-title">Business Details</div>
              <div className="form-row">
                <div className="form-group half-width">
                  <label>Business Name*</label>
                  <input type="text" name="business_name" value={setupForm.business_name} onChange={handleInputChange} required />
                </div>
                <div className="form-group half-width">
                  <label>Owner Name*</label>
                  <input type="text" name="owner_name" value={setupForm.owner_name} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label>Business Type</label>
                  <select name="business_type" value={setupForm.business_type} onChange={handleInputChange}>
                    <option value="Retailer">Retailer</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="Service">Service Provider</option>
                  </select>
                </div>
                <div className="form-group half-width">
                  <label>Business Logo</label>
                  <input type="file" name="logo_file" onChange={handleFileChange} className="file-input" />
                </div>
              </div>

              {/* --- SECTION 2: LOCATION --- */}
              <div className="form-section-title">Location</div>
              <div className="form-group">
                <label>Address*</label>
                <input type="text" name="address" value={setupForm.address} onChange={handleInputChange} placeholder="Building, Street, Area" required />
              </div>

              <div className="form-row">
                 <div className="form-group half-width">
                   <label>Country</label>
                   <input type="text" name="country" value={setupForm.country} onChange={handleInputChange} />
                 </div>
                 <div className="form-group half-width">
                   <label>State</label>
                   <input type="text" name="state" value={setupForm.state} onChange={handleInputChange} />
                 </div>
              </div>

              <div className="form-row">
                 <div className="form-group half-width">
                   <label>District/City</label>
                   <input type="text" name="district" value={setupForm.district} onChange={handleInputChange} />
                 </div>
                 <div className="form-group half-width">
                   <label>Pincode</label>
                   <input type="number" name="pin" value={setupForm.pin} onChange={handleInputChange} />
                 </div>
              </div>

              {/* --- SECTION 3: TAX & KYC --- */}
              <div className="form-section-title">Tax & Compliance</div>
              <div className="form-row">
                <div className="form-group half-width">
                  <label>GST Status</label>
                  <select name="gst_status" value={setupForm.gst_status} onChange={handleInputChange}>
                    <option value="Unregister">Unregistered</option>
                    <option value="Registered">Registered</option>
                  </select>
                </div>
                {setupForm.gst_status === 'Registered' && (
                  <div className="form-group half-width">
                    <label>GST Number</label>
                    <input type="text" name="gst_number" value={setupForm.gst_number} onChange={handleInputChange} placeholder="Ex: 19ABCDE1234F1Z5" />
                  </div>
                )}
              </div>

              <div className="form-row">
                 <div className="form-group half-width">
                    <label>KYC Document Type</label>
                    <select name="kyc_doc_type" value={setupForm.kyc_doc_type} onChange={handleInputChange}>
                       <option value="Pan">PAN Card</option>
                       <option value="Aadhar">Aadhar Card</option>
                       <option value="Driving License">Driving License</option>
                       <option value="Voter ID">Voter ID</option>
                       <option value="Passport">Passport</option>
                    </select>
                 </div>
                 <div className="form-group half-width">
                    <label>Upload KYC Document</label>
                    <input type="file" name="kyc_file" onChange={handleFileChange} className="file-input" />
                 </div>
              </div>

              <button type="submit" className="btn-primary">Save Business Details</button>
              
              {!data?.requires_setup && (
                <button type="button" className="btn-text" onClick={() => setShowSetupModal(false)}>Cancel</button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;