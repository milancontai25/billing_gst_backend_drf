import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { X, Mail, Lock, KeyRound, User, Phone, Loader2, ArrowLeft } from 'lucide-react';

const AuthCustomer = ({ isOpen, onClose, onLoginSuccess }) => {
  const { slug } = useParams();
  
  const [authMode, setAuthMode] = useState('login'); 
  const [loginMethod, setLoginMethod] = useState('otp'); 
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [authForm, setAuthForm] = useState({ 
    name: '', email: '', phone: '', password: '', confirmPassword: '', otp: '' 
  });

  if (!isOpen) return null;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  const API_BASE = `${API_BASE_URL}/api/v1/business/${slug}/customer`;

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const resetState = (mode) => {
    setAuthMode(mode);
    setAuthForm({ name: '', email: '', phone: '', password: '', confirmPassword: '', otp: '' });
    setOtpSent(false);
  };

  const handleSendOtp = async (endpoint) => {
    if (!authForm.email) return alert("Please enter your email.");
    try {
      setIsLoading(true);
      await axios.post(`${API_BASE}${endpoint}`, { email: authForm.email });
      alert("OTP sent to your email!");
      setOtpSent(true);
      if (authMode === 'forgot') setAuthMode('reset');
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((authMode === 'signup' || authMode === 'reset') && authForm.password !== authForm.confirmPassword) {
      return alert("Passwords do not match!");
    }

    setIsLoading(true);

    try {
      let res;
      
      // 1. SIGNUP
      if (authMode === 'signup') {
        res = await axios.post(`${API_BASE}/signup/`, {
            name: authForm.name,
            email: authForm.email,
            phone: authForm.phone,
            password: authForm.password
        });
        
        // If API returns tokens on signup, log them in instantly!
        if (res.data && (res.data.tokens || res.data.access)) {
            handleSuccess(res.data);
        } else {
            alert("Account created! Please login.");
            resetState('login');
        }
      } 
      
      // 2. LOGIN (OTP) - Handles both registered and new "anytime OTP" users
      else if (authMode === 'login' && loginMethod === 'otp') {
        if (!otpSent) return alert("Please send OTP first.");
        res = await axios.post(`${API_BASE}/login/otp/verify/`, {
            email: authForm.email,
            otp: authForm.otp
        });
        handleSuccess(res.data);
      } 
      
      // 3. LOGIN (PASSWORD)
      else if (authMode === 'login') {
        res = await axios.post(`${API_BASE}/login/`, {
            email: authForm.email, 
            password: authForm.password
        });
        handleSuccess(res.data);
      }

      // 4. FORGOT/RESET
      else if (authMode === 'forgot') {
        await handleSendOtp('/forgot-password/');
      }
      else if (authMode === 'reset') {
        res = await axios.post(`${API_BASE}/reset-password/`, {
            email: authForm.email,
            otp: authForm.otp,
            new_password: authForm.password
        });
        alert("Password reset successful! You can now login.");
        resetState('login');
      }

    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.message || "Action failed";
      alert(msg);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSuccess = (data) => {
    // 1. Extract Tokens (Prioritizes new nested structure, falls back to flat structure)
    const token = data.tokens?.access || data.access; 
    const refresh = data.tokens?.refresh || data.refresh; 
    
    if (token) {
        // 2. Save Tokens
        localStorage.setItem('customer_token', token);
        if (refresh) localStorage.setItem('customer_refresh', refresh);

        // 3. Extract Name (Prioritizes new customer object, falls back to form state, then email prefix)
        const displayName = data.customer?.name || authForm.name || (authForm.email ? authForm.email.split('@')[0] : 'Customer');
        localStorage.setItem('customer_name', displayName);
        
        // 4. Update Parent & Close
        onLoginSuccess(); 
        onClose();        
    } else {
        console.error("Missing token in response:", data);
        alert("Login failed: Server did not return an access token.");
    }
  };

  return (
    <div className="store-modal-overlay">
      <div className="auth-box">
        <button className="close-modal-btn" onClick={onClose}><X size={20}/></button>
        
        {/* --- TABS --- */}
        {(authMode === 'login' || authMode === 'signup') && (
          <div className="auth-tabs">
            <div className={`auth-tab ${authMode === 'login' ? 'active' : ''}`} onClick={() => setAuthMode('login')}>Login</div>
            <div className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`} onClick={() => setAuthMode('signup')}>Sign Up</div>
          </div>
        )}

        <div className="auth-content">
          <h2 className="auth-title">
            {authMode === 'login' && 'Welcome Back'}
            {authMode === 'signup' && 'Create Account'}
            {authMode === 'forgot' && 'Forgot Password'}
            {authMode === 'reset' && 'Reset Password'}
          </h2>
          
          <p className="auth-subtitle">
            {authMode === 'login' && 'Access your orders and wishlist'}
            {authMode === 'signup' && 'Join us to track your orders'}
            {authMode === 'forgot' && 'Enter email to receive OTP'}
            {authMode === 'reset' && 'Create a new password'}
          </p>

          {/* Toggle Login Method */}
          {authMode === 'login' && (
            <div className="method-toggle">
              <button type="button" className={loginMethod === 'otp' ? 'active' : ''} onClick={() => setLoginMethod('otp')}>OTP</button>
              <button type="button" className={loginMethod === 'password' ? 'active' : ''} onClick={() => setLoginMethod('password')}>Password</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-body">
            
            {/* Name & Phone (Signup) */}
            {authMode === 'signup' && (
              <>
                <div className="input-group">
                  <User size={18} className="input-icon" />
                  <input type="text" name="name" placeholder="Full Name" required value={authForm.name} onChange={handleInputChange} />
                </div>
                <div className="input-group">
                  <Phone size={18} className="input-icon" />
                  <input type="text" name="phone" placeholder="Phone Number" required value={authForm.phone} onChange={handleInputChange} />
                </div>
              </>
            )}

            {/* Email */}
            <div className="input-group">
              <Mail size={18} className="input-icon" />
              <input type="email" name="email" placeholder="Email Address" required value={authForm.email} onChange={handleInputChange} readOnly={authMode === 'reset'} />
            </div>

            {/* Password */}
            {(authMode === 'signup' || (authMode === 'login' && loginMethod === 'password') || authMode === 'reset') && (
              <div className="input-group">
                <Lock size={18} className="input-icon" />
                <input type="password" name="password" placeholder={authMode === 'reset' ? "New Password" : "Password"} required value={authForm.password} onChange={handleInputChange} />
              </div>
            )}

            {/* Confirm Password */}
            {(authMode === 'signup' || authMode === 'reset') && (
              <div className="input-group">
                <Lock size={18} className="input-icon" />
                <input type="password" name="confirmPassword" placeholder="Confirm Password" required value={authForm.confirmPassword} onChange={handleInputChange} />
              </div>
            )}

            {/* OTP */}
            {((authMode === 'login' && loginMethod === 'otp') || authMode === 'reset') && (
              <div className="input-group">
                <KeyRound size={18} className="input-icon" />
                <input type="text" name="otp" placeholder="Enter OTP" required value={authForm.otp} onChange={handleInputChange} />
                {authMode === 'login' && (
                    <button type="button" className="send-otp-btn" onClick={() => handleSendOtp('/login/otp/')}>
                        {otpSent ? "Resend" : "Send OTP"}
                    </button>
                )}
              </div>
            )}

            <button type="submit" className="primary-auth-btn" disabled={isLoading}>
              {isLoading ? <Loader2 size={18} className="animate-spin" style={{ margin: '0 auto' }}/> : 
                (authMode === 'forgot' ? 'Send OTP' : 
                 authMode === 'reset' ? 'Reset Password' : 
                 authMode === 'login' ? 'Login' : 'Create Account')
              }
            </button>
          </form>

          <div className="auth-footer">
            {/* ADDED: && loginMethod === 'password' to hide on OTP tab */}
            {authMode === 'login' && loginMethod === 'password' && (
              <>
                <p>Don't have an account? <span className="auth-link" onClick={() => resetState('signup')}>Sign Up</span></p>
                <p style={{marginTop:'10px'}}><span className="auth-link" onClick={() => resetState('forgot')}>Forgot Password?</span></p>
              </>
            )}
            
            {(authMode === 'signup' || authMode === 'forgot' || authMode === 'reset') && (
               <p className="flex-center auth-link" onClick={() => resetState('login')}>
                  <ArrowLeft size={14} style={{marginRight:5}}/> 
                  <span>Back to Login</span>
               </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCustomer;