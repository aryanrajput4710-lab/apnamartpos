import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { Search, Camera, Eye, EyeOff, Package, Tag, ArrowLeft, RefreshCw, X, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

const CameraScanner = lazy(() => import('../components/CameraScanner'));

export default function PriceCheck() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCP, setShowCP] = useState({});
  const [showCamera, setShowCamera] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('Apna Mart installed successfully!');
      setInstallPrompt(null);
    }
  };

  const handleBarcodeScan = (code) => {
    if (!code) return;
    setQuery(code);
    executeSearch(code);
  };

  // Enable global hardware scanner
  useBarcodeScanner(handleBarcodeScan);

  const executeSearch = async (searchTerm) => {
    const term = (searchTerm || '').trim();
    if (!term) return;

    setLoading(true);
    setResults([]);
    setShowCP({});

    try {
      // 1. Try exact barcode scan first
      const scanRes = await api.get('/pos/scan/' + encodeURIComponent(term));
      if (scanRes.data.success && scanRes.data.data) {
        setResults([scanRes.data.data]);
        setLoading(false);
        return;
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error('Error scanning product');
      }
    }

    try {
      // 2. Fallback to product name/SKU search
      const searchRes = await api.get('/pos/search?q=' + encodeURIComponent(term));
      if (searchRes.data.success && searchRes.data.data) {
        setResults(searchRes.data.data);
        if (searchRes.data.data.length === 0) {
          toast.error('No matching products found');
        }
      }
    } catch (err) {
      toast.error('Error searching products');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleCameraScan = (code) => {
    setShowCamera(false);
    setQuery(code);
    executeSearch(code);
  };

  const formatCurrency = (val) => {
    return '₹' + parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleToggleCP = (id) => {
    setShowCP(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1rem', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* PWA 1-Tap Install Banner (Appears when mobile browser allows installing) */}
        {installPrompt && (
          <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '12px', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', boxShadow: '0 2px 4px rgba(37,99,235,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src="/apna-mart-logo.jpg" alt="Logo" style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #bfdbfe' }} />
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1e40af' }}>Install Apna Mart App</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Fast 1-tap price checks on your phone</div>
              </div>
            </div>
            <button
              onClick={handleInstallClick}
              style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '0.55rem 1rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
            >
              <Download size={16} /> Install
            </button>
          </div>
        )}

        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={() => navigate(-1)} 
              style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#475569' }}
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={22} color="#2563eb" /> Price Checker
              </h1>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>For Salesmen & Staff</p>
            </div>
          </div>

          <button
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '500', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RefreshCw size={14} /> Clear
          </button>
        </div>

        {/* Search & Camera Input Card */}
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 240px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Search size={20} />
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="Scan barcode or type product name..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 2.75rem 0.875rem 2.5rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  outline: 'none',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  background: '#f8fafc'
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Mobile Camera Scan Button */}
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              style={{
                padding: '0 1rem',
                background: '#eff6ff',
                color: '#2563eb',
                border: '1.5px solid #bfdbfe',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                minHeight: '48px'
              }}
              title="Scan with Mobile Camera"
            >
              <Camera size={20} />
              <span>Camera</span>
            </button>

            {/* Check Button */}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              style={{
                padding: '0 1.5rem',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: (!query.trim() || loading) ? 0.7 : 1,
                minHeight: '48px'
              }}
            >
              {loading ? 'Searching...' : 'Check Price'}
            </button>
          </form>
        </div>

        {/* Results Container */}
        <div>
          {results.length === 0 && !loading && (
            <div style={{ textAlign: 'center', background: '#ffffff', padding: '3.5rem 1.5rem', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
              <Package size={56} style={{ opacity: 0.25, margin: '0 auto 1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.1rem' }}>No Product Selected</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: '380px', marginInline: 'auto' }}>
                Scan any barcode (with scanner or camera) or type a product name above to instantly view prices and stock.
              </p>
            </div>
          )}

          {results.map((item, idx) => {
            const mrp = parseFloat(item.mrp || 0);
            const sellingPrice = parseFloat(item.sellingPrice || 0);
            const savings = mrp > sellingPrice ? (mrp - sellingPrice) : 0;
            const savingsPct = mrp > 0 && savings > 0 ? Math.round((savings / mrp) * 100) : 0;
            const isOutOfStock = (item.stock || 0) <= 0;

            return (
              <div 
                key={item.id || idx} 
                style={{
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '1.5px solid #e2e8f0',
                  padding: '1.25rem',
                  marginBottom: '1rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}
              >
                {/* Product Title & Stock Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: '700', color: '#0f172a' }}>
                      {item.product?.name || item.productNameSnapshot || 'Product Name'}
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {item.size && <span>Size: <strong>{item.size}</strong></span>}
                      {item.color && <span>Color: <strong>{item.color}</strong></span>}
                      <span>SKU: {item.sku}</span>
                      {item.barcode && <span>Barcode: {item.barcode}</span>}
                    </div>
                  </div>

                  <span style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    background: isOutOfStock ? '#fee2e2' : '#dcfce7',
                    color: isOutOfStock ? '#991b1b' : '#166534',
                    whiteSpace: 'nowrap'
                  }}>
                    {isOutOfStock ? 'Out of Stock' : item.stock + ' in Stock'}
                  </span>
                </div>

                {/* Price Display Boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                  
                  {/* MRP */}
                  <div style={{ background: '#f8fafc', padding: '0.875rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>MRP</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#94a3b8', textDecoration: 'line-through', marginTop: '0.25rem' }}>
                      {formatCurrency(item.mrp)}
                    </div>
                  </div>

                  {/* Selling Price */}
                  <div style={{ background: '#eff6ff', padding: '0.875rem', borderRadius: '10px', border: '1.5px solid #bfdbfe' }}>
                    <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: '700', textTransform: 'uppercase' }}>Selling Price</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#1e40af', marginTop: '0.25rem' }}>
                      {formatCurrency(item.sellingPrice)}
                    </div>
                  </div>

                  {/* Customer Discount / Savings */}
                  {savings > 0 && (
                    <div style={{ background: '#f0fdf4', padding: '0.875rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: '700', textTransform: 'uppercase' }}>Customer Saves</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#16a34a', marginTop: '0.25rem' }}>
                        {formatCurrency(savings)} <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>({savingsPct}% OFF)</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Hidden Cost Price (CP) - Protected from Customers */}
                <div style={{
                  marginTop: '1.25rem',
                  paddingTop: '0.875rem',
                  borderTop: '1px dashed #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                    Wholesale Cost Price (CP):
                  </div>

                  <div>
                    {showCP[item.id] ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
                        <span style={{ fontWeight: '700', color: '#991b1b', fontSize: '1rem' }}>
                          {formatCurrency(item.costPrice)}
                        </span>
                        <button
                          onClick={() => handleToggleCP(item.id)}
                          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          title="Hide CP"
                        >
                          <EyeOff size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleToggleCP(item.id)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: '#475569',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Eye size={14} /> Show CP
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Camera Barcode Scanner Modal */}
      {showCamera && (
        <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem' }}>Starting Camera...</div>}>
          <CameraScanner
            onScan={handleCameraScan}
            onClose={() => setShowCamera(false)}
          />
        </Suspense>
      )}
    </div>
  );
}