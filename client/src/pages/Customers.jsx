import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { SkeletonRow, SkeletonCard } from '../components/SkeletonRow';
import api from '../services/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchCustomers = async (p = page, q = search) => {
    setLoading(true);
    try {
      const res = await api.get(`/customers?page=${p}&limit=20&search=${encodeURIComponent(q)}`);
      setCustomers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers(1, search);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: '"Inter", "Plus Jakarta Sans", system-ui, sans-serif' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0, marginBottom: '0.25rem' }}>Customers</h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>View and manage customer profiles and purchase history</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Search Bar */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ position: 'relative', flex: 1, minWidth: '250px', display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input 
                type="text" 
                placeholder="Search by name or phone..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '0.625rem 0.875rem 0.625rem 2.5rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }}
                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <button type="submit" style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, backgroundColor: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', transition: 'background-color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}>
              Search
            </button>
          </form>
        </div>

        {/* Table Area */}
        {loading ? (
          <div><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : customers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={32} color="#d1d5db" />
            <p style={{ margin: 0, fontWeight: 500, color: '#374151' }}>No customers found</p>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Orders</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Spent</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Purchase</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, index) => (
                    <tr key={c.id} style={{ borderBottom: index === customers.length - 1 ? 'none' : '1px solid #e5e7eb', transition: 'background-color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{c.name}</div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#4b5563', fontSize: '0.875rem' }}>{c.phone}</td>
                      <td style={{ padding: '1rem 1.25rem', color: '#374151', fontSize: '0.875rem' }}>{c.totalOrders}</td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>
                        Rs. {parseFloat(c.totalSpent).toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                        {c.orders?.length > 0 ? new Date(c.orders[0].createdAt).toLocaleDateString() : 'No purchases yet'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <Link to={`/customers/${c.id}`} style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, backgroundColor: 'white', color: '#4b5563', border: '1px solid #d1d5db', textDecoration: 'none', transition: 'all 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.borderColor = '#9ca3af'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#d1d5db'; }}>
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer with Pagination */}
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '0.875rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                Showing <strong>{(page - 1) * 20 + (customers.length > 0 ? 1 : 0)}</strong>–<strong>{(page - 1) * 20 + customers.length}</strong> of <strong>{pagination.total || 0}</strong> customers
              </span>
              
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', padding: 0, border: '1px solid #d1d5db', background: 'white', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>{page} / {pagination.totalPages}</span>
                  <button 
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', padding: 0, border: '1px solid #d1d5db', background: 'white', borderRadius: '6px', cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer', opacity: page === pagination.totalPages ? 0.5 : 1 }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
