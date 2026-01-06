import React from 'react';
import { 
  LayoutDashboard, ShoppingCart, Users, FileText, Package, 
  BarChart2, ChevronDown, ChevronUp, PlusCircle, Settings, Store // <--- Import Store Icon
} from 'lucide-react';

const Sidebar = ({ 
  data, activeTab, setActiveTab, 
  showSwitcher, setShowSwitcher, 
  handleSwitchBusiness, setShowSetupModal 
}) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'products', icon: Package, label: 'Products' },
    { id: 'customers', icon: Users, label: 'Customers' },
    { id: 'orders', icon: ShoppingCart, label: 'Orders' },
    { id: 'invoices', icon: FileText, label: 'Invoices' },
  ];

  // Helper to open store
  const openMyStore = () => {
    if (data?.active_business?.slug) {
      // Opens in new tab
      window.open(`/store/${data.active_business.slug}`, '_blank');
    } else {
      alert("Store is not active or slug is missing.");
    }
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
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
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon size={18}/> {item.label}
          </div>
        ))}

        {/* --- NEW: MY STORE LINK --- */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #374151', paddingTop: '10px' }}>
           <div className="nav-item" onClick={openMyStore} style={{ color: '#60A5FA' }}>
              <Store size={18} /> My Online Store
           </div>
        </div>

      </nav>

      {/* Business Switcher Footer (Keep existing code) */}
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
            <div className="dropdown-action" onClick={() => { setShowSetupModal(true); setShowSwitcher(false); }}>
              <Settings size={16}/> Manage Business
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