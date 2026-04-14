import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { useParams, Link, useNavigate } from 'react-router-dom'; 
import { Loader2, ArrowRight } from 'lucide-react';
import StoreHeader from './StoreHeader';
import StoreFooter from './StoreFooter';
import AuthCustomer from './AuthCustomer';
import CartDrawer from './CartDrawer';
import customerApi from '../api/customerAxios';
import '../assets/css/storecategory.css'; 

const StoreCategory = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [summaryData, setSummaryData] = useState({
    categories: [],
    best_selling: [],
    trending: []
  });
  const [loading, setLoading] = useState(true);
  
  // Dynamic Header Menu Toggles
  const [hasProducts, setHasProducts] = useState(true); 
  const [hasServices, setHasServices] = useState(false);
  
  // Business Info
  const [businessName, setBusinessName] = useState('');
  const [businessLogo, setBusinessLogo] = useState('');
  const [banners, setBanners] = useState([]);
  const [socialLinks, setSocialLinks] = useState({});
  const [contactInfo, setContactInfo] = useState({});
  
  // UI State
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAuthCustomer, setShowAuthCustomer] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  const SUMMARY_API_URL = `${API_BASE_URL}/api/v1/business/${slug}/items/summary/`;

  // --- HELPERS ---
  const formatUrl = (path) => {
    if (!path) return null;
    const filename = path.split(/[/\\]/).pop();
    return `${API_BASE_URL}/media/business_logo/${filename}`; 
  };

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // 1. Fetch Summary Data
  useEffect(() => {
    checkLoginStatus();
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(SUMMARY_API_URL);
        const data = res.data;
        
        setSummaryData({
            categories: data.categories || [],
            best_selling: data.best_selling || [],
            trending: data.trending || []
        });

        // --- SMART MENU DETECTION FOR CATEGORY PAGE ---
        // Scan the returned summary items to see if any are services
        const allSummaryItems = [...(data.best_selling || []), ...(data.trending || [])];
        const foundServices = allSummaryItems.some(p => p.item_type && p.item_type.toLowerCase() === 'service');
        const foundGoods = allSummaryItems.some(p => !p.item_type || p.item_type.toLowerCase() === 'goods' || p.item_type.toLowerCase() === 'products');
        
        setHasServices(foundServices);
        setHasProducts(allSummaryItems.length === 0 ? true : foundGoods); // Default to true if empty
        
        // FOOLPROOF BUSINESS EXTRACTION
        const biz = data.business || data.best_selling?.[0]?.business || data.trending?.[0]?.business;
        
        if (biz) {
            setBusinessName(biz.business_name || slug.toUpperCase());
            setBusinessLogo(formatUrl(biz.logo_bucket_url));
            
            const activeBanners = [];
            if (biz.banner_1_url) activeBanners.push(biz.banner_1_url);
            if (biz.banner_2_url) activeBanners.push(biz.banner_2_url);
            if (biz.banner_3_url) activeBanners.push(biz.banner_3_url);
            setBanners(activeBanners);

            setSocialLinks({
                facebook: biz.facebook_url,
                instagram: biz.instagram_url,
                youtube: biz.youtube_url,
                twitter: biz.x_url || biz.twitter_url
            });
            setContactInfo({
                email: biz.user?.email || biz.email || `contact@${slug}.com`, 
                phone: biz.user?.phone || biz.phone ? `+91 ${biz.user?.phone || biz.phone}` : ''
            });
        } else {
            setBusinessName(toTitleCase(slug.replace('-', ' ')));
        }
        
        setLoading(false);
      } catch (err) {
        console.error("API Fetch Error:", err);
        setBusinessName("Store Not Found");
        setLoading(false);
      }
    };
    fetchStoreData();
  }, [slug]);


  useEffect(() => {
     if (searchTerm && searchTerm.trim() !== '') {
         // Pass the search term in the URL!
         navigate(`/${slug}/items?search=${encodeURIComponent(searchTerm)}`); 
     }
  }, [searchTerm, navigate, slug]);

  
  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000); 
      return () => clearInterval(interval);
    }
  }, [banners]);

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

  const handleAddToCart = async (productId, e) => {
    e.preventDefault(); 
    if (!isLoggedIn) { alert("Please Login to shop!"); setShowAuthCustomer(true); return; }
    try {
        await customerApi.post(`customer/cart/add/`, { item: productId, quantity: 1 });
        setIsCartOpen(true);
    } catch (err) { console.error(err); alert("Failed to add item to cart."); }
  };

  // --- ELEGANT PRODUCT CARD RENDERER ---
  const renderProductCard = (product, badgeLabel = null) => {
    const isOutOfStock = product.quantity_product <= 0;
    const mrp = parseFloat(product.mrp_baseprice || 0);
    const sellingPrice = parseFloat(product.gross_amount || 0);
    const hasDiscount = mrp > sellingPrice;
    const currency = product.currency_symbol || '₹'; 
    
    // Calculate percentage off
    const discountPercent = hasDiscount ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

    return (
      <div key={product.id} className="elegant-product-card">
        <Link to={`/${slug}/item/${product.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="elegant-image-box">
                {badgeLabel && !isOutOfStock && <div className="elegant-badge">{badgeLabel}</div>}
                {isOutOfStock && <div className="elegant-badge out-of-stock">SOLD OUT</div>}

                {product.item_image_url ? (
                    <img src={product.item_image_url} alt={product.item_name} className={`elegant-product-img ${isOutOfStock ? 'grayscale' : ''}`} />
                ) : ( 
                    <div className="elegant-placeholder-img">{product.item_name.charAt(0)}</div> 
                )}
                
                <div className="elegant-add-overlay">
                    <button 
                        className="elegant-add-btn" 
                        disabled={isOutOfStock} 
                        onClick={(e) => handleAddToCart(product.id, e)}
                    >
                        {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
                    </button>
                </div>
            </div>
            
            <div className="elegant-details">
                <h3 className="elegant-title" title={product.item_name}>{product.item_name}</h3>
                
                <div className="elegant-price-row">
                    <span className="elegant-price">{currency}{sellingPrice}</span>
                    {hasDiscount && (
                        <>
                            <span className="elegant-mrp">{currency}{mrp}</span>
                            <span className="elegant-discount-text">{discountPercent}% off</span>
                        </>
                    )}
                </div>
                
            </div>
        </Link>
      </div>
    );
  };

  if (loading) return <div className="loading-container"><Loader2 size={40} className="animate-spin" /><p>Loading...</p></div>;

  return (
    <div className="store-body elegant-theme">
      
      <StoreHeader 
        slug={slug}
        businessName={businessName}
        businessLogo={businessLogo}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isLoggedIn={isLoggedIn}
        user={user}
        onLoginClick={() => setShowAuthCustomer(true)}
        onLogoutClick={handleLogout}
        onCartClick={() => setIsCartOpen(true)}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
        /* PASSING NEW PROPS HERE */
        hasProducts={hasProducts}
        hasServices={hasServices}
      />

      {/* HERO SECTION */}
      <div className="hero-wrapper">
          {banners.length > 0 ? (
            <div className="hero-slider">
                {banners.map((banner, index) => (
                    <div key={index} className={`hero-slide ${index === currentBannerIndex ? 'active' : ''}`} style={{ backgroundImage: `url(${banner})` }}></div>
                ))}
                {banners.length > 1 && (
                    <div className="slider-dots">
                        {banners.map((_, idx) => (
                            <span key={idx} className={`dot ${idx === currentBannerIndex ? 'active' : ''}`} onClick={() => setCurrentBannerIndex(idx)}></span>
                        ))}
                    </div>
                )}
            </div>
          ) : (
             <div className="store-hero-fallback">
                 <div className="hero-content">
                     <h1>Welcome to <br/><span>{businessName}</span></h1>
                     <p>Quality products, honest savings. Delivered to your door.</p>
                 </div>
             </div>
          )}
      </div>

      {/* --- 1. CATEGORY SECTION (CREAM BACKGROUND) --- */}
      {summaryData.categories.length > 0 && (
          <section className="elegant-section section-cream">
            <div className="elegant-main-wrapper">
                <div className="elegant-section-header">
                    <span className="elegant-overline">EXPLORE</span>
                    <h2 className="elegant-serif-title">Shop by Category</h2>
                </div>
                
                <div className="category-blocks-grid">
                    {summaryData.categories.map((cat, idx) => (
                        <Link 
                            to={`/${slug}/items#${encodeURIComponent(cat.category)}`}
                            key={idx} 
                            className="cat-block"
                        >
                            {cat.category_image_url ? (
                                <img src={cat.category_image_url} alt={cat.category} className="cat-block-img" />
                            ) : (
                                <div className="cat-block-placeholder"></div>
                            )}
                            <div className="cat-block-overlay">
                                <h3 className="cat-block-title">{cat.category}</h3>
                                <span className="cat-block-link">Explore <ArrowRight size={14}/></span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
          </section>
      )}

      {/* --- 2. BEST SELLING SECTION (WHITE BACKGROUND) --- */}
      {summaryData.best_selling.length > 0 && (
          <section className="elegant-section section-white">
            <div className="elegant-main-wrapper">
                <div className="elegant-section-header">
                    <span className="elegant-overline">TOP PICKS</span>
                    <h2 className="elegant-serif-title">Best Selling Products</h2>
                </div>
                
                <div className="elegant-product-grid">
                    {summaryData.best_selling.map(product => renderProductCard(product, "BEST SELLER"))}
                </div>
            </div>
          </section>
      )}

      {/* --- 3. TRENDING SECTION (CREAM BACKGROUND) --- */}
      {summaryData.trending.length > 0 && (
          <section className="elegant-section section-cream">
            <div className="elegant-main-wrapper">
                <div className="elegant-section-header">
                    <span className="elegant-overline">WHAT'S HOT</span>
                    <h2 className="elegant-serif-title">Trending Now</h2>
                </div>
                
                <div className="elegant-product-grid">
                    {summaryData.trending.map(product => renderProductCard(product, "TRENDING"))}
                </div>
            </div>
          </section>
      )}

      <StoreFooter 
        slug={slug}
        businessName={businessName}
        businessLogo={businessLogo}
        socialLinks={socialLinks}
        contactInfo={contactInfo}
      />

      <AuthCustomer isOpen={showAuthCustomer} onClose={() => setShowAuthCustomer(false)} onLoginSuccess={checkLoginStatus} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} slug={slug} />
    </div>
  );
};

export default StoreCategory;