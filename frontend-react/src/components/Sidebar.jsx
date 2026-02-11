import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../assets/images/statgrow-logo.png';
import logo from '../assets/images/logo.png';
import { 
  LayoutDashboard, ShoppingCart, Users, FileText, Boxes, 
  BarChart2, ChevronDown, ChevronUp, PlusCircle, Settings, Store,
  ChevronLeft, ChevronRight, Edit, ShoppingBag // <--- Added ShoppingBag for Marketplace
} from 'lucide-react';

const Sidebar = ({ 
  data, activeTab, 
  showSwitcher, setShowSwitcher, 
  handleSwitchBusiness, 
  handleAddNewBusiness, 
  handleEditBusiness,   
  isCollapsed, setIsCollapsed,
  isMobileOpen, setIsMobileOpen
}) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { id: 'inventory', icon: Boxes, label: 'Inventory', path: '/inventory' },
    { id: 'customers', icon: Users, label: 'Customers', path: '/customers' },
    { id: 'orders', icon: ShoppingCart, label: 'Orders', path: '/orders' },
    { id: 'invoices', icon: FileText, label: 'Invoices', path: '/invoices' },
  ];

  const openMyStore = () => {
    if (data?.active_business?.slug) {
      window.open(`/${data.active_business.slug}`, '_blank');
    } else {
      alert("Store is not active or slug is missing.");
    }
  };

  const openMarketplace = () => {
    // You can adjust this path if your marketplace route is different
    window.open(`/store/marketplace`, '_blank');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      
      {/* 1. Toggle Button */}
      <div className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </div>

      {/* 2. Brand Header */}
      <div className="brand-header">
        {isCollapsed ? (
          <div className="logo-icon-collapsed">
             <img src={logo} alt="StatGrow Icon" className="sidebar-logo" />
          </div>
        ) : (
          <img src={logoImage} alt="StatGrow" className="sidebar-logo-img" />
        )}
      </div>

      {/* 3. Navigation */}
      <nav className="nav-menu">
        {menuItems.map((item) => (
          <div 
            key={item.id} 
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path)}
            title={isCollapsed ? item.label : ''} 
          >
            <item.icon size={20} style={{ minWidth: '20px' }} /> 
            <span className="nav-text">{item.label}</span>
          </div>
        ))}

        {/* EXTERNAL LINKS SECTION */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #374151', paddingTop: '10px' }}>
           
           {/* My Store Link */}
           <div className="nav-item" onClick={openMyStore} style={{ color: '#60A5FA' }} title="My Online Store">
              <Store size={20} style={{ minWidth: '20px' }} /> 
              <span className="nav-text">My Store</span>
           </div>

           {/* Marketplace Link */}
           <div className="nav-item" onClick={openMarketplace} style={{ color: '#A78BFA' }} title="Marketplace">
              <ShoppingBag size={20} style={{ minWidth: '20px' }} /> 
              <span className="nav-text">Marketplace</span>
           </div>

        </div>
      </nav>
      
      {/* 4. Footer / Business Switcher */}
      <div className="sidebar-footer">
        <div className="business-switcher">
          
          {/* Dropdown Menu */}
          {!isCollapsed && (
            <div className={`biz-dropdown ${showSwitcher ? 'show' : ''}`}>
                <div className="dropdown-header">All Business Profiles</div>
                
                {data?.businesses?.map(biz => (
                  <div key={biz.id} className="dropdown-item" onClick={() => handleSwitchBusiness(biz.id)}>
                      {biz.business_name}
                  </div>
                ))}
                
                <div className="dropdown-divider"></div>
                
                <div className="dropdown-item" onClick={handleEditBusiness}>
                   <Edit size={14}/> Edit Current Business
                </div>

                <div className="dropdown-action" onClick={handleAddNewBusiness}>
                   <PlusCircle size={16}/> Add New Business
                </div>
            </div>
          )}

          {/* Active Business Button */}
          <div className="active-business-btn" onClick={() => !isCollapsed && setShowSwitcher(!showSwitcher)}>
            <div className="biz-info">
              {data?.active_business?.logo_bucket_url ? (
                <img src={data.active_business.logo_bucket_url} className="biz-avatar" alt="logo" />
              ) : (
                <div className="biz-avatar text-avatar">
                  {data?.active_business?.business_name?.charAt(0) || 'B'}
                </div>
              )}
              
              {!isCollapsed && (
                <div className="biz-text">
                  <span className="biz-name-display" style={{ color: '#ffffff', fontWeight: '600' }}>
                      {data?.active_business?.business_name || "No Business"}
                  </span>
                  <span className="biz-role-display" style={{ color: '#9CA3AF' }}>
                      {data?.active_business?.owner_name || "Owner"}
                  </span>
                </div>
              )}
            </div>
            
            {!isCollapsed && (
               showSwitcher ? <ChevronUp size={16} color="#9CA3AF"/> : <ChevronDown size={16} color="#9CA3AF"/>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;