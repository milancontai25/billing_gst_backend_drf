import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/css/style.css'; // Importing your existing login CSS

const ForgotPassword = () => {
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [step, setStep] = useState(1); // Step 1: Send OTP, Step 2: Reset Password
  const [isLoading, setIsLoading] = useState(false);
  
  // Form Data
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); // <--- ADDED THIS

  // --- STEP 1: SEND OTP ---
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      // Note: Endpoint expects 'email'
      const response = await axios.post('http://127.0.0.1:8000/api/v1/forgot-password/', { 
        email: email 
      });
      
      console.log('OTP Sent:', response.data);
      setMessage('OTP sent to your email. Please check your inbox.');
      setStep(2); // Move to next step
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send OTP. Please check the email.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- STEP 2: RESET PASSWORD ---
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    // Frontend Validation: Confirm Password Logic
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('api/v1/reset-password/', {
        email: email, // Email is preserved from Step 1
        otp: otp,
        new_password: newPassword
      });

      console.log('Reset Success:', response.data);
      setMessage('Password reset successful! Redirecting to login...');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/login'); // Assuming '/' is your login route
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.detail || "Invalid OTP or Server Error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="logo">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
        </div>

        {/* Display Success Messages */}
        {message && (
            <div style={{ color: 'green', marginBottom: '15px', padding: '10px', background: '#ecfdf5', borderRadius: '8px' }}>
                {message}
            </div>
        )}

        {/* Display Error Messages */}
        {error && (
            <div style={{ color: 'red', marginBottom: '15px', padding: '10px', background: '#fef2f2', borderRadius: '8px' }}>
                {error}
            </div>
        )}

        {/* --- FORM STEP 1: ENTER EMAIL --- */}
        {step === 1 && (
            <form onSubmit={handleSendOtp}>
                <div className="form-group">
                    <label>Email Address</label>
                    <input 
                        type="email" 
                        placeholder="you@company.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                
                <button type="submit" className="btn" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send OTP'}
                </button>
            </form>
        )}

        {/* --- FORM STEP 2: ENTER OTP & NEW PASSWORD --- */}
        {step === 2 && (
            <form onSubmit={handleResetPassword}>
                <div className="form-group">
                    <label>Enter OTP</label>
                    <input 
                        type="text" 
                        placeholder="Enter the code sent to your email" 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        
                    />
                </div>

                <div className="form-group">
                    <label>New Password</label>
                    <div className="password-container">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="New password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            
                        />
                        <button 
                            type="button" 
                            className="toggle-password" 
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Show password"
                        >
                            {/* Eye Icon SVG */}
                            {!showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                            )}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label>Confirm Password</label>
                    {/* Added missing password-container div here */}
                    <div className="password-container">
                        <input 
                            type={showConfirm ? "text" : "password"} 
                            placeholder="Confirm new password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            
                        />
                        <button 
                            type="button" 
                            className="toggle-password" 
                            onClick={() => setShowConfirm(!showConfirm)} 
                            aria-label="Show confirm password"
                        >
                            {/* Eye Icon SVG */}
                            {!showConfirm ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                            )}
                        </button>
                    </div>
                </div>

                <button type="submit" className="btn" disabled={isLoading}>
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
                
                {/* Option to go back to email step */}
                <div style={{marginTop: '15px', fontSize: '0.9rem', color: 'gray', cursor: 'pointer', textAlign: 'center'}} onClick={() => setStep(1)}>
                    Wrong email? Go back
                </div>
            </form>
        )}

        <Link to="/login" className="back-link">← Back to Login</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;