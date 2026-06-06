import React, { useState, useEffect, useRef } from 'react';
import '../assets/css/landing.css';
import logoImage from '../assets/images/logo-enterprize.png';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [country, setCountry] = useState('IN');
  const [showCountryDrop, setShowCountryDrop] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  
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

  // Pricing updated to Monthly primary, Yearly secondary
  const pricingData = {
    IN: {
      advMonth: '₹800 / month',
      advYear: '(Billed ₹9,600 yearly)',
      proMonth: '₹1,333 / month',
      proYear: '(Billed ₹16,000 yearly)',
    },
    US: {
      advMonth: '$20 / month',
      advYear: '(Billed $240 yearly)',
      proMonth: '$30 / month',
      proYear: '(Billed $360 yearly)',
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
    },
    {
      q: "Is there a built-in online storefront on all plans?",
      a: "Yes. Every tier includes a public digital store linked directly to your inventory database, ensuring real-time pricing accuracy and zero stock discrepancies."
    },
    {
      q: "Does the platform support Indian GST calculations?",
      a: "Yes. For Indian businesses, the billing engine fully computes GST with proper breakdowns (CGST, SGST, IGST) to streamline your monthly accounting and compliance workflows."
    },
    {
      q: "Can teams access the platform simultaneously?",
      a: "Yes. The platform is fully cloud-hosted and supports secure multi-device access tokens, allowing teams across locations to collaborate on registers and inventory in real time."
    }
  ];

  // Testimonial Data
  const testimonials = [
    {
      name: "Rakesh Dey",
      role: "Retail Store Owner",
      text: "Statgrow has transformed the way we manage inventory and sales. The AI-driven insights help us understand customer trends, and the automated stock alerts ensure we never miss a sales opportunity.",
      img: "https://i.pravatar.cc/150?img=11"
    },
    {
      name: "Riya Patel",
      role: "Jwellery Business Owner",
      text: "The real-time analytics dashboard provides a clear picture of our business performance. Statgrow has helped us make smarter decisions and improve operational efficiency.",
      img: "https://i.pravatar.cc/150?img=5"
    },
    {
      name: "Amit Verma",
      role: "Wholesale Distributor",
      text: "Managing multiple warehouses was challenging before Statgrow. Now, inventory tracking, purchase orders, and billing are all streamlined in one platform. We are extremely satisfied with the results.",
      img: "https://i.pravatar.cc/150?img=8"
    },
    {
      name: "Sneha Desai",
      role: "E-commerce Entrepreneur",
      text: "The integrated digital storefront and cloud inventory synchronization have eliminated inventory mismatches completely. Statgrow has made our online and offline operations work seamlessly together.",
      img: "https://i.pravatar.cc/150?img=44"
    },
    {
      name: "Vikram Singh",
      role: "Supermarket Owner",
      text: "The smart billing engine, GST automation, and customer ledger features have saved us countless hours every month. Statgrow is an essential part of our business today.",
      img: "https://i.pravatar.cc/150?img=33"
    }
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const getFloatClass = (index) => {
    if (index === activeTestimonial) return "testi-avatar-center";
    // Maps the remaining 4 avatars to fixed position classes (pos-1 to pos-4)
    const pos = index > activeTestimonial ? index : index + 1;
    return `testi-avatar-float pos-${pos}`;
  };

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
            <a href="#portfolio" onClick={() => setIsMenuOpen(false)}>Portfolio</a>
            <a href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <a href="#about" onClick={() => setIsMenuOpen(false)}>About</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)}>Contact</a>
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

      {/* AI-DRIVEN ANALYTICS MODULE */}
      <section className="ai-section">
        <div className="ai-inner">
          <div className="ai-content">
            <div className="section-label" style={{background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)', color: 'var(--accent-blue)'}}>Next-Gen Architecture</div>
            <h2 className="section-title">AI-Driven Analytics Module</h2>
            <p className="section-sub" style={{fontSize: '15px'}}>Sift through hundreds of invoice variables automatically. StatGrow Enterprise contextually maps velocity indexes, ensuring you scale ahead of inventory market lags.</p>
            <div className="ai-list">
              <div className="ai-item">
                <div className="ai-bullet"><i className="fa-solid fa-arrow-trend-up"></i></div>
                <div>
                  <h4>Real-Time Insights</h4>
                  <p>Isolate regional scaling trends and surface critical signals instantly from live transaction streams.</p>
                </div>
              </div>
              <div className="ai-item">
                <div className="ai-bullet"><i className="fa-solid fa-fingerprint"></i></div>
                <div>
                  <h4>Consumer Behavior Analysis</h4>
                  <p>Map individual category purchase patterns to optimize product placement and promotions.</p>
                </div>
              </div>
              <div className="ai-item">
                <div className="ai-bullet"><i className="fa-solid fa-hourglass-start"></i></div>
                <div>
                  <h4>Fast-Moving Spot Checks</h4>
                  <p>Automatically identify high-velocity SKUs before stockouts impact your revenue flow.</p>
                </div>
              </div>
              <div className="ai-item">
                <div className="ai-bullet"><i className="fa-solid fa-chart-pie"></i></div>
                <div>
                  <h4>Predictive Cash Modeling</h4>
                  <p>Reduce warehouse friction metrics by up to 20% with forward-looking inventory projection models.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="ai-visual">
            <div className="av-glow"></div>
            <div className="av-header">
              <span className="av-title">Predictive Analytics Engine</span>
              <span className="av-online"><i className="fa-solid fa-circle" style={{fontSize:'7px'}}></i> Live</span>
            </div>
            <div className="av-bar-group">
              <div className="av-bar-row">
                <div className="av-bar-top"><span>Electronics</span><span style={{color: 'var(--accent-green)'}}>↑ 34%</span></div>
                <div className="av-bar-track"><div className="av-bar-fill" style={{width:'82%', background:'linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))'}}></div></div>
              </div>
              <div className="av-bar-row">
                <div className="av-bar-top"><span>Apparel</span><span style={{color: 'var(--accent-green)'}}>↑ 21%</span></div>
                <div className="av-bar-track"><div className="av-bar-fill" style={{width:'60%', background:'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))'}}></div></div>
              </div>
              <div className="av-bar-row">
                <div className="av-bar-top"><span>Groceries</span><span style={{color: 'var(--accent-green)'}}>↑ 18%</span></div>
                <div className="av-bar-track"><div className="av-bar-fill" style={{width:'50%', background:'linear-gradient(90deg, var(--accent-blue), #818cf8)'}}></div></div>
              </div>
              <div className="av-bar-row">
                <div className="av-bar-top"><span>Home Goods</span><span style={{color: 'var(--accent-green)'}}>↑ 9%</span></div>
                <div className="av-bar-track"><div className="av-bar-fill" style={{width:'35%', background:'linear-gradient(90deg, var(--accent-blue), #6366f1)'}}></div></div>
              </div>
              <div className="av-bar-row">
                <div className="av-bar-top"><span>Pharma</span><span style={{color:'#f59e0b'}}>— 3%</span></div>
                <div className="av-bar-track"><div className="av-bar-fill" style={{width:'20%', background:'#f59e0b'}}></div></div>
              </div>
            </div>
            <div className="av-quote">"Turn your everyday transactional data into active optimization paths — StatGrow Enterprise."</div>
          </div>
        </div>
      </section>

      {/* PORTFOLIO & OUTREACH */}
      <section id="portfolio" className="portfolio-section">
        <div className="portfolio-container">
          <div className="features-header">
            <div className="section-label" style={{background:'rgba(139, 92, 246, 0.1)', borderColor:'rgba(139, 92, 246, 0.2)', color:'var(--accent-purple)'}}>Global Footprint</div>
            <h2 className="section-title">Client Outreach & Portfolio</h2>
            <p className="section-sub">Empowering a diverse range of industries across multiple regions.</p>
          </div>

          <div className="outreach-grid">
            {/* Outreach Locations */}
            <div className="outreach-card">
              <h3><i className="fa-solid fa-earth-americas" style={{color: 'var(--accent-blue)'}}></i> Active Regions</h3>
              <p className="outreach-desc">Our platform is actively scaling businesses across major economic hubs.</p>
              
              <div className="region-list">
                <div className="region-item">
                  <span className="region-flag">🇮🇳</span>
                  <div>
                    <h4>India Hubs</h4>
                    <p>Gujarat, Maharashtra, West Bengal, Assam, Tripura</p>
                  </div>
                  <span className="region-pulse"></span>
                </div>
                <div className="region-item">
                  <span className="region-flag">🇺🇸</span>
                  <div>
                    <h4>North America</h4>
                    <p>California, USA</p>
                  </div>
                  <span className="region-pulse"></span>
                </div>
              </div>
            </div>

            {/* Diverse Client Portfolio / Categories */}
            <div className="categories-wrapper">
              <h3 className="cat-title">Supported Business Categories</h3>
              <div className="category-grid">
                <div className="cat-card">
                  <i className="fa-solid fa-industry"></i>
                  <span>Manufacturer</span>
                </div>
                <div className="cat-card">
                  <i className="fa-solid fa-ship"></i>
                  <span>Import & Export</span>
                </div>
                <div className="cat-card">
                  <i className="fa-solid fa-handshake"></i>
                  <span>B2B Wholesaler</span>
                </div>
                <div className="cat-card">
                  <i className="fa-solid fa-cart-shopping"></i>
                  <span>Supermarket</span>
                </div>
                <div className="cat-card">
                  <i className="fa-solid fa-briefcase-medical"></i>
                  <span>Pharmacy</span>
                </div>
                <div className="cat-card">
                  <i className="fa-solid fa-laptop"></i>
                  <span>Electronics</span>
                </div>
                <div className="cat-card">
                  <i className="fa-solid fa-shirt"></i>
                  <span>Clothing</span>
                </div>
                <div className="cat-card">
                  <i className="fa-solid fa-hammer"></i>
                  <span>Hardware</span>
                </div>
                <div className="cat-card">
                  <i className="fa-solid fa-utensils"></i>
                  <span>Restaurant</span>
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
            <div className="plan-tier">{country === 'IN' ? '₹0 / month' : '$0 / month'}</div>
            <div className="plan-tier-sub" style={{color: 'transparent'}}>(Free Forever)</div>
            <p className="plan-trial" style={{margin: '8px 0 16px 0', textAlign: 'left', color: 'var(--accent-blue)'}}>15 Days Free Trial</p>
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
            <div className="plan-tier">{currentPricing.advMonth}</div>
            <div className="plan-tier-sub">{currentPricing.advYear}</div>
            <p className="plan-trial" style={{margin: '8px 0 16px 0', textAlign: 'left', color: 'var(--accent-blue)'}}>15 Days Free Trial Included</p>
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
            <div className="plan-tier">{currentPricing.proMonth}</div>
            <div className="plan-tier-sub">{currentPricing.proYear}</div>
            <p className="plan-trial" style={{margin: '8px 0 16px 0', textAlign: 'left', color: 'var(--accent-blue)'}}>15 Days Free Trial Included</p>
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

      {/* ABOUT US */}
      <section id="about" className="about-section">
        <div className="about-inner">
          <div className="about-text">
            <div className="section-label" style={{background: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-purple)'}}>Our Foundation</div>
            <h2 className="section-title">About StatGrow Enterprise</h2>
            <p>StatGrow Enterprise was founded in 2025 with a clear observation: while large conglomerates had access to powerful multi-million dollar cloud ERP systems, small business owners were still managing manual ledgers and paper records.</p>
            <p>We built StatGrow to serve as a global operational bridge — sophisticated enough to handle deep multi-tenant analytics and forecasting, yet straightforward enough for daily operators to use without specialized cloud training.</p>
            <p><strong>Today, StatGrow Enterprise proudly serves businesses across India, USA, Norway, and Uganda — helping companies transition into fully digitized operations with complete transparency.</strong></p>
          </div>
          <div className="stat-grid">
            <div className="stat-box">
              <div className="stat-number">10+</div>
              <div className="stat-label">Business Formats</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">4</div>
              <div className="stat-label">Active Countries</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">20+</div>
              <div className="stat-label">Metropolitan Nodes</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">100%</div>
              <div className="stat-label">Made in India</div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION (Added before FAQ) */}
      <section className="testimonials-section">
        <div className="testi-container">
          <div className="testi-stage">
            {testimonials.map((testi, i) => (
              <div 
                key={i} 
                className={`testi-avatar-container ${getFloatClass(i)}`}
                onClick={() => setActiveTestimonial(i)}
              >
                <img src={testi.img} alt={testi.name} />
              </div>
            ))}
          </div>
          
          <div className="testi-content">
            <p className="testi-quote">"{testimonials[activeTestimonial].text}"</p>
            <h4 className="testi-name">{testimonials[activeTestimonial].name}</h4>
            <span className="testi-role">{testimonials[activeTestimonial].role}</span>
          </div>

          <div className="testi-dots">
            {testimonials.map((_, i) => (
              <span 
                key={i} 
                className={`testi-dot ${i === activeTestimonial ? 'active' : ''}`} 
                onClick={() => setActiveTestimonial(i)}
              ></span>
            ))}
          </div>
        </div>
      </section>

      {/* ENHANCED FAQ */}
      <section id="faq">
        <div className="faq-wrap">
          <div className="faq-header">
            <div className="section-label" style={{justifyContent:'center', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.2)'}}>Knowledge Base</div>
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