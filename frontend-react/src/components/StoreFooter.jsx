import React from 'react';
import { Link } from 'react-router-dom';
import { Store, Facebook, Instagram, Youtube, Twitter, Mail, Phone } from 'lucide-react';
import '../assets/css/storefooter.css';

const StoreFooter = ({ slug, businessName, businessLogo, socialLinks, contactInfo }) => {
  return (
    <footer className="modern-footer">
      <div className="footer-content">
        
        {/* Column 1: Brand */}
        <div className="footer-col brand-col">
          <div className="footer-brand">
            <div className="brand-logo-box">
              {businessLogo ? (
                <img 
                  src={businessLogo} 
                  className="brand-logo-img" 
                  alt="logo" 
                  onError={(e) => e.target.style.display='none'} 
                />
              ) : (
                <Store size={22} />
              )}
            </div>
            <span className="footer-brand-name">{businessName}</span>
          </div>
          <div className="social-links">
            {socialLinks?.instagram && <a href={socialLinks.instagram} target="_blank" rel="noreferrer"><Instagram size={20} /></a>}
            {socialLinks?.facebook && <a href={socialLinks.facebook} target="_blank" rel="noreferrer"><Facebook size={20} /></a>}
            {socialLinks?.youtube && <a href={socialLinks.youtube} target="_blank" rel="noreferrer"><Youtube size={20} /></a>}
            {socialLinks?.twitter && <a href={socialLinks.twitter} target="_blank" rel="noreferrer"><Twitter size={20} /></a>}
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to={`/${slug}`}>Home</Link></li>
            <li><a href="#">Shop Now</a></li>
            <li><Link to={`/${slug}/orders`}>Track Your Order</Link></li>
          </ul>
        </div>

        {/* Column 3: About */}
        <div className="footer-col">
          <h4>About</h4>
          <ul>
            <li><a href="#">Our Story</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Privacy Policy</a></li>
          </ul>
        </div>

        {/* Column 4: Contact */}
        <div className="footer-col contact-col">
          <h4>Contact Us</h4>
          <p><Mail size={16} /> {contactInfo?.email || 'contact@store.com'}</p>
          <p><Phone size={16} /> {contactInfo?.phone || '+91-0000000000'}</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} {businessName}. All rights reserved.</p>
        <p>Powered by StatGrow</p>
      </div>
    </footer>
  );
};

export default StoreFooter;