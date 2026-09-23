import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await api.get(`/customers/${id}`);
        setCustomer(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCustomer();
  }, [id]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get(`/customers/${id}/orders?page=${page}&limit=20`);
        setOrders(res.data.data);
        setPagination(res.data.pagination);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [id, page]);

  if (loading && !customer) return <div style={{ padding: '2rem' }}>Loading customer profile...</div>;
  if (!customer) return <div style={{ padding: '2rem', color: 'red' }}>Customer not found</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/customers" style={{ color: '#6b7280', textDecoration: 'none' }}>&larr; Back to Customers</Link>
      </div>

      {/* Profile Header */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <h2 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.8rem' }}>{customer.name}</h2>
        <div style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 0.25rem 0' }}><strong>Phone:</strong> {customer.phone}</p>
          {customer.email && <p style={{ margin: '0 0 0.25rem 0' }}><strong>Email:</strong> {customer.email}</p>}
          {customer.address && <p style={{ margin: '0 0 0.25rem 0' }}><strong>Address:</strong> {customer.address}</p>}
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', minWidth: '150px' }}>
            <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>Total Orders</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{customer.totalOrders}</p>
          </div>
          <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', minWidth: '150px' }}>
            <p style={{ margin: '0 0 0.5rem 0', color: '#16a34a', fontSize: '0.875rem' }}>Total Spent</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#15803d' }}>₹{parseFloat(customer.totalSpent).toFixed(2)}</p>
          </div>
          <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', minWidth: '150px' }}>
            <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>Last Purchase</p>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>
              {customer.orders?.length > 0 ? new Date(customer.orders[0].createdAt).toLocaleDateString() : 'No purchases yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Order History */}
      <h3 style={{ marginBottom: '1rem' }}>Order History</h3>
      
      {loading ? (
        <div>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={{ padding: '2rem', background: '#f9fafb', borderRadius: '8px', color: '#6b7280', textAlign: 'center' }}>
          No completed purchases yet.
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div className="table-responsive"><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Order Number</th>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Total</th>
                  <th style={{ padding: '1rem' }}>Payment</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{o.orderNumber || o.id.split('-')[0].toUpperCase()}</td>
                    <td style={{ padding: '1rem' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>₹{parseFloat(o.total).toFixed(2)}</td>
                    <td style={{ padding: '1rem' }}>{o.payments?.[0]?.method || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.5rem', background: o.status === 'COMPLETED' ? '#dcfce3' : '#fee2e2', color: o.status === 'COMPLETED' ? '#16a34a' : '#dc2626', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <Link to={`/receipt/${o.id}`} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold', marginRight: '1rem' }}>
                        View / Print
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
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

