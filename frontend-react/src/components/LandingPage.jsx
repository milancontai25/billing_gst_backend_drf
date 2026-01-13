import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/css/landing.css'; 

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="landing-scope">
      
      {/* --- DEMO MODAL (Only for 'Schedule Demo' buttons now) --- */}
      {showDemoModal && (
        <div className="modal-overlay" onClick={() => setShowDemoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="modal-close" onClick={() => setShowDemoModal(false)}>&times;</span>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#111827' }}>Contact Us</h3>
            <p style={{ color: '#4b5563' }}>For demo or inquiries:</p>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb', margin: '20px 0', display: 'block' }}>
                contact@statgrow.com
            </span>
            <p style={{ fontWeight: 600, color: '#111827' }}>Call Us: +91-7477686079</p>
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'left' }}>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 'bold', marginBottom: '5px' }}>Office Address:</p>
              <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                StatGrow Technologies Pvt Ltd.<br />
                Plot No. 42, Hitech City, Madhapur<br />
                Hyderabad, Telangana - 500081
              </p>
            </div>
            <a href="mailto:contact@statgrow.com" className="btn btn-primary" style={{ marginTop: '20px', width: '100%', color: 'white', display:'block' }}>
                Send Email Now
            </a>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header>
        <div className="nav-container">
          <a href="#" className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
            StatGrow
          </a>
          
          <div className="hamburger" onClick={toggleMenu}>
            <span style={isMenuOpen ? { transform: 'rotate(45deg) translate(5px, 6px)' } : {}}></span>
            <span style={isMenuOpen ? { opacity: 0 } : {}}></span>
            <span style={isMenuOpen ? { transform: 'rotate(-45deg) translate(5px, -6px)' } : {}}></span>
          </div>

          <div className={`nav-right ${isMenuOpen ? 'open' : ''}`}>
            <div className="nav-links">
              <a href="#about" className="nav-link" onClick={() => setIsMenuOpen(false)}>About</a>
              
              <div className="nav-item-dropdown">
                <span className="nav-link">Our Products <span>▾</span></span>
                <div className="dropdown-menu">
                  <a href="#features" onClick={() => setIsMenuOpen(false)}>Business Analytics</a>
                  <a href="#features" onClick={() => setIsMenuOpen(false)}>Inventory Management</a>
                  <a href="#features" onClick={() => setIsMenuOpen(false)}>Smart Billing</a>
                  <a href="#features" onClick={() => setIsMenuOpen(false)}>Online Store</a>
                </div>
              </div>

              <a href="#testimonials" className="nav-link" onClick={() => setIsMenuOpen(false)}>Testimonials</a>
              <a href="#faq" className="nav-link" onClick={() => setIsMenuOpen(false)}>FAQ</a>
            </div>
            
            <div className="nav-actions">
              {/* LOGIN BUTTON */}
              <Link to="/login" className="btn btn-sm btn-outline-dark">Log In</Link>
              
              {/* REGISTER BUTTON */}
              <Link to="/register" className="btn btn-sm btn-primary" style={{ color: 'white' }}>
                  Start for Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* --- HERO --- */}
      <section className="hero">
        <div className="hero-glow"></div>
        <div className="container">
          <h1>Grow Your Business with India's<br />Most Affordable Platform</h1>
          <p>Everything you need to manage your business - analytics, inventory, billing, reports, and your own online store. All in one simple platform built for Indian businesses.</p>
          
          <div className="hero-buttons">
            {/* HERO CTA -> REGISTER */}
            <Link to="/register" className="btn btn-primary" style={{ color: '#ffffff', background: '#3b82f6' }}>
                Start for Free
            </Link>
            <a href="#features" className="btn btn-outline">Explore Features</a>
          </div>

          <div className="trust-badges">
            <div className="trust-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> 
              Secure & Reliable
            </div>
            <div className="trust-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
              Easy Setup
            </div>
            <div className="trust-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              10,000+ Businesses
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES (unchanged) --- */}
      <section id="features" className="features">
        <div className="blob-cont">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>
        <div className="container">
          <div className="section-header">
            <h2 className="gradient-text">Everything Your Business Needs</h2>
            <p>Powerful features designed to help you manage and grow your business efficiently</p>
          </div>
          <div className="features-grid">
            <FeatureCard icon="analytics" title="Business Analytics" desc="Get real-time insights into your business performance with comprehensive analytics." />
            <FeatureCard icon="inventory" title="Inventory Management" desc="Track stock levels, manage suppliers, and automate reordering." />
            <FeatureCard icon="users" title="Customer Management" desc="Maintain detailed customer records and track purchase history." />
            <FeatureCard icon="billing" title="Smart Billing & Reports" desc="Generate professional invoices instantly and access detailed financial reports." />
            <FeatureCard icon="store" title="Online Store" desc="Launch your own online store and reach customers beyond your physical location." />
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS (unchanged) --- */}
      <section id="testimonials" className="testimonials">
        <div className="container">
          <div className="section-header">
            <h2 className="gradient-text">Loved by Business Owners</h2>
            <p>See what our customers have to say</p>
          </div>
          <div className="testimonial-grid">
            <TestimonialCard name="Rajesh Kumar" role="Kumar Electronics, Mumbai" text="StatGrow has transformed how we manage our business. The inventory tracking alone has saved us thousands." />
            <TestimonialCard name="Priya Sharma" role="Sharma Boutique, Delhi" text="The online store feature helped us reach customers across India. Our sales increased by 40%!" />
            <TestimonialCard name="Ankit Patel" role="Patel Groceries, Ahmedabad" text="Simple, powerful, and affordable. StatGrow gives us the tools of large corporations at a fraction of the cost." />
          </div>
        </div>
      </section>

      {/* --- FAQ (unchanged) --- */}
      <div className="container">
        <section id="faq" className="faq">
          <div className="section-header">
            <h2 className="gradient-text">Frequently Asked Questions</h2>
          </div>
          <details>
            <summary>What makes StatGrow different from other software?</summary>
            <p>StatGrow is built specifically for Indian businesses with a focus on affordability and ease of use, combining inventory, billing, and an online store in one platform.</p>
          </details>
          <details>
            <summary>Can I try StatGrow before committing to a paid plan?</summary>
            <p>Yes, we offer a 14-day free trial so you can explore all features before subscribing.</p>
          </details>
          <details>
            <summary>Is my business data secure with StatGrow?</summary>
            <p>Absolutely. We use industry-standard encryption and security protocols to keep your data safe and backed up.</p>
          </details>
        </section>
      </div>

      {/* --- CTA --- */}
      <section id="cta" className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your Business?</h2>
          <p style={{ marginBottom: '30px', opacity: 0.9 }}>Join thousands of Indian businesses already growing with StatGrow.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
            {/* CTA -> REGISTER */}
            <Link to="/register" className="btn btn-primary" style={{color: '#1e3a8a', background: 'white'}}>
                Start for Free
            </Link>
            
            <button onClick={() => setShowDemoModal(true)} className="btn btn-outline-dark" style={{borderColor:'rgba(255,255,255,0.5)', color:'white'}}>
                Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      {/* --- ABOUT & FOOTER (unchanged) --- */}
      <section id="about" className="about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-image-wrapper">
                <div style={{width:'100%', height:'300px', background:'linear-gradient(135deg, #dbeafe, #93c5fd)', borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <span style={{fontSize:'3rem'}}>🚀</span>
                </div>
            </div>
            <div className="about-text">
              <h2 className="gradient-text">About Us</h2>
              <p style={{ fontSize: '1.1rem', color: '#4b5563', marginBottom: '20px' }}>
                StatGrow was founded with a single mission: to empower India's small and medium businesses with the same powerful tools used by large corporations, but at a price they can afford.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3 style={{ color: '#1e3a8a', display:'flex', alignItems:'center', gap:'10px' }}>
                StatGrow
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Empowering Indian businesses.</p>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#">Pricing</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <ul>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="mailto:support@statgrow.com">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="copyright">
            <p>&copy; 2025 StatGrow. All rights reserved. Made with ❤️ in India.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const FeatureCard = ({ icon, title, desc }) => (
  <div className="feature-card">
    <div className="feature-icon">
        {icon === 'analytics' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>}
        {icon === 'inventory' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>}
        {icon === 'users' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path></svg>}
        {icon === 'billing' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>}
        {icon === 'store' && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>}
    </div>
    <h3>{title}</h3>
    <p>{desc}</p>
  </div>
);

const TestimonialCard = ({ name, role, text }) => (
  <div className="testimonial-card">
    <div className="testimonial-avatar" style={{background: 'linear-gradient(135deg, #3b82f6, #2563eb)'}}></div>
    <p className="quote">"{text}"</p>
    <div className="author">{name}</div>
    <div className="author-title" style={{fontSize:'0.85rem', color:'#4b5563'}}>{role}</div>
  </div>
);

export default LandingPage;