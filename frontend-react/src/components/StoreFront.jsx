import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom'; 
import { ShoppingCart, Search, Store, User } from 'lucide-react';
import AuthCustomer from './AuthCustomer'; // <--- IMPORT THE NEW COMPONENT
import '../assets/css/storefront.css'; 

const StoreFront = () => {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // --- AUTH STATE ---
  const [showAuthCustomer, setShowAuthCustomer] = useState(false); // Only this state needed now!

  // Categories list
  const categories = ["All", "Cosmetics", "Grocery", "Fashion", "Electronics", "Home Decor", "Furniture"];
  const API_URL = `http://127.0.0.1:8000/api/v1/business/${slug}/items/`;

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_URL);
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

  const filteredProducts = products.filter(p => {
    const pName = p.item_name ? p.item_name.toLowerCase() : "";
    const pCat = p.category ? p.category.toLowerCase() : "";
    const search = searchTerm.toLowerCase();
    const matchesSearch = pName.includes(search) || pCat.includes(search);
    const matchesCategory = selectedCategory === 'All' ? true : pCat === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="loading-container">Loading Store...</div>;

  return (
    <div className="store-body">
      
      {/* --- HEADER --- */}
      <header className="store-header">
        <div className="header-content">
          <div className="brand-section">
            <div className="brand-logo-box"><Store size={24} /></div>
            <h1 className="brand-name">{businessName}</h1>
          </div>
          
          <div className="search-container">
            <input 
              type="text" className="search-input" placeholder="Search for products..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={18} className="search-icon" />
          </div>

          <div className="header-actions">
            {/* Login Trigger */}
            <button className="login-link-btn" onClick={() => setShowAuthCustomer(true)}>
               <User size={18} style={{marginRight:'5px', verticalAlign:'text-bottom'}}/> Login
            </button>
            
            <button className="cart-btn">
              <ShoppingCart size={24} color="#374151" />
              <span className="cart-badge">0</span>
            </button>
          </div>
        </div>

        <div className="category-bar">
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
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="store-main">
        {filteredProducts.length === 0 ? (
          <div className="no-products">
            <h3>No products found</h3>
            <p>Try changing the category or search term.</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image-box">
                  {product.item_image_url ? (
                    <img src={product.item_image_url} alt={product.item_name} className="product-img" />
                  ) : (
                    <span className="placeholder-img">{product.item_name.charAt(0)}</span>
                  )}
                </div>
                <div className="product-details">
                  <div className="product-cat">{product.category}</div>
                  <h3 className="product-name">{product.item_name}</h3>
                  <p className="product-desc">{product.description || 'No description available'}</p>
                  <div className="product-footer">
                    <div className="price">₹{product.mrp_baseprice}</div>
                    <button className="add-btn">Add to Cart</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- RENDER AUTH MODAL --- */}
      <AuthCustomer 
        isOpen={showAuthCustomer} 
        onClose={() => setShowAuthCustomer(false)} 
      />

    </div>
  );
};

export default StoreFront;