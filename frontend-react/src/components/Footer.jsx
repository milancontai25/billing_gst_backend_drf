import React from 'react';
import '../assets/css/main.css';

const Footer = () => {
  return (
    <footer>
      <div className="main-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              StatGrow
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Empowering Indian businesses with simple, powerful management tools.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#docs">Documentation</a></li>
              <li><a href="mailto:support@statgrow.com">Support</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="copyright">
          <p>&copy; 2025 StatGrow. All rights reserved. Made with❤️ in India.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;