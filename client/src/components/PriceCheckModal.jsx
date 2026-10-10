import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Eye, EyeOff, Package, Tag, Camera } from 'lucide-react';
import CameraScanner from './CameraScanner';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function PriceCheckModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCP, setShowCP] = useState({});
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setShowCP({});
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const toggleCP = (id) => {
    setShowCP(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCameraScan = async (code) => {
    setShowCamera(false);
    setQuery(code);
    
    // Programmatically trigger search
    setLoading(true);
    setResults([]);
    setShowCP({});
    try {
      const scanRes = await api.get(/pos/scan/ + code);
      if (scanRes.data.success && scanRes.data.data) {
        setResults([scanRes.data.data]);
      } else {
        const searchRes = await api.get(/pos/search?q= + encodeURIComponent(code));
        if (searchRes.data.success && searchRes.data.data) setResults(searchRes.data.data);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          const searchRes = await api.get(/pos/search?q= + encodeURIComponent(code));
          if (searchRes.data.success && searchRes.data.data) setResults(searchRes.data.data);
        } catch (e) {}
      } else {
        toast.error('Error scanning product');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setResults([]);
    setShowCP({});

    try {
      // Try exact barcode scan first
      const scanRes = await api.get(`/pos/scan/${query.trim()}`);
      if (scanRes.data.success && scanRes.data.data) {
        setResults([scanRes.data.data]);
        setLoading(false);
        return;
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Error scanning product');
        setLoading(false);
        return;
      }
    }

    try {
      // Fallback to text search
      const searchRes = await api.get(`/pos/search?q=${encodeURIComponent(query.trim())}`);
      if (searchRes.data.success && searchRes.data.data) {
        setResults(searchRes.data.data);
      }
    } catch (err) {
      toast.error('Error searching products');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return '?' + parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (!isOpen) return null;

  return (
    <>
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827' }}>
            <Tag size={20} color="#3b82f6" />
            Price Checker
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '1.25rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                <Search size={18} />
              </div>
                            <input
                ref={inputRef}
                type="text"
                placeholder="Scan barcode or type name..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 3rem 0.75rem 2.5rem',
                  borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none',
                  fontSize: '1rem', boxSizing: 'border-box'
                }}
              />
              <button 
                type="button" 
                onClick={() => setShowCamera(true)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex' }}
              >
                <Camera size={20} />
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                padding: '0 1.25rem', background: '#3b82f6', color: '#fff',
                border: 'none', borderRadius: '8px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '...' : 'Check'}
            </button>
          </form>
        </div>

        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
          {results.length === 0 && !loading && (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem 0' }}>
              <Package size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
              <p style={{ margin: 0 }}>Scan an item or enter a name to check prices.</p>
            </div>
          )}

          {results.map((item, idx) => (
            <div key={item.id || idx} style={{
              border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem',
              marginBottom: '1rem', background: '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', color: '#111827' }}>{item.product?.name || item.productNameSnapshot || 'Unknown Product'}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
                    {item.size} {item.color ? `| ${item.color}` : ''} • SKU: {item.sku}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-block', padding: '0.25rem 0.5rem', borderRadius: '999px',
                    fontSize: '0.75rem', fontWeight: '600',
                    background: item.stock > 0 ? '#dcfce7' : '#fee2e2',
                    color: item.stock > 0 ? '#166534' : '#991b1b'
                  }}>
                    {item.stock > 0 ? `${item.stock} in stock` : 'Out of Stock'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>MRP</p>
                  <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500', color: '#94a3b8', textDecoration: 'line-through' }}>
                    {formatCurrency(item.mrp)}
                  </p>
                </div>
                <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '6px' }}>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: '#2563eb', textTransform: 'uppercase', fontWeight: '700' }}>Selling Price</p>
                  <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1d4ed8' }}>
                    {formatCurrency(item.sellingPrice)}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px dashed #e5e7eb', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>Cost Price (CP)</span>
                {showCP[item.id] ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: '#111827' }}>{formatCurrency(item.costPrice)}</span>
                    <button onClick={() => toggleCP(item.id)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <EyeOff size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => toggleCP(item.id)}
                    style={{
                      background: 'none', border: '1px solid #d1d5db', borderRadius: '6px',
                      padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: '#4b5563',
                      display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer'
                    }}
                  >
                    <Eye size={14} /> Show
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    {showCamera && (
      <CameraScanner
        onScan={handleCameraScan}
        onClose={() => setShowCamera(false)}
      />
    )}
    </>
  );
}

