import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../assets/css/landing.css';
import logoImage from '../assets/images/statgrow-logo.png';
import { ShoppingCart, Search, Store, User, Settings, LogOut, Package, ChevronDown, Loader2, Facebook, Instagram, Youtube, Twitter, Mail, Phone, ChevronRight, ChevronLeft } from 'lucide-react';

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
                statgrowinfo@gmail.com
            </span>
            <p style={{ fontWeight: 600, color: '#111827' }}>Call Us: +91-7477686079</p>
            {/* ... Address details ... */}
            <a href="mailto:contact@statgrow.com" className="btn btn-primary" style={{ marginTop: '20px', width: '100%', display:'flex' }}>
                Send Email Now
            </a>
          </div>
        </div>
      )}


      {/* --- HEADER --- */}
      <header>
        <div className="nav-container">
          
          {/* LOGO LINK */}
          <Link to="/" className="logo" onClick={() => setIsMenuOpen(false)}>
            <img 
                src={logoImage} 
                alt="StatGrow" 
                className="logo-img" 
            />
          </Link>
    
    {/* ... rest of your header code ... */}
          
          {/* HAMBURGER ICON */}
          <div className="hamburger" onClick={toggleMenu}>
            {/* Animated Hamburger Lines */}
            <span style={isMenuOpen ? { transform: 'rotate(45deg) translate(5px, 6px)' } : {}}></span>
            <span style={isMenuOpen ? { opacity: 0 } : {}}></span>
            <span style={isMenuOpen ? { transform: 'rotate(-45deg) translate(5px, -6px)' } : {}}></span>
          </div>

          {/* NAV MENU (Collapsible) */}
          <div className={`nav-right ${isMenuOpen ? 'open' : ''}`}>
            <div className="nav-links">
              <a href="#about" className="nav-link" onClick={() => setIsMenuOpen(false)}>About</a>
              <a href="#features" className="nav-link" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="#testimonials" className="nav-link" onClick={() => setIsMenuOpen(false)}>Testimonials</a>
              <a href="#faq" className="nav-link" onClick={() => setIsMenuOpen(false)}>FAQ</a>
            </div>
            
            <div className="nav-actions">
              <Link to="/login" className="btn btn-sm btn-outline-dark" onClick={() => setIsMenuOpen(false)}>
                  Log In
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary" onClick={() => setIsMenuOpen(false)}>
                  Start for Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="hero">
        <div className="hero-glow"></div>
        <div className="container">
          <h1>Grow Your Business with India's<br />Most Affordable Platform</h1>
          <p>Everything you need to manage your business - analytics, inventory, billing, reports, and your own online store. All in one simple platform built for Indian businesses.</p>
          
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">Start for Free</Link>
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

      {/* --- ABOUT / STORY SECTION (Updated) --- */}
      <section id="about" className="story-section">
        <div className="container">
            <div className="story-grid">
                
                {/* Left: Content */}
                <div className="story-content">
                    <h2 className="gradient-text">About Us</h2>
                    <p>
                        StatGrow was founded in 2025 with a simple observation: while large corporations had access to powerful ERP systems, local business owners in India were still struggling with manual entry and paper ledgers.
                    </p>
                    <p>
                        We built StatGrow to be the bridge. A platform that is sophisticated enough to handle complex inventory and data analytics, yet simple enough for anyone to use without technical training.
                    </p>
                    
                    <div className="stats-row">
                        <div className="stat-item">
                            <div className="stat-number">10k+</div>
                            <div className="stat-label">Businesses</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">25+</div>
                            <div className="stat-label">Cities</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">100%</div>
                            <div className="stat-label">Made in India</div>
                        </div>
                    </div>
                </div>

                {/* Right: Image */}
                <div className="story-image">
                    {/* You can replace this src with your own team photo later */}
                    <img 
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2670&auto=format&fit=crop" 
                        alt="The StatGrow Team working together" 
                    />
                </div>

            </div>
        </div>
      </section>

      
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

      {/* --- CTA SECTION --- */}
      <section id="cta" className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your Business?</h2>
          <p style={{ marginBottom: '30px', opacity: 0.9 }}>
            Join thousands of Indian businesses already growing with StatGrow.
          </p>
          
          {/* UPDATED BUTTON GROUP */}
          <div className="cta-button-group">
            
            {/* 1. White Button (Blue Text) */}
            <Link to="/register" className="btn btn-white">
                Start for Free
            </Link>
            
            {/* 2. Outline Button (White Text) */}
            <button 
                onClick={() => setShowDemoModal(true)} 
                className="btn btn-outline-white"
            >
                Schedule a Demo
            </button>

          </div>
        </div>
      </section>

 
      <footer>
        <div className="container">
          <div className="footer-grid">
            
            {/* 1. Brand Column */}
            <div className="footer-brand">
              <Link to="/" className="footer-logo-link" onClick={() => window.scrollTo(0,0)}>
                <img 
                    src={logoImage} 
                    alt="StatGrow" 
                    className="footer-logo-img" 
                />
              </Link>
              <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '10px' }}>
                Empowering Indian businesses<br/> with affordable technology.
              </p>

              {/* Social Icons (Keep your existing code here) */}
              <div className="social-links">
                 {/* ... keep your social icons code ... */}
                 <a href="https://whatsapp.com/channel/0029VbBhada0rGiSzA4cbs2J" target="_blank" rel="noopener noreferrer" className="social-icon whatsapp">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.694c.93.513 1.936.784 2.806.784 3.181 0 5.767-2.587 5.767-5.766.001-3.181-2.585-5.769-5.767-5.769zm9.969 5.766c0-5.384-4.379-9.766-9.769-9.766-5.381 0-9.759 4.382-9.769 9.766C2.452 15.825 4.541 18.256 6.3 19.387l-1.397 5.101 5.223-1.368c1.23.367 2.65.645 3.875.645 5.39 0 9.769-4.381 9.769-9.766z"/></svg>
                 </a>
                 <a href="https://www.facebook.com/share/19YTCJS1PB/" target="_blank" rel="noopener noreferrer" className="social-icon facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                 </a>
                 <a href="https://www.instagram.com/statgrowinfo/" target="_blank" rel="noopener noreferrer" className="social-icon instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                 </a>
                 <a href="https://www.linkedin.com/in/statgrow/" target="_blank" rel="noopener noreferrer" className="social-icon linkedin">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                 </a>
                 <a href="https://www.youtube.com/@StatGrow" target="_blank" rel="noopener noreferrer" className="social-icon youtube">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                 </a>
              </div>
            </div>

            {/* 2. Product Column */}
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#testimonials">Testimonials</a></li>
              </ul>
            </div>

            {/* 3. Support Column */}
            <div className="footer-col">
              <h4>Support</h4>
              <ul>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="mailto:statgrowinfo@gmail.com">Contact Us</a></li>
              </ul>
            </div>

            {/* 4. Legal Column */}
            <div className="footer-col">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>

            {/* 5. Contact Column (Updated for alignment) */}
            <div className="footer-col">
              <h4>Contact Us</h4>
              <ul className="contact-list">
                <li>
                  <Mail size={18} className="footer-icon" />
                  <a href="mailto:statgrowinfo@gmail.com">statgrowinfo@gmail.com</a>
                </li>
                <li>
                  <Phone size={18} className="footer-icon" />
                  <span>+91-7477686079</span>
                </li>
              </ul>
            </div>

          </div>
          
          <div className="copyright">
            <p>&copy; 2025 StatGrow. All rights reserved.</p>
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