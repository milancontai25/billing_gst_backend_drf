import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/main.css';


const Header = () => {
  return (
    <header>
      <div className="nav-container">
        {/* Added inline flex style to ensure icon and text align perfectly */}
        <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ display: 'block' }} // Ensures SVG doesn't have weird line-height gaps
          >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
          <span style={{ color: '#1e3a8a' }}>StatGrow</span>
        </Link>
        
        <input type="checkbox" id="menu-toggle" className="menu-checkbox" />
        <label htmlFor="menu-toggle" className="hamburger">
          <span></span><span></span><span></span>
        </label>

        <div className="nav-right">
          <div className="nav-links">
            <a href="#about" className="nav-link">About</a>
            
            {/* "Our Products" REMOVED as requested */}

            <div className="nav-item-dropdown">
              <a href="#services" className="nav-link">Our Services <span>▾</span></a>
              <div className="dropdown-menu">
                <a href="#">Business Consulting</a>
                <a href="#">Custom Integration</a>
                <a href="#">Staff Training</a>
                <a href="#">Priority Support</a>
              </div>
            </div>

            <a href="#testimonials" className="nav-link">Testimonials</a>
            <a href="#faq" className="nav-link">FAQ</a>
            
            {/* Contact Us ADDED as requested (Targets the CSS Modal) */}
            <a href="#demo-modal" className="nav-link">Contact Us</a>
          </div>
          
          <div className="nav-actions">
            <Link to="/login" className="st-btn st-btn-sm st-btn-outline-dark">Log In</Link>
  <Link to="/register" className="st-btn st-btn-sm st-btn-primary">Start for Free</Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;