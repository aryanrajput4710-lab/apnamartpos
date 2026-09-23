import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, ShoppingCart, Package, Users, Settings, FileText, UserPlus, TrendingUp } from 'lucide-react';

export default function AppLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#1f2937', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #374151' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Store POS</h1>
        </div>
        
        <nav style={{ flex: 1, padding: '1rem 0' }}>
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
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <header style={{ backgroundColor: 'white', padding: '1rem 2rem', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Welcome, {currentUser.name}</h2>
        </header>
        <main style={{ padding: '2rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
