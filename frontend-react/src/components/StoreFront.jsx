import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { useParams, Link } from 'react-router-dom'; 
import { ShoppingCart, Search, Store, User, Settings, LogOut, Package, ChevronDown, Loader2 } from 'lucide-react';

import AuthCustomer from './AuthCustomer';
import CartDrawer from './CartDrawer';
import customerApi from '../api/customerAxios';
import '../assets/css/storefront.css'; 

const StoreFront = () => {
  const { slug } = useParams();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [showAuthCustomer, setShowAuthCustomer] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const categories = ["All", "Cosmetics", "Grocery", "Fashion", "Electronics", "Home Decor", "Furniture"];
  const PRODUCT_API_URL = `http://127.0.0.1:8000/api/v1/business/${slug}/items/`;

  useEffect(() => {
    checkLoginStatus();
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(PRODUCT_API_URL);
        setProducts(res.data);
        
        if (res.data && res.data.length > 0) {
             setBusinessName(res.data[0].business.business_name);
        } else {
             const formattedSlug = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
             setBusinessName(formattedSlug);
        }
        setLoading(false);
      } catch (err) {
        console.error("Store not found", err);
        setBusinessName("Store Not Found");
        setLoading(false);
      }
    };
    fetchStoreData();
  }, [slug]);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('customer_token');
    const name = localStorage.getItem('customer_name');
    if (token) {
        setIsLoggedIn(true);
        setUser({ name: name || 'User' });
    } else {
        setIsLoggedIn(false);
        setUser(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_name');
    localStorage.removeItem('customer_refresh');
    setIsLoggedIn(false);
    setUser(null);
    setIsDropdownOpen(false);
  };

  const handleAddToCart = async (productId) => {
    if (!isLoggedIn) {
        alert("Please Login to shop!");
        setShowAuthCustomer(true);
        return;
    }
    try {
        await customerApi.post(`/customer/cart/add/`, { item: productId, quantity: 1 });
        setIsCartOpen(true);
    } catch (err) {
        console.error(err);
        alert("Failed to add item to cart.");
    }
  };

  const filteredProducts = products.filter(p => {
    const pName = p.item_name ? p.item_name.toLowerCase() : "";
    const pCat = p.category ? p.category.toLowerCase() : "";
    const search = searchTerm.toLowerCase();
    const matchesSearch = pName.includes(search) || pCat.includes(search);
    const matchesCategory = selectedCategory === 'All' ? true : pCat === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const getStockBadge = (qty, minStock) => {
    if (qty <= 0) return <span className="stock-badge out">Out of Stock</span>;
    if (qty <= minStock) return <span className="stock-badge low">Low Stock</span>;
    return null;
  };

  if (loading) return (
      <div className="loading-container">
          <Loader2 size={40} className="animate-spin" />
          <p>Loading {businessName || 'Store'}...</p>
      </div>
  );

  return (
    <div className="store-body">
      
      {/* --- HEADER --- */}
      <header className="store-header">
        <div className="header-content">
          <Link to={`/store/${slug}`} className="brand-section">
            <div className="brand-logo-box"><Store size={22} /></div>
            <h1 className="brand-name">{businessName}</h1>
          </Link>
          
          <div className="search-container">
            <input 
              type="text" className="search-input" placeholder="Search products..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} className="search-icon" />
          </div>

          <div className="header-actions">
            {isLoggedIn ? (
                <div className="user-info-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                    <div className="user-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
                    {isDropdownOpen && (
                        <div className="profile-dropdown">
                            <div className="dropdown-header">Hello, {user?.name}</div>
                            <Link to={`/store/${slug}/orders`} className="dropdown-item"><Package size={16} /> My Orders</Link>
                            <div className="dropdown-item"><User size={16} /> Profile</div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item text-red" onClick={handleLogout}><LogOut size={16} /> Logout</div>
                        </div>
                    )}
                </div>
            ) : (
                <button className="login-link-btn" onClick={() => setShowAuthCustomer(true)}>
                   Login / Sign Up
                </button>
            )}
            
            <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <div className="store-hero">
          <div className="hero-content">
              <h1>Welcome to {businessName}</h1>
              <p>Discover our latest collection of premium products. Quality you can trust, prices you'll love.</p>
          </div>
      </div>

      {/* --- CATEGORY BAR (Sticky) --- */}
      <div className="category-bar-wrapper">
        <div className="category-list">
            {categories.map((cat) => (
            <button key={cat} 
                className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
            >
                {cat}
            </button>
            ))}
        </div>
      </div>

      {/* --- PRODUCT GRID --- */}
      <main className="store-main">
        <h2 className="section-title">
            {selectedCategory === 'All' ? 'All Products' : selectedCategory}
        </h2>

        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <h3>No products found</h3>
            <p>Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => {
               const isOutOfStock = product.quantity_product <= 0;
               return (
                  <div key={product.id} className="product-card">
                    <div className="product-image-box">
                      {getStockBadge(product.quantity_product, product.min_stock_product)}
                      
                      {product.item_image_url ? (
                        <img src={product.item_image_url} alt={product.item_name} className={`product-img ${isOutOfStock ? 'grayscale' : ''}`} />
                      ) : (
                        <span className="placeholder-img">{product.item_name.charAt(0)}</span>
                      )}
                    </div>
                    
                    <div className="product-details">
                      <div className="product-cat">{product.category}</div>
                      <h3 className="product-name" title={product.item_name}>{product.item_name}</h3>
                      <p className="product-desc">{product.description || 'No description available for this product.'}</p>
                      
                      <div className="product-footer">
                        <div className="price">₹{product.mrp_baseprice}</div>
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

      {/* --- FOOTER --- */}
      <footer className="store-footer">
          <p>&copy; {new Date().getFullYear()} {businessName}. All rights reserved.</p>
          <p>Powered by StatGrow</p>
      </footer>

      <AuthCustomer 
        isOpen={showAuthCustomer} 
        onClose={() => setShowAuthCustomer(false)} 
        onLoginSuccess={checkLoginStatus} 
      />

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        slug={slug}
      />
    </div>
  );
};

export default StoreFront;