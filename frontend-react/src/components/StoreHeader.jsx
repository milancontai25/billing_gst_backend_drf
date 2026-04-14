import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut, Package, X } from 'lucide-react';
import '../assets/css/storeheader.css'; 

const StoreHeader = ({ 
  slug, 
  businessName, 
  businessLogo, 
  searchTerm, 
  setSearchTerm, 
  isLoggedIn, 
  user, 
  onLoginClick, 
  onLogoutClick, 
  onCartClick,
  isDropdownOpen,
  setIsDropdownOpen,
  hasProducts, 
  hasServices 
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isSearchOpen]);

  return (
    <header className={`store-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        
        <Link to={`/${slug}`} className="brand-section">
          {businessLogo && (
              <img 
                src={businessLogo} 
                className="brand-logo-img" 
                alt="logo" 
                onError={(e) => e.target.style.display='none'} 
              />
          )}
          <h1 className="brand-name-elegant" title={businessName}>
              {businessName || 'LUXE'}
          </h1>
        </Link>
        
        {/* --- DYNAMIC ROUTING NAVIGATION --- */}
        <nav className="header-nav">
          <Link to={`/${slug}`} className="header-nav-link">Categories</Link>
          {hasProducts && <Link to={`/${slug}/items?type=goods`} className="header-nav-link">Products</Link>}
          {hasServices && <Link to={`/${slug}/items?type=services`} className="header-nav-link">Services</Link>}
          <Link to={`/${slug}/about`} className="header-nav-link">Our Story</Link>
        </nav>

        <div className="header-actions">
          <div className="header-search-wrapper">
            <div className="search-input-group">
              {!isSearchOpen ? (
                <button className="action-icon-btn" onClick={() => setIsSearchOpen(true)}>
                  <Search size={22} />
                </button>
              ) : (
                <Search size={18} color="#9CA3AF" className="search-active-icon" />
              )}
              
              <input 
                ref={searchInputRef}
                type="text" 
                className={`header-search-input ${isSearchOpen ? 'open' : ''}`}
                placeholder="Search..." 
                value={typeof searchTerm === 'string' ? searchTerm : ''}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              {isSearchOpen && (
                <button 
                    className="action-icon-btn close-search-btn" 
                    onClick={() => {
                        setIsSearchOpen(false);
                        setSearchTerm(''); 
                    }}
                >
                  <X size={18} color="#6B7280" />
                </button>
              )}
            </div>
          </div>

          <div className="user-info-trigger">
            {isLoggedIn ? (
              <div className="auth-icon-wrapper" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <div className="user-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
                
                {isDropdownOpen && (
                  <div className="profile-dropdown">
                    <div className="dropdown-header">Hello, {user?.name}</div>
                    <Link to={`/${slug}/orders`} className="dropdown-item"><Package size={16} /> My Orders</Link>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-item text-red" onClick={onLogoutClick}><LogOut size={16} /> Logout</div>
                  </div>
                )}
              </div>
            ) : (
              <button className="action-icon-btn" onClick={onLoginClick}>
                <User size={22} />
              </button>
            )}
          </div>

          <button className="action-icon-btn cart-icon-wrapper" onClick={onCartClick}>
            <ShoppingCart size={22} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default StoreHeader;