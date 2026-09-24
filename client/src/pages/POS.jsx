import { useState, useRef, useEffect, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, User, Search, Trash2, Plus, Minus, X, Camera } from 'lucide-react';
import CameraScanner from '../components/CameraScanner';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import Receipt from '../components/Receipt';

export default function POS() {
  const { currentUser } = useAuth();
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [extraDiscount, setExtraDiscount] = useState('');
  
  // Scanner / Search State
  const [scanInput, setScanInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const scanInputRef = useRef(null);

  // Customer State
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', address: '' });

  // Checkout State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('CUSTOMER');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const holdData = {
      id: Date.now(),
      cart,
      customer,
      extraDiscount,
      time: new Date().toLocaleTimeString()
    };
    setHeldCarts([...heldCarts, holdData]);
    setCart([]);
    setCustomer(null);
    setExtraDiscount('');
  };

  const handleRestoreCart = (heldId) => {
    const target = heldCarts.find(hc => hc.id === heldId);
    if (!target) return;
    // If current cart is not empty, maybe alert?
    if (cart.length > 0 && !confirm("Current cart will be replaced. Continue?")) return;
    setCart(target.cart);
    setCustomer(target.customer);
    setExtraDiscount(target.extraDiscount);
    setHeldCarts(heldCarts.filter(hc => hc.id !== heldId));
    setShowHeldModal(false);
  };
  const [settings, setSettings] = useState(null);
  const [offers, setOffers] = useState([]);
  const [heldCarts, setHeldCarts] = useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("heldCarts") || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse heldCarts from local storage", e);
      return [];
    }
  });
  const [showHeldModal, setShowHeldModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('heldCarts', JSON.stringify(heldCarts));
  }, [heldCarts]);
  const [shift, setShift] = useState(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [openingFloat, setOpeningFloat] = useState('');
  const [actualCash, setActualCash] = useState('');

  useEffect(() => {
    api.get('/settings').then(res => setSettings(res.data.data)).catch(console.error);
    api.get('/offers?active=true').then(res => setOffers(res.data.data)).catch(console.error);
    api.get('/register/status').then(res => setShift(res.data.data)).catch(console.error);
  }, []);

  // Removed hacky auto-focus logic in favor of global useBarcodeScanner
  useBarcodeScanner(handleScanRequest);

  const handleCameraScan = (code) => {
    setShowCamera(false);
    setScanInput(code);
    // Programmatically trigger the search with the scanned code
    handleScanRequest(code);
  };

  const handleScanRequest = async (rawCode) => {
    if (!rawCode.trim()) return;
    try {
      let code = rawCode.trim();

      const res = await api.get(`/pos/scan/${code}`);
      const variant = res.data.data;
      
      if (variant.stock <= 0) {
        alert('Product is out of stock!');
      } else {
        addToCart(variant);
      }
      setScanInput('');
      setSearchResults([]);
    } catch (err) {
      if (err.response?.status === 404) {
        searchProducts(rawCode);
      } else {
        alert(err.response?.data?.message || 'Error scanning product');
      }
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    handleScanRequest(scanInput);
  };

  const searchProducts = async (query) => {
    setIsSearching(true);
    try {
      const res = await api.get(`/pos/search?q=${query}`);
      setSearchResults(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const addToCart = (variant) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === variant.id);
      if (existing) {
        if (existing.quantity >= variant.stock) {
          alert(`Only ${variant.stock} available in stock.`);
          return prev;
        }
        return prev.map(item => 
          item.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...variant, quantity: 1 }];
    });
    setSearchResults([]);
    setScanInput('');
    scanInputRef.current?.focus();
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item; // Handled by remove
        if (newQty > item.stock) {
          alert(`Only ${item.stock} available in stock.`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  
  const openRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/register/open', { openingFloat });
      setShift({ ...res.data.data, expectedCash: parseFloat(openingFloat), totalSalesCash: 0, totalSalesUPI: 0 });
    } catch (err) { alert('Failed to open register'); }
  };

  const closeRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/register/close/${shift.id}`, { 
        actualCash, 
        totalUPI: shift.totalSalesUPI, 
        expectedCash: shift.expectedCash 
      });
      alert('Register closed successfully. End of shift.');
      setShift(null);
      setShowShiftModal(false);
      setActualCash('');
      setOpeningFloat('');
    } catch (err) { alert('Failed to close register'); }
  };

  const clearCart = () => {
    if (cart.length > 0 && window.confirm('Clear all items from this sale?')) {
      setCart([]);
      setCustomer(null);
      setExtraDiscount("");
    }
  };

  // Calculations
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    
    cart.forEach(item => {
      const price = parseFloat(item.sellingPrice);
      const qty = item.quantity;
      const lineTotal = price * qty;
      
      let itemDiscount = 0;
      if (item.discountType === 'FIXED') {
        itemDiscount = parseFloat(item.discountValue) * qty;
      } else if (item.discountType === 'PERCENTAGE') {
        itemDiscount = lineTotal * (parseFloat(item.discountValue) / 100);
      }

      subtotal += lineTotal;
      totalDiscount += itemDiscount;
    });

    const manualDiscount = parseFloat(extraDiscount) || 0;
      const finalDiscount = totalDiscount + manualDiscount;
      return {
        subtotal,
        discount: finalDiscount,
        total: Math.max(0, subtotal - finalDiscount)
      };
  /* FORCE UPDATE */
  }, [cart, extraDiscount]);

  // Customer Management
  const searchCustomer = async () => {
    if (!customerPhone) return;
    try {
      const res = await api.get(`/customers/search?q=${customerPhone}`);
      const found = res.data.data;
      if (found.length > 0) {
        setCustomer(found[0]); // Take exact/closest match
      } else {
        setShowCustomerModal(true);
        setNewCustomer(prev => ({ ...prev, phone: customerPhone }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/customers', newCustomer);
      setCustomer(res.data.data);
      setShowCustomerModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating customer');
    }
  };

  const [idempotencyKey, setIdempotencyKey] = useState('');

  const openCheckout = () => {
    setIdempotencyKey(crypto.randomUUID());
    setCheckoutStep('CUSTOMER');
    setShowCheckoutModal(true);
  };

  const handleCheckout = async () => {
    if (!shift) {
      alert("Please open the register first!");
      return;
    }
    setIsProcessing(true);
    try {
      const payload = {
        items: cart.map(item => ({ variantId: item.id, quantity: item.quantity })),
        customerId: customer?.id || null,
        customerPhone: customerPhone || null,
        customerName: newCustomer.name || null,
        paymentMethod,
        extraDiscount: parseFloat(extraDiscount) || 0,
        idempotencyKey
      };
      
      const res = await api.post('/pos/checkout', payload);
      setOrderSuccess(res.data.data);
      setCart([]);
      setCustomer(null);
      setCustomerPhone('');
        setExtraDiscount('');
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const closeSuccessModal = () => {
    setOrderSuccess(null);
    setShowCheckoutModal(false);
    scanInputRef.current?.focus();
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#f3f4f6', margin: '-2rem', overflow: 'hidden' }}>
      
      {/* Left Pane: Scanner & Search */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', padding: '1rem', borderRight: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            {shift ? (
              <button onClick={() => setShowShiftModal(true)} style={{ padding: '0.5rem 1rem', background: '#ecfdf5', color: '#059669', border: '1px solid #10b981', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Register: OPEN</button>
            ) : (
              <button onClick={() => setShowShiftModal(true)} style={{ padding: '0.5rem 1rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #ef4444', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Register: CLOSED (Click to Open)</button>
            )}
          </div>
        <form onSubmit={handleScanSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button type="button" onClick={() => setShowCamera(true)} style={{ padding: '0 1rem', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={20} />
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '10px', top: '10px', color: '#6b7280' }} />
            <input
              ref={scanInputRef}
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Scan barcode or type to search..."
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', fontSize: '1.1rem', borderRadius: '8px', border: '2px solid #3b82f6', outline: 'none' }}
            />
          </div>
          <button type="submit" style={{ padding: '0 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            Find
          </button>
        </form>

        {isSearching && <p>Searching...</p>}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {searchResults.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {searchResults.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => v.stock > 0 && addToCart(v)}
                  style={{ 
                    background: 'white', padding: '1rem', borderRadius: '8px', cursor: v.stock > 0 ? 'pointer' : 'not-allowed',
                    border: '1px solid #e5e7eb', opacity: v.stock > 0 ? 1 : 0.6,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{v.product.name}</h4>
                  <p style={{ margin: '0', fontSize: '0.875rem', color: '#4b5563' }}>{v.size ? `Size: ${v.size}` : ''} {v.color ? `Color: ${v.color}` : ''}</p>
                  <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>SKU: {v.sku}</p>
                  <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.875rem' }}>MRP: Rs. {v.mrp}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#16a34a' }}>Rs. {v.sellingPrice}</span>
                        <span style={{ fontSize: '0.875rem', color: v.stock > 0 ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                          {v.stock > 0 ? `Stock: ${v.stock}` : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Cart & Customer */}
      <div style={{ width: '100%', maxWidth: '400px', background: 'white', display: 'flex', flexDirection: 'column' }}>
        
        {/* Customer Section */}
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
          {customer ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16}/> {customer.name}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{customer.phone} • Orders: {customer.totalOrders}</div>
              </div>
              <button onClick={() => setCustomer(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={20}/></button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Customer Phone..." 
                value={customerPhone} 
                onChange={e => setCustomerPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchCustomer()}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
              />
              <button onClick={searchCustomer} style={{ padding: '0.5rem 1rem', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px' }}>Find</button>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
              <ShoppingCart size={48} style={{ marginBottom: '1rem' }} />
              <p>Cart is empty. Scan a product to begin.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold' }}>{item.product.name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {item.size || ''} {item.color ? `/ ${item.color}` : ''}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', textDecoration: 'line-through' }}>MRP: Rs. {item.mrp}</div>
                    <div style={{ fontSize: '1rem', color: '#16a34a', fontWeight: 'bold' }}>Rs. {item.sellingPrice}</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f3f4f6', borderRadius: '4px', padding: '0.25rem' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} disabled={item.quantity <= 1} style={{ border: 'none', background: 'white', borderRadius: '4px', padding: '0.25rem', cursor: 'pointer' }}><Minus size={16}/></button>
                    <span style={{ width: '2rem', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ border: 'none', background: 'white', borderRadius: '4px', padding: '0.25rem', cursor: 'pointer' }}><Plus size={16}/></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Actions */}
        <div style={{ padding: '1.5rem', background: '#f8fafc', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#4b5563' }}>
            <span>Subtotal</span>
            <span>Rs. {totals.subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#16a34a' }}>
            <span>Discount</span>
            <span>- Rs. {totals.discount.toFixed(2)}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem', color: '#16a34a' }}>
            <span>Extra Discount</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Rs. <input type="number" min="0" placeholder="0" value={extraDiscount} onChange={e => setExtraDiscount(e.target.value)} style={{ width: '80px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
            </div>
          </div>
<div style={{ display: 'flex', justifyContent: 'space-between', margin: '1rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>
            <span>Total</span>
            <span>Rs. {totals.total.toFixed(2)}</span>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleHoldCart} disabled={cart.length === 0} style={{ padding: '1rem', background: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}>
                Hold
              </button>
              <button onClick={() => setShowHeldModal(true)} style={{ padding: '1rem', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Held ({heldCarts.length})
              </button>
              <button onClick={clearCart} disabled={cart.length === 0} style={{ padding: '1rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}>
                Clear
              </button>
            <button onClick={openCheckout} disabled={cart.length === 0} style={{ flex: 1, padding: '1rem', background: cart.length === 0 ? '#9ca3af' : '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}>
              Continue to Payment
            </button>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showCustomerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Add New Customer</h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>No customer found for {newCustomer.phone}</p>
            
            <form onSubmit={createCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Phone Number *</label>
                <input required value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Full Name *</label>
                <input required autoFocus value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Email (Optional)</label>
                <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCustomerModal(false)} style={{ flex: 1, padding: '0.75rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '4px' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && !orderSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {checkoutStep === 'CUSTOMER' ? (
              <>
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center' }}>Customer Details</h2>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Phone Number (Optional)</label>
                  <input 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Customer Name (Optional)</label>
                  <input 
                    value={customer ? customer.name : newCustomer.name}
                    onChange={(e) => {
                      if (customer) { setCustomer({...customer, name: e.target.value}); }
                      else { setNewCustomer({...newCustomer, name: e.target.value}); }
                    }}
                    placeholder="Enter customer name"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setShowCheckoutModal(false)} style={{ flex: 1, padding: '1rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '8px' }}>Cancel</button>
                  <button onClick={() => setCheckoutStep('PAYMENT')} style={{ flex: 2, padding: '1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    Next Step
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center' }}>Complete Payment</h2>
                  
                  {offers.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#4b5563' }}>Available Offers</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {offers.map(offer => {
                          const isEligible = totals.subtotal >= offer.minCartValue;
                          const applyOffer = () => {
                            if (!isEligible) return;
                            let discountAmt = 0;
                            if (offer.discountType === 'PERCENTAGE') {
                              discountAmt = (totals.subtotal * (offer.discountValue / 100)).toFixed(2);
                            } else {
                              discountAmt = Number(offer.discountValue).toFixed(2);
                            }
                            setExtraDiscount(discountAmt);
                          };
                          
                          return (
                            <div key={offer.id} onClick={applyOffer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', background: isEligible ? '#ecfdf5' : '#f3f4f6', cursor: isEligible ? 'pointer' : 'not-allowed', opacity: isEligible ? 1 : 0.6 }}>
                              <div>
                                <strong style={{ color: '#065f46' }}>{offer.title}</strong>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{offer.description || ''} (Min: Rs. {offer.minCartValue})</div>
                              </div>
                              <span style={{ fontWeight: 'bold', color: '#16a34a' }}>
                                {offer.discountType === 'FIXED' ? 'Rs. ' : ''}{offer.discountValue}{offer.discountType === 'PERCENTAGE' ? '%' : ''} Off
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    <span>Subtotal</span>
                    <span>₹{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#16a34a' }}>
                    <span>Discount</span>
                    <span>- ₹{totals.discount.toFixed(2)}</span>
                  </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#16a34a' }}>
                      <span>Extra Discount</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Rs. <input type="number" min="0" placeholder="0" value={extraDiscount} onChange={e => setExtraDiscount(e.target.value)} style={{ width: '80px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 'bold', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <span>Total to Pay</span>
                    <span>₹{totals.total.toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Payment Method</h4>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      onClick={() => setPaymentMethod('CASH')}
                      style={{ flex: 1, padding: '1rem', border: paymentMethod === 'CASH' ? '2px solid #3b82f6' : '1px solid #d1d5db', background: paymentMethod === 'CASH' ? '#eff6ff' : 'white', borderRadius: '8px', fontWeight: 'bold' }}
                    >
                      CASH
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('QR')}
                      style={{ flex: 1, padding: '1rem', border: paymentMethod === 'QR' ? '2px solid #3b82f6' : '1px solid #d1d5db', background: paymentMethod === 'QR' ? '#eff6ff' : 'white', borderRadius: '8px', fontWeight: 'bold' }}
                    >
                      STORE QR
                    </button>
                  </div>
                </div>

                {paymentMethod === 'QR' && (
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 1rem 0', fontWeight: 'bold' }}>Scan to Pay</p>
                    {settings?.paymentQrCodeUrl ? (
                        <img src={settings.paymentQrCodeUrl} alt="Store QR" style={{ width: '150px', height: '150px', objectFit: 'contain' }} />
                      ) : (
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=store@upi&pn=StorePOS&am=${totals.total.toFixed(2)}`} alt="UPI QR" style={{ width: '150px', height: '150px' }} />
                      )}
                    <p style={{ margin: '1rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>Ask customer to scan using any UPI app</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setCheckoutStep('CUSTOMER')} disabled={isProcessing} style={{ flex: 1, padding: '1rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '8px' }}>Back</button>
                  <button onClick={handleCheckout} disabled={isProcessing} style={{ flex: 2, padding: '1rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {isProcessing ? 'Processing...' : 'Confirm Payment'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success Modal */}
      {orderSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 60, overflowY: 'auto', padding: '2rem' }}>
          <div className="mobile-col" style={{ background: 'white', padding: '2rem', borderRadius: '8px', display: 'flex', gap: '2rem', maxWidth: '800px', width: '100%', alignItems: 'flex-start' }}>
            
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', background: '#dcfce3', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>SALE COMPLETED</h2>
              <p style={{ color: '#6b7280', margin: '0 0 2rem 0' }}>Order #{orderSuccess.id.split('-')[0].toUpperCase()}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button onClick={() => window.print()} style={{ width: '100%', padding: '1rem', background: '#1f2937', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
                  Print Bill
                </button>
                <button onClick={closeSuccessModal} style={{ width: '100%', padding: '1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
                  New Sale
                </button>
              </div>
            </div>

            <div style={{ flex: 1, borderLeft: '1px solid #e5e7eb', paddingLeft: '2rem' }} className="print-area">
              <Receipt order={orderSuccess} />
            </div>

          </div>
        </div>
      )}

      
      {/* Held Carts Modal */}
      {showHeldModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '5vh', zIndex: 60 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setShowHeldModal(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>X</button>
            <h3 style={{ marginTop: 0 }}>Held Carts</h3>
            {heldCarts.length === 0 ? (
              <p>No held carts.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {heldCarts.map(hc => (
                  <div key={hc.id} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>Time: {hc.time}</div>
                      <div style={{ color: '#4b5563', fontSize: '0.9rem' }}>Items: {hc.cart.length} | Customer: {hc.customer ? hc.customer.phone : 'Guest'}</div>
                    </div>
                    <button onClick={() => handleRestoreCart(hc.id)} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Resume</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shift Start Overlay */}
      {!shift && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ marginTop: 0, color: '#dc2626' }}>Register Closed</h2>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>You must open the register to start billing.</p>
            <form onSubmit={openRegister}>
              <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                <label>Opening Cash (Rs.)</label>
                <input type="number" required value={openingFloat} onChange={e => setOpeningFloat(e.target.value)} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }} placeholder="e.g. 500" />
              </div>
              <button type="submit" style={{ width: '100%', padding: '1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>Open Register</button>
            </form>
          </div>
        </div>
      )}

      {/* Shift Close Modal */}
      {showShiftModal && shift && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 60 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button onClick={() => setShowShiftModal(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>X</button>
            <h3 style={{ marginTop: 0, color: '#059669' }}>Current Shift Status</h3>
            
            <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Opening Float:</span> <strong>Rs. {shift.openingFloat}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Cash Sales:</span> <strong>Rs. {shift.totalSalesCash}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>UPI Sales:</span> <strong>Rs. {shift.totalSalesUPI}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #d1d5db', fontSize: '1.1rem' }}>
                <span>Expected Cash in Drawer:</span> <strong style={{ color: '#16a34a' }}>Rs. {shift.expectedCash}</strong>
              </div>
            </div>

            <form onSubmit={closeRegister}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 'bold' }}>Counted Cash (Actual)</label>
                <input type="number" required value={actualCash} onChange={e => setActualCash(e.target.value)} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '1.1rem' }} placeholder="e.g. 1500" />
              </div>
              <button type="submit" style={{ width: '100%', padding: '1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>Close Shift (Z-Report)</button>
            </form>
          </div>
        </div>
      )}

      {/* Camera Scanner Modal */}
      {showCamera && <CameraScanner onScan={handleCameraScan} onClose={() => setShowCamera(false)} />}

    </div>
  );
}
















