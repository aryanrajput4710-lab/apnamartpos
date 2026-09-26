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
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

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

  const isActiveRoute = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const currentPageName = navItems.find(item => isActiveRoute(item.path))?.name || 'Apna Mart';

  const isPOS = location.pathname === '/pos';

  const DrawerContent = () => (
    <>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/apna-mart-logo.jpg" alt="Apna Mart" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #374151' }} />
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>Apna Mart</h1>
        </div>
        <button
          onClick={() => setDrawerOpen(false)}
          style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      </div>

      <nav style={{ flex: 1, paddingTop: '0.75rem', overflowY: 'auto' }}>
        {navItems.map((item) => {
          if (!item.roles.includes(currentUser.role)) return null;
          const active = isActiveRoute(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.7rem 1.5rem',
                color: active ? 'white' : '#d1d5db',
                backgroundColor: active ? '#2563eb' : 'transparent',
                textDecoration: 'none',
                gap: '0.75rem',
                fontWeight: active ? '600' : '400',
                fontSize: '0.9375rem',
                borderLeft: active ? '3px solid white' : '3px solid transparent',
                transition: 'background 0.15s',
              }}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #374151' }}>
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: '600', color: 'white', fontSize: '0.9rem' }}>{currentUser.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{currentUser.role}</div>
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
            padding: '0',
            fontSize: '0.875rem',
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb', overflow: 'hidden' }}>

      {/* Drawer Backdrop */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 40 }}
          aria-hidden="true"
        />
      )}

      {/* Global Navigation Drawer */}
      <div
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: 'fixed',
          top: 0, bottom: 0, left: 0,
          width: '272px',
          backgroundColor: '#1f2937',
          color: 'white',
          zIndex: 50,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: drawerOpen ? '4px 0 20px rgba(0,0,0,0.25)' : 'none',
        }}
      >
        <DrawerContent />
      </div>

      {/* Main Content Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>

        {/* Global Header — hidden on POS (POS has its own top bar with the ☰ button) */}
        {!isPOS && (
          <header style={{
            backgroundColor: 'white',
            padding: '0.875rem 1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexShrink: 0,
            zIndex: 10,
          }}>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                flexShrink: 0,
              }}
            >
              <Menu size={22} color="#334155" />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1 }}>
              <img src="/apna-mart-logo.jpg" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
              <span style={{ fontWeight: '700', fontSize: '1rem', color: '#0f172a' }}>
                {currentPageName}
              </span>
            </div>

            <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: '500', flexShrink: 0 }}>
              {currentUser.name}
            </div>
          </header>
        )}

        {/* Page Content */}
        <main style={{
          flex: 1,
          overflow: isPOS ? 'hidden' : 'auto',
          padding: isPOS ? 0 : '1.75rem',
          height: isPOS ? '100%' : undefined,
        }}>
          <Outlet context={{ setDrawerOpen }} />
        </main>
      </div>
    </div>
  );
}
