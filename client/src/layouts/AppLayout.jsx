import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, ShoppingCart, Package, Users, Settings, FileText, UserPlus, TrendingUp, Menu, X, Tag } from 'lucide-react';

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
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN'] },
    { name: 'POS', path: '/pos', icon: ShoppingCart, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Price Check', path: '/price-check', icon: Tag, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Products', path: '/products', icon: Package, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Inventory', path: '/inventory', icon: Package, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Customers', path: '/customers', icon: Users, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Orders', path: '/orders', icon: FileText, roles: ['ADMIN', 'CASHIER'] },
    { name: 'Reports', path: '/reports', icon: TrendingUp, roles: ['ADMIN'] },
          { name: 'Users', path: '/users', icon: UserPlus, roles: ['ADMIN'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] },
    { name: 'Audit Logs', path: '/audit-logs', icon: FileText, roles: ['ADMIN'] },
  ];

  const isActiveRoute = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const currentPageName = navItems.find(item => isActiveRoute(item.path))?.name || 'Apna Mart';
  const isPOS = location.pathname === '/pos';
  const isPriceCheck = location.pathname === '/price-check';

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bottom Navigation tabs for mobile devices
  const mobileTabs = [
    { name: 'Price Check', path: '/price-check', icon: Tag },
    { name: 'POS', path: '/pos', icon: ShoppingCart },
    ...(currentUser?.role === 'ADMIN' 
      ? [{ name: 'Dashboard', path: '/', icon: LayoutDashboard }]
      : [{ name: 'Orders', path: '/orders', icon: FileText }]),
    { name: 'Products', path: '/products', icon: Package },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', maxWidth: '100vw', backgroundColor: '#f9fafb', overflow: 'hidden' }}>

      {/* Drawer Backdrop */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }}
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
          backgroundColor: '#111827',
          zIndex: 50,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0,0,0,0.35)',
          overflowY: 'hidden',
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '1.25rem 1.25rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          backgroundColor: '#0f172a',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src="/apna-mart-logo.jpg"
              alt="Apna Mart"
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }}
            />
            <span style={{ fontSize: '1.0625rem', fontWeight: '700', color: '#ffffff', letterSpacing: '-0.01em' }}>
              Apna Mart
            </span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2e8f0',
              cursor: 'pointer',
              padding: '0.375rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              lineHeight: 1,
            }}
          >
            <X size={18} color="#e2e8f0" />
          </button>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, paddingTop: '0.5rem', paddingBottom: '0.5rem', overflowY: 'auto', backgroundColor: '#1e293b' }}>
          {navItems.map((item) => {
            if (!item.roles.includes(currentUser.role)) return null;
            const active = isActiveRoute(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.7rem 1.25rem',
                  color: '#ffffff',
                  backgroundColor: active ? '#2563eb' : 'transparent',
                  textDecoration: 'none',
                  gap: '0.875rem',
                  fontWeight: active ? '700' : '500',
                  fontSize: '0.95rem',
                  borderLeft: active ? '4px solid #93c5fd' : '4px solid transparent',
                  transition: 'background-color 0.15s',
                  marginBottom: '2px',
                  opacity: active ? 1 : 0.9,
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.opacity = '1'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.opacity = '0.9'; } }}
              >
                <Icon size={19} color={active ? '#ffffff' : '#e2e8f0'} strokeWidth={active ? 2.5 : 2} />
                <span style={{ color: '#ffffff' }}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
          backgroundColor: '#0f172a',
        }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: '600', color: '#f1f5f9', fontSize: '0.875rem' }}>{currentUser.name}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '2px' }}>{currentUser.role}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'transparent',
              color: '#f87171',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              fontSize: '0.875rem',
              fontWeight: '500',
            }}
          >
            <LogOut size={15} color="#f87171" />
            <span style={{ color: '#f87171' }}>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden' }}>

        {/* Global Header — hidden on POS and Price Check (they manage their own headers) */}
        {!isPOS && !isPriceCheck && (
          <header style={{
            backgroundColor: 'white',
            padding: isMobile ? '0.625rem 0.875rem' : '0.875rem 1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexShrink: 0,
            zIndex: 10,
            borderBottom: '1px solid #f1f5f9',
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, padding: '0.25rem 0.75rem 0.25rem 0.25rem', borderRadius: '9999px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}>
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              {!isMobile && (
                <div style={{ fontSize: '0.8125rem', color: '#334155', fontWeight: '600' }}>
                  {currentUser.name}
                </div>
              )}
            </div>
          </header>
        )}

        {/* Page Content */}
        <main style={{
          flex: 1,
          overflow: isPOS ? 'hidden' : 'auto',
          padding: (isPOS || isPriceCheck) ? 0 : (isMobile ? '0.75rem' : '1.75rem'),
          paddingBottom: isMobile ? '4.5rem' : ((isPOS || isPriceCheck) ? 0 : '1.75rem'),
          height: isPOS ? '100%' : undefined,
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100vw',
        }}>
          <Outlet context={{ setDrawerOpen }} />
        </main>

        {/* Mobile Bottom Navigation Bar */}
        {isMobile && (
          <nav
            role="navigation"
            aria-label="Mobile Navigation"
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '56px',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              zIndex: 30,
              boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {mobileTabs.map(tab => {
              const active = isActiveRoute(tab.path);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.name}
                  to={tab.path}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    color: active ? '#2563eb' : '#64748b',
                    flex: 1,
                    height: '100%',
                    padding: '4px 0',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} color={active ? '#2563eb' : '#64748b'} />
                  <span style={{ fontSize: '0.7rem', fontWeight: active ? '700' : '500', marginTop: '2px', color: active ? '#2563eb' : '#64748b' }}>
                    {tab.name}
                  </span>
                </Link>
              );
            })}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open More Menu"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                flex: 1,
                height: '100%',
                padding: '4px 0',
                cursor: 'pointer',
              }}
            >
              <Menu size={20} color="#64748b" />
              <span style={{ fontSize: '0.7rem', fontWeight: '500', marginTop: '2px', color: '#64748b' }}>
                Menu
              </span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
