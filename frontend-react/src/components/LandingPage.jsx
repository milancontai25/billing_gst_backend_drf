import React, { useState, useEffect, useRef } from 'react';
import '../assets/css/landing.css';
import logoImage from '../assets/images/logo-enterprize.png';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [country, setCountry] = useState('IN');
  const [showCountryDrop, setShowCountryDrop] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  
  const dropdownRef = useRef(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDrop(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pricingData = {
    IN: {
      advYear: '₹9,600 / Year',
      advMonth: '(₹800/month)',
      proYear: '₹16,000 / Year',
      proMonth: '(₹1,333/month)',
    },
    US: {
      advYear: '$240 / Year',
      advMonth: '($20/month)',
      proYear: '$360 / Year',
      proMonth: '($30/month)',
    },
  };

  const currentPricing = pricingData[country];

  const faqs = [
    {
      q: "What makes StatGrow different from other platforms?",
      a: "StatGrow Enterprise integrates real-time billing, multi-warehouse inventory tracking, automated digital stores, and native AI predictive insights into a single unified cloud database — no stitching separate tools together."
    },
    {
      q: "How does the 15-Day Free Trial work?",
      a: "Every plan comes with a 15-day free trial. You can fully deploy data registers, test billing, and launch store configurations — no upfront payment required. Cancel anytime."
    },
    {
      q: "Is my business data securely isolated?",
      a: "Absolutely. Every deployment uses dedicated database isolation clusters with automated cloud encryption standards. Your business data remains completely private and separate from other tenants."
    },
    {
      q: "Can I use my own custom domain?",
      a: "Yes. Our Advance and Pro packages support full native domain mapping. Present your store and landing page under your own branded domain seamlessly."
    }
  ];

  return (
    <div className="landing-scope">
      {/* TOPBAR */}
      <div className="topbar">
        ✦ Launch Offer: Start with any plan and claim a <span>15-Days Free Trial</span> — zero risk, no credit card required
      </div>

      {/* HEADER */}
      <header>
        <div className="header-inner">
          <a href="#" className="logo">
            <img src={logoImage} alt="EZe EnterPriZe" className="logo-img" />
          </a>
          
          <nav className={isMenuOpen ? 'open' : ''}>
            <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)}>Contact</a>
            <a href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a>
          </nav>

          <div className="header-actions">
            {/* Custom Flag Dropdown (Flag Only) */}
            <div className="custom-country-selector" ref={dropdownRef}>
              <div 
                className="ccs-active" 
                onClick={() => setShowCountryDrop(!showCountryDrop)}
              >
                <span style={{fontSize: '18px', lineHeight: 1}}>{country === 'IN' ? '🇮🇳' : '🇺🇸'}</span>
                <i className={`fa-solid fa-chevron-down ${showCountryDrop ? 'rotate' : ''}`}></i>
              </div>
              
              {showCountryDrop && (
                <div className="ccs-dropdown">
                  <div className="ccs-option" onClick={() => { setCountry('IN'); setShowCountryDrop(false); }}>
                    🇮🇳 India (INR)
                  </div>
                  <div className="ccs-option" onClick={() => { setCountry('US'); setShowCountryDrop(false); }}>
                    🇺🇸 USA (USD)
                  </div>
                </div>
              )}
            </div>

            <a href="/register" className="btn-primary desktop-only">Start Free Trial</a>
            
            <div className="hamburger" onClick={toggleMenu}>
              <span style={isMenuOpen ? { transform: 'rotate(45deg) translate(5px, 5px)' } : {}}></span>
              <span style={isMenuOpen ? { opacity: 0 } : {}}></span>
              <span style={isMenuOpen ? { transform: 'rotate(-45deg) translate(5px, -5px)' } : {}}></span>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-noise"></div>
        <div className="hero-grid"></div>
        <div className="hero-glow-1"></div>
        <div className="hero-glow-2"></div>
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-badge">
              <span className="pulse-dot"></span>
              Global Deployment Architecture Live
            </div>
            <h1>The Most <em>Affordable</em> Enterprise Platform</h1>
            <p>Real-time analytics, automated inventory, retail billing, and professional online storefronts — all in one unified cloud system built for scale.</p>
            <div className="hero-chips">
              <div className="chip"><span className="chip-dot" style={{background: 'var(--accent-blue)'}}></span>AI Trend Engine</div>
              <div className="chip"><span className="chip-dot" style={{background: 'var(--accent-cyan)'}}></span>Cloud Server</div>
              <div className="chip"><span className="chip-dot" style={{background: 'var(--accent-purple)'}}></span>Domain Sync</div>
              <div className="chip"><span className="chip-dot" style={{background: 'var(--accent-green)'}}></span>SSL Secured</div>
            </div>
            <div className="hero-ctas">
              <a href="/register" className="btn-xl">Claim 15-Day Free Trial</a>
              <a href="#features" className="btn-outline">Explore Features</a>
            </div>
          </div>
          
          <div className="hero-right">
            <div className="dashboard-card">
              <div className="dc-bar">
                <div className="dc-dots">
                  <div className="dc-dot" style={{background:'#ff5f57'}}></div>
                  <div className="dc-dot" style={{background:'#febc2e'}}></div>
                  <div className="dc-dot" style={{background:'#28c840'}}></div>
                </div>
                <span className="dc-title">EZe Analytics</span>
                <span className="dc-status"><i className="fa-solid fa-circle" style={{fontSize:'7px'}}></i> ONLINE</span>
              </div>
              <div className="dc-body">
                <div className="metric-row">
                  <div className="metric-box">
                    <div className="metric-label">Revenue</div>
                    <div className="metric-value">₹4.2L</div>
                    <div className="metric-delta">↑ 18.4%</div>
                  </div>
                  <div className="metric-box">
                    <div className="metric-label">Orders</div>
                    <div className="metric-value up">1,284</div>
                    <div className="metric-delta">↑ 9.1%</div>
                  </div>
                  <div className="metric-box">
                    <div className="metric-label">Stock</div>
                    <div className="metric-value">94%</div>
                    <div className="metric-delta" style={{color:'#f59e0b'}}>— 2.0%</div>
                  </div>
                </div>
                <div className="chart-area">
                  <div className="bar" style={{height:'30%', background:'rgba(59, 130, 246, 0.2)'}}></div>
                  <div className="bar" style={{height:'50%', background:'rgba(59, 130, 246, 0.3)'}}></div>
                  <div className="bar" style={{height:'40%', background:'rgba(59, 130, 246, 0.2)'}}></div>
                  <div className="bar" style={{height:'65%', background:'rgba(59, 130, 246, 0.4)'}}></div>
                  <div className="bar" style={{height:'55%', background:'rgba(59, 130, 246, 0.3)'}}></div>
                  <div className="bar" style={{height:'80%', background:'rgba(59, 130, 246, 0.5)'}}></div>
                  <div className="bar" style={{height:'70%', background:'rgba(59, 130, 246, 0.4)'}}></div>
                  <div className="bar" style={{height:'100%', background:'linear-gradient(to top, #3b82f6, #06b6d4)'}}></div>
                </div>
                <div className="alert-box">
                  <span className="alert-icon"><i className="fa-solid fa-bolt"></i></span>
                  <div className="alert-text">
                    <strong>AI Alert: Stock Restructuring Triggered</strong>
                    Predictive velocity model recommends reorder for 3 SKUs
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features">
        <div className="features-header">
          <div className="section-label" style={{background:'rgba(6, 182, 212, 0.1)', borderColor:'rgba(6, 182, 212, 0.2)', color:'var(--accent-cyan)'}}>Platform Capabilities</div>
          <h2 className="section-title">Everything Your Business Needs</h2>
          <p className="section-sub">Powerful architecture. Intuitive experience. Built for operators at every scale.</p>
        </div>
        <div className="features-grid">
          <div className="feature-cell">
            <div className="feature-icon"><i className="fa-solid fa-chart-line"></i></div>
            <div className="feature-title">Business Analytics</div>
            <p className="feature-desc">Map operational indices over sleek visual trend monitors with real-time data streaming and customizable dashboards.</p>
          </div>
          <div className="feature-cell accent-cell">
            <div className="feature-icon"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
            <div className="feature-title" style={{color: 'var(--accent-blue)'}}>AI-Driven Insights</div>
            <p className="feature-desc">Isolate consumer behavior, track seasonal demands, and receive auto-generated inventory restructuring alerts instantly.</p>
            <span className="feature-tag">Core AI</span>
          </div>
          <div className="feature-cell">
            <div className="feature-icon"><i className="fa-solid fa-cubes"></i></div>
            <div className="feature-title">Inventory Management</div>
            <p className="feature-desc">Track multi-warehouse counts, automate supplier purchase orders, and configure smart low-stock warning thresholds.</p>
          </div>
          <div className="feature-cell">
            <div className="feature-icon"><i className="fa-solid fa-id-card-clip"></i></div>
            <div className="feature-title">Customer Ledgers</div>
            <p className="feature-desc">Maintain detailed contact logs, manage seasonal profiles, and study individual transaction velocity parameters cleanly.</p>
          </div>
          <div className="feature-cell">
            <div className="feature-icon"><i className="fa-solid fa-file-invoice-dollar"></i></div>
            <div className="feature-title">Smart Billing Engine</div>
            <p className="feature-desc">Issue stylized retail receipts instantly with built-in GST computation and multi-device fiscal summary exports.</p>
          </div>
          <div className="feature-cell">
            <div className="feature-icon"><i className="fa-solid fa-store"></i></div>
            <div className="feature-title">Digital Storefront</div>
            <p className="feature-desc">Deploy a consumer e-commerce portal natively connected to your cloud inventory database with zero pricing gaps.</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing">
        <div className="pricing-header">
          <div className="section-label">Transparent Pricing</div>
          <h2 className="section-title">Choose Your Framework</h2>
          <p className="section-sub">Every tier starts with a 15-day free trial. No contracts. No surprises.</p>
        </div>
        <div className="pricing-grid">

          {/* Basic */}
          <div className="plan-card">
            <div className="plan-name">Basic Plan</div>
            <div className="plan-tier">{country === 'IN' ? '₹0' : '$0'}</div>
            <p className="plan-trial" style={{margin: '0 0 8px 0', textAlign: 'left', color: 'var(--accent-blue)'}}>15 Days Free Trial</p>
            <div className="plan-desc">Perfect for shops looking to fully digitize physical ledger and retail operations risk-free.</div>
            <ul className="plan-features">
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>EnterPriZe Core App:</strong> Access unified central management dashboard.</li>
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>Secure Isolated Hosting:</strong> Data completely segregated on secure cloud.</li>
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>Central Online Store:</strong> Instantly launch a public digital storefront.</li>
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>Order Management:</strong> Track, process, and update digital orders natively.</li>
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>Customer Management:</strong> Unified business profiles and contact records.</li>
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>Real-time Retail Billing:</strong> Instant digital receipts with precise GST.</li>
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>Base Inventory Metrics:</strong> Track multi-warehouse stock counts cleanly.</li>
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>Standard Business Reports:</strong> Access core operational logs and basic sales summaries.</li>
              <li className="highlight"><i className="fa-solid fa-circle-check check-icon"></i><strong>24/7 Priority SLA:</strong> Direct-line engineering access.</li>
            </ul>
            <a href="/register" className="plan-cta dark">Start Free Trial</a>
          </div>

          {/* Advanced (Featured) */}
          <div className="plan-card featured">
            <div className="plan-badge">Best Value</div>
            <div className="plan-name">Advance Plan</div>
            <div className="plan-tier">{currentPricing.advYear}</div>
            <p className="plan-trial" style={{margin: '0 0 8px 0', textAlign: 'left', color: 'var(--accent-blue)'}}>{currentPricing.advMonth}</p>
            <div className="plan-desc">For growing companies ready to secure their operational footprint for an entire year.</div>
            <ul className="plan-features">
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>EnterPriZe Core App:</strong> Access unified central management dashboard.</li>
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>Secure Isolated Hosting:</strong> Data completely segregated on secure cloud.</li>
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>Central Online Store:</strong> Instantly launch a public digital storefront.</li>
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>Order Management:</strong> Track, process, and update digital orders natively.</li>
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>Customer Management:</strong> Unified business profiles and contact records.</li>
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>Real-time Retail Billing:</strong> Instant digital receipts with precise GST.</li>
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>Base Inventory Metrics:</strong> Track multi-warehouse stock counts cleanly.</li>
              <li><i className="fa-solid fa-circle-check check-icon"></i><strong>Standard Business Reports:</strong> Access core operational logs and basic sales summaries.</li>
              <li className="highlight"><i className="fa-solid fa-circle-check check-icon"></i><strong>24/7 Priority SLA:</strong> Direct-line engineering access.</li>
            </ul>
            <a href="/register" className="plan-cta accent">Upgrade to Advance</a>
          </div>

          {/* Pro */}
          <div className="plan-card">
            <div className="plan-name">Pro Plan</div>
            <div className="plan-tier">{currentPricing.proYear}</div>
            <p className="plan-trial" style={{margin: '0 0 8px 0', textAlign: 'left', color: 'var(--accent-blue)'}}>{currentPricing.proMonth}</p>
            <div className="plan-desc">The ultimate white-label cloud configuration featuring complete custom domain authority.</div>
            <ul className="plan-features">
              <li style={{color:'var(--text-muted)', fontSize:'11px', fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase'}}>Includes All Advance Features, Plus:</li>
              <li className="highlight"><i className="fa-solid fa-circle-check check-icon"></i><strong>Custom Landing Page:</strong> A tailored, high-converting landing page built entirely around your brand identity.</li>
              <li className="highlight"><i className="fa-solid fa-circle-check check-icon"></i><strong>Seamless E-Commerce Integration:</strong> Turn traffic into revenue by embedding a functional online store.</li>
              <li className="highlight"><i className="fa-solid fa-circle-check check-icon"></i><strong>24/7 Priority SLA:</strong> Direct-line engineering access for zero business operational downtime.</li>
            </ul>
            <a href="/register" className="plan-cta dark">Go Pro Enterprise</a>
          </div>

        </div>
      </section>

      {/* CONTACT US */}
      <section id="contact" className="contact-section">
        <div className="contact-container">
          <div className="contact-header-center">
            <span className="section-label" style={{background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)', color: 'var(--accent-blue)'}}>CONTACT</span>
            <h2 className="section-title">Get In Touch</h2>
            <p className="section-sub">Questions or want a live demo? We reply within a few hours.</p>
          </div>
          
          <div className="contact-grid">
            {/* Left Column */}
            <div className="contact-left">
              <h3>Let's grow your business together</h3>
              <p className="contact-left-sub">Whether you're a single store or a growing chain, our team is ready to help you get started.</p>
              
              <div className="contact-info-blocks">
                <div className="info-block" style={{borderLeftColor: 'var(--accent-blue)'}}>
                  <span className="info-label">EMAIL</span>
                  <span className="info-value">statgrowinfo@gmail.com</span>
                </div>
                <div className="info-block" style={{borderLeftColor: 'var(--accent-green)'}}>
                  <span className="info-label">WHATSAPP</span>
                  <span className="info-value">+91 77191 12315</span>
                </div>
                <div className="info-block" style={{borderLeftColor: 'var(--accent-purple)'}}>
                  <span className="info-label">PHONE</span>
                  <span className="info-value" style={{fontSize: '13px'}}>+91 747 767 3060<br/>+91 77191 12315</span>
                </div>
                <div className="info-block" style={{borderLeftColor: 'var(--accent-cyan)'}}>
                  <span className="info-label">SUPPORT</span>
                  <span className="info-value">24/7 — Always Online</span>
                </div>
              </div>

              <div className="contact-action-btns">
                <a href="https://wa.me/917719112315" className="btn-whatsapp" target="_blank" rel="noopener noreferrer">
                  <i className="fa-brands fa-whatsapp"></i> Chat on WhatsApp
                </a>
                <a href="tel:+917477673060" className="btn-callus">
                  <i className="fa-solid fa-phone"></i> Call Us
                </a>
              </div>

              <div className="contact-trust-marks">
                <span><i className="fa-solid fa-circle-check"></i> Free consultation</span>
                <span><i className="fa-solid fa-circle-check"></i> No commitment</span>
                <span><i className="fa-solid fa-circle-check"></i> Quick reply</span>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="contact-right">
              <div className="contact-form-card">
                <h3>Send us a message</h3>
                <p className="form-sub">Fill the form below and we'll reach out shortly.</p>
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Your Name</label>
                      <input type="text" placeholder="John Doe" />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input type="text" placeholder="+91 xxxxxxxxxx" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" placeholder="john@example.com" />
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea placeholder="Tell us about your business..." rows="4"></textarea>
                  </div>
                  <button type="submit" className="btn-submit">
                    Send Message &rarr;
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENHANCED FAQ */}
      <section id="faq">
        <div className="faq-wrap">
          <div className="faq-header">
            <div className="section-label" style={{justifyContent:'center', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)', borderColor: 'rgba(139, 92, 246, 0.2)'}}>Knowledge Base</div>
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-sub">Everything you need to know about deploying EZe EnterPriZe.</p>
          </div>

          <div id="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-item ${openFaq === index ? 'open' : ''}`}>
                <button className="faq-question" onClick={() => toggleFaq(index)}>
                  {faq.q}
                  <span className="faq-chevron"><i className="fa-solid fa-chevron-down"></i></span>
                </button>
                <div className="faq-ans">
                  <div className="faq-ans-inner">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA STRIP (Pre-Footer) */}
      <div className="cta-section">
        <div className="cta-glow"></div>
        <div className="cta-inner">
          <h2>Ready to Modernize Your Operations?</h2>
          <p>Join thousands of growing businesses managing their channels with ease via the EZe EnterPriZe Platform.</p>
          <div className="cta-btns">
            <a href="/register" className="btn-xl" style={{background: '#fff', color: 'var(--accent-blue)'}}>Start Free Trial</a>
            <a href="https://wa.me/917719112315" className="btn-whatsapp-cta" target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-whatsapp"></i> Chat on WhatsApp
            </a>
          </div>
          <p className="cta-note">No contracts · No hidden fees · Cancel anytime</p>
        </div>
      </div>

      {/* MATCHING FOOTER */}
      <footer>
        <div className="footer-inner">
          <div className="footer-top">
            
            {/* Column 1: Brand & Socials */}
            <div className="footer-brand">
              <a href="#" className="footer-logo-link">
                <img src={logoImage} alt="EZe EnterPriZe" className="footer-logo-img" />
              </a>
              <p className="footer-desc">Delivering powerful cloud operations and analytics modules designed to transform modern retail businesses globally.</p>
              
              <div className="footer-socials">
                <a href="https://whatsapp.com/channel/0029VbBhada0rGiSzA4cbs2J" target="_blank" rel="noopener noreferrer" className="soc-wa" aria-label="WhatsApp"><i className="fa-brands fa-whatsapp"></i></a>
                <a href="https://www.facebook.com/share/19YTCJS1PB/" target="_blank" rel="noopener noreferrer" className="soc-fb" aria-label="Facebook"><i className="fa-brands fa-facebook-f"></i></a>
                <a href="https://www.instagram.com/statgrowinfo/" target="_blank" rel="noopener noreferrer" className="soc-ig" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
                <a href="https://www.linkedin.com/in/statgrow/" target="_blank" rel="noopener noreferrer" className="soc-li" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a>
                <a href="https://www.youtube.com/@StatGrow" target="_blank" rel="noopener noreferrer" className="soc-yt" aria-label="YouTube"><i className="fa-brands fa-youtube"></i></a>
              </div>
            </div>
            
            {/* Column 2: Platform */}
            <div className="footer-col">
              <h4>PLATFORM</h4>
              <a href="#features">Feature Matrix</a>
              <a href="#pricing">Pricing Tiers</a>
              <a href="#about">About Us</a>
            </div>
            
            {/* Column 3: Support */}
            <div className="footer-col">
              <h4>SUPPORT</h4>
              <a href="#faq">FAQ Guide</a>
              <a href="#contact">Contact Us</a>
            </div>
            
            {/* Column 4: Contact */}
            <div className="footer-col contact-col">
              <h4>CONTACT</h4>
              <div className="footer-contact-item">
                <i className="fa-solid fa-envelope"></i> 
                <span>statgrowinfo@gmail.com</span>
              </div>
              <div className="footer-contact-item">
                <i className="fa-solid fa-phone"></i> 
                <span>+91 747 767 3060</span>
              </div>
              <div className="footer-contact-item">
                <i className="fa-brands fa-whatsapp"></i> 
                <span>+91 77191 12315</span>
              </div>
            </div>

          </div>

          <div className="footer-bottom">
            <p>© 2026 EZe EnterPriZe By StatGrow. All rights reserved.</p>
            <div className="footer-bottom-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;