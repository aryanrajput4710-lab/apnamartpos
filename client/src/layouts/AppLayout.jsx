import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, ShoppingCart, Package, Users, Settings, FileText, UserPlus, TrendingUp, Menu, X } from 'lucide-react';

export default function AppLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['ADMIN'] },
    { name: 'POS', path: '/pos', icon: <ShoppingCart size={20} />, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Products', path: '/products', icon: <Package size={20} />, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Inventory', path: '/inventory', icon: <Package size={20} />, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Customers', path: '/customers', icon: <Users size={20} />, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Orders', path: '/orders', icon: <FileText size={20} />, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Reports', path: '/reports', icon: <TrendingUp size={20} />, roles: ['ADMIN'] },
    { name: 'Users', path: '/users', icon: <UserPlus size={20} />, roles: ['ADMIN'] },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} />, roles: ['ADMIN'] },
    { name: 'Audit Logs', path: '/audit-logs', icon: <FileText size={20} />, roles: ['ADMIN'] },
  ];

  const SidebarContent = () => (
    <>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/apna-mart-logo.jpg" alt="Apna Mart" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #374151' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>Apna Mart</h1>
            
          </div>
        </div>
        <button className="show-on-mobile" onClick={() => setDrawerOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }}>
          <X size={24} />
        </button>
      </div>
      
      <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
        {navItems.map((item) => {
          if (!item.roles.includes(currentUser.role)) return null;
          return (
            <Link
              key={item.name}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                color: '#d1d5db',
                textDecoration: 'none',
                gap: '0.75rem'
              }}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid #374151' }}>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 'bold' }}>{currentUser.name}</div>
          <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{currentUser.role}</div>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'transparent',
            color: '#fca5a5',
            border: 'none',
            cursor: 'pointer',
            padding: '0'
          }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      
      {/* Desktop Permanent Sidebar */}
      <div className="hide-on-mobile" style={{ width: '250px', backgroundColor: '#1f2937', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <SidebarContent />
      </div>

      {/* Mobile Drawer Overlay & Sidebar */}
      {drawerOpen && (
        <div className="drawer-backdrop show-on-mobile" onClick={() => setDrawerOpen(false)}></div>
      )}
      <div className={`mobile-drawer show-on-mobile ${drawerOpen ? 'open' : ''}`}>
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <header style={{ 
          backgroundColor: 'white', 
          padding: '1rem', 
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <button 
            className="show-on-mobile"
            onClick={() => setDrawerOpen(true)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
          >
            <Menu size={24} />
          </button>
          
          <h2 style={{ margin: 0, fontSize: '1.25rem', flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="hide-on-mobile">Welcome, {currentUser.name}</span>
            <span className="show-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src="/apna-mart-logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
              Apna Mart
            </span>
          </h2>

          <div className="show-on-mobile" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {currentUser.name}
          </div>
        </header>

        <main className="mobile-p-4" style={{ padding: '2rem', flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}


