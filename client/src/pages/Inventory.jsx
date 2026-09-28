import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import { 
  Package, 
  Layers, 
  Archive, 
  AlertTriangle, 
  XCircle, 
  DollarSign, 
  TrendingUp, 
  Search, 
  History 
} from 'lucide-react';
import { SkeletonRow, SkeletonCard } from '../components/SkeletonRow';

const SummaryCard = ({ title, value, icon: Icon, color, bgColor }) => (
  <div style={{ padding: '1.25rem', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: '1 1 180px', minWidth: '160px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>{title}</span>
      <div style={{ background: bgColor, color: color, padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
        <Icon size={18} />
      </div>
    </div>
    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827' }}>{value}</div>
  </div>
);

export default function Inventory() {
  const [variants, setVariants] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVariantsCount, setTotalVariantsCount] = useState(0);
  
  const { currentUser } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // STOCK_IN, STOCK_OUT, ADJUST
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('MANUAL');

  useEffect(() => {
    setPage(1);
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/inventory?page=${page}&limit=50&search=${encodeURIComponent(debouncedSearch)}`);
      setVariants(res.data.data);
      if (res.data.pagination) {
        setTotalPages(Math.ceil(res.data.pagination.total / res.data.pagination.limit));
        setTotalVariantsCount(res.data.pagination.total);
        if (page > 1 && res.data.data.length === 0) {
          setPage(page - 1);
        }
      }
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
      toast.success('Stock updated successfully');
      setShowModal(false);
      fetchInventory();
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating stock');
    }
  };

  const isMobile = useIsMobile();

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: '"Inter", "Plus Jakarta Sans", system-ui, sans-serif' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0, marginBottom: '0.25rem' }}>Inventory Management</h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Track products, stock levels, and inventory value</p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <Link to="/inventory/history" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'white', color: '#374151', border: '1px solid #d1d5db', textDecoration: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'background-color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
            <History size={16} /> View Global History
          </Link>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <SummaryCard title="Total Products" value={summary.totalProducts} icon={Package} color="#3b82f6" bgColor="#eff6ff" />
          <SummaryCard title="Total Variants" value={summary.totalVariants} icon={Layers} color="#8b5cf6" bgColor="#f5f3ff" />
          <SummaryCard title="Units In Stock" value={summary.totalUnits} icon={Archive} color="#10b981" bgColor="#ecfdf5" />
          <SummaryCard title="Low Stock" value={summary.lowStockCount} icon={AlertTriangle} color="#f59e0b" bgColor="#fffbeb" />
          <SummaryCard title="Out of Stock" value={summary.outOfStockCount} icon={XCircle} color="#ef4444" bgColor="#fef2f2" />
          <SummaryCard title="Asset Value" value={`Rs. ${summary.assetValue || 0}`} icon={DollarSign} color="#6366f1" bgColor="#e0e7ff" />
          <SummaryCard title="Potential Value" value={`Rs. ${summary.potentialValue}`} icon={TrendingUp} color="#14b8a6" bgColor="#ccfbf1" />
        </div>
      )}

      {/* Search and Table Area */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        {/* Search Bar */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input 
              type="text" 
              placeholder="Search inventory by name, SKU, barcode..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.625rem 0.875rem 0.625rem 2.5rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }}
              onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : variants.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={32} color="#d1d5db" />
            <p style={{ margin: 0, fontWeight: 500, color: '#374151' }}>No products found</p>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            {isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {variants.map((v) => {
                  const isOutOfStock = v.stock === 0;
                  const isLowStock = v.stock === 1;
                  const badge = isOutOfStock
                    ? { label: 'Out of Stock', bg: '#fef2f2', color: '#b91c1c' }
                    : isLowStock
                    ? { label: 'Low Stock', bg: '#fffbeb', color: '#b45309' }
                    : { label: 'In Stock', bg: '#ecfdf5', color: '#047857' };
                  return (
                    <div key={v.id} style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', background: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.375rem' }}>
                        <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem', flex: 1, minWidth: 0, marginRight: '0.5rem' }}>
                          {v.product?.name || 'Unknown'}{v.size ? ` - ${v.size}` : ''}{v.color ? ` - ${v.color}` : ''}
                        </div>
                        <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: badge.bg, color: badge.color, whiteSpace: 'nowrap' }}>{badge.label}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace', marginBottom: '0.5rem' }}>{v.sku}</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>Stock: {v.stock}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link to={`/inventory/${v.id}/history`} style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', color: '#374151', textDecoration: 'none', background: 'white' }}>History</Link>
                        {currentUser?.role === 'ADMIN' && (
                          <>
                            <button onClick={() => openModal(v, 'STOCK_IN')} style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #a7f3d0', color: '#047857', background: '#ecfdf5', cursor: 'pointer' }}>In</button>
                            <button onClick={() => openModal(v, 'STOCK_OUT')} style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #fecaca', color: '#b91c1c', background: '#fef2f2', cursor: 'pointer' }}>Out</button>
                            <button onClick={() => openModal(v, 'ADJUST')} style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #bfdbfe', color: '#1d4ed8', background: '#eff6ff', cursor: 'pointer' }}>Adjust</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Desktop Table */}
            {!isMobile && (
            <div className="table-responsive">
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, index) => {
                    const isOutOfStock = v.stock === 0;
                    const isLowStock = v.stock === 1;
                    
                    const badge = isOutOfStock 
                      ? { label: 'Out of Stock', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
                      : isLowStock 
                      ? { label: 'Low Stock', bg: '#fffbeb', color: '#b45309', border: '#fde68a' }
                      : { label: 'In Stock', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };

                    return (
                      <tr key={v.id} style={{ borderBottom: index === variants.length - 1 ? 'none' : '1px solid #e5e7eb', transition: 'background-color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                            {v.product?.name || 'Unknown'} {v.size ? `- ${v.size}` : ''} {v.color ? `- ${v.color}` : ''}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>
                            {v.sku}
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>{v.stock}</span>
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>units</span>
                            {isLowStock && (
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b', marginLeft: '0.25rem' }} title="Low stock indicator"></div>
                            )}
                            {isOutOfStock && (
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', marginLeft: '0.25rem' }} title="Out of stock indicator"></div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span style={{ display: 'inline-flex', padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Link to={`/inventory/${v.id}/history`} style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, backgroundColor: 'white', color: '#4b5563', border: '1px solid #d1d5db', textDecoration: 'none', transition: 'all 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.borderColor = '#9ca3af'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#d1d5db'; }}>
                              History
                            </Link>
                            {currentUser?.role === 'ADMIN' && (
                              <>
                                <button onClick={() => openModal(v, 'STOCK_IN')} style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d1fae5'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ecfdf5'; }}>
                                  In
                                </button>
                                <button onClick={() => openModal(v, 'STOCK_OUT')} style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}>
                                  Out
                                </button>
                                <button onClick={() => openModal(v, 'ADJUST')} style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}>
                                  Adjust
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            )} {/* end !isMobile desktop table */}
            
            {/* Table Footer with Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderTop: '1px solid #e5e7eb', background: 'white' }}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: page === 1 ? '#f9fafb' : 'white',
                    color: page === 1 ? '#9ca3af' : '#374151',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500'
                  }}
                >
                  ← Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: p === page ? 'none' : '1px solid #cbd5e1',
                      background: p === page ? '#3b82f6' : 'white',
                      color: p === page ? 'white' : '#374151',
                      cursor: p === page ? 'default' : 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: p === page ? '600' : '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: page === totalPages ? '#f9fafb' : 'white',
                    color: page === totalPages ? '#9ca3af' : '#374151',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500'
                  }}
                >
                  Next →
                </button>
              </div>
            )}
            
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '0.875rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Showing <strong>{(page - 1) * 50 + (variants.length > 0 ? 1 : 0)}</strong>–<strong>{(page - 1) * 50 + variants.length}</strong> of <strong>{totalVariantsCount}</strong> items</span>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
                {modalType === 'STOCK_IN' && 'Stock In'}
                {modalType === 'STOCK_OUT' && 'Stock Out'}
                {modalType === 'ADJUST' && 'Adjust Physical Stock'}
              </h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                Update inventory for <strong style={{ color: '#374151' }}>{selectedVariant?.product?.name}</strong> ({selectedVariant?.sku})
              </p>
            </div>
            
            <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: 500 }}>Current Stock</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827' }}>{selectedVariant?.stock}</span>
            </div>
            
            <form onSubmit={handleStockAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                  {modalType === 'ADJUST' ? 'Physical Stock Count' : 'Quantity'}
                </label>
                <input 
                  type="number" 
                  min="0" 
                  required 
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)} 
                  style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>
                  Reason
                </label>
                <input 
                  required 
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.625rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', cursor: 'pointer', transition: 'background-color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, backgroundColor: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', transition: 'background-color 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
