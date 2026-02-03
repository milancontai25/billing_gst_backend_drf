import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Share2, Heart, Minus, Plus, Loader2, Copy, PlayCircle } from 'lucide-react';
import customerApi from '../api/customerAxios'; 
import StoreHeader from './StoreHeader';
import StoreFooter from './StoreFooter';
import CartDrawer from './CartDrawer';
import AuthCustomer from './AuthCustomer';
import '../assets/css/storefront.css';

const StoreProductDetail = () => {
  const { slug, itemSlug } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

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

  // --- VIDEO HELPERS (UPDATED) ---

  // 1. Detect Platform
  const isYoutube = (url) => url && (url.includes('youtube.com') || url.includes('youtu.be'));
  const isInstagram = (url) => url && (url.includes('instagram.com/reel') || url.includes('instagram.com/p'));

  // 2. Get YouTube Embed (Handles Standard + Shorts)
  const getYoutubeEmbed = (url) => {
    // Handle Shorts
    if (url.includes('/shorts/')) {
        const videoId = url.split('/shorts/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    // Handle Standard
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
  };

  // 3. Get Instagram Embed
  const getInstagramEmbed = (url) => {
    // Ensure URL ends with /embed/ caption
    // Remove query params first
    const cleanUrl = url.split('?')[0]; 
    // Remove trailing slash if present
    const base = cleanUrl.endsWith('/') ? cleanUrl.slice(0, -1) : cleanUrl;
    return `${base}/embed`;
  };

  useEffect(() => {
    checkLoginStatus();
    
    const fetchProductAndBiz = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/v1/business/${slug}/items/${itemSlug}/`);
        const data = res.data;
        setProduct(data);

        // --- PREPARE MEDIA LIST ---
        const media = [];
        
        // 1. Add Images
        if (data.item_image_url) media.push({ type: 'image', url: data.item_image_url });
        if (data.item_image_1) media.push({ type: 'image', url: data.item_image_1 });
        if (data.item_image_2) media.push({ type: 'image', url: data.item_image_2 });
        if (data.item_image_3) media.push({ type: 'image', url: data.item_image_3 });
        
        // 2. Add Video (if exists)
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
                 email: biz.user.email, 
                 phone: `+91 ${biz.user.phone}`
             });
        } else {
            setBusinessName(slug.toUpperCase());
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

  if (loading) return <div className="loading-container"><Loader2 className="animate-spin" /></div>;
  if (!product) return <div className="loading-container">Product not found</div>;

  const mrp = parseFloat(product.mrp_baseprice || 0);
  const sellingPrice = parseFloat(product.gross_amount || 0);
  const hasDiscount = mrp > sellingPrice;
  const discountPercent = hasDiscount ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

  return (
    <div className="product-detail-page">
      
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
      />

      <div className="detail-header">
        <div className="breadcrumb-nav">
            <Link to={`/${slug}`} className="crumb-link">HOME</Link> 
            <span className="crumb-sep">{'>'}</span>
            <Link to={`/${slug}`} className="crumb-link">{product.category?.toUpperCase()}</Link>
            <span className="crumb-sep">{'>'}</span>
            <span className="crumb-current">{product.item_name?.toUpperCase()}</span>
        </div>
      </div>

      <div className="detail-container">
        
        {/* --- LEFT: MEDIA GALLERY --- */}
        <div className="detail-gallery">
            {/* 1. Thumbnail Strip */}
            <div className="thumbnail-list">
                {mediaList.map((media, idx) => (
                    <div 
                        key={idx} 
                        className={`thumb-item ${activeMedia?.url === media.url ? 'active' : ''}`}
                        onMouseEnter={() => setActiveMedia(media)} // Or onClick
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

            {/* 2. Main Display Area */}
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
                            className="main-video-embed instagram-embed" // Add specific class if needed
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
                    <button className="icon-btn"><Share2 size={20} /></button>
                    <button className="icon-btn"><Heart size={20} /></button>
                </div>
            </div>

            <div className="tag-row">
                <span className="sub-text">Natural | {toTitleCase(product.category)}</span>
            </div>

            <div className="rating-row">
                <div className="stars">
                    {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="#FACC15" color="#FACC15"/>)}
                </div>
                <span className="review-text">2 Reviews</span>
            </div>

            <div className="detail-price-section">
                <span className="d-selling-price">₹{sellingPrice.toFixed(2)}</span>
                {hasDiscount && (
                    <>
                        <span className="d-mrp-price">₹{mrp.toFixed(2)}</span>
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

            <div className="description-box">
                <h3>Description</h3>
                <p>{product.description || "No description available."}</p>
            </div>
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