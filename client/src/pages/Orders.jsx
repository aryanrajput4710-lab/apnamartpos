import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../services/api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 20
      });
      if (search) params.append('search', search);
      if (paymentMethod) params.append('paymentMethod', paymentMethod);
      if (paymentStatus) params.append('paymentStatus', paymentStatus);
      if (orderStatus) params.append('orderStatus', orderStatus);

      const res = await api.get(`/orders?${params.toString()}`);
      setOrders(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, paymentMethod, paymentStatus, orderStatus]); // Re-fetch on filter change or page change

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>All Orders</h2>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '10px', top: '10px', color: '#9ca3af' }} size={20} />
            <input 
              type="text"
              placeholder="Search Order No, Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '0.5rem 0.5rem 0.5rem 2.5rem', width: '250px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            />
          </div>
          
          <select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}>
            <option value="">All Methods</option>
            <option value="CASH">CASH</option>
            <option value="QR">QR</option>
          </select>

          <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}>
            <option value="">All Pay Status</option>
            <option value="COMPLETED">PAID</option>
            <option value="PENDING">PENDING</option>
          </select>

          <select value={orderStatus} onChange={(e) => { setOrderStatus(e.target.value); setPage(1); }} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}>
            <option value="">All Order Status</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <button type="submit" style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>Search</button>
        </form>
      </div>

      {loading ? (
        <div>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#f9fafb', borderRadius: '8px', color: '#6b7280' }}>
          No orders found.
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Order Number</th>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Customer</th>
                  <th style={{ padding: '1rem' }}>Items</th>
                  <th style={{ padding: '1rem' }}>Total</th>
                  <th style={{ padding: '1rem' }}>Method</th>
                  <th style={{ padding: '1rem' }}>Pay Status</th>
                  <th style={{ padding: '1rem' }}>Order Status</th>
                  <th style={{ padding: '1rem' }}>Cashier</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{o.orderNumber || o.id.split('-')[0].toUpperCase()}</td>
                    <td style={{ padding: '1rem' }}>
                      {new Date(o.createdAt).toLocaleDateString()} <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {o.customer ? (
                        <Link to={`/customers/${o.customer.id}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                          {o.customer.name}
                        </Link>
                      ) : (
                        <span style={{ color: '#6b7280' }}>Walk-in</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>{o._count?.items || 0} line items</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>₹{parseFloat(o.total).toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>{o.payments?.[0]?.method || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.5rem', background: o.payments?.[0]?.status === 'COMPLETED' ? '#dcfce3' : '#fef3c7', color: o.payments?.[0]?.status === 'COMPLETED' ? '#16a34a' : '#d97706', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {o.payments?.[0]?.status === 'COMPLETED' ? 'PAID' : (o.payments?.[0]?.status || 'N/A')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.5rem', background: o.status === 'COMPLETED' ? '#dcfce3' : '#fee2e2', color: o.status === 'COMPLETED' ? '#16a34a' : '#dc2626', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: '#6b7280' }}>{o.user?.name}</td>
                    <td style={{ padding: '1rem' }}>
                      <Link to={`/receipt/${o.id}`} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>
                        View / Print
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '4px', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center' }}>Page {page} of {pagination.totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '4px', cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
