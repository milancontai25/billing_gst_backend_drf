import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, Store, Package, User, LogOut } from 'lucide-react';
import '../assets/css/storefront.css';

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
  setIsDropdownOpen
}) => {
  return (
    <header className="store-header">
      <div className="header-content">
        <Link to={`/${slug}`} className="brand-section">
          <div className="brand-logo-box">
            {businessLogo ? (
              <img 
                src={businessLogo} 
                className="brand-logo-img" 
                alt="logo" 
                onError={(e) => e.target.style.display='none'} 
              />
            ) : (
              <Store size={22} />
            )}
          </div>
          <h1 className="brand-name">{businessName}</h1>
        </Link>
        
        {/* --- SEARCH BAR FIX --- */}
        <div className="search-container">
          {setSearchTerm && (
            <>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search products..." 
                value={typeof searchTerm === 'string' ? searchTerm : ''} // Safety check
                onChange={(e) => setSearchTerm(e.target.value)} // <--- FIXED HERE
              />
              <Search size={18} className="search-icon" />
            </>
          )}
        </div>

        <div className="header-actions">
          {isLoggedIn ? (
            <div className="user-info-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <div className="user-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
              {isDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">Hello, {user?.name}</div>
                  <Link to={`/${slug}/orders`} className="dropdown-item"><Package size={16} /> My Orders</Link>
                  <div className="dropdown-item"><User size={16} /> Profile</div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item text-red" onClick={onLogoutClick}><LogOut size={16} /> Logout</div>
                </div>
              )}
            </div>
          ) : (
            <button className="login-link-btn" onClick={onLoginClick}>Login / Sign Up</button>
          )}
          <button className="cart-btn" onClick={onCartClick}><ShoppingCart size={20} /></button>
        </div>
      </div>
    </header>
  );
};

export default StoreHeader;