import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  X, 
  MoreVertical, 
  Tag, 
  Edit3, 
  Trash2, 
  Power, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({ totalProducts: 0, activeProductsCount: 0, inactiveProductsCount: 0, lowStockProductsCount: 0 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, statusFilter, stockFilter]);

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, statusFilter, stockFilter, page]);

  const fetchProducts = async () => {
    setLoading(true);
    setFetchError('');
    try {
      let url = `/products?page=${page}&limit=50&search=${encodeURIComponent(search)}`;
      if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      if (stockFilter) url += `&stock=${encodeURIComponent(stockFilter)}`;
      
      const res = await api.get(url);
      setProducts(res.data.data || []);
      
      if (res.data.pagination) {
        setTotalPages(Math.ceil(res.data.pagination.total / res.data.pagination.limit));
        // Safety check if current page is empty after a delete
        if (page > 1 && res.data.data.length === 0) {
          setPage(page - 1);
        }
      }
      
      if (res.data.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error(err);
      setFetchError(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? (This will fail if it has past orders)')) return;
    try {
      await api.delete('/products/' + id);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting product');
    } finally {
      setActiveMenuId(null);
    }
  };

  const toggleStatus = async (id, isActive) => {
    try {
      await api.patch(`/products/${id}/status`, { isActive: !isActive });
      fetchProducts();
    } catch (err) {
      alert('Error changing status');
    } finally {
      setActiveMenuId(null);
    }
  };

  const getProductStockInfo = (product) => {
    if (!product.variants || product.variants.length === 0) {
      return { totalStock: 0, status: 'out', label: 'Out of stock', color: '#ef4444', bg: '#fef2f2' };
    }
    const totalStock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    
    if (totalStock === 0) {
      return { totalStock: 0, status: 'out', label: '✕ Out of stock', color: '#dc2626', bg: '#fee2e2' };
    } else if (totalStock === 1) {
      return { totalStock, status: 'low', label: `⚠ Low stock (${totalStock})`, color: '#d97706', bg: '#fef3c7' };
    }
    return { totalStock, status: 'in', label: `✓ ${totalStock} in stock`, color: '#16a34a', bg: '#dcfce7' };
  };

  // Derive filter categories
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Products are already filtered by the backend
  const filteredProducts = products;

  // Calculate summary stats
  const { totalProducts, activeProductsCount, inactiveProductsCount, lowStockProductsCount } = summary;

  const hasActiveFilters = Boolean(search || categoryFilter || statusFilter || stockFilter);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStatusFilter('');
    setStockFilter('');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* 1. PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>Products</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>Manage your store products, variants and inventory.</p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <Link 
            to="/products/new" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.65rem 1.25rem', 
              background: '#2563eb', 
              color: 'white', 
              textDecoration: 'none', 
              borderRadius: '10px',
              fontWeight: '600',
              fontSize: '0.95rem',
              boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={18} />
            Add Product
          </Link>
        )}
      </div>

      {/* SUMMARY KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Total Products</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', marginTop: '0.5rem' }}>{totalProducts}</div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Active</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a', marginTop: '0.5rem' }}>{activeProductsCount}</div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Inactive</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <Power size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#64748b', marginTop: '0.5rem' }}>{inactiveProductsCount}</div>
        </div>

        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Low / Out of Stock</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706', marginTop: '0.5rem' }}>{lowStockProductsCount}</div>
        </div>
      </div>

      {/* 3. SEARCH + FILTER TOOLBAR */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Search Field */}
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search products by name, SKU or barcode..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ 
                width: '100%', 
                height: '42px',
                paddingLeft: '16px', 
                paddingRight: '16px', 
                borderRadius: '8px', 
                border: '1px solid #cbd5e1', 
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              height: '42px',
              padding: '0 0.875rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              background: 'white',
              color: '#334155',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              height: '42px',
              padding: '0 0.875rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              background: 'white',
              color: '#334155',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            style={{
              height: '42px',
              padding: '0 0.875rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              background: 'white',
              color: '#334155',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                height: '42px',
                padding: '0 1rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                color: '#64748b',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              <RotateCcw size={15} />
              Clear Filters
            </button>
          )}

        </div>
      </div>

      {/* 4. PRODUCT TABLE */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          Loading products...
        </div>
      ) : fetchError ? (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #fee2e2' }}>
          <AlertTriangle size={36} color="#dc2626" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.15rem', color: '#991b1b', margin: '0 0 0.5rem 0' }}>Failed to load products</h3>
          <p style={{ color: '#7f1d1d', margin: '0 0 1.25rem 0' }}>{fetchError}</p>
          <button
            onClick={fetchProducts}
            style={{ padding: '0.6rem 1.25rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
          >
            Retry
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {hasActiveFilters ? (
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', margin: '0 0 0.5rem 0' }}>No products match your search</h3>
              <p style={{ color: '#64748b', margin: '0 0 1.25rem 0' }}>Try changing or resetting your search or filter options.</p>
              <button
                onClick={clearFilters}
                style={{ padding: '0.6rem 1.25rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <h3 style={{ fontSize: '1.25rem', color: '#0f172a', margin: '0 0 0.5rem 0' }}>No products found</h3>
              <p style={{ color: '#64748b', margin: '0 0 1.5rem 0' }}>Add your first product to start managing your inventory.</p>
              {currentUser?.role === 'ADMIN' && (
                <Link
                  to="/products/new"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', background: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: '600' }}
                >
                  <Plus size={18} />
                  Add Product
                </Link>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
            Showing {(page - 1) * 50 + (filteredProducts.length > 0 ? 1 : 0)}–{(page - 1) * 50 + filteredProducts.length} of {totalProducts} products
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.925rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Product</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Category</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Variants</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Stock</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const variantCount = p._count?.variants || p.variants?.length || 0;
                  const stockInfo = getProductStockInfo(p);
                  const isExpanded = expandedProductId === p.id;
                  const primaryVariant = p.variants && p.variants[0];

                  return (
                    <tr 
                      key={p.id} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Product Name & Details */}
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '0.95rem' }}>{p.name}</div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                          {p.brand && <span style={{ fontSize: '0.775rem', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{p.brand}</span>}
                          {primaryVariant?.sku && (
                            <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>SKU: {primaryVariant.sku}</span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                        {p.category ? (
                          <span style={{ display: 'inline-block', padding: '0.25rem 0.65rem', background: '#eff6ff', color: '#1d4ed8', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500' }}>
                            {p.category}{p.subcategory ? ` › ${p.subcategory}` : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>

                      {/* Variants Count & Toggle */}
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                        <button
                          onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: isExpanded ? '#f1f5f9' : 'white',
                            color: '#334155',
                            fontSize: '0.825rem',
                            fontWeight: '500',
                            cursor: 'pointer'
                          }}
                        >
                          <Layers size={14} color="#64748b" />
                          {variantCount} {variantCount === 1 ? 'variant' : 'variants'}
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {/* Inline Expanded Variant Breakdown */}
                        {isExpanded && p.variants && p.variants.length > 0 && (
                          <div style={{ marginTop: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', maxWidth: '360px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Variant Breakdown:</div>
                            {p.variants.map((v, idx) => (
                              <div key={v.id || idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155', padding: '0.25rem 0', borderBottom: idx < p.variants.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                                <div>
                                  <span style={{ fontWeight: '600' }}>
                                    {[v.size, v.color, v.netQuantity].filter(Boolean).join(' / ') || `Variant #${idx + 1}`}
                                  </span>
                                  {v.barcode && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>BC: {v.barcode}</div>}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontWeight: '600', color: '#0f172a' }}>₹{v.sellingPrice}</div>
                                  <div style={{ fontSize: '0.725rem', color: (v.stock || 0) <= 5 ? '#d97706' : '#16a34a' }}>Stock: {v.stock || 0}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Stock Status */}
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.375rem', 
                          padding: '0.3rem 0.65rem', 
                          borderRadius: '20px', 
                          background: stockInfo.bg, 
                          color: stockInfo.color, 
                          fontSize: '0.8rem', 
                          fontWeight: '600' 
                        }}>
                          {stockInfo.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.375rem', 
                          padding: '0.25rem 0.6rem', 
                          borderRadius: '20px', 
                          background: p.isActive ? '#f0fdf4' : '#f1f5f9', 
                          color: p.isActive ? '#15803d' : '#64748b', 
                          fontSize: '0.8rem', 
                          fontWeight: '500' 
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.isActive ? '#22c55e' : '#94a3b8' }}></span>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                          
                          {/* Labels Button */}
                          <Link 
                            to={`/products/${p.id}`}
                            title="Print Labels"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              padding: '0.4rem 0.75rem',
                              borderRadius: '6px',
                              background: '#eff6ff',
                              color: '#2563eb',
                              textDecoration: 'none',
                              fontSize: '0.825rem',
                              fontWeight: '600'
                            }}
                          >
                            <Tag size={14} />
                            Labels
                          </Link>

                          {currentUser?.role === 'ADMIN' && (
                            <>
                              {/* Edit Button */}
                              <Link 
                                to={`/products/${p.id}/edit`}
                                title="Edit Product"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  padding: '0.4rem 0.75rem',
                                  borderRadius: '6px',
                                  background: '#f8fafc',
                                  border: '1px solid #cbd5e1',
                                  color: '#334155',
                                  textDecoration: 'none',
                                  fontSize: '0.825rem',
                                  fontWeight: '500'
                                }}
                              >
                                <Edit3 size={14} />
                                Edit
                              </Link>

                              {/* Three Dot Menu Trigger */}
                              <div style={{ position: 'relative' }}>
                                <button
                                  onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    background: 'white',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <MoreVertical size={16} />
                                </button>

                                {/* Dropdown Menu */}
                                {activeMenuId === p.id && (
                                  <div 
                                    style={{
                                      position: 'absolute',
                                      right: 0,
                                      top: 'calc(100% + 4px)',
                                      background: 'white',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: '8px',
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                      zIndex: 10,
                                      minWidth: '140px',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    <button
                                      onClick={() => toggleStatus(p.id, p.isActive)}
                                      style={{
                                        width: '100%',
                                        padding: '0.6rem 0.875rem',
                                        textAlign: 'left',
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '0.85rem',
                                        color: '#334155',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                      }}
                                    >
                                      <Power size={14} color={p.isActive ? '#dc2626' : '#16a34a'} />
                                      {p.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button
                                      onClick={() => handleDelete(p.id)}
                                      style={{
                                        width: '100%',
                                        padding: '0.6rem 0.875rem',
                                        textAlign: 'left',
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '0.85rem',
                                        color: '#dc2626',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        borderTop: '1px solid #f1f5f9'
                                      }}
                                    >
                                      <Trash2 size={14} color="#dc2626" />
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
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
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderTop: '1px solid #e2e8f0', background: 'white' }}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: page === 1 ? '#f8fafc' : 'white',
                  color: page === 1 ? '#94a3b8' : '#334155',
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
                    background: p === page ? '#2563eb' : 'white',
                    color: p === page ? 'white' : '#334155',
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
                  background: page === totalPages ? '#f8fafc' : 'white',
                  color: page === totalPages ? '#94a3b8' : '#334155',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500'
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
