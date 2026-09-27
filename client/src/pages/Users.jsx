import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, UserPlus, Mail, Lock, User } from 'lucide-react';
import api from '../services/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CASHIER');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', { name, email, password, role });
      setName('');
      setEmail('');
      setPassword('');
      setRole('CASHIER');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating user');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await api.patch(`/users/${id}/active`, { isActive: !currentStatus });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error toggling user status');
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading users...</div>;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: '"Inter", "Plus Jakarta Sans", system-ui, sans-serif' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0, marginBottom: '0.25rem' }}>User Management</h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Manage system access, roles, and cashier accounts</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={18} /> {error}
        </div>
      )}

      {/* Create User Card */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={18} color="#4b5563" /> Create New User
        </h2>
        <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.25rem' }}>Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" style={{ width: '100%', paddingTop: '8px', paddingRight: '12px', paddingBottom: '8px', paddingLeft: '40px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.25rem' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" style={{ width: '100%', paddingTop: '8px', paddingRight: '12px', paddingBottom: '8px', paddingLeft: '40px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.25rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Secure Password" style={{ width: '100%', paddingTop: '8px', paddingRight: '12px', paddingBottom: '8px', paddingLeft: '40px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.25rem' }}>Role</label>
            <div style={{ position: 'relative' }}>
              <Shield size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', paddingTop: '8px', paddingRight: '12px', paddingBottom: '8px', paddingLeft: '40px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', boxSizing: 'border-box', backgroundColor: 'white' }}>
                <option value="CASHIER">CASHIER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
          <button type="submit" style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, backgroundColor: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', height: '38px', transition: 'background-color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}>
            Create User
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</th>
                <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => (
                <tr key={u.id} style={{ borderBottom: index === users.length - 1 ? 'none' : '1px solid #e5e7eb', transition: 'background-color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{u.name}</div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#4b5563', fontSize: '0.875rem' }}>{u.email}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: u.role === 'ADMIN' ? '#e0e7ff' : '#f3f4f6', color: u.role === 'ADMIN' ? '#4338ca' : '#4b5563' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: u.isActive ? '#dcfce7' : '#fef2f2', color: u.isActive ? '#15803d' : '#b91c1c' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: u.isActive ? '#15803d' : '#b91c1c' }}></span>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => toggleActive(u.id, u.isActive)}
                      style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, backgroundColor: 'white', color: u.isActive ? '#b91c1c' : '#15803d', border: `1px solid ${u.isActive ? '#fca5a5' : '#86efac'}`, cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = u.isActive ? '#fef2f2' : '#f0fdf4'} 
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
