import React, { useState } from 'react';
import { X, Mail, Lock, KeyRound, User } from 'lucide-react';
import '../assets/css/storefront.css'; // Uses the same CSS we created

const AuthCustomer = ({ isOpen, onClose }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', otp: '' });

  if (!isOpen) return null;

  // --- HANDLERS ---
  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
    setAuthForm({ name: '', email: '', password: '', otp: '' }); // Reset form
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting:", { authMode, loginMethod, ...authForm });
    // Add your API login logic here (e.g., axios.post('/api/login', authForm))
    alert(`${authMode === 'login' ? 'Login' : 'Signup'} successful!`);
    onClose();
  };

  return (
    <div className="store-modal-overlay">
      <div className="auth-box">
        <button className="close-modal-btn" onClick={onClose}><X size={20}/></button>
        
        {/* Tab Header */}
        <div className="auth-tabs">
          <div 
            className={`auth-tab ${authMode === 'login' ? 'active' : ''}`} 
            onClick={() => setAuthMode('login')}
          >
            Login
          </div>
          <div 
            className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`} 
            onClick={() => setAuthMode('signup')}
          >
            Sign Up
          </div>
        </div>

        <div className="auth-content">
          <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="auth-subtitle">
            {authMode === 'login' ? 'Access your orders and wishlist' : 'Join us to track your orders'}
          </p>

          {/* Login Method Toggle (Only for Login) */}
          {authMode === 'login' && (
            <div className="method-toggle">
              <button 
                className={loginMethod === 'password' ? 'active' : ''} 
                onClick={() => setLoginMethod('password')}
              >
                Password
              </button>
              <button 
                className={loginMethod === 'otp' ? 'active' : ''} 
                onClick={() => setLoginMethod('otp')}
              >
                OTP
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {authMode === 'signup' && (
              <div className="input-group">
                <User size={18} className="input-icon" />
                <input 
                  type="text" placeholder="Full Name" required 
                  value={authForm.name} 
                  onChange={e => setAuthForm({...authForm, name: e.target.value})}
                />
              </div>
            )}

            <div className="input-group">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" placeholder="Email Address" required 
                value={authForm.email} 
                onChange={e => setAuthForm({...authForm, email: e.target.value})}
              />
            </div>

            {/* Password Field */}
            {(authMode === 'signup' || (authMode === 'login' && loginMethod === 'password')) && (
              <div className="input-group">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" placeholder="Password" required 
                  value={authForm.password} 
                  onChange={e => setAuthForm({...authForm, password: e.target.value})}
                />
              </div>
            )}

            {/* OTP Field */}
            {authMode === 'login' && loginMethod === 'otp' && (
              <div className="input-group">
                <KeyRound size={18} className="input-icon" />
                <input 
                  type="text" placeholder="Enter OTP" required 
                  value={authForm.otp} 
                  onChange={e => setAuthForm({...authForm, otp: e.target.value})}
                />
                <button type="button" className="send-otp-btn">Send</button>
              </div>
            )}

            <button type="submit" className="primary-auth-btn">
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            {authMode === 'login' ? (
              <p>Don't have an account? <span onClick={toggleAuthMode}>Sign Up</span></p>
            ) : (
              <p>Already have an account? <span onClick={toggleAuthMode}>Login</span></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCustomer;