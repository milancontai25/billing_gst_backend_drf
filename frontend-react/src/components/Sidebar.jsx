import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Users, FileText, Package, 
  BarChart2, ChevronDown, ChevronUp, PlusCircle, Settings, Store,
  ChevronLeft, ChevronRight // Import arrows for toggle
} from 'lucide-react';

const Sidebar = ({ 
  data, activeTab, 
  showSwitcher, setShowSwitcher, 
  handleSwitchBusiness, setShowSetupModal,
  // NEW PROPS
  isCollapsed, setIsCollapsed,
  isMobileOpen, setIsMobileOpen
}) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { id: 'products', icon: Package, label: 'Products', path: '/products' },
    { id: 'customers', icon: Users, label: 'Customers', path: '/customers' },
    { id: 'orders', icon: ShoppingCart, label: 'Orders', path: '/orders' },
    { id: 'invoices', icon: FileText, label: 'Invoices', path: '/invoices' },
  ];

  const openMyStore = () => {
    if (data?.active_business?.slug) {
      window.open(`/store/${data.active_business.slug}`, '_blank');
    } else {
      alert("Store is not active or slug is missing.");
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileOpen(false); // Close sidebar on mobile after clicking
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
      
      {/* 1. Toggle Button (Desktop Only) */}
      <div className="sidebar-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </div>

      {/* 2. Brand Header */}
      <div className="brand-header">
        <div className="brand-logo">
          <BarChart2 size={28} color="#3B82F6" /> 
          <span className="text-white ml-2 brand-text" style={{ color: '#fff' }}>StatGrow</span>
        </div>
      </div>

      {/* 3. Navigation */}
      <nav className="nav-menu">
        {menuItems.map((item) => (
          <div 
            key={item.id} 
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path)}
            title={isCollapsed ? item.label : ''} // Tooltip on hover when collapsed
          >
            <item.icon size={20} style={{ minWidth: '20px' }} /> 
            <span className="nav-text">{item.label}</span>
          </div>
        ))}

        <div style={{ marginTop: '20px', borderTop: '1px solid #374151', paddingTop: '10px' }}>
           <div className="nav-item" onClick={openMyStore} style={{ color: '#60A5FA' }} title="My Online Store">
              <Store size={20} style={{ minWidth: '20px' }} /> 
              <span className="nav-text">My Store</span>
           </div>
        </div>
      </nav>
      
      {/* 4. Footer / Business Switcher */}
      <div className="sidebar-footer">
        <div className="business-switcher">
          
          {/* Dropdown Menu (Hidden if collapsed or logic to show popover can be added later) */}
          {!isCollapsed && (
            <div className={`biz-dropdown ${showSwitcher ? 'show' : ''}`}>
                <div className="dropdown-header">All Business Profiles</div>
                {data?.businesses?.map(biz => (
                <div key={biz.id} className="dropdown-item" onClick={() => handleSwitchBusiness(biz.id)}>
                    {biz.business_name}
                </div>
                ))}
                <div className="dropdown-divider"></div>
                <div className="dropdown-action" onClick={() => { setShowSetupModal(true); setShowSwitcher(false); }}>
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
              
              <div className="biz-text">
                <span className="biz-name-display" style={{ color: '#ffffff', fontWeight: '600' }}>
                    {data?.active_business?.business_name || "No Business"}
                </span>
                <span className="biz-role-display" style={{ color: '#9CA3AF' }}>
                    {data?.active_business?.owner_name || "Owner"}
                </span>
              </div>
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