import React, { useState } from 'react';
import axios from 'axios'; // For login, we can use raw axios or the instance
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  // State for form fields
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // State for UI
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
        const response = await axios.post('api/v1/token/', formData);
        
        console.log('Login Successful:', response.data);
        
        // --- UPDATED LOGIC HERE ---
        // Django SimpleJWT returns: { access: "...", refresh: "..." }
        const accessToken = response.data.access;
        const refreshToken = response.data.refresh;
        
        if (accessToken && refreshToken) {
            // Store BOTH tokens
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            
            navigate('/dashboard'); 
        } else {
            setError("Login failed: Invalid server response.");
        }

    } catch(err) {
        if (err.response) {
            setError(err.response.data.detail || "Invalid email or password");
        } else {
            setError("Could not connect to server. Is backend running?");
        }
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="logo">Login</div>
        
        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email"
              placeholder="you@company.com" 
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label>Password</label>
            <div className="password-container">
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button 
                type="button" 
                className="toggle-password" 
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Show password"
              >
                {!showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                )}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#10b981', textDecoration: 'none', fontWeight: '600' }}>
                    Forgot Password?
                </Link>
            </div>
          </div>

          {error && (
            <div style={{ color: 'red', marginBottom: '15px', fontSize: '0.9rem' }}>
                {error}
            </div>
          )}

          <button type="submit" className="btn">Log In</button>
        </form>
        
        <div className="links">
            Don't have an account? <Link to="/register">Sign Up</Link>
        </div>
        
        <Link to="/" className="back-link">← Back to Home</Link>
      </div>
    </div>
  );
}

export default Login;