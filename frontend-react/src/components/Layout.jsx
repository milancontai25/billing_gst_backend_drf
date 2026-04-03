import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';
import Sidebar from './Sidebar';
import UserProfile from './UserProfile'; 
import { X, Menu, CreditCard, Link as LinkIcon, Shield } from 'lucide-react'; 
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

  // --- PAYMENT CONFIG STATE ---
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasPaymentConfig, setHasPaymentConfig] = useState(false);

  // Sidebar State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // --- BUSINESS FORM STATE ---
  const initialFormState = {
    business_name: '', owner_name: '', business_type: 'Retailer',
    currency: 'INR', 
    gst_status: 'Unregister', gst_number: '', address: '',
    country: 'India', state: '', district: '', pin: '',
    kyc_doc_type: 'Pan', kyc_pan_id: '',
    logo_file: null, kyc_file: null,
    banner_1: null, banner_2: null, banner_3: null, 
    facebook_url: '', instagram_url: '', youtube_url: '', x_url: ''
  };
  const [setupForm, setSetupForm] = useState(initialFormState);

  // --- PAYMENT FORM STATE ---
  const initialPaymentState = {
    payment_mode: 'UPI',
    gateway_provider: 'RAZORPAY',
    gateway_merchant_id: '', 
    gateway_public_key: '',
    gateway_secret_key: '',
    gateway_webhook_secret: '',
    upi_id: '',
    upi_qrcode: null, 
    is_upi_active: true,
    is_gateway_active: false
  };
  const [paymentForm, setPaymentForm] = useState(initialPaymentState);

  // --- FETCH DATA ---
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

  // --- BUSINESS SETUP HANDLERS ---
  const handleEditBusiness = () => {
    if (!data?.active_business) return;
    const biz = data.active_business;
    setSetupForm({
        business_name: biz.business_name || '', owner_name: biz.owner_name || '',
        business_type: biz.business_type || 'Retailer', 
        currency: biz.currency || 'INR', 
        gst_status: biz.gst_status || 'Unregister',
        gst_number: biz.gst_number || '', address: biz.address || '',
        country: biz.country || 'India', state: biz.state || '',
        district: biz.district || '', pin: biz.pin || '',
        kyc_doc_type: biz.kyc_doc_type || 'Pan', kyc_pan_id: biz.kyc_pan_id || '',
        logo_file: null, kyc_file: null,
        banner_1: null, banner_2: null, banner_3: null,
        facebook_url: biz.facebook_url || '', instagram_url: biz.instagram_url || '',
        youtube_url: biz.youtube_url || '', x_url: biz.x_url || ''
    });
    setIsEditMode(true);
    setShowSetupModal(true);
    setShowSwitcher(false); 
  };

  const handleAddNewBusiness = () => {
      setSetupForm(initialFormState); 
      setIsEditMode(false);
      setShowSetupModal(true);
      setShowSwitcher(false);
  };

  const handleInputChange = (e) => setSetupForm({ ...setupForm, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setSetupForm({ ...setupForm, [e.target.name]: e.target.files[0] });

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(setupForm).forEach(key => {
        const isFileField = ['logo_file', 'kyc_file', 'banner_1', 'banner_2', 'banner_3'].includes(key);
        if (isFileField && !setupForm[key]) return;
        if (setupForm[key] !== null && setupForm[key] !== undefined) {
             formData.append(key, setupForm[key]);
        }
    });

    try {
      if (isEditMode && data?.active_business?.id) {
          await api.patch(`/business/${data.active_business.id}/update/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
          await api.post('/business/setup/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowSetupModal(false);
      fetchDashboard();
      
      // OPEN PAYMENT CONFIGURATION AFTER SAVING BUSINESS
      openPaymentConfig();
      
    } catch (err) {
      if (err.response && err.response.data) {
          alert(`Validation Error: ${JSON.stringify(err.response.data)}`);
      } else {
          alert("Error saving business details.");
      }
    }
  };

  // --- PAYMENT CONFIGURATION HANDLERS ---
  const openPaymentConfig = async () => {
      try {
          const res = await api.get('/business/payment-config/');
          const conf = res.data;

          // Smart Currency Logic: Force Gateway if USD
          let currentMode = conf.payment_mode || 'UPI';
          if (setupForm.currency === 'USD') {
              currentMode = 'GATEWAY';
          }

          setPaymentForm({
              payment_mode: currentMode,
              gateway_provider: conf.gateway_provider || 'RAZORPAY',
              gateway_merchant_id: conf.gateway_merchant_id || '', 
              gateway_public_key: conf.gateway_public_key || '',
              gateway_secret_key: '', 
              gateway_webhook_secret: '',
              upi_id: conf.upi_id || '',
              upi_qrcode: null,
              is_upi_active: conf.is_upi_active ?? true,
              is_gateway_active: conf.is_gateway_active ?? false,
          });
          setHasPaymentConfig(true);
      } catch (error) {
          // If no config exists, default to UPI, unless currency is USD
          let currentMode = 'UPI';
          if (setupForm.currency === 'USD') currentMode = 'GATEWAY';

          setPaymentForm({
              ...initialPaymentState,
              payment_mode: currentMode
          });
          setHasPaymentConfig(false);
      }
      setShowPaymentModal(true);
  };

  const handlePaymentInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      setPaymentForm({ ...paymentForm, [name]: type === 'checkbox' ? checked : value });
  };

  const handlePaymentFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
          setPaymentForm({ ...paymentForm, upi_qrcode: e.target.files[0] });
      }
  };

  const handlePaymentSubmit = async (e) => {
      e.preventDefault();
      const payload = new FormData();
      const mode = paymentForm.payment_mode;

      payload.append('payment_mode', mode);

      if (mode === 'UPI' || mode === 'BOTH') {
          payload.append('upi_id', paymentForm.upi_id);
          payload.append('is_upi_active', paymentForm.is_upi_active);
          if (paymentForm.upi_qrcode instanceof File) {
              payload.append('upi_qrcode_url', paymentForm.upi_qrcode); 
          }
      }

      if (mode === 'GATEWAY' || mode === 'BOTH') {
          payload.append('gateway_provider', paymentForm.gateway_provider);
          payload.append('gateway_merchant_id', paymentForm.gateway_merchant_id); 
          payload.append('gateway_public_key', paymentForm.gateway_public_key);
          payload.append('is_gateway_active', paymentForm.is_gateway_active);
          if (paymentForm.gateway_secret_key) payload.append('gateway_secret_key', paymentForm.gateway_secret_key);
          if (paymentForm.gateway_webhook_secret) payload.append('gateway_webhook_secret', paymentForm.gateway_webhook_secret);
      }

      try {
          if (hasPaymentConfig) {
              await api.patch('/business/payment-config/', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
              alert("Payment Configuration Updated!");
          } else {
              await api.post('/business/payment-config/', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
              alert("Payment Configuration Saved!");
          }
          setShowPaymentModal(false);
      } catch (err) {
          alert("Error saving payment configuration.");
          console.error(err);
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
        openPaymentConfig={openPaymentConfig}
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

      {/* --- BUSINESS SETUP MODAL --- */}
      {showSetupModal && (
        <div className="modal-overlay" style={{zIndex: 1000}}>
          <div className="modal-box extended-modal">
            <div className="modal-header">
              <h2>{isEditMode ? "Edit Business Profile" : (data?.requires_setup ? "Setup Your Business" : "Add New Business")}</h2>
              <p>Please update your business details below.</p>
              {!data?.requires_setup && (
                 <button className="close-btn" onClick={() => setShowSetupModal(false)}><X size={20}/></button>
              )}
            </div>
            
            <form onSubmit={handleSetupSubmit} className="setup-form scrollable-form">
              
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
                
                {/* --- CURRENCY DROPDOWN (LOCKED IN EDIT MODE) --- */}
                <div className="form-group half-width">
                  <label>Base Currency</label>
                  <select 
                    name="currency" 
                    value={setupForm.currency} 
                    onChange={handleInputChange}
                    disabled={isEditMode}
                    style={isEditMode ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                  {isEditMode && (
                    <p style={{fontSize: '11px', color: '#ef4444', marginTop: '4px'}}>
                      Base currency cannot be changed after setup.
                    </p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Business Logo</label>
                <input type="file" name="logo_file" onChange={handleFileChange} className="file-input" />
              </div>

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

              {!isEditMode && (
                <div className="form-row">
                   <div className="form-group half-width">
                      <label>KYC Doc Type</label>
                      <select name="kyc_doc_type" value={setupForm.kyc_doc_type} onChange={handleInputChange}>
                         <option value="Pan">PAN Card</option>
                      </select>
                   </div>
                   <div className="form-group half-width">
                    <label>PAN ID</label>
                    <input type="text" name="kyc_pan_id" value={setupForm.kyc_pan_id} onChange={handleInputChange} placeholder="Pan id"/>
                  </div>
                   <div className="form-group half-width">
                      <label>Upload KYC</label>
                      <input type="file" name="kyc_file" onChange={handleFileChange} className="file-input"  />
                   </div>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{marginTop: '20px'}}>
                  {isEditMode ? "Save & Proceed to Payments" : "Create & Configure Payments"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- PAYMENT CONFIGURATION MODAL --- */}
      {showPaymentModal && (
        <div className="modal-overlay" style={{zIndex: 1010}}>
          <div className="modal-box extended-modal">
            <div className="modal-header">
              <h2>Payment Configuration</h2>
              <p>Set up how you want to accept payments from customers.</p>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}><X size={20}/></button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="setup-form scrollable-form">
              
              <div className="form-group" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                 <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Select Payment Mode</label>
                 <select name="payment_mode" value={paymentForm.payment_mode} onChange={handlePaymentInputChange} style={{ marginTop: '8px' }}>
                    {/* Only show UPI options if currency is NOT USD */}
                    {setupForm.currency !== 'USD' && <option value="UPI">UPI Only</option>}
                    <option value="GATEWAY">Payment Gateway Only</option>
                    {setupForm.currency !== 'USD' && <option value="BOTH">Both UPI & Gateway</option>}
                 </select>
                 {setupForm.currency === 'USD' && (
                     <p style={{fontSize: '11px', color: '#6b7280', marginTop: '6px'}}>
                        * UPI is not available for USD transactions.
                     </p>
                 )}
              </div>

              {/* UPI CONFIGURATION */}
              {(paymentForm.payment_mode === 'UPI' || paymentForm.payment_mode === 'BOTH') && (
                <div style={{ marginTop: '25px' }}>
                    <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LinkIcon size={18}/> UPI Setup
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group half-width">
                            <label>Merchant UPI ID*</label>
                            <input type="text" name="upi_id" placeholder="shopname@upi" value={paymentForm.upi_id} onChange={handlePaymentInputChange} required />
                        </div>
                        <div className="form-group half-width">
                            <label>UPI QR Code Image</label>
                            <input type="file" onChange={handlePaymentFileChange} className="file-input" accept="image/*" />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer" style={{fontSize: '13px', marginTop: '10px'}}>
                        <input type="checkbox" name="is_upi_active" checked={paymentForm.is_upi_active} onChange={handlePaymentInputChange} />
                        Activate UPI Payments
                    </label>
                </div>
              )}

              {/* GATEWAY CONFIGURATION */}
              {(paymentForm.payment_mode === 'GATEWAY' || paymentForm.payment_mode === 'BOTH') && (
                <div style={{ marginTop: '25px' }}>
                    <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={18}/> Gateway Setup
                    </div>

                    <div className="form-row">
                        <div className="form-group half-width">
                            <label>Gateway Provider</label>
                            <select name="gateway_provider" value={paymentForm.gateway_provider} onChange={handlePaymentInputChange}>
                                <option value="RAZORPAY">Razorpay</option>
                                <option value="STRIPE">Stripe</option>
                                <option value="PAYPAL">PayPal</option>
                            </select>
                        </div>
                        <div className="form-group half-width">
                            <label>Merchant ID*</label>
                            <input type="text" name="gateway_merchant_id" placeholder="e.g. merchant_123" value={paymentForm.gateway_merchant_id} onChange={handlePaymentInputChange} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Public Key / Key ID*</label>
                        <input type="text" name="gateway_public_key" value={paymentForm.gateway_public_key} onChange={handlePaymentInputChange} required />
                    </div>

                    <div className="form-row">
                        <div className="form-group half-width">
                            <label>Secret Key <Shield size={12} className="inline text-gray-400"/></label>
                            <input type="password" name="gateway_secret_key" placeholder={hasPaymentConfig ? "Leave blank to keep existing" : "Enter Secret Key"} value={paymentForm.gateway_secret_key} onChange={handlePaymentInputChange} required={!hasPaymentConfig} />
                        </div>
                        <div className="form-group half-width">
                            <label>Webhook Secret (Optional)</label>
                            <input type="password" name="gateway_webhook_secret" placeholder={hasPaymentConfig ? "Leave blank to keep existing" : ""} value={paymentForm.gateway_webhook_secret} onChange={handlePaymentInputChange} />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer" style={{fontSize: '13px', marginTop: '10px'}}>
                        <input type="checkbox" name="is_gateway_active" checked={paymentForm.is_gateway_active} onChange={handlePaymentInputChange} />
                        Activate Gateway Payments
                    </label>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{marginTop: '30px'}}>
                  {hasPaymentConfig ? "Update Payment Settings" : "Save Payment Settings"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Layout;