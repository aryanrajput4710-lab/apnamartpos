import toast from 'react-hot-toast';
import { useState, useRef, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, User, Search, Trash2, Plus, Minus, X, Camera, Menu, LayoutDashboard, Package, Users, FileText, TrendingUp, UserPlus, Settings, LogOut, ChevronRight, Keyboard } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import CameraScanner from '../components/CameraScanner';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import Receipt from '../components/Receipt';
import ZReportReceipt from '../components/ZReportReceipt';
import { playBeep } from '../utils/audio';

export default function POS() {
  const { currentUser } = useAuth();
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [confirmModal, setConfirmModal] = useState(false);
  const [extraDiscount, setExtraDiscount] = useState('');
  
  // Scanner / Search State
  const [scanInput, setScanInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [customProductForm, setCustomProductForm] = useState({ name: '', costPrice: '', sellingPrice: '', mrp: '', stock: '' });
  const scanInputRef = useRef(null);

  // Customer State
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', address: '' });

  // Checkout State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('CUSTOMER');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  
  // Keyboard Shortcuts
  useEffect(() => {
    const handleHotkeys = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') e.target.blur();
        return;
      }
      if (e.key === 'F1') {
        e.preventDefault();
        if (cart.length > 0) {
          setCheckoutStep('CUSTOMER');
          setShowCheckoutModal(true);
        }
      }
      if (e.key === 'F2') {
        e.preventDefault();
        handleHoldCart();
      }
      if (e.key === 'Escape') {
        setShowCheckoutModal(false);
        setShowCustomerModal(false);
        setShowHeldModal(false);
        setOrderSuccess(null);
      }
    };
    window.addEventListener('keydown', handleHotkeys);
    return () => window.removeEventListener('keydown', handleHotkeys);
  }, [cart]);

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

  const handleDeleteHeldCart = (heldId) => {
    if (window.confirm("Are you sure you want to delete this held cart?")) {
      setHeldCarts(heldCarts.filter(hc => hc.id !== heldId));
    }
  };

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
  const [closedShiftReport, setClosedShiftReport] = useState(null);

  useEffect(() => {
    api.get('/settings').then(res => setSettings(res.data.data)).catch(console.error);
    api.get('/offers?active=true').then(res => setOffers(res.data.data)).catch(console.error);
    api.get('/register/status').then(res => setShift(res.data.data)).catch(console.error);
  }, []);

  
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
        toast('Product is out of stock!');
      } else {
        addToCart(variant);
      }
      setScanInput('');
      setSearchResults([]);
    } catch (err) {
      if (err.response?.status === 404) {
        searchProducts(rawCode);
      } else {
        toast(err.response?.data?.message || 'Error scanning product');
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
    playBeep();
    setCart(prev => {
      const existing = prev.find(item => item.id === variant.id);
      if (existing) {
        if (existing.quantity >= variant.stock) {
          toast(`Only ${variant.stock} available in stock.`);
          return prev;
        }
        return prev.map(item => 
          item.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...variant, quantity: 1 }];
    });
    scanInputRef.current?.focus();
  };

  const addCustomItem = async () => {
    const priceStr = prompt("Enter price for custom item (Rs):");
    if (!priceStr) return;
    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      toast.error("Invalid price");
      return;
    }
    const name = prompt("Enter item name (optional):") || "Miscellaneous Item";
    try {
      const res = await api.get('/pos/scan/MISC');
      const variant = res.data.data;
      const customItem = {
        ...variant,
        id: 'custom-' + Date.now(),
        variantId: variant.id,
        sellingPrice: price,
        customPrice: price,
        quantity: 1,
        product: { ...variant.product, name: name }
      };
      playBeep();
      setCart(prev => [...prev, customItem]);
    } catch (err) {
      toast.error("Error adding custom item");
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item; // Handled by remove
        if (newQty > item.stock) {
          toast(`Only ${item.stock} available in stock.`);
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
    } catch (err) { toast.error('Failed to open register'); }
  };

  const closeRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/register/close/${shift.id}`, { 
        actualCash, 
        totalUPI: shift.totalSalesUPI, 
        expectedCash: shift.expectedCash 
      });
      toast.success('Register closed successfully. End of shift.');
      setClosedShiftReport({ ...shift, actualCash });
      setShift(null);
      setShowShiftModal(false);
      setActualCash('');
      setOpeningFloat('');
    } catch (err) { toast.error('Failed to close register'); }
  };

  const clearCart = () => { if (cart.length > 0) { setConfirmModal(true); } };
  const confirmClearCart = () => { setCart([]); setCustomer(null); setExtraDiscount(''); };

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
      toast(err.response?.data?.message || 'Error creating customer');
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
      toast("Please open the register first!");
      return;
    }
    setIsProcessing(true);
    try {
      const payload = {
        items: cart.map(item => ({ variantId: item.variantId || item.id, quantity: item.quantity, customPrice: item.customPrice })),
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
      toast(err.response?.data?.message || 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const closeSuccessModal = () => {
    setOrderSuccess(null);
    setShowCheckoutModal(false);
    scanInputRef.current?.focus();
  };

  // Global Hardware Barcode Scanner Listener
  useBarcodeScanner(handleScanRequest);

  const [quickProducts, setQuickProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { setDrawerOpen } = useOutletContext();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    api.get('/pos/search?q=').then(res => {
      const prods = res.data.data || [];
      setQuickProducts(prods);
      
      const cats = new Set();
      prods.forEach(p => {
        if (p.product && p.product.category) cats.add(p.product.category);
      });
      setCategories(['All', ...Array.from(cats)]);
    }).catch(console.error);
  }, []);

  const displayedQuickProducts = selectedCategory === 'All' 
    ? quickProducts 
    : quickProducts.filter(p => p.product?.category === selectedCategory);
  return (
    <div style={{ display: 'flex', height: '100%', background: '#f8fafc', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* MAIN LAYOUT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%', overflow: 'hidden' }}>
        
        {/* LEFT PANE - PRODUCTS & SEARCH (65%) */}
        <div style={{ flex: isMobile ? '1' : '0 0 65%', display: 'flex', flexDirection: 'column', padding: '1.25rem', background: '#f8fafc', overflow: 'hidden' }}>
          
          {/* TOP BAR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <button onClick={() => setDrawerOpen(true)} style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <Menu size={24} color="#334155" />
            </button>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', flex: 1 }}>Apna Mart POS</h1>
            
            {/* REGISTER STATUS PILL */}
            {shift ? (
              <div onClick={() => setShowShiftModal(true)} style={{ background: '#dcfce7', color: '#166534', padding: '0.375rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', border: '1px solid #bbf7d0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '8px', height: '8px', background: '#16a34a', borderRadius: '50%' }} />
                Register Open
              </div>
            ) : (
              <div onClick={() => setShowShiftModal(true)} style={{ background: '#fee2e2', color: '#991b1b', padding: '0.375rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', border: '1px solid #fecaca', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ width: '8px', height: '8px', background: '#dc2626', borderRadius: '50%' }} />
                Register Closed
              </div>
            )}
          </div>

          {/* SEARCH BAR */}
          <form onSubmit={handleScanSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button type="button" onClick={() => setShowCamera(true)} style={{ padding: '0 1rem', background: 'white', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
              <Camera size={24} />
            </button>
            <div style={{ flex: 1 }}>
              <input
                ref={scanInputRef}
                type="text"
                value={scanInput}
                onChange={(e) => {
                  setScanInput(e.target.value);
                  if (e.target.value.trim() === '') setSearchResults([]);
                }}
                placeholder="Scan barcode or search product..."
                style={{ width: '100%', height: '52px', padding: '0 16px', fontSize: '1.05rem', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'border-color 0.2s', boxSizing: 'border-box', background: 'white', minHeight: 'unset' }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>
            <button type="submit" style={{ padding: '0 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(59,130,246,0.3)' }}>
              Search
            </button>
            <button type="button" onClick={handleCustomItemClick} style={{ padding: '0 1.5rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(245,158,11,0.3)' }}>
              Custom Item
            </button>
          </form>

          {/* PRODUCT AREA */}
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {isSearching ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Searching products...</div>
            ) : searchResults.length > 0 ? (
              <>
                <h3 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '1.1rem' }}>Search Results</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                  {searchResults.map(v => (
                    <div 
                      key={v.id} 
                      onClick={() => v.stock > 0 && addToCart(v)}
                      style={{ 
                        background: 'white', padding: '1rem', borderRadius: '12px', cursor: v.stock > 0 ? 'pointer' : 'not-allowed',
                        border: '1px solid #e2e8f0', opacity: v.stock > 0 ? 1 : 0.6,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column'
                      }}
                    >
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.product.name}</h4>
                      <p style={{ margin: '0', fontSize: '0.8rem', color: '#64748b' }}>{v.size?.trim() ? `Size: ${v.size}` : ''} {v.color?.trim() ? `Color: ${v.color}` : ''}</p>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.75rem', color: '#94a3b8' }}>SKU: {v.sku}</p>
                      <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.75rem' }}>₹{v.mrp}</div>
                          <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1.1rem' }}>₹{v.sellingPrice}</div>
                        </div>
                        <div style={{ background: '#f1f5f9', padding: '0.375rem', borderRadius: '6px', color: '#3b82f6' }}>
                          <Plus size={18} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* QUICK ADD SECTION */}
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{ 
                        padding: '0.5rem 1rem', 
                        background: selectedCategory === cat ? '#3b82f6' : 'white', 
                        color: selectedCategory === cat ? 'white' : '#475569', 
                        border: selectedCategory === cat ? '1px solid #3b82f6' : '1px solid #cbd5e1', 
                        borderRadius: '999px', 
                        fontWeight: '500', 
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                
                <h3 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '1.1rem' }}>Popular Products</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                  {displayedQuickProducts.map(v => (
                    <div 
                      key={v.id} 
                      onClick={() => v.stock > 0 && addToCart(v)}
                      style={{ 
                        background: 'white', padding: '1rem', borderRadius: '12px', cursor: v.stock > 0 ? 'pointer' : 'not-allowed',
                        border: '1px solid #e2e8f0', opacity: v.stock > 0 ? 1 : 0.6,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column'
                      }}
                    >
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.product?.name}</h4>
                      <p style={{ margin: '0', fontSize: '0.8rem', color: '#64748b' }}>{v.size?.trim() ? `Size: ${v.size}` : ''} {v.color?.trim() ? `Color: ${v.color}` : ''}</p>
                      <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1.1rem' }}>₹{v.sellingPrice}</div>
                        <div style={{ background: '#f1f5f9', padding: '0.375rem', borderRadius: '6px', color: '#3b82f6' }}>
                          <Plus size={18} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANE - CART & CHECKOUT (35%) */}
        <div style={{ flex: isMobile ? '1' : '0 0 35%', display: 'flex', flexDirection: 'column', background: 'white', borderLeft: '1px solid #e2e8f0', boxShadow: '-2px 0 10px rgba(0,0,0,0.02)', zIndex: 10 }}>
          
          {/* CUSTOMER CARD */}
          <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} /> Customer
              </h3>
              <button onClick={() => setShowCustomerModal(true)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.875rem', fontWeight: '600', cursor: 'pointer' }}>
                + Add New
              </button>
            </div>
            
            {!customer ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={customerPhone} 
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number..."
                  style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
                <button onClick={searchCustomer} style={{ padding: '0 1.25rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  Find
                </button>
              </div>
            ) : (
              <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{customer.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>{customer.phone}</div>
                </div>
                <button onClick={() => {setCustomer(null); setCustomerPhone('');}} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          {/* CART ITEMS */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
            {cart.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <div style={{ background: '#f1f5f9', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                  <ShoppingCart size={40} color="#cbd5e1" />
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '1.1rem' }}>Your cart is empty</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', textAlign: 'center', maxWidth: '220px' }}>Scan a barcode or select a product to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{item.product?.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.875rem' }}>₹{item.sellingPrice}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '1.05rem' }}>₹{(item.sellingPrice * item.quantity).toFixed(2)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '0.375rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Minus size={14}/></button>
                        <span style={{ padding: '0 0.5rem', fontWeight: '600', fontSize: '0.875rem', minWidth: '1.5rem', textAlign: 'center' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '0.375rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Plus size={14}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BILL SUMMARY */}
          <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: '#64748b', fontSize: '0.95rem' }}>
              <span>Subtotal</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', color: '#16a34a', fontSize: '0.95rem' }}>
                <span>Discount</span>
                <span>-₹{totals.discount.toFixed(2)}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1' }}>
              <span style={{ fontWeight: '600', color: '#334155', fontSize: '1.1rem' }}>TOTAL</span>
              <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '2rem' }}>₹{totals.total.toFixed(2)}</span>
            </div>

            {/* ACTION BUTTONS */}
            <button 
              onClick={openCheckout}
              disabled={cart.length === 0 || !shift}
              style={{ 
                width: '100%', padding: '1.25rem', background: cart.length > 0 && shift ? '#16a34a' : '#94a3b8', 
                color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '1.25rem', 
                cursor: cart.length > 0 && shift ? 'pointer' : 'not-allowed', marginBottom: '1rem',
                boxShadow: cart.length > 0 && shift ? '0 4px 6px rgba(22,163,74,0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              PAY ₹{totals.total.toFixed(2)}
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <button onClick={handleHoldCart} disabled={cart.length === 0} style={{ padding: '0.75rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: '600', fontSize: '0.875rem', cursor: cart.length > 0 ? 'pointer' : 'not-allowed' }}>Hold Sale</button>
              <button onClick={() => setShowHeldModal(true)} style={{ padding: '0.75rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer' }}>Held ({heldCarts.length})</button>
              <button onClick={clearCart} disabled={cart.length === 0} style={{ padding: '0.75rem', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontWeight: '600', fontSize: '0.875rem', cursor: cart.length > 0 ? 'pointer' : 'not-allowed' }}>Clear</button>
            </div>
          </div>
        </div>
      </div>

      {/* ALL MODALS (KEEP EXACTLY AS THEY WERE) */}
      
      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '5vh', zIndex: 60 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setShowCheckoutModal(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>X</button>
            
            <h2 style={{ marginTop: 0 }}>Checkout</h2>
            
            {/* Customer Info at Checkout */}
            {!customer ? (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#334155' }}>Customer Phone (Optional)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    value={customerPhone} 
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="Enter phone number..."
                    style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                  <button onClick={searchCustomer} style={{ padding: '0 1.25rem', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                    Find
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{customer.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>{customer.phone}</div>
                </div>
                <button onClick={() => {setCustomer(null); setCustomerPhone('');}} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                  <X size={18} />
                </button>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#334155' }}>Extra Discount (Rs)</label>
              <input 
                type="number" 
                min="0"
                value={extraDiscount}
                onChange={e => setExtraDiscount(e.target.value)}
                placeholder="0"
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem', background: '#f3f4f6', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', color: '#4b5563' }}>Amount Due</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#16a34a' }}>Rs. {totals.total.toFixed(2)}</div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Payment Method</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setPaymentMethod('CASH')}
                  style={{ flex: 1, padding: '1rem', border: paymentMethod === 'CASH' ? '2px solid #3b82f6' : '1px solid #d1d5db', background: paymentMethod === 'CASH' ? '#eff6ff' : 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >CASH</button>
                <button 
                  onClick={() => setPaymentMethod('QR')}
                  style={{ flex: 1, padding: '1rem', border: paymentMethod === 'QR' ? '2px solid #3b82f6' : '1px solid #d1d5db', background: paymentMethod === 'QR' ? '#eff6ff' : 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >QR/UPI</button>
              </div>
            </div>

            {paymentMethod === 'QR' && settings?.paymentQrCodeUrl && (
              <div style={{ marginBottom: '1.5rem', textAlign: 'center', background: '#f9fafb', padding: '1rem', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                <div style={{ marginBottom: '0.5rem', fontWeight: '500', color: '#4b5563' }}>Scan to Pay</div>
                <img src={settings.paymentQrCodeUrl} alt="Store QR Code" style={{ width: '200px', height: '200px', objectFit: 'contain', margin: '0 auto' }} />
              </div>
            )}

            <button 
              onClick={handleCheckout} 
              disabled={isProcessing}
              style={{ width: '100%', padding: '1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.2rem', cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.7 : 1 }}
            >
              {isProcessing ? 'Processing...' : 'Complete Payment'}
            </button>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 60 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button onClick={() => setShowCustomerModal(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>X</button>
            <h3 style={{ marginTop: 0 }}>New Customer</h3>
            <form onSubmit={createCustomer}>
              <div style={{ marginBottom: '1rem' }}>
                <label>Phone</label>
                <input required type="text" value={newCustomer.phone || ''} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Name</label>
                <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} />
              </div>
              <button type="submit" style={{ width: '100%', padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save & Select</button>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {orderSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, overflowY: 'auto', padding: '2rem' }}>
          <div className="mobile-col" style={{ background: 'white', padding: '2rem', borderRadius: '8px', display: 'flex', gap: '2rem', maxWidth: '800px', width: '100%', alignItems: 'flex-start' }}>
            
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1rem', fontSize: '3rem' }}>✓</div>
              <h2 style={{ margin: '0 0 1rem 0' }}>Payment Successful!</h2>
              <p style={{ fontSize: '1.2rem', color: '#4b5563', marginBottom: '2rem' }}>Order #{orderSuccess.orderNumber}</p>
              
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
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleDeleteHeldCart(hc.id)} style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                      <button onClick={() => handleRestoreCart(hc.id)} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Resume</button>
                    </div>
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


      
      {showAddProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Add Custom Product</h3>
            <form onSubmit={handleCreateCustomProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="Product Name" value={customProductForm.name} onChange={e => setCustomProductForm({...customProductForm, name: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
              <input type="number" placeholder="Cost Price (Rs)" value={customProductForm.costPrice} onChange={e => setCustomProductForm({...customProductForm, costPrice: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
              <input type="number" placeholder="MRP (Rs)" value={customProductForm.mrp} onChange={e => setCustomProductForm({...customProductForm, mrp: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
              <input type="number" placeholder="Selling Price (Rs)" value={customProductForm.sellingPrice} onChange={e => setCustomProductForm({...customProductForm, sellingPrice: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
              <input type="number" placeholder="Stock" value={customProductForm.stock} onChange={e => setCustomProductForm({...customProductForm, stock: e.target.value})} style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} required />
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddProductModal(false)} style={{ flex: 1, padding: '0.75rem', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button onClick={() => setShowShortcuts(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Keyboard size={20}/> Keyboard Shortcuts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#475569' }}>Checkout / Pay</span>
                <kbd style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 'bold' }}>Enter</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#475569' }}>Hold Sale</span>
                <kbd style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 'bold' }}>F2</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#475569' }}>Close Modals</span>
                <kbd style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 'bold' }}>Esc</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#475569' }}>Focus Search/Barcode</span>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Start scanning anywhere</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Scanner Modal */}

      {showCamera && <CameraScanner onScan={handleCameraScan} onClose={() => setShowCamera(false)} />}


      {/* Z-Report Modal */}
      {closedShiftReport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, overflowY: 'auto', padding: '2rem' }}>
          <div className="mobile-col" style={{ background: 'white', padding: '2rem', borderRadius: '8px', display: 'flex', gap: '2rem', maxWidth: '800px', width: '100%', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h2>SHIFT CLOSED</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button onClick={() => window.print()} style={{ width: '100%', padding: '1rem', background: '#1f2937', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
                  Print Z-Report
                </button>
                <button onClick={() => setClosedShiftReport(null)} style={{ width: '100%', padding: '1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
                  Done
                </button>
              </div>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid #e5e7eb', paddingLeft: '2rem' }} className="print-area">
              <ZReportReceipt shift={closedShiftReport} />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal}
        title="Clear Cart?"
        message="Are you sure you want to remove all items from the cart? This cannot be undone."
        confirmText="Clear Cart"
        onConfirm={() => {
          confirmClearCart();
          setConfirmModal(false);
        }}
        onCancel={() => setConfirmModal(false)}
      />

    </div>
  );
}
