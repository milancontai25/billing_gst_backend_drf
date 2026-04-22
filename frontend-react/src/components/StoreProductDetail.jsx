import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Share2, Heart, Minus, Plus, Loader2, Copy, PlayCircle } from 'lucide-react';
import customerApi from '../api/customerAxios'; 
import StoreHeader from './StoreHeader';
import StoreFooter from './StoreFooter';
import CartDrawer from './CartDrawer';
import AuthCustomer from './AuthCustomer';
import '../assets/css/productdetail.css';

const StoreProductDetail = () => {
  const { slug, itemSlug } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // Dynamic Header Menu Toggles
  const [hasProducts, setHasProducts] = useState(true); 
  const [hasServices, setHasServices] = useState(false);

  // --- MEDIA STATE ---
  const [mediaList, setMediaList] = useState([]);
  const [activeMedia, setActiveMedia] = useState(null); 

  // Global State
  const [businessName, setBusinessName] = useState('');
  const [businessLogo, setBusinessLogo] = useState('');
  const [socialLinks, setSocialLinks] = useState({});
  const [contactInfo, setContactInfo] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showAuthCustomer, setShowAuthCustomer] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

  const formatUrl = (path) => {
    if (!path) return null;
    const filename = path.split(/[/\\]/).pop();
    return `${API_BASE_URL}/media/business_logo/${filename}`; 
  };

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // --- VIDEO HELPERS ---
  const isYoutube = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
  const isInstagram = (url) => url && (url.includes('instagram.com/reel') || url.includes('instagram.com/p'));

  const getYoutubeEmbed = (url) => {
    if (url.includes('/shorts/')) {
        const videoId = url.split('/shorts/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  };

  const getInstagramEmbed = (url) => {
    const cleanUrl = url.split('?')[0]; 
    const base = cleanUrl.endsWith('/') ? cleanUrl.slice(0, -1) : cleanUrl;
    return `${base}/embed`;
  };

  useEffect(() => {
    checkLoginStatus();
    
    const fetchProductAndBiz = async () => {
      try {
        setLoading(true);
        
        // Fetch specific product AND store summary concurrently
        const PRODUCT_API_URL = `${API_BASE_URL}/api/v1/business/${slug}/items/${itemSlug}/`;
        const SUMMARY_API_URL = `${API_BASE_URL}/api/v1/business/${slug}/items/summary/`;

        const [productRes, summaryRes] = await Promise.allSettled([
            axios.get(PRODUCT_API_URL),
            axios.get(SUMMARY_API_URL)
        ]);

        // Process Summary Data to determine Header Menu status
        if (summaryRes.status === 'fulfilled') {
            const sumData = summaryRes.value.data;
            const allSummaryItems = [...(sumData.best_selling || []), ...(sumData.trending || [])];
            
            const foundServices = allSummaryItems.some(p => p.item_type && p.item_type.toLowerCase() === 'service');
            const foundGoods = allSummaryItems.some(p => !p.item_type || ['good', 'goods', 'product', 'products'].includes(p.item_type.toLowerCase()));
            
            setHasServices(foundServices);
            setHasProducts(allSummaryItems.length === 0 ? true : foundGoods);
        } else {
            setHasProducts(true);
            setHasServices(false);
        }

        // Process Product Data
        if (productRes.status === 'fulfilled') {
            const data = productRes.value.data;
            setProduct(data);

            // PREPARE MEDIA LIST
            const media = [];
            if (data.item_image_url) media.push({ type: 'image', url: data.item_image_url });
            if (data.item_image_1) media.push({ type: 'image', url: data.item_image_1 });
            if (data.item_image_2) media.push({ type: 'image', url: data.item_image_2 });
            if (data.item_image_3) media.push({ type: 'image', url: data.item_image_3 });
            if (data.item_video_link) media.push({ type: 'video', url: data.item_video_link });

            setMediaList(media);
            setActiveMedia(media[0]); 

            // Business Info
            if (data.business) {
                const biz = data.business;
                setBusinessName(biz.business_name);
                setBusinessLogo(formatUrl(biz.logo_bucket_url));
                setSocialLinks({
                    facebook: biz.facebook_url,
                    instagram: biz.instagram_url,
                    youtube: biz.youtube_url,
                    twitter: biz.x_url
                });
                setContactInfo({
                     email: biz.user?.email || '', 
                     phone: biz.user?.phone ? `+91 ${biz.user.phone}` : ''
                 });
            } else {
                setBusinessName(slug.toUpperCase());
            }
        }

      } catch (err) {
        console.error("Error fetching product", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndBiz();
  }, [slug, itemSlug]);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('customer_token');
    const name = localStorage.getItem('customer_name');
    if (token) { setIsLoggedIn(true); setUser({ name: name || 'User' }); }
    else { setIsLoggedIn(false); setUser(null); }
  };

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_name');
    setIsLoggedIn(false); setUser(null); setIsDropdownOpen(false);
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn) { alert("Please Login first!"); setShowAuthCustomer(true); return; }
    try {
      setAdding(true);
      await customerApi.post(`customer/cart/add/`, { item: product.id, quantity: quantity });
      setIsCartOpen(true); 
    } catch (err) {
      console.error(err);
      alert("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;
    const shareTitle = `${product.item_name} - ${businessName}`;
    
    // Use the native Web Share API if available (works great on mobile!)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Check out this amazing ${product.item_name} at ${businessName}!`,
          url: currentUrl,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback for older desktop browsers: Copy to clipboard
      try {
        await navigator.clipboard.writeText(currentUrl);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy link: ", err);
      }
    }
  };

  if (loading) return <div className="loading-container"><Loader2 className="animate-spin" /></div>;
  if (!product) return <div className="loading-container">Product not found</div>;

  const mrp = parseFloat(product.mrp_baseprice || 0);
  const sellingPrice = parseFloat(product.gross_amount || 0);
  const hasDiscount = mrp > sellingPrice;
  const discountPercent = hasDiscount ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;
  const currency = product.currency_symbol || '₹';


  // NEW: Determine if it's a Product or Service Description
  const descriptionTitle = (() => {
    if (!hasProducts && hasServices) return "Service Description";
    if (hasProducts && hasServices && product?.item_type) {
        const typeStr = String(product.item_type).toLowerCase();
        if (typeStr.includes('service')) return "Service Description";
    }
    return "Product Description"; // Default fallback
  })();


  return (
    <div className="product-detail-page elegant-theme">
      
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

      <div className="detail-header">
        <div className="breadcrumb-nav">
            <Link to={`/${slug}`} className="crumb-link">HOME</Link> 
            <span className="crumb-sep">{'>'}</span>
            <Link to={`/${slug}/items`} className="crumb-link">{product.category?.toUpperCase() || 'ITEMS'}</Link>
            <span className="crumb-sep">{'>'}</span>
            <span className="crumb-current">{product.item_name?.toUpperCase()}</span>
        </div>
      </div>

      <div className="detail-container">
        
        {/* --- LEFT: MEDIA GALLERY --- */}
        <div className="detail-gallery">
            <div className="thumbnail-list">
                {mediaList.map((media, idx) => (
                    <div 
                        key={idx} 
                        className={`thumb-item ${activeMedia?.url === media.url ? 'active' : ''}`}
                        onMouseEnter={() => setActiveMedia(media)}
                        onClick={() => setActiveMedia(media)}
                    >
                        {media.type === 'video' ? (
                            <div className="video-thumb-placeholder">
                                <PlayCircle size={24} color="#334155" />
                            </div>
                        ) : (
                            <img src={media.url} alt={`thumb-${idx}`} />
                        )}
                    </div>
                ))}
            </div>

            <div className="main-image-frame">
                {activeMedia?.type === 'video' ? (
                    isYoutube(activeMedia.url) ? (
                        <iframe 
                            src={getYoutubeEmbed(activeMedia.url)} 
                            title="YouTube Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="main-video-embed"
                        ></iframe>
                    ) : isInstagram(activeMedia.url) ? (
                        <iframe 
                            src={getInstagramEmbed(activeMedia.url)} 
                            title="Instagram Video"
                            frameBorder="0"
                            allowFullScreen
                            className="main-video-embed instagram-embed"
                            scrolling="no"
                        ></iframe>
                    ) : (
                        <video controls autoPlay className="main-video-file">
                            <source src={activeMedia.url} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    )
                ) : (
                    <img src={activeMedia?.url} alt={product.item_name} className="main-img" />
                )}
            </div>
        </div>

        {/* --- RIGHT: INFO --- */}
        <div className="detail-info">
            <div className="info-header">
                <h1 className="detail-title">{product.item_name}</h1>
                <div className="icon-actions">
                    {/* ADD THE onClick HERE */}
                    <button className="icon-btn" onClick={handleShare}>
                        <Share2 size={20} />
                    </button>
                    <button className="icon-btn"><Heart size={20} /></button>
                </div>
            </div>

            <div className="tag-row">
                <span className="sub-text">Category: {toTitleCase(product.category)}</span>
            </div>

            <div className="rating-row">
                <div className="stars">
                    {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="#111827" color="#111827"/>)}
                </div>
                <span className="review-text">Customer Reviews</span>
            </div>

            <div className="detail-price-section">
                <span className="d-selling-price">{currency}{sellingPrice.toFixed(2)}</span>
                {hasDiscount && (
                    <>
                        <span className="d-mrp-price">{currency}{mrp.toFixed(2)}</span>
                        <span className="d-discount-off">{discountPercent}% off</span>
                    </>
                )}
                <span className="tax-info">MRP (Incl. of all taxes)</span>
            </div>

            <div className="action-row">
                <div className="qty-selector-big">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={18}/></button>
                    <span>{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)}><Plus size={18}/></button>
                </div>
                <button className="btn-add-cart-big" onClick={handleAddToCart} disabled={adding}>
                    {adding ? 'ADDING...' : 'ADD TO CART'}
                </button>
                <button className="btn-buy-now-big">BUY NOW</button>
            </div>

            {/* --- MOVED HELP SECTION HERE (Right Column) --- */}
            <div className="help-box-right">
                <h5>Have a question? We can help.</h5>
                <p className="help-timing">24*7</p>
                
                {contactInfo.phone && (
                    <p className="help-contact">
                        <strong>Call or WhatsApp us:</strong><br/>
                        {contactInfo.phone}
                    </p>
                )}
                
                {contactInfo.email && (
                    <p className="help-email">
                        Email us at <strong>{contactInfo.email}</strong> or chat/DM us on our Instagram.
                    </p>
                )}
            </div>

        </div>
      </div>

      {/* --- FULL-WIDTH DESCRIPTION (Bottom) --- */}
      <div className="full-width-description-container">
          <div className="desc-tabs-header">
              <h3 className="active-tab">Description</h3>
          </div>
          
          <div className="desc-body">
              {/* NEW: Dynamic Subtitle */}
              <h4 className="desc-subtitle">{descriptionTitle}</h4>
              
              {product.description ? (
                  <p className="desc-text" style={{ whiteSpace: 'pre-wrap' }}>
                      {product.description}
                  </p>
              ) : (
                  <p className="desc-text">No description available.</p>
              )}
          </div>
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

export default StoreProductDetail;