import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate and Link
// import '../assets/css/register.css'; 

const Register = () => {
  const navigate = useNavigate(); // Hook for navigation

  // 1. State for Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // State for Popup
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // 2. State for Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  // 3. Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
        setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  // 4. Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match!" });
      return;
    }
    
    const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
    };
    
    try {
        const response = await axios.post(`${API_BASE_URL}/api/v1/register/`, userData);
        console.log('Registration Successful:', response.data);
        
        // SHOW POPUP INSTEAD OF ALERT
        setShowSuccessPopup(true);

    } catch(error) {
        if (error.response) {
            setErrors(error.response.data);
        } else {
            console.error('Network error:', error.message);
            alert("Network Error: Could not reach server.");
        }
    }
  };

  // Function to close popup and go to login
  const handleClosePopup = () => {
    setShowSuccessPopup(false);
    navigate('/login'); // Redirects to login page
  };

  return (
    <div className="register-wrapper">

      {/* --- SUCCESS POPUP COMPONENT --- */}
      {showSuccessPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <div className="popup-icon">✅</div>
            <h2>Success!</h2>
            <p>Your account has been created successfully.</p>
            <button className="popup-btn" onClick={handleClosePopup}>
              Go to Login
            </button>
          </div>
        </div>
      )}

      <div className="signup-card">
        <div className="logo">Registration</div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              name="name"
              placeholder="John Doe" 
              value={formData.name}
              onChange={handleChange} 
            />
            <small style={{ color: 'red' }}>{errors.name && <div>{errors.name}</div>}</small>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email"
              placeholder="you@company.com" 
              value={formData.email}
              onChange={handleChange}
            />
             <small style={{ color: 'red' }}>{errors.email && <div>{errors.email}</div>}</small>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input 
              type="tel" 
              name="phone"
              placeholder="+91 98765 43210" 
              value={formData.phone}
              onChange={handleChange}
            />
             <small style={{ color: 'red' }}>{errors.phone && <div>{errors.phone}</div>}</small>
          </div>

          <div className="form-group">
            <label>Create Password</label>
            <div className="password-container">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleChange}
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => setShowPassword(!showPassword)} 
              >
                {!showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                )}
              </button>
            </div>
            <small style={{ color: 'red' }}>{errors.password && <div>{errors.password}</div>}</small>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="password-container">
              <input 
                type={showConfirm ? "text" : "password"} 
                name="confirmPassword"
                placeholder="••••••••" 
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => setShowConfirm(!showConfirm)} 
              >
                {!showConfirm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                )}
              </button>
            </div>
            <small style={{ color: 'red' }}>
                {errors.confirmPassword && <div>{errors.confirmPassword}</div>}
            </small>
          </div>

          <button type="submit" className="btn">Create Account</button>
        </form>
        
        {/* CHANGED TO LINK */}
        <div className="links">
          Already have an account? <Link to="/login">Log In</Link>
        </div>
        
        {/* CHANGED TO LINK */}
        <Link to="/" className="back-link">← Back to Home</Link>
      </div>
    </div>
  );
}

export default Register;