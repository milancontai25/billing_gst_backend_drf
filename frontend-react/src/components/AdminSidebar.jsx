import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Briefcase, Database, Settings, LogOut, X } from 'lucide-react';

const AdminSidebar = ({ isMobileOpen, setIsMobileOpen, handleLogout }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Exact menu items from your screenshot
  const navItems = [
    { path: '/admin/users', name: 'User Management', icon: Users },
    { path: '/admin/businesses', name: 'Business Management', icon: Briefcase },
    { path: '/admin/data', name: 'Global Data', icon: Database },
    { path: '/admin/settings', name: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
      <div className="sidebar-header" style={{ padding: '24px 20px' }}>
        {/* Matches your screenshot branding */}
        <h2 style={{ color: '#60a5fa', fontWeight: '800', fontSize: '22px', margin: 0, letterSpacing: '0.5px' }}>
          StatGrow <span style={{ color: 'white' }}>ADMIN</span>
        </h2>
        <button className="mobile-close-btn" onClick={() => setIsMobileOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav" style={{ marginTop: '20px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout strictly at the bottom */}
      <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '20px' }}>
        <button 
          className="nav-item" 
          onClick={handleLogout}
          style={{ width: '100%', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          onMouseOver={(e) => e.currentTarget.style.color = '#f87171'}
          onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;