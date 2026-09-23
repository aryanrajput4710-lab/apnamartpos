import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Receipt from '../components/Receipt';

export default function ReceiptView() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/pos/orders/${id}/receipt`);
        setOrder(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching receipt');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading receipt...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }} className="no-print">
        <button onClick={() => window.print()} style={{ padding: '0.75rem 1.5rem', background: '#1f2937', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Print Receipt
        </button>
        <Link to="/pos" style={{ padding: '0.75rem 1.5rem', background: '#e5e7eb', color: '#374151', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
          Back to POS
        </Link>
      </div>
      
      <div style={{ border: '1px solid #e5e7eb', background: '#f9fafb', padding: '1rem' }}>
        <Receipt order={order} />
      </div>
    </div>
  );
}
