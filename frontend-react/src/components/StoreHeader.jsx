import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut, Package, X, ChevronDown, Menu } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // NEW: Mobile Menu State
  const searchInputRef = useRef(null);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentType = searchParams.get('type');
  
  const isCategoriesActive = location.pathname === `/${slug}` && !currentType;
  const isProductsActive = currentType === 'goods';
  const isServicesActive = currentType === 'services';
  const isOurStoryActive = location.pathname === `/${slug}/about`;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isSearchOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, currentType]);

  return (
    <header className={`store-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        
        {/* --- LEFT: BRAND LOGO & NAME --- */}
        <Link to={`/${slug}`} className="brand-section">
          {businessLogo && (
              <img 
                src={businessLogo} 
                className="brand-logo-img" 
                alt="logo" 
                onError={(e) => e.target.style.display='none'} 
              />
          )}
          {/* RESTORED: Business Name, formatted to be smaller via CSS */}
          <h1 className="brand-name-elegant" title={businessName}>
              {businessName || 'LUXE'}
          </h1>
        </Link>
        
        {/* --- CENTER: DESKTOP NAVIGATION MENU --- */}
        <nav className="header-nav">
          <Link to={`/${slug}`} className={`header-nav-link ${isCategoriesActive ? 'active' : ''}`}>
            Categories
          </Link>
          {hasProducts && (
            <Link to={`/${slug}/items?type=goods`} className={`header-nav-link ${isProductsActive ? 'active' : ''}`}>
              Products
            </Link>
          )}
          {hasServices && (
            <Link to={`/${slug}/items?type=services`} className={`header-nav-link ${isServicesActive ? 'active' : ''}`}>
              Services
            </Link>
          )}
          <Link to={`/${slug}`} className={`header-nav-link ${isOurStoryActive ? 'active' : ''}`}>
            Our Story
          </Link>
        </nav>

        {/* --- RIGHT: ICONS --- */}
        <div className="header-actions">
          
          {/* Search */}
          <div className="header-search-wrapper">
            <div className="search-input-group">
              {!isSearchOpen ? (
                <button className="action-icon-btn" onClick={() => setIsSearchOpen(true)}>
                  <Search size={20} />
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

          {/* User Auth */}
          <div className="user-info-trigger">
            {isLoggedIn ? (
              <div className="auth-icon-wrapper" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <div className="user-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
                <ChevronDown size={14} color="#6B7280" style={{ marginLeft: '4px' }} />
                
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
                <User size={20} />
              </button>
            )}
          </div>

          {/* Cart */}
          <button className="action-icon-btn cart-icon-wrapper" onClick={onCartClick}>
            <ShoppingCart size={20} />
          </button>

          {/* NEW: Clickable Mobile Hamburger Menu */}
          <button 
            className="action-icon-btn mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* --- NEW: MOBILE NAVIGATION DROPDOWN --- */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-dropdown">
          <Link to={`/${slug}`} className={`mobile-nav-link ${isCategoriesActive ? 'active' : ''}`}>
            Categories
          </Link>
          {hasProducts && (
            <Link to={`/${slug}/items?type=goods`} className={`mobile-nav-link ${isProductsActive ? 'active' : ''}`}>
              Products
            </Link>
          )}
          {hasServices && (
            <Link to={`/${slug}/items?type=services`} className={`mobile-nav-link ${isServicesActive ? 'active' : ''}`}>
              Services
            </Link>
          )}
          <Link to={`/${slug}`} className={`mobile-nav-link ${isOurStoryActive ? 'active' : ''}`}>
            Our Story
          </Link>
        </div>
      )}
    </header>
  );
};

export default StoreHeader;