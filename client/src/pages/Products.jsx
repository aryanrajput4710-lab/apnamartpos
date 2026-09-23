import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/products?search=${search}`);
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, isActive) => {
    try {
      await api.patch(`/products/${id}/status`, { isActive: !isActive });
      fetchProducts();
    } catch (err) {
      alert('Error changing status');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Products</h3>
        {currentUser.role === 'ADMIN' && (
          <Link to="/products/new" style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Add Product
          </Link>
        )}
      </div>

      <input 
        type="text" 
        placeholder="Search products by name, SKU, barcode..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
      />

      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '0.75rem' }}>Name</th>
              <th style={{ padding: '0.75rem' }}>Category</th>
              <th style={{ padding: '0.75rem' }}>Variants</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>{p.name}</td>
                <td style={{ padding: '0.75rem' }}>{p.category}</td>
                <td style={{ padding: '0.75rem' }}>{p._count.variants}</td>
                <td style={{ padding: '0.75rem' }}>{p.isActive ? 'Active' : 'Inactive'}</td>
                <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/products/${p.id}`}>View / Labels</Link>
                  {currentUser.role === 'ADMIN' && (
                    <button onClick={() => toggleStatus(p.id, p.isActive)}>
                      {p.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
