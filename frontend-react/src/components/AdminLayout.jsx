import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { Menu, Bell, User } from 'lucide-react';
import '../assets/css/dashboard.css'; 

const AdminLayout = () => {
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  return (
    <div className="app-container">
      
      {/* 1. ADMIN SIDEBAR */}
      <AdminSidebar 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
        handleLogout={handleLogout} 
      />

      {/* Mobile background dim overlay */}
      <div 
        className={`mobile-overlay ${isMobileOpen ? 'show' : ''}`} 
        onClick={() => setIsMobileOpen(false)} 
      />

      {/* 2. MAIN CONTENT AREA */}
      <main className="main-content" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Admin Top Header Bar */}
        <header style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '24px', 
            background: 'white', 
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button className="mobile-menu-btn" onClick={() => setIsMobileOpen(true)} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Menu size={24} className="text-gray-600" />
            </button>
          </div>
          
          {/* Right side Profile & Notifications */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
              <Bell size={20} className="text-gray-500 hover:text-gray-700" />
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></span>
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '15px', borderLeft: '1px solid #e2e8f0' }}>
              <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                <User size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }} className="hidden sm:flex">
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', lineHeight: '1' }}>System Admin</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Administrator</span>
              </div>
            </div>
          </div>

        </header>

        {/* 3. NESTED PAGES RENDER HERE (e.g., AdminUsers.jsx) */}
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>

      </main>
    </div>
  );
};

export default AdminLayout;