import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios'; 
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'; 
import { Loader2, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react'; // Added Chevrons
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
    const filename = path.split(/[/\\]/).pop();
    return `${API_BASE_URL}/media/business_logo/${filename}`; 
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
                     phone: biz.user?.phone ? `+91 ${biz.user.phone}` : ''
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

  // NEW: Scroll Function for Arrow Buttons
  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = 350; // Distance to scroll per click
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
    const isOutOfStock = product.quantity_product <= 0;
    const mrp = parseFloat(product.mrp_baseprice || 0);
    const sellingPrice = parseFloat(product.gross_amount || 0);
    const hasDiscount = mrp > sellingPrice;
    const discountPercent = hasDiscount ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
    const currency = product.currency_symbol || '₹';

    return (
      <div key={product.id} className="min-product-card">
        <Link to={`/${slug}/item/${product.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div className="min-image-box">
                {isOutOfStock && <div className="min-out-badge">SOLD OUT</div>}

                {product.item_image_url ? (
                    <img src={product.item_image_url} alt={product.item_name} className={`min-product-img ${isOutOfStock ? 'grayscale' : ''}`} />
                ) : ( 
                    <div className="min-placeholder-img">{product.item_name.charAt(0)}</div> 
                )}
                
                <div className="min-add-overlay">
                    <button 
                        className="min-add-btn" 
                        disabled={isOutOfStock} 
                        onClick={(e) => handleAddToCart(product.id, e)}
                    >
                        {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
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

      <div className="main-section-bg">
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
      </div>

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