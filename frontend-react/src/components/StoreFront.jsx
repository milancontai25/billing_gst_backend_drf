import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'; 
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'; 
import { Loader2, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react'; 
import StoreHeader from './StoreHeader';
import StoreFooter from './StoreFooter';
import AuthCustomer from './AuthCustomer';
import CartDrawer from './CartDrawer';
import customerApi from '../api/customerAxios';
import '../assets/css/storefront.css'; 

const StoreFront = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); 

  // Grab parameters from the URL
  const queryParams = new URLSearchParams(location.search);
  const currentType = queryParams.get('type'); 
  const initialSearch = queryParams.get('search') || ''; 
  
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState(initialSearch); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [hasProducts, setHasProducts] = useState(false); 
  const [hasServices, setHasServices] = useState(false);
  
  const [businessName, setBusinessName] = useState('');
  const [businessLogo, setBusinessLogo] = useState('');
  const [banners, setBanners] = useState([]);
  const [socialLinks, setSocialLinks] = useState({});
  const [contactInfo, setContactInfo] = useState({});
  
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All'); 
  const [showAuthCustomer, setShowAuthCustomer] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // NEW: Ref for category scrolling
  const categoryScrollRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  
  const GOODS_API_URL = `${API_BASE_URL}/api/v1/business/${slug}/items/goods/`;
  const SERVICES_API_URL = `${API_BASE_URL}/api/v1/business/${slug}/items/services/`;

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

  // 1. Fetch Data
  useEffect(() => {
    checkLoginStatus();
    
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        
        const [goodsRes, servicesRes] = await Promise.allSettled([
            axios.get(GOODS_API_URL),
            axios.get(SERVICES_API_URL)
        ]);

        let goodsList = [];
        let servicesList = [];

        if (goodsRes.status === 'fulfilled') {
            goodsList = Array.isArray(goodsRes.value.data) ? goodsRes.value.data : (goodsRes.value.data.results || []);
            goodsList.forEach(item => item._local_item_type = 'goods'); 
        }
        if (servicesRes.status === 'fulfilled') {
            servicesList = Array.isArray(servicesRes.value.data) ? servicesRes.value.data : (servicesRes.value.data.results || []);
            servicesList.forEach(item => item._local_item_type = 'services'); 
        }

        const combinedProducts = [...goodsList, ...servicesList];
        setProducts(combinedProducts);
        
        setHasProducts(goodsList.length > 0 || combinedProducts.length === 0); 
        setHasServices(servicesList.length > 0);
        
        if (combinedProducts.length > 0) {
             const biz = combinedProducts[0].business;
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
                    twitter: biz.x_url
                 });
                 setContactInfo({
                     email: biz.user?.email || `contact@${slug}.com`, 
                     phone: biz.user?.phone ? `${biz.user.phone}` : ''
                 });
             } else {
                 setBusinessName(toTitleCase(slug.replace('-', ' ')));
             }
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

  // 1. Filter master products list based on the Header Link clicked
  const typeFilteredProducts = products.filter(p => {
    if (currentType === 'goods') return p._local_item_type === 'goods';
    if (currentType === 'services' || currentType === 'service') return p._local_item_type === 'services';
    return true; 
  });

  // 2. Extract Categories ONLY from the filtered products
  const categoryMap = new Map();
  typeFilteredProducts.forEach(p => {
    if (p.category) {
      const catName = toTitleCase(p.category);
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, p.category_image_url || p.category_image || null);
      }
    }
  });

  const categories = [];
  categoryMap.forEach((image, name) => {
    categories.push({ name, image });
  });

  // 3. Reset Selected Category if the user switches tabs
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (typeFilteredProducts.length > 0 && categories.length > 0) {
      if (hash) {
        const decodedHash = decodeURIComponent(hash);
        const matchedCategory = categories.find(c => c.name.toLowerCase() === decodedHash.toLowerCase());
        if (matchedCategory) {
          setSelectedCategory(matchedCategory.name);
          return;
        }
      }
      setSelectedCategory('All');
    }
  }, [typeFilteredProducts.length, currentType]); 

  const handleCategorySelect = (catName) => {
    setSelectedCategory(catName);
    if (catName === 'All') {
        window.history.pushState("", document.title, window.location.pathname + window.location.search);
    } else {
        window.location.hash = encodeURIComponent(catName);
    }
  };

  // Scroll Function for Arrow Buttons
  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = 350; 
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Banner Slide
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

  const filteredProducts = typeFilteredProducts.filter(p => {
    const pName = p.item_name ? p.item_name.toLowerCase() : "";
    const rawCat = p.category ? p.category.toLowerCase() : ""; 
    const displayCat = p.category ? toTitleCase(p.category) : ""; 

    const safeSearch = (typeof searchTerm === 'string' ? searchTerm : '').toLowerCase();
    
    const matchesSearch = pName.includes(safeSearch) || rawCat.includes(safeSearch);
    const matchesCategory = selectedCategory === 'All' ? true : displayCat === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const renderProductCard = (product) => {
    const mrp = parseFloat(product.mrp_baseprice || 0);
    const sellingPrice = parseFloat(product.gross_amount || 0);
    const hasDiscount = mrp > sellingPrice;
    const discountPercent = hasDiscount ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
    const currency = product.currency_symbol || '₹';

    // --- DYNAMIC AVAILABILITY LOGIC ---
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
        if (product.quantity_product <= 0) {
            isUnavailable = true;
            unavailableText = 'SOLD OUT';
        }
    }

    return (
      <div key={product.id} className="min-product-card">
        <Link to={`/${slug}/item/${product.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="min-image-box">
                {isUnavailable && <div className="min-out-badge">{unavailableText}</div>}

                {product.item_image_url ? (
                    <img src={product.item_image_url} alt={product.item_name} className={`min-product-img ${isUnavailable ? 'grayscale' : ''}`} />
                ) : ( 
                    <div className="min-placeholder-img">{product.item_name.charAt(0)}</div> 
                )}
                
                <div className="min-add-overlay">
                    <button 
                        className="min-add-btn" 
                        disabled={isUnavailable} 
                        onClick={(e) => handleAddToCart(product.id, e)}
                    >
                        {isUnavailable ? unavailableText : 'Add to Cart'}
                    </button>
                </div>
            </div>
            
            <div className="min-details">
                <h3 className="min-title" title={product.item_name}>{product.item_name}</h3>
                
                <div className="min-price-row">
                    <span className="min-price">{currency}{sellingPrice}</span>
                    {hasDiscount && (
                        <>
                            <span className="min-mrp">{currency}{mrp}</span>
                            {discountPercent > 0 && <span className="min-discount-text">{discountPercent}% off</span>}
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
    <div className="store-body">
      
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

      <section className="explore-section">
        {categories.length > 0 && (
            <>
                <h2 className="explore-title">
                   {currentType === 'services' ? 'EXPLORE OUR SERVICES' : 'EXPLORE OUR RANGE'}
                </h2>
                
                {/* NEW: Category Carousel Wrapper with Buttons */}
                <div className="category-carousel-wrapper">
                    <button className="carousel-arrow left-arrow" onClick={() => scrollCategories('left')}>
                        <ChevronLeft size={24} />
                    </button>

                    <div className="category-scroll-container" ref={categoryScrollRef}>
                        {categories.map((cat) => (
                            <div 
                              key={cat.name} 
                              className={`cat-card ${selectedCategory === cat.name ? 'active' : ''}`} 
                              onClick={() => handleCategorySelect(cat.name)}
                            >
                                <div className="cat-img-box">
                                    {cat.image ? (
                                        <img src={cat.image} alt={cat.name} className="cat-img" />
                                    ) : (
                                        <ImageIcon size={32} color="#94A3B8" /> 
                                    )}
                                </div>
                                <div className="cat-label">{cat.name}</div>
                            </div>
                        ))}
                    </div>

                    <button className="carousel-arrow right-arrow" onClick={() => scrollCategories('right')}>
                        <ChevronRight size={24} />
                    </button>
                </div>
            </>
        )}

        {filteredProducts.length === 0 ? (
          <div className="no-products" style={{ marginTop: '40px' }}>
            <h3>No items found</h3>
            <p>Try selecting a different category or check back later.</p>
          </div>
        ) : (
          <div className="min-product-grid" style={{ marginTop: '40px' }}>
            {filteredProducts.map(product => renderProductCard(product))}
          </div>
        )}

        {selectedCategory !== 'All' && (
            <div className="view-all-container">
                <button className="btn-view-all" onClick={() => handleCategorySelect('All')}>VIEW ALL</button>
            </div>
        )}
      </section>

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

export default StoreFront;

