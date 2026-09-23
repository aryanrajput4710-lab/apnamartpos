import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Inventory() {
  const [variants, setVariants] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { currentUser } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // STOCK_IN, STOCK_OUT, ADJUST
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('MANUAL');

  useEffect(() => {
    fetchInventory();
    fetchSummary();
  }, [search]);

  const fetchInventory = async () => {
    try {
      const res = await api.get(`/inventory?search=${search}`);
      setVariants(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get('/inventory/summary');
      setSummary(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (variant, type) => {
    setSelectedVariant(variant);
    setModalType(type);
    setQuantity(type === 'ADJUST' ? variant.stock : '');
    setReason('MANUAL');
    setShowModal(true);
  };

  const handleStockAction = async (e) => {
    e.preventDefault();
    try {
      const endpoint = modalType === 'ADJUST' 
        ? '/inventory/adjust' 
        : (modalType === 'STOCK_IN' ? '/inventory/stock-in' : '/inventory/stock-out');
      
      const payload = {
        variantId: selectedVariant.id,
        reason
      };

      if (modalType === 'ADJUST') {
        payload.physicalStock = Number(quantity);
      } else {
        payload.quantity = Number(quantity);
      }

      await api.post(endpoint, payload);
      setShowModal(false);
      fetchInventory();
      fetchSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating stock');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Inventory Management</h3>
        {currentUser.role === 'ADMIN' && (
          <Link to="/inventory/history" style={{ padding: '0.5rem 1rem', background: '#374151', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            View Global History
          </Link>
        )}
      </div>

      {summary && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ flex: 1, padding: '1rem', background: 'white', borderRadius: '8px' }}>
            <h4>Total Products</h4>
            <p>{summary.totalProducts}</p>
          </div>
          <div style={{ flex: 1, padding: '1rem', background: 'white', borderRadius: '8px' }}>
            <h4>Total Variants</h4>
            <p>{summary.totalVariants}</p>
          </div>
          <div style={{ flex: 1, padding: '1rem', background: 'white', borderRadius: '8px' }}>
            <h4>Units In Stock</h4>
            <p>{summary.totalUnits}</p>
          </div>
          <div style={{ flex: 1, padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}>
            <h4>Low Stock</h4>
            <p>{summary.lowStockCount}</p>
          </div>
          <div style={{ flex: 1, padding: '1rem', background: '#fee2e2', borderRadius: '8px' }}>
            <h4>Out of Stock</h4>
            <p>{summary.outOfStockCount}</p>
          </div>
          <div style={{ flex: 1, padding: '1rem', background: '#dcfce3', borderRadius: '8px' }}>
            <h4>Potential Value</h4>
            <p>Rs. {summary.potentialValue}</p>
          </div>
        </div>
      )}

      <input 
        type="text" 
        placeholder="Search inventory by name, SKU, barcode..." 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
      />

      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '0.75rem' }}>Product</th>
              <th style={{ padding: '0.75rem' }}>SKU</th>
              <th style={{ padding: '0.75rem' }}>Stock</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {variants.map(v => {
              let status = 'In Stock';
              let color = 'green';
              if (v.stock === 0) {
                status = 'Out of Stock';
                color = 'red';
              } else if (v.stock <= v.lowStockThreshold) {
                status = 'Low Stock';
                color = 'orange';
              }

              return (
                <tr key={v.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {v.product.name} {v.size ? `- ${v.size}` : ''} {v.color ? `- ${v.color}` : ''}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{v.sku}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{v.stock}</td>
                  <td style={{ padding: '0.75rem', color, fontWeight: 'bold' }}>{status}</td>
                  <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/inventory/${v.id}/history`}>History</Link>
                    {currentUser.role === 'ADMIN' && (
                      <>
                        <button onClick={() => openModal(v, 'STOCK_IN')} style={{ background: '#dcfce3', border: '1px solid #4ade80' }}>In</button>
                        <button onClick={() => openModal(v, 'STOCK_OUT')} style={{ background: '#fee2e2', border: '1px solid #f87171' }}>Out</button>
                        <button onClick={() => openModal(v, 'ADJUST')} style={{ background: '#e0e7ff', border: '1px solid #818cf8' }}>Adjust</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', minWidth: '400px' }}>
            <h3>
              {modalType === 'STOCK_IN' && 'Stock In'}
              {modalType === 'STOCK_OUT' && 'Stock Out'}
              {modalType === 'ADJUST' && 'Adjust Physical Stock'}
            </h3>
            <p>{selectedVariant?.product.name} ({selectedVariant?.sku})</p>
            <p>Current Stock: {selectedVariant?.stock}</p>
            
            <form onSubmit={handleStockAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label>{modalType === 'ADJUST' ? 'Physical Stock Count' : 'Quantity'}</label><br/>
                <input type="number" min="0" required value={quantity} onChange={e => setQuantity(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
              </div>
              <div>
                <label>Reason</label><br/>
                <input required value={reason} onChange={e => setReason(e.target.value)} style={{ width: '100%', padding: '0.5rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', border: 'none' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
