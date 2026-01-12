import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { 
  LayoutDashboard, ShoppingCart, Users, FileText, Package, 
  BarChart2, ChevronDown, ChevronUp, PlusCircle, Settings, Store 
} from 'lucide-react';

const Sidebar = ({ 
  data, activeTab, 
  showSwitcher, setShowSwitcher, 
  handleSwitchBusiness, setShowSetupModal 
}) => {
  const navigate = useNavigate(); // Hook for navigation

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

  return (
    <aside className="sidebar">
      <div className="brand-header">
        <div className="brand-logo">
          <BarChart2 size={28} color="#3B82F6" /> 
          <span className="text-white ml-2" style={{ color: '#fff' }}>StatGrow</span>
        </div>
      </div>

      <nav className="nav-menu">
        {menuItems.map((item) => (
          <div 
            key={item.id} 
            // Check if URL contains the ID (simple active check)
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => navigate(item.path)} // Navigate to URL
          >
            <item.icon size={18}/> {item.label}
          </div>
        ))}

        <div style={{ marginTop: '20px', borderTop: '1px solid #374151', paddingTop: '10px' }}>
           <div className="nav-item" onClick={openMyStore} style={{ color: '#60A5FA' }}>
              <Store size={18} /> My Online Store
           </div>
        </div>
      </nav>
      
      {/* Footer / Switcher (Same as before) */}
      <div className="sidebar-footer">
        <div className="business-switcher">
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

          <div className="active-business-btn" onClick={() => setShowSwitcher(!showSwitcher)}>
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
            {showSwitcher ? <ChevronUp size={16} color="#9CA3AF"/> : <ChevronDown size={16} color="#9CA3AF"/>}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;