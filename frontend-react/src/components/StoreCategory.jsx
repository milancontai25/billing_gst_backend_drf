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
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`; 
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

        const allSummaryItems = [...(data.best_selling || []), ...(data.trending || [])];
        const foundServices = allSummaryItems.some(p => p.item_type && p.item_type.toLowerCase() === 'service');
        const foundGoods = allSummaryItems.some(p => !p.item_type || p.item_type.toLowerCase() === 'goods' || p.item_type.toLowerCase() === 'products');
        
        setHasServices(foundServices);
        setHasProducts(allSummaryItems.length === 0 ? true : foundGoods);
        
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
                phone: biz.user?.phone || biz.phone ? `${biz.user?.phone || biz.phone}` : ''
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

  const renderProductCard = (product, badgeLabel = null) => {
    // --- 1. DEFAULT TO BASE PRODUCT DATA ---
    let mrp = parseFloat(product.mrp_baseprice || 0);
    let sellingPrice = parseFloat(product.gross_amount || 0);
    let stockQuantity = product.quantity_product || 0;
    let imageUrl = product.item_image_url || null;

    // --- 2. OVERRIDE WITH FIRST VARIANT IF HAS_VARIANTS IS TRUE ---
    if (product.has_variants && product.variants && product.variants.length > 0) {
        const firstVariant = product.variants[0];
        sellingPrice = parseFloat(firstVariant.selling_price || sellingPrice);
        mrp = parseFloat(firstVariant.mrp || mrp); // Fallbacks to base mrp if not defined in variant
        stockQuantity = firstVariant.stock !== undefined ? firstVariant.stock : stockQuantity;
        
        if (firstVariant.images && firstVariant.images.length > 0) {
            const primaryImg = firstVariant.images.find(img => img.is_primary);
            imageUrl = primaryImg ? primaryImg.image_url : firstVariant.images[0].image_url;
        }
    }

    const hasDiscount = mrp > sellingPrice;
    const currency = product.currency_symbol || '₹'; 
    const discountPercent = hasDiscount ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

    // --- 3. DYNAMIC AVAILABILITY LOGIC ---
    const isService = product.item_type && String(product.item_type).toLowerCase().includes('service');
    let isUnavailable = false;
    let unavailableText = 'SOLD OUT';

    if (isService) {
        const status = product.availability_status_service || '';
        if (status.toLowerCase() === 'busy' || status.toLowerCase() === 'offline') {
            isUnavailable = true;
            unavailableText = 'NOT AVAILABLE';
        }
    } else {
        if (stockQuantity <= 0) {
            isUnavailable = true;
            unavailableText = 'SOLD OUT';
        }
    }

    return (
      <div key={product.id} className="elegant-product-card">
        <Link to={`/${slug}/item/${product.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="elegant-image-box">
                {badgeLabel && !isUnavailable && <div className="elegant-badge">{badgeLabel}</div>}
                {isUnavailable && <div className="elegant-badge out-of-stock">{unavailableText}</div>}

                {imageUrl ? (
                    <img src={imageUrl} alt={product.item_name} className={`elegant-product-img ${isUnavailable ? 'grayscale' : ''}`} />
                ) : ( 
                    <div className="elegant-placeholder-img">{product.item_name.charAt(0)}</div> 
                )}
                
                <div className="elegant-add-overlay">
                    <button 
                        className="elegant-add-btn" 
                        disabled={isUnavailable} 
                        onClick={(e) => {
                            // If it has variants, it's better to redirect them to the item page so they can choose size/color!
                            if (product.has_variants) {
                                navigate(`/${slug}/item/${product.slug}`);
                            } else {
                                handleAddToCart(product.id, e);
                            }
                        }}
                    >
                        {isUnavailable ? unavailableText : (product.has_variants ? 'Select Options' : 'Add to Cart')}
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
        hasProducts={hasProducts}
        hasServices={hasServices}
      />

      {/* --- HERO SECTION (NO CSS CLASSES = BULLETPROOF) --- */}
      <div style={{ width: '100%', margin: 0, padding: 0, lineHeight: 0 }}>
          {banners.length > 0 ? (
            <div style={{ position: 'relative', width: '100%', margin: 0, padding: 0 }}>
                
                {/* THE SPACER: Dictates the exact height based on screen width. 0% Crop. */}
                <img 
                    src={banners[currentBannerIndex]} 
                    alt="spacer" 
                    style={{ 
                        width: '100%', 
                        height: 'auto', 
                        display: 'block', 
                        visibility: 'hidden',
                        margin: 0,
                        padding: 0
                    }} 
                />
                
                {/* THE VISIBLE BANNERS: Float perfectly inside the spacer's shape */}
                {banners.map((banner, index) => (
                    <img 
                       key={index} 
                       src={banner}
                       alt={`Banner ${index}`}
                       style={{ 
                           position: 'absolute',
                           top: 0,
                           left: 0,
                           width: '100%',
                           height: '100%',
                           display: 'block',
                           margin: 0,
                           padding: 0,
                           opacity: index === currentBannerIndex ? 1 : 0,
                           transition: 'opacity 0.5s ease-in-out',
                           pointerEvents: index === currentBannerIndex ? 'auto' : 'none'
                       }}
                    />
                ))}
                
                {/* DOTS */}
                {banners.length > 1 && (
                    <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '8px', lineHeight: 'normal' }}>
                        {banners.map((_, idx) => (
                            <span 
                                key={idx} 
                                onClick={() => setCurrentBannerIndex(idx)}
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: idx === currentBannerIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.3s ease'
                                }}
                            ></span>
                        ))}
                    </div>
                )}
            </div>
          ) : (
             <div style={{ padding: '80px 20px', textAlign: 'center', background: '#111827', color: 'white', lineHeight: 'normal' }}>
                 <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', margin: '0 0 10px 0' }}>Welcome to <br/><span>{businessName}</span></h1>
                 <p style={{ margin: 0, color: '#D1D5DB' }}>Quality products, honest savings. Delivered to your door.</p>
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
                            /* 👇 THE FIX: Passing Category via URL Query Param instead of hash 👇 */
                            to={`/${slug}/items?category=${encodeURIComponent(cat.category)}`}
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