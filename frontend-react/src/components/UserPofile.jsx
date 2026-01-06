import React, { useState } from 'react';
import { Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react';

const UserProfile = ({ user, handleLogout, activeTab }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Define titles for each tab
  const pageTitles = {
    dashboard: 'Dashboard Overview',
    products: 'Inventory Management',
    customers: 'Customer List',
    orders: 'Order History',
    invoices: 'Invoices',
  };

  const currentTitle = pageTitles[activeTab] || 'Overview';

  return (
    <header className="top-bar">
      <h1 className="page-title">{currentTitle}</h1>
      
      <div className="user-profile-section">
        <div className="icon-btn">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </div>

        <div 
          className="user-info-trigger" 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          {isDropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-item">
                <User size={16} /> Manage Profile
              </div>
              <div className="dropdown-item">
                <Settings size={16} /> Settings
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item text-red" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default UserProfile;