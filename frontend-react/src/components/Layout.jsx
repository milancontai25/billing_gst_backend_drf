import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';
import Sidebar from './Sidebar';
import UserProfile from './UserProfile'; 
import { X, Menu } from 'lucide-react'; 
import '../assets/css/dashboard.css';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- GLOBAL STATE ---
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 

  // Sidebar State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // --- BUSINESS FORM STATE ---
  const initialFormState = {
    business_name: '', owner_name: '', business_type: 'Retailer',
    gst_status: 'Unregister', gst_number: '', address: '',
    country: 'India', state: '', district: '', pin: '',
    kyc_doc_type: 'Pan', 
    // Files
    logo_file: null, kyc_file: null,
    banner_1: null, banner_2: null, banner_3: null, // New Banners
    // Social Media Fields
    facebook_url: '', instagram_url: '', youtube_url: '', x_url: ''
  };

  const [setupForm, setSetupForm] = useState(initialFormState);

  // Fetch Global Dashboard Data
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

  // --- EDIT BUSINESS HANDLER ---
  const handleEditBusiness = () => {
    if (!data?.active_business) return;
    const biz = data.active_business;
    
    setSetupForm({
        business_name: biz.business_name || '',
        owner_name: biz.owner_name || '',
        business_type: biz.business_type || 'Retailer',
        gst_status: biz.gst_status || 'Unregister',
        gst_number: biz.gst_number || '',
        address: biz.address || '',
        country: biz.country || 'India',
        state: biz.state || '',
        district: biz.district || '',
        pin: biz.pin || '',
        kyc_doc_type: biz.kyc_doc_type || 'Pan',
        kyc_pan_id: biz.kyc_pan_id,
        // Files reset on edit
        logo_file: null, kyc_file: null,
        banner_1: null, banner_2: null, banner_3: null,
        // Socials
        facebook_url: biz.facebook_url || '',
        instagram_url: biz.instagram_url || '',
        youtube_url: biz.youtube_url || '',
        x_url: biz.x_url || ''
    });
    setIsEditMode(true);
    setShowSetupModal(true);
    setShowSwitcher(false); 
  };

  // --- ADD NEW BUSINESS HANDLER ---
  const handleAddNewBusiness = () => {
      setSetupForm(initialFormState); 
      setIsEditMode(false);
      setShowSetupModal(true);
      setShowSwitcher(false);
  };

  // Form Handlers
  const handleInputChange = (e) => setSetupForm({ ...setupForm, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setSetupForm({ ...setupForm, [e.target.name]: e.target.files[0] });

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    // Append Fields
    Object.keys(setupForm).forEach(key => {
        // Skip file fields if they are null (don't overwrite existing images with null)
        const isFileField = ['logo_file', 'kyc_file', 'banner_1', 'banner_2', 'banner_3'].includes(key);
        if (isFileField && !setupForm[key]) return;

        // Skip null values
        if (setupForm[key] !== null && setupForm[key] !== undefined) {
             formData.append(key, setupForm[key]);
        }
    });

    try {
      if (isEditMode && data?.active_business?.id) {
          await api.patch(`/business/${data.active_business.id}/update/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' } 
          });
          alert("Business Updated Successfully!");
      } else {
          await api.post('/business/setup/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' } 
          });
          alert("Business Created Successfully!");
      }
      
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
      
      <Sidebar 
        data={data}
        activeTab={currentPath}
        showSwitcher={showSwitcher}
        setShowSwitcher={setShowSwitcher}
        handleSwitchBusiness={handleSwitchBusiness}
        handleAddNewBusiness={handleAddNewBusiness} 
        handleEditBusiness={handleEditBusiness}     
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className={`mobile-overlay ${isMobileOpen ? 'show' : ''}`} onClick={() => setIsMobileOpen(false)} />

      <main className="main-content">
        <div style={{ display:'flex', alignItems:'center', marginBottom: '20px' }}>
            <button className="mobile-menu-btn" onClick={() => setIsMobileOpen(true)}>
                <Menu size={24} />
            </button>
            <div style={{ flex: 1 }}>
                <UserProfile user={data?.user} handleLogout={handleLogout} activeTab={currentPath} />
            </div>
        </div>
        <Outlet context={{ data, fetchDashboard }} />
      </main>

      {/* --- BUSINESS SETUP / EDIT MODAL --- */}
      {showSetupModal && (
        <div className="modal-overlay">
          <div className="modal-box extended-modal">
            <div className="modal-header">
              <h2>{isEditMode ? "Edit Business Profile" : (data?.requires_setup ? "Setup Your Business" : "Add New Business")}</h2>
              <p>Please update your business details below.</p>
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
                    <option value="IT">IT / Tech</option>
                  </select>
                </div>
                <div className="form-group half-width">
                  <label>Business Logo</label>
                  <input type="file" name="logo_file" onChange={handleFileChange} className="file-input" />
                </div>
              </div>

              {/* --- SECTION 2: BANNERS (NEW) --- */}
              <div className="form-section-title">Store Banners</div>
              <div className="form-row">
                 <div className="form-group half-width">
                    <label>Banner 1 (Main)</label>
                    <input type="file" name="banner_1" onChange={handleFileChange} className="file-input" />
                 </div>
                 <div className="form-group half-width">
                    <label>Banner 2</label>
                    <input type="file" name="banner_2" onChange={handleFileChange} className="file-input" />
                 </div>
              </div>
              <div className="form-row">
                 <div className="form-group half-width">
                    <label>Banner 3</label>
                    <input type="file" name="banner_3" onChange={handleFileChange} className="file-input" />
                 </div>
              </div>

              {/* --- SECTION 3: SOCIAL MEDIA --- */}
              <div className="form-section-title">Social Media Presence</div>
              <div className="form-row">
                 <div className="form-group half-width">
                   <label>Facebook URL</label>
                   <input type="url" name="facebook_url" value={setupForm.facebook_url} onChange={handleInputChange} placeholder="https://facebook.com/..." />
                 </div>
                 <div className="form-group half-width">
                   <label>Instagram URL</label>
                   <input type="url" name="instagram_url" value={setupForm.instagram_url} onChange={handleInputChange} placeholder="https://instagram.com/..." />
                 </div>
              </div>
              <div className="form-row">
                 <div className="form-group half-width">
                   <label>YouTube URL</label>
                   <input type="url" name="youtube_url" value={setupForm.youtube_url} onChange={handleInputChange} placeholder="https://youtube.com/..." />
                 </div>
                 <div className="form-group half-width">
                   <label>X (Twitter) URL</label>
                   <input type="url" name="x_url" value={setupForm.x_url} onChange={handleInputChange} placeholder="https://x.com/..." />
                 </div>
              </div>

              {/* --- SECTION 4: LOCATION --- */}
              <div className="form-section-title">Location</div>
              <div className="form-group">
                <label>Address*</label>
                <input type="text" name="address" value={setupForm.address} onChange={handleInputChange} required />
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

              {/* --- SECTION 5: TAX & KYC --- */}
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
                    <input type="text" name="gst_number" value={setupForm.gst_number} onChange={handleInputChange} />
                  </div>
                )}
              </div>

              {/* KYC Section: HIDDEN IN EDIT MODE */}
              {!isEditMode && (
                <div className="form-row">
                   <div className="form-group half-width">
                      <label>KYC Doc Type</label>
                      <select name="kyc_doc_type" value={setupForm.kyc_doc_type} onChange={handleInputChange}>
                         <option value="Pan">PAN Card</option>
                         
                      </select>
                   </div>
                   <div className="form-group half-width">
                    <label>PAN</label>
                    <input type="text" name="gst_number" value={setupForm.kyc_pan_id} onChange={handleInputChange} placeholder="Pan id"/>
                  </div>
                   <div className="form-group half-width">
                      <label>Upload KYC</label>
                      <input type="file" name="kyc_file" onChange={handleFileChange} className="file-input"  />
                   </div>
                </div>
              )}

              <button type="submit" className="btn-primary">
                  {isEditMode ? "Update Business Details" : "Save Business Details"}
              </button>
              
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