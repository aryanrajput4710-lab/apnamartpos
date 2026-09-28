import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { Link } from 'react-router-dom';
import { Search, Printer, RotateCcw, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Orders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [returnOrder, setReturnOrder] = useState(null);
  const [returnItems, setReturnItems] = useState({});
  const [returnProcessing, setReturnProcessing] = useState(false);

  const fetchOrders = async (p = page) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: p,
        limit: 20
      });
      if (search) q.append('search', search);
      if (paymentMethod) q.append('paymentMethod', paymentMethod);
      if (paymentStatus) q.append('paymentStatus', paymentStatus);
      if (orderStatus) q.append('status', orderStatus);

      const res = await api.get(`/orders?${q.toString()}`);
      setOrders(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders(1);
  };

  const openReturnModal = async (orderId) => {
    try {
      const res = await api.get('/orders/' + orderId);
      const order = res.data.data;
      setReturnOrder(order);
      const initialItems = {};
      order.items.forEach(item => {
        initialItems[item.id] = { quantity: 0, reason: 'Customer Return' };
      });
      setReturnItems(initialItems);
    } catch (err) {
      toast('Error fetching order details: ' + (err.response?.data?.message || err.message)); console.error(err);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    const itemsToReturn = Object.entries(returnItems)
      .filter(([id, data]) => data.quantity > 0)
      .map(([id, data]) => ({ orderItemId: id, quantity: data.quantity, reason: data.reason }));
      
    if (itemsToReturn.length === 0) {
      toast('Please select at least one item to return');
      return;
    }

    if (!confirm(`Are you sure you want to process this return?`)) return;

    setReturnProcessing(true);
    try {
      await api.post(`/orders/${returnOrder.id}/return`, { items: itemsToReturn });
      toast.success('Return processed successfully');
      setReturnOrder(null);
      fetchOrders();
    } catch (err) {
      toast('Error processing return: ' + (err.response?.data?.message || err.message));
    } finally {
      setReturnProcessing(false);
    }
  };

  const printReplacementLabel = async (item) => {
    try {
      // Create a temporary hidden print frame for a single barcode
      const printWindow = window.open('', '_blank');
      const html = `
        <html>
          <head>
            <style>
              @page { size: 50mm 25mm; margin: 0; }
              body { margin: 0; padding: 2mm; width: 50mm; height: 25mm; box-sizing: border-box; font-family: sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; }
              .name { font-size: 10px; font-weight: bold; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; margin-bottom: 2px; }
              .price { font-size: 12px; font-weight: bold; margin-bottom: 2px; }
              .sku { font-size: 8px; }
            </style>
          </head>
          <body>
            <div class="name">${item.productNameSnapshot}</div>
            <div class="price">Rs. ${item.priceSnapshot}</div>
            <div class="sku">${item.skuSnapshot}</div>
            <script>
              window.onload = () => { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    } catch (err) {
      console.error('Print failed', err);
    }
  };



  const handleClearTestOrders = async () => {
    if (!window.confirm('WARNING: Are you absolutely sure you want to delete ALL orders and related data (returns, payments, sale history)? This will NOT restore inventory! This is meant for clearing test data only.')) return;
    try {
      await api.delete("/orders");
      fetchOrders();
      toast.success('All test orders cleared successfully.');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to clear orders');
    }
  };

  const handleDeleteOrder = async (orderId) => {

    if (!window.confirm('Are you sure you want to completely delete this order? This action cannot be undone, but inventory will be restored.')) return;
    try {
      await api.delete("/orders/" + orderId);
      fetchOrders();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete order');
    }
  };

  return (

    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: '"Inter", "Plus Jakarta Sans", system-ui, sans-serif', paddingBottom: '2rem' }}>
      
      {/* Header Section */}
      
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0, marginBottom: '0.25rem' }}>All Orders</h1>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>View, track, and manage your orders and returns</p>
          </div>
          {currentUser?.role === 'ADMIN' && (
            <button onClick={handleClearTestOrders} style={{ padding: '0.75rem 1.5rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 size={18} /> Clear Test Orders
            </button>
          )}
        </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Search & Filters */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ position: 'relative', flex: '1 1 250px' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input 
                type="text"
                placeholder="Search Order No, Customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '0.625rem 0.875rem 0.625rem 2.5rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', boxSizing: 'border-box' }}
                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            
            <select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }} style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none', backgroundColor: 'white' }}>
              <option value="">All Methods</option>
              <option value="CASH">CASH</option>
              <option value="QR">QR</option>
            </select>

            <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none', backgroundColor: 'white' }}>
              <option value="">All Pay Status</option>
              <option value="COMPLETED">PAID</option>
              <option value="PENDING">PENDING</option>
            </select>

            <select value={orderStatus} onChange={(e) => { setOrderStatus(e.target.value); setPage(1); }} style={{ padding: '0.625rem 0.875rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.875rem', outline: 'none', backgroundColor: 'white' }}>
              <option value="">All Order Status</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="RETURNED">RETURNED</option>
              <option value="PARTIAL_RETURN">PARTIAL_RETURN</option>
            </select>
            <button type="submit" style={{ padding: '0.625rem 1.25rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, backgroundColor: '#2563eb', color: 'white', border: 'none', cursor: 'pointer', transition: 'background-color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}>
              Filter
            </button>
          </form>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <p style={{ margin: 0, fontWeight: 500, color: '#374151' }}>No orders found</p>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Order No</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Total</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Pay Method</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Pay Status</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Order Status</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600 }}>Cashier</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, index) => (
                    <tr key={o.id} style={{ borderBottom: index === orders.length - 1 ? 'none' : '1px solid #e5e7eb', transition: 'background-color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{o.orderNumber}</td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>{new Date(o.createdAt).toLocaleString()}</td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>Rs. {parseFloat(o.totalAmount).toFixed(2)}</td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>{o.payments?.[0]?.method || 'N/A'}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ padding: '0.25rem 0.65rem', background: o.payments?.[0]?.status === 'COMPLETED' ? '#dcfce7' : '#fef2f2', color: o.payments?.[0]?.status === 'COMPLETED' ? '#15803d' : '#b91c1c', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: o.payments?.[0]?.status === 'COMPLETED' ? '#15803d' : '#b91c1c' }}></span>
                          {o.payments?.[0]?.status === 'COMPLETED' ? 'PAID' : (o.payments?.[0]?.status || 'PENDING')}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ padding: '0.25rem 0.65rem', background: o.status === 'COMPLETED' ? '#dcfce7' : '#fee2e2', color: o.status === 'COMPLETED' ? '#16a34a' : '#dc2626', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>{o.user?.name}</td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <Link to={`/receipt/${o.id}`} style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, backgroundColor: 'white', color: '#4b5563', border: '1px solid #d1d5db', textDecoration: 'none', transition: 'all 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.borderColor = '#9ca3af'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#d1d5db'; }}>
                            View
                          </Link>
                          {(o.status === 'COMPLETED' || o.status === 'PARTIAL_RETURN') && (
                            <button onClick={() => openReturnModal(o.id)} style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'all 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}>
                              <RotateCcw size={12}/> Return
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Footer */}
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '0.875rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                Showing <strong>{(page - 1) * 20 + (orders.length > 0 ? 1 : 0)}</strong>–<strong>{(page - 1) * 20 + orders.length}</strong> of <strong>{pagination.total || 0}</strong> orders
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

      {returnOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, overflowY: 'auto' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>Process Return (Order {returnOrder.orderNumber.split('-')[0]})</h2>
            
            <form onSubmit={handleReturnSubmit}>
              <div className="table-responsive" style={{ marginBottom: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Product</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Purchased</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Returned</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Return Qty</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Reason</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Missing Tag?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnOrder.items.map(item => {
                      const availableToReturn = item.quantity - (item.returnedQty || 0);
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '1rem', fontSize: '0.875rem' }}><strong style={{ color: '#111827' }}>{item.productNameSnapshot}</strong> <br/><span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{item.skuSnapshot}</span></td>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#4b5563' }}>{item.quantity}</td>
                          <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#4b5563' }}>{item.returnedQty || 0}</td>
                          <td style={{ padding: '1rem' }}>
                            <input 
                              type="number" 
                              min="0" 
                              max={availableToReturn} 
                              value={returnItems[item.id]?.quantity || 0}
                              onChange={e => setReturnItems({...returnItems, [item.id]: { ...returnItems[item.id], quantity: parseInt(e.target.value) || 0 }})}
                              disabled={availableToReturn === 0}
                              style={{ width: '60px', padding: '0.375rem 0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
                            />
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <select 
                              value={returnItems[item.id]?.reason || 'Customer Return'}
                              onChange={e => setReturnItems({...returnItems, [item.id]: { ...returnItems[item.id], reason: e.target.value }})}
                              disabled={availableToReturn === 0}
                              style={{ padding: '0.375rem 0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: 'white', fontSize: '0.875rem' }}
                            >
                              <option value="Customer Return">Customer Return</option>
                              <option value="Defective">Defective</option>
                              <option value="Wrong Item">Wrong Item</option>
                              <option value="Wrong Size">Wrong Size</option>
                            </select>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {returnItems[item.id]?.quantity > 0 && (
                              <button type="button" onClick={() => printReplacementLabel(item)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}>
                                <Printer size={14}/> Print Tag
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={() => setReturnOrder(null)} style={{ padding: '0.625rem 1.25rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, color: '#374151' }}>Cancel</button>
                <button type="submit" disabled={returnProcessing} style={{ padding: '0.625rem 1.25rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: returnProcessing ? 'not-allowed' : 'pointer' }}>
                  {returnProcessing ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
