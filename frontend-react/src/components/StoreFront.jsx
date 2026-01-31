import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { useParams, Link } from 'react-router-dom'; 
import { ShoppingCart, Search, Store, User, Settings, LogOut, Package, ChevronDown, Loader2, Facebook, Instagram, Youtube, Twitter, Mail, Phone, ChevronRight, ChevronLeft } from 'lucide-react';

import AuthCustomer from './AuthCustomer';
import CartDrawer from './CartDrawer';
import customerApi from '../api/customerAxios';
import '../assets/css/storefront.css'; 

const StoreFront = () => {
  const { slug } = useParams();
  
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Business Info
  const [businessName, setBusinessName] = useState('');
  const [businessLogo, setBusinessLogo] = useState('');
  const [banners, setBanners] = useState([]); // Array of valid banner URLs
  const [socialLinks, setSocialLinks] = useState({});
  const [contactInfo, setContactInfo] = useState({});
  
  // UI State
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAuthCustomer, setShowAuthCustomer] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const toTitleCase = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  
  const categories = ['All', ...new Set(products
      .map(p => p.category)
      .filter(c => c)
      .map(c => toTitleCase(c))
  )];

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  const PRODUCT_API_URL = `${API_BASE_URL}/api/v1/business/${slug}/items/`;

  // --- HELPERS ---
  const formatUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const filename = path.split(/[/\\]/).pop();
    return `${API_BASE_URL}/media/business_logo/${filename}`; // Adjust if banners are in a different folder
  };

  // Helper for Banner specifically (sometimes banners are in different media folder, assuming same for now or full URL)
  const formatBannerUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const filename = path.split(/[/\\]/).pop();
    // Assuming banners might be in a general media folder or specific one. 
    // If backend returns full URL for banners, this isn't needed. 
    // If it returns local path, we assume /media/ root or specific bucket.
    return `${API_BASE_URL}/media/${filename}`; 
  };

  useEffect(() => {
    checkLoginStatus();
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(PRODUCT_API_URL);
        const productList = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setProducts(productList);
        
        if (productList.length > 0) {
             const biz = productList[0].business;
             setBusinessName(biz.business_name);
             setBusinessLogo(formatUrl(biz.logo_bucket_url));
             
             // Extract Banners
             const activeBanners = [];
             if (biz.banner_1_url) activeBanners.push(biz.banner_1_url); // Use formatBannerUrl if needed
             if (biz.banner_2_url) activeBanners.push(biz.banner_2_url);
             if (biz.banner_3_url) activeBanners.push(biz.banner_3_url);
             setBanners(activeBanners);

             // Extract Socials & Contact
             setSocialLinks({
                facebook: biz.facebook_url,
                instagram: biz.instagram_url,
                youtube: biz.youtube_url,
                twitter: biz.x_url
             });
             setContactInfo({
                 email: `contact@${biz.slug}.com`, // Fallback or real data
                 phone: '+91-9876543210'           // Fallback or real data
             });

        } else {
             const formattedSlug = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
             setBusinessName(formattedSlug);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setBusinessName("Store Not Found");
        setLoading(false);
      }
    };
    fetchStoreData();
  }, [slug]);

  // --- BANNER AUTO SLIDE ---
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000); // Change every 5 seconds
      return () => clearInterval(interval);
    }
  }, [banners]);

  // --- AUTH & CART HANDLERS (Same as before) ---
  const checkLoginStatus = () => {
    const token = localStorage.getItem('customer_token');
    const name = localStorage.getItem('customer_name');
    if (token) { setIsLoggedIn(true); setUser({ name: name || 'User' }); }
    else { setIsLoggedIn(false); setUser(null); }
  };

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_name');
    localStorage.removeItem('customer_refresh');
    setIsLoggedIn(false); setUser(null); setIsDropdownOpen(false);
  };

  const handleAddToCart = async (productId) => {
    if (!isLoggedIn) { alert("Please Login to shop!"); setShowAuthCustomer(true); return; }
    try {
        await customerApi.post(`customer/cart/add/`, { item: productId, quantity: 1 });
        setIsCartOpen(true);
    } catch (err) { console.error(err); alert("Failed to add item to cart."); }
  };

  const filteredProducts = products.filter(p => {
    const pName = p.item_name ? p.item_name.toLowerCase() : "";
    const rawCat = p.category ? p.category.toLowerCase() : ""; // For Search
    const displayCat = p.category ? toTitleCase(p.category) : ""; // For Filter button match

    const search = searchTerm.toLowerCase();
    
    const matchesSearch = pName.includes(search) || rawCat.includes(search);
    const matchesCategory = selectedCategory === 'All' ? true : displayCat === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  
  const getStockBadge = (qty, minStock) => {
    if (qty <= 0) return <span className="stock-badge out">Out of Stock</span>;
    if (qty <= minStock) return <span className="stock-badge low">Low Stock</span>;
    return null;
  };

  if (loading) return <div className="loading-container"><Loader2 size={40} className="animate-spin" /><p>Loading...</p></div>;

  return (
    <div className="store-body">
      
      {/* --- HEADER --- */}
      <header className="store-header">
        <div className="header-content">
          <Link to={`/${slug}`} className="brand-section">
            <div className="brand-logo-box">
              {businessLogo ? <img src={businessLogo} className="brand-logo-img" alt="logo" /> : <Store size={22} />}
            </div>
            {/* Split name if long for styling (Handled in CSS) */}
            <h1 className="brand-name">{businessName}</h1>
          </Link>
          
          <div className="search-container">
            <input type="text" className="search-input" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Search size={18} className="search-icon" />
          </div>

          <div className="header-actions">
            {isLoggedIn ? (
                <div className="user-info-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                    <div className="user-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
                    {isDropdownOpen && (
                        <div className="profile-dropdown">
                            <div className="dropdown-header">Hello, {user?.name}</div>
                            <Link to={`/${slug}/orders`} className="dropdown-item"><Package size={16} /> My Orders</Link>
                            <div className="dropdown-item"><User size={16} /> Profile</div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item text-red" onClick={handleLogout}><LogOut size={16} /> Logout</div>
                        </div>
                    )}
                </div>
            ) : (
                <button className="login-link-btn" onClick={() => setShowAuthCustomer(true)}>Login / Sign Up</button>
            )}
            <button className="cart-btn" onClick={() => setIsCartOpen(true)}><ShoppingCart size={20} /></button>
          </div>
        </div>
      </header>

      {/* --- DYNAMIC HERO SECTION --- */}
      <div className="hero-wrapper">
          {banners.length > 0 ? (
            <div className="hero-slider">
                {banners.map((banner, index) => (
                    <div 
                        key={index} 
                        className={`hero-slide ${index === currentBannerIndex ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${banner})` }}
                    >
                         {/* Optional: Add text overlay if needed, currently just image as per request */}
                    </div>
                ))}
                
                {/* Slider Dots (Only if > 1 banner) */}
                {banners.length > 1 && (
                    <div className="slider-dots">
                        {banners.map((_, idx) => (
                            <span 
                                key={idx} 
                                className={`dot ${idx === currentBannerIndex ? 'active' : ''}`}
                                onClick={() => setCurrentBannerIndex(idx)}
                            ></span>
                        ))}
                    </div>
                )}
            </div>
          ) : (
             // FALLBACK: Solid Blue Gradient
             <div className="store-hero-fallback">
                 <div className="hero-content">
                     <h1>Welcome to <br/><span>{businessName}</span></h1>
                     <p>Quality products, honest savings. Delivered to your door.</p>
                 </div>
             </div>
          )}
      </div>

      {/* --- CATEGORY BAR --- */}
      <div className="category-bar-wrapper">
        <div className="category-list">
            {categories.map((cat) => (
            <button key={cat} className={`category-chip ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
            ))}
        </div>
      </div>

      {/* --- PRODUCT GRID --- */}
      <main className="store-main">
        <h2 className="section-title">{selectedCategory === 'All' ? 'All Products' : selectedCategory}</h2>
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <h3>No products found</h3>
            <p>Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => {
              const isOutOfStock = product.quantity_product <= 0;
              const mrp = parseFloat(product.mrp_baseprice);
              const sellingPrice = parseFloat(product.gross_amount); // Assuming gross_amount is the selling price
              const hasDiscount = mrp > sellingPrice;
              const discountPercent = hasDiscount ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

              return (
                <div key={product.id} className="product-card">
                  {/* ... (Image Box remains same) ... */}
                  <div className="product-image-box">
                      {getStockBadge(product.quantity_product, product.min_stock_product)}
                      {product.item_image_url ? (
                      <img src={product.item_image_url} alt={product.item_name} className={`product-img ${isOutOfStock ? 'grayscale' : ''}`} />
                      ) : ( <span className="placeholder-img">{product.item_name.charAt(0)}</span> )}
                  </div>
                  
                  <div className="product-details">
                    <div className="product-cat">{product.category}</div>
                    <h3 className="product-name" title={product.item_name}>{product.item_name}</h3>
                    
                    {/* --- NEW PRICE SECTION --- */}
                    <div className="price-row">
                      {hasDiscount && (
                          <span className="price-mrp">₹{mrp}</span>
                      )}
                      <span className="price-selling">₹{sellingPrice}</span>
                      
                      {hasDiscount && discountPercent > 0 && (
                          <span className="discount-tag">{discountPercent}% OFF</span>
                      )}
                    </div>

                    <div className="product-actions">
                      <button 
                          className={`add-btn ${isOutOfStock ? 'disabled' : ''}`} 
                          disabled={isOutOfStock}
                          onClick={() => handleAddToCart(product.id)}
                      >
                          {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              );

            })}
          </div>
        )}
      </main>

      {/* --- PROFESSIONAL FOOTER --- */}
      <footer className="modern-footer">
         <div className="footer-content">
            
            {/* Column 1: Brand */}
            <div className="footer-col brand-col">
               <div className="footer-brand">
                  <div className="brand-logo-box">
                    {businessLogo ? <img src={businessLogo} className="brand-logo-img" alt="logo" /> : <Store size={22} />}
                  </div>
                  <span className="footer-brand-name">{businessName}</span>
               </div>
               <div className="social-links">
                  {socialLinks.instagram && <a href={socialLinks.instagram} target="_blank" rel="noreferrer"><Instagram size={20} /></a>}
                  {socialLinks.facebook && <a href={socialLinks.facebook} target="_blank" rel="noreferrer"><Facebook size={20} /></a>}
                  {socialLinks.youtube && <a href={socialLinks.youtube} target="_blank" rel="noreferrer"><Youtube size={20} /></a>}
                  {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noreferrer"><Twitter size={20} /></a>}
               </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="footer-col">
               <h4>Quick Links</h4>
               <ul>
                  <li><Link to={`/${slug}`}>Home</Link></li>
                  <li><a href="#">Shop Now</a></li>
                  <li><a href="#">Top Reads</a></li>
                  <li><a href="#">Refund Policy</a></li>
                  <li><Link to={`/${slug}/orders`}>Track Your Order</Link></li>
               </ul>
            </div>

            {/* Column 3: About */}
            <div className="footer-col">
               <h4>About</h4>
               <ul>
                  <li><a href="#">Our Story</a></li>
                  <li><a href="#">Our Impact</a></li>
                  <li><a href="#">Help Center</a></li>
                  <li><a href="#">Terms of Service</a></li>
                  <li><a href="#">Privacy Policy</a></li>
               </ul>
            </div>

            {/* Column 4: Contact */}
            <div className="footer-col contact-col">
               <h4>Contact Us</h4>
               <p><Mail size={16} /> {contactInfo.email || 'contact@store.com'}</p>
               <p><Phone size={16} /> {contactInfo.phone || '+91-0000000000'}</p>
            </div>
         </div>
         
         <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} {businessName}. All rights reserved.</p>
            <p>Powered by StatGrow</p>
         </div>
      </footer>

      {/* Modals */}
      <AuthCustomer isOpen={showAuthCustomer} onClose={() => setShowAuthCustomer(false)} onLoginSuccess={checkLoginStatus} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} slug={slug} />
    </div>
  );
};

export default StoreFront;


