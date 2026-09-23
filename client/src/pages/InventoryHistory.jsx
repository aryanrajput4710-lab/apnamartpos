import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function InventoryHistory() {
  const { variantId } = useParams();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [variantId]);

  const fetchHistory = async () => {
    try {
      const url = variantId ? `/inventory/${variantId}/history` : '/inventory/history';
      const res = await api.get(url);
      setHistory(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>{variantId ? 'Variant Stock History' : 'Global Stock History'}</h3>
      
      {loading ? <p>Loading...</p> : (
        <div className="table-responsive"><table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '0.75rem' }}>Date</th>
              {!variantId && <th style={{ padding: '0.75rem' }}>Product</th>}
              <th style={{ padding: '0.75rem' }}>Type</th>
              <th style={{ padding: '0.75rem' }}>Quantity</th>
              <th style={{ padding: '0.75rem' }}>Prev → New</th>
              <th style={{ padding: '0.75rem' }}>Reason</th>
              <th style={{ padding: '0.75rem' }}>By</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr key={h.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem' }}>{new Date(h.createdAt).toLocaleString()}</td>
                {!variantId && <td style={{ padding: '0.75rem' }}>{h.variant?.product?.name}</td>}
                <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{h.type}</td>
                <td style={{ padding: '0.75rem' }}>{['STOCK_IN', 'ADJUSTMENT'].includes(h.type) && h.newStock >= h.previousStock ? '+' : '-'}{h.quantity}</td>
                <td style={{ padding: '0.75rem' }}>{h.previousStock} → {h.newStock}</td>
                <td style={{ padding: '0.75rem' }}>{h.reason}</td>
                <td style={{ padding: '0.75rem' }}>{h.user?.name}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
}

