import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, Share2, Heart, Minus, Plus, Loader2, PlayCircle } from 'lucide-react';
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

  // Dynamic Header Menu Toggles
  const [hasProducts, setHasProducts] = useState(true); 
  const [hasServices, setHasServices] = useState(false);

  // --- VARIANT & MEDIA STATE ---
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
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
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`; 
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
        const PRODUCT_API_URL = `${API_BASE_URL}/api/v1/business/${slug}/items/${itemSlug}/`;
        const SUMMARY_API_URL = `${API_BASE_URL}/api/v1/business/${slug}/items/summary/`;

        const [productRes, summaryRes] = await Promise.allSettled([
            axios.get(PRODUCT_API_URL),
            axios.get(SUMMARY_API_URL)
        ]);

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

        if (productRes.status === 'fulfilled') {
            const data = productRes.value.data;
            setProduct(data);

            // --- INITIALIZE VARIANT DATA ---
            if (data.has_variants && data.variants && data.variants.length > 0) {
                const firstVariant = data.variants[0];
                setSelectedVariant(firstVariant);
                
                const initialAttrs = {};
                firstVariant.attributes.forEach(attr => {
                    initialAttrs[attr.attribute_name] = attr.attribute_value;
                });
                setSelectedAttributes(initialAttrs);
            }

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
                     phone: biz.user?.phone ? `${biz.user.phone}` : ''
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

  // --- UPDATE MEDIA BASED ON SELECTION ---
  useEffect(() => {
    if (!product) return;
    
    const media = [];
    if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
        selectedVariant.images.forEach(img => {
            media.push({ type: 'image', url: img.image_url });
        });
        if (product.item_video_link) media.push({ type: 'video', url: product.item_video_link });
    } else {
        if (product.item_image_url) media.push({ type: 'image', url: product.item_image_url });
        if (product.item_image_1) media.push({ type: 'image', url: product.item_image_1 });
        if (product.item_image_2) media.push({ type: 'image', url: product.item_image_2 });
        if (product.item_image_3) media.push({ type: 'image', url: product.item_image_3 });
        if (product.item_video_link) media.push({ type: 'video', url: product.item_video_link });
    }
    
    setMediaList(media);
    if (media.length > 0) setActiveMedia(media[0]);
  }, [product, selectedVariant]);

  // --- EXTRACT AVAILABLE ATTRIBUTES (e.g. Color, Size) ---
  const availableAttributes = useMemo(() => {
    if (!product || !product.has_variants) return {};
    const attrs = {};
    product.variants.forEach(v => {
        v.attributes.forEach(a => {
            if (!attrs[a.attribute_name]) attrs[a.attribute_name] = new Set();
            attrs[a.attribute_name].add(a.attribute_value);
        });
    });
    
    const result = {};
    Object.keys(attrs).forEach(key => {
        result[key] = Array.from(attrs[key]);
    });
    return result;
  }, [product]);

  // Handle User Selecting a new Color/Size
  const handleAttributeSelect = (attrName, value) => {
    const newAttrs = { ...selectedAttributes, [attrName]: value };

    // Try to find the exact variant match
    let matchingV = product.variants.find(v =>
        v.attributes.every(a => newAttrs[a.attribute_name] === a.attribute_value)
    );

    // If that combination doesn't exist (e.g. Red XL is sold out/removed), find the nearest valid variant for the clicked attribute
    if (!matchingV) {
         matchingV = product.variants.find(v =>
             v.attributes.some(a => a.attribute_name === attrName && a.attribute_value === value)
         );
         if (matchingV) {
             const updatedAttrs = {};
             matchingV.attributes.forEach(a => { updatedAttrs[a.attribute_name] = a.attribute_value; });
             setSelectedAttributes(updatedAttrs);
             setSelectedVariant(matchingV);
             return;
         }
    }

    setSelectedAttributes(newAttrs);
    if (matchingV) setSelectedVariant(matchingV);
  };

  // Extract a specific color's image for the swatch buttons
  const getSwatchImage = (attrName, attrValue) => {
    const matchingVariant = product.variants.find(v =>
        v.attributes.some(a => a.attribute_name === attrName && a.attribute_value === attrValue)
    );
    if (matchingVariant && matchingVariant.images && matchingVariant.images.length > 0) {
        const primary = matchingVariant.images.find(i => i.is_primary);
        return primary ? primary.image_url : matchingVariant.images[0].image_url;
    }
    return null; 
  };


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

  // --- CART ACTION ---
  const handleAddToCart = async () => {
    if (!isLoggedIn) { alert("Please Login first!"); setShowAuthCustomer(true); return; }
    try {
      setAdding(true);
      const payload = { item: product.id, quantity: quantity };
      
      // If it's a variant, send the variant UID to the backend
      if (selectedVariant) {
          payload.variant_uid = selectedVariant.uid; 
      }

      await customerApi.post(`customer/cart/add/`, payload);
      setIsCartOpen(true); 
    } catch (err) {
      console.error(err);
      alert("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  // --- BUY NOW ACTION ---
  const handleBuyNow = async () => {
    if (!isLoggedIn) { 
        alert("Please Login first to buy!"); 
        setShowAuthCustomer(true); 
        return; 
    }
    
    try {
        setAdding(true);
        const payload = { item: product.id, quantity: quantity };
        if (selectedVariant) payload.variant_uid = selectedVariant.uid;
        
        await customerApi.post(`customer/cart/add/`, payload);
        
        navigate(`/${slug}/checkout`, { 
            state: { 
                isBuyNow: true, 
                buyNowItems: [{
                    product_id: product.id,
                    variant_uid: selectedVariant?.uid || null,
                    item_name: product.item_name,
                    variant_name: selectedVariant?.variant_name || null,
                    gross_amount: selectedVariant ? selectedVariant.selling_price : product.gross_amount,
                    quantity: quantity,
                    image: activeMedia?.url || product.item_image_url
                }]
            } 
        });
    } catch (err) {
        console.error("Buy Now Error:", err);
        alert("Failed to process Buy Now");
    } finally {
        setAdding(false);
    }
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;
    const shareTitle = `${product.item_name} - ${businessName}`;
    
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

  // --- DYNAMIC PRICING AND STOCK ---
  const currentPrice = selectedVariant ? parseFloat(selectedVariant.selling_price || 0) : parseFloat(product.gross_amount || 0);
  const currentMrp = selectedVariant ? parseFloat(selectedVariant.mrp || currentPrice) : parseFloat(product.mrp_baseprice || 0);
  const hasDiscount = currentMrp > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100) : 0;
  const currency = product.currency_symbol || '₹';
  
  const stock = selectedVariant ? selectedVariant.stock : product.quantity_product;
  const isOutOfStock = stock <= 0;

  const descriptionTitle = (() => {
    if (!hasProducts && hasServices) return "Service Description";
    if (hasProducts && hasServices && product?.item_type) {
        const typeStr = String(product.item_type).toLowerCase();
        if (typeStr.includes('service')) return "Service Description";
    }
    return "Product Description"; 
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
                <span className="d-selling-price">{currency}{currentPrice.toFixed(2)}</span>
                {hasDiscount && (
                    <>
                        <span className="d-mrp-price">{currency}{currentMrp.toFixed(2)}</span>
                        <span className="d-discount-off">{discountPercent}% off</span>
                    </>
                )}
                <span className="tax-info">MRP (Incl. of all taxes)</span>
            </div>

            {/* --- VARIANTS SELECTOR --- */}
            {product.has_variants && Object.entries(availableAttributes).map(([attrName, values]) => {
                
                // 👇 THIS IS THE FIX: Checks for BOTH "Color" and "Colour"
                const isColor = ['color', 'colour'].includes(attrName.toLowerCase());
                
                return (
                    <div key={attrName} className="variant-section">
                        <div className="variant-header">
                            <span className="variant-title">
                                {isColor ? `Selected ${toTitleCase(attrName)}:` : `Select ${attrName}`} 
                                {isColor && <strong style={{marginLeft: '6px', fontWeight: '500'}}>{selectedAttributes[attrName]}</strong>}
                            </span>
                            {/* {!isColor && <span className="size-chart-link">Size Chart</span>} */}
                        </div>
                        
                        <div className={`variant-options ${isColor ? 'swatch-group' : 'pill-group'}`}>
                            {values.map(val => {
                                const isSelected = selectedAttributes[attrName] === val;
                                if (isColor) {
                                    const swatchImg = getSwatchImage(attrName, val);
                                    return (
                                        <button
                                            key={val}
                                            className={`swatch-btn ${isSelected ? 'active' : ''}`}
                                            onClick={() => handleAttributeSelect(attrName, val)}
                                            title={val}
                                        >
                                            {swatchImg ? <img src={swatchImg} alt={val} /> : <div className="swatch-fallback">{val.charAt(0)}</div>}
                                        </button>
                                    );
                                } else {
                                    return (
                                        <button
                                            key={val}
                                            className={`pill-btn ${isSelected ? 'active' : ''}`}
                                            onClick={() => handleAttributeSelect(attrName, val)}
                                        >
                                            {val}
                                        </button>
                                    );
                                }
                            })}
                        </div>
                    </div>
                );
            })}

            {isOutOfStock && <div className="out-of-stock-alert">Currently Out of Stock</div>}

            <div className="action-row">
                <div className="qty-selector-big">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={isOutOfStock}><Minus size={18}/></button>
                    <span>{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} disabled={isOutOfStock}><Plus size={18}/></button>
                </div>
                <button className="btn-add-cart-big" onClick={handleAddToCart} disabled={adding || isOutOfStock}>
                    {adding ? 'ADDING...' : (isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART')}
                </button>
                <button className="btn-buy-now-big" onClick={handleBuyNow} disabled={adding || isOutOfStock}>
                    BUY NOW
                </button>
            </div>

            {/* --- HELP SECTION --- */}
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

      {/* --- DESCRIPTION --- */}
      <div className="full-width-description-container">
          <div className="desc-tabs-header">
              <h3 className="active-tab">Description</h3>
          </div>
          <div className="desc-body">
              <h4 className="desc-subtitle">{descriptionTitle}</h4>
              {product.description ? (
                  <div className="desc-text" dangerouslySetInnerHTML={{ __html: product.description }} />
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