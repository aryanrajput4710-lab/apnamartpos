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
        <button onClick={() => setDrawerOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }}>
          <X size={24} />
        </button>
      </div>
      
      <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
        {navItems.map((item) => {
          if (!item.roles.includes(currentUser.role)) return null;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.name}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1.5rem',
                color: isActive ? 'white' : '#d1d5db',
                backgroundColor: isActive ? '#3b82f6' : 'transparent',
                textDecoration: 'none',
                gap: '0.75rem',
                fontWeight: isActive ? '600' : 'normal',
                borderLeft: isActive ? '4px solid white' : '4px solid transparent'
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

  const isPOS = location.pathname === '/pos';

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb', overflow: 'hidden' }}>
      
      {/* Global Drawer Overlay */}
      {drawerOpen && (
        <div 
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 40 }}
        ></div>
      )}

      {/* Global Sidebar Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        width: '280px',
        backgroundColor: '#1f2937',
        color: 'white',
        zIndex: 50,
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: drawerOpen ? '4px 0 15px rgba(0,0,0,0.2)' : 'none'
      }}>
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', width: '100%' }}>
        
        {/* Global Header (Only show if NOT pos, because POS has its own specialized header within its component, OR show for all but simplify POS) 
            Wait, user said: "POS page should use the same global drawer... The POS workspace should remain full-width when the drawer is closed."
            And "Create/use one consistent header across all authenticated pages."
            But POS has "Register Open" pill, search bar, etc. 
            Actually, I can just hide the global header for POS and let POS implement the hamburger button, OR let POS use the global header.
            I will hide this standard global header on POS, and POS will render its own top bar but with the hamburger button triggering the global drawer.
            Wait, `drawerOpen` state is inside `AppLayout`. How can POS trigger it?
            We can pass `setDrawerOpen` via React Context, or Outlet context! 
        */}
        
        {!isPOS && (
          <header style={{ 
            backgroundColor: 'white', 
            padding: '1rem 1.5rem', 
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            zIndex: 10
          }}>
            <button 
              onClick={() => setDrawerOpen(true)}
              style={{ background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <Menu size={24} color="#334155" />
            </button>
            
            <h2 style={{ margin: 0, fontSize: '1.25rem', flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold' }}>
              <img src="/apna-mart-logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
              Apna Mart
            </h2>

            <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              {currentUser.name}
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className={!isPOS ? "mobile-p-4" : ""} style={{ flex: 1, overflow: isPOS ? 'hidden' : 'auto', padding: isPOS ? 0 : '2rem' }}>
          <Outlet context={{ setDrawerOpen }} />
        </main>
      </div>
    </div>
  );
}
