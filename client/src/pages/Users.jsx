import { useState, useEffect } from 'react';
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

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <h3>User Management</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'white', borderRadius: '8px' }}>
        <h4>Create New User</h4>
        <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label>Name</label><br/>
            <input required value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label>Email</label><br/>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label>Password</label><br/>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <label>Role</label><br/>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="CASHIER">CASHIER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <button type="submit" style={{ padding: '0.25rem 1rem' }}>Create</button>
        </form>
      </div>

      <div className="table-responsive"><table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ccc' }}>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem 0' }}>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.isActive ? 'Active' : 'Inactive'}</td>
              <td>
                <button onClick={() => toggleActive(u.id, u.isActive)}>
                  {u.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}

