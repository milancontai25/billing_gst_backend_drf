import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/main.css'; 

const Main = () => {
  return (
    <main>
      {/* --- MODAL (Pure CSS Control) --- */}
      {/* Note: Modals using :target selectors must use <a> tags with href IDs, not <Link> */}
      <div id="demo-modal" className="modal-overlay">
        <div className="modal-content">
          <a href="#" className="modal-close">&times;</a>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Contact Us</h3>
          <p style={{ color: '#4b5563' }}>For demo or inquiries:</p>
          <span className="modal-email">contact@statgrow.com </span>
          <p style={{ fontWeight: 600, color: '#111827' }}>Call Us: +91-7477686079</p>
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', textAlign: 'left' }}>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 'bold', marginBottom: '5px' }}>Office Address:</p>
            <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>
              StatGrow Technologies Pvt Ltd.<br />
              Plot No. 42, Hitech City, Madhapur<br />
              Hyderabad, Telangana - 500081
            </p>
          </div>
          <a href="mailto:contact@statgrow.com" className="st-btn st-btn-primary" style={{ marginTop: '20px', width: '100%', color: 'white' }}>Send Email Now</a>
        </div>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="hero">
        <div className="hero-glow"></div>
        <div className="main-container">
          <h1>Grow Your Business with India's<br />Most Affordable Platform</h1>
          <p>Everything you need to manage your business - analytics, inventory, billing, reports, and your own online store. All in one simple platform built for Indian businesses.</p>
          
          <div className="hero-buttons">
            <Link to="/register" className="st-btn st-btn-primary" style={{ color: '#ffffff' }}>Start for Free</Link>
            {/* Hash links stay as <a> for smooth scrolling */}
            <a href="#features" className="st-btn st-btn-outline">Explore Features</a>
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

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="features">
        <div className="blob-cont">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>
        <div className="main-container">
          <div className="section-header">
            <h2 className="gradient-text">Everything Your Business Needs</h2>
            <p>Powerful features designed to help you manage and grow your business efficiently</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
              </div>
              <h3>Business Analytics</h3>
              <p>Get real-time insights into your business performance with comprehensive analytics and customizable dashboards.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              </div>
              <h3>Inventory Management</h3>
              <p>Track stock levels, manage suppliers, and automate reordering to never run out of essential products.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <h3>Customer Management</h3>
              <p>Maintain detailed customer records, track purchase history, and build lasting relationships.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
              </div>
              <h3>Smart Billing & Reports</h3>
              <p>Generate professional invoices instantly and access detailed financial reports at any time.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              </div>
              <h3>Online Store</h3>
              <p>Launch your own online store and reach customers beyond your physical location.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- GALLERY SECTION --- */}
      <section className="gallery-section">
        <div className="main-container">
          <div className="section-header">
            <h2 className="gradient-text">Product Showcase</h2>
            <p>Explore the intuitive interface of the StatGrow ecosystem</p>
          </div>
          <div className="gallery-grid">
            <div className="gallery-item">
              <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80" alt="Dashboard View" />
              <div className="gallery-overlay"><h4>Main Dashboard</h4></div>
            </div>
            <div className="gallery-item">
              <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80" alt="Billing Interface" />
              <div className="gallery-overlay"><h4>POS & Smart Billing</h4></div>
            </div>
            <div className="gallery-item">
              <img src="https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&w=800&q=80" alt="Inventory tracking" />
              <div className="gallery-overlay"><h4>Inventory Tracking</h4></div>
            </div>
            <div className="gallery-item">
               <img src="https://images.unsplash.com/photo-1551288049-bbbda5366392?auto=format&fit=crop&w=800&q=80" alt="Analytics Reports" />
               <div className="gallery-overlay"><h4>Advanced Reports</h4></div>
            </div>
          </div>
        </div>
      </section>

      {/* --- VIDEO SECTION --- */}
      <section className="video-section">
        <div className="main-container">
          <div className="section-header">
            <h2 className="gradient-text">Learn in Minutes</h2>
            <p>Watch our walkthroughs to see how StatGrow works for your business</p>
          </div>
          <div className="video-grid">
            <div className="video-card">
              <div className="video-wrapper">
                <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowFullScreen title="Video 1"></iframe>
              </div>
              <div className="video-info">
                <h4>Getting Started with StatGrow</h4>
                <p>A complete 5-minute guide to setting up your business profile and adding your first product.</p>
              </div>
            </div>
            <div className="video-card">
              <div className="video-wrapper">
                <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowFullScreen title="Video 2"></iframe>
              </div>
              <div className="video-info">
                <h4>How to Launch Your Online Store</h4>
                <p>Learn how to take your physical shop online and start accepting orders digitally.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section id="testimonials" className="testimonials">
        <div className="blob-cont">
             <div className="blob blob-2" style={{ left: '-10%', top: '20%' }}></div>
        </div>
        <div className="main-container">
            <div className="section-header">
                <h2 className="gradient-text">Loved by Business Owners Across India</h2>
                <p>See what our customers have to say</p>
            </div>
            <div className="testimonial-grid">
                <div className="testimonial-card">
                    <img className="testimonial-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23dbeafe'/%3E%3Cg fill='%233b82f6'%3E%3Ccircle cx='50' cy='35' r='20'/%3E%3Cpath d='M50 60 C25 60 15 95 15 100 L85 100 C85 95 75 60 50 60 Z'/%3E%3C/g%3E%3C/svg%3E" alt="Rajesh Kumar" />
                    <p className="quote">"StatGrow has transformed how we manage our business. The inventory tracking alone has saved us thousands in lost stock."</p>
                    <div className="author">Rajesh Kumar</div>
                    <div className="author-title">Kumar Electronics, Mumbai</div>
                </div>
                <div className="testimonial-card">
                      <img className="testimonial-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23dbeafe'/%3E%3Cg fill='%233b82f6'%3E%3Ccircle cx='50' cy='35' r='20'/%3E%3Cpath d='M25 30 Q50 10 75 30 L75 45 Q50 25 25 45 Z'/%3E%3Cpath d='M50 60 C25 60 15 95 15 100 L85 100 C85 95 75 60 50 60 Z'/%3E%3C/g%3E%3C/svg%3E" alt="Priya Sharma" />
                    <p className="quote">"The online store feature helped us reach customers across India. Our sales increased by 40% in just 3 months!"</p>
                    <div className="author">Priya Sharma</div>
                    <div className="author-title">Sharma Fashion Boutique, Delhi</div>
                </div>
                <div className="testimonial-card">
                    <img className="testimonial-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23dbeafe'/%3E%3Cg fill='%233b82f6'%3E%3Crect x='30' y='20' width='40' height='30' rx='10'/%3E%3Ccircle cx='50' cy='40' r='15' fill='%23dbeafe'/%3E%3Cpath d='M50 60 C25 60 15 95 15 100 L85 100 C85 95 75 60 50 60 Z'/%3E%3Cpath d='M35 50 Q50 65 65 50 L65 55 Q50 75 35 55 Z'/%3E%3C/g%3E%3C/svg%3E" alt="Ankit Patel" />
                    <p className="quote">"Simple, powerful, and affordable. StatGrow gives us the tools of large corporations at a fraction of the cost."</p>
                    <div className="author">Ankit Patel</div>
                    <div className="author-title">Patel Groceries, Ahmedabad</div>
                </div>
            </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <div className="main-container">
        <section id="faq" className="faq">
          <div className="section-header">
            <h2 className="gradient-text">Frequently Asked Questions</h2>
            <p>Got questions? We've got answers.</p>
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
          <details>
            <summary>Can I upgrade or downgrade my plan later?</summary>
            <p>Yes, you can change your plan at any time based on your business needs.</p>
          </details>
        </section>
      </div>

      {/* --- CTA SECTION --- */}
      <section id="cta" className="cta-section">
        <div className="main-container">
          <h2>Ready to Transform Your Business?</h2>
          <p style={{ marginBottom: '30px', opacity: 0.9 }}>Join thousands of Indian businesses already growing with StatGrow.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <Link to="/register" className="st-btn st-btn-primary">Start for Free</Link>
            <a href="#demo-modal" className="st-btn st-btn-outline-dark">Schedule a Demo</a>
          </div>
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section id="about" className="about-section">
        <div className="main-container">
          <div className="about-grid">
            <div className="about-image-wrapper">
              <div className="about-image">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Cdefs%3E%3ClinearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2360a5fa'/%3E%3Cstop offset='100%25' stop-color='%232563eb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpolyline points='100,220 150,180 200,200 250,120 300,80' fill='none' stroke='url(%23g1)' stroke-width='8' stroke-linecap='round'/%3E%3Ccircle cx='100' cy='220' r='6' fill='%232563eb'/%3E%3Ccircle cx='150' cy='180' r='6' fill='%232563eb'/%3E%3Ccircle cx='200' cy='200' r='6' fill='%232563eb'/%3E%3Ccircle cx='250' cy='120' r='6' fill='%232563eb'/%3E%3Ccircle cx='300' cy='80' r='8' fill='%232563eb'/%3E%3Cg transform='translate(80, 160)'%3E%3Ccircle cx='20' cy='20' r='15' fill='%232563eb'/%3E%3Cpath d='M5 60 Q20 35 35 60 L40 90 L0 90 Z' fill='%2360a5fa'/%3E%3C/g%3E%3Cg transform='translate(280, 120)'%3E%3Ccircle cx='20' cy='20' r='15' fill='%232563eb'/%3E%3Cpath d='M5 60 Q20 35 35 60 L40 90 L0 90 Z' fill='%2360a5fa'/%3E%3C/g%3E%3C/svg%3E" alt="Business Growth Illustration" />
              </div>
            </div>
            <div className="about-text">
              <h2 className="gradient-text">About Us</h2>
              <p style={{ fontSize: '1.1rem', color: '#4b5563', marginBottom: '20px' }}>
                StatGrow was founded with a single mission: to empower India's small and medium businesses with the same powerful tools used by large corporations, but at a price they can afford.
              </p>
              <p style={{ fontSize: '1.1rem', color: '#4b5563' }}>
                We believe technology should be an enabler, not a barrier. That's why we built a platform that handles everything from inventory to online sales.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Main;