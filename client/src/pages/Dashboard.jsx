import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  IndianRupee, ShoppingBag, ShoppingCart, TrendingUp, AlertTriangle, 
  Bell, User, CheckCircle2, Search, Plus, Barcode, 
  Package, Users, Clock, Box, ArrowRight, CreditCard, ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Label, Sector
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('Today');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const theme = isDarkMode ? {
    bg: '#111827', card: '#1f2937', text: '#f9fafb', textSec: '#9ca3af', border: '#374151', borderDark: '#4b5563', hover: '#374151'
  } : {
    bg: '#fafafa', card: '#ffffff', text: '#111827', textSec: '#6b7280', border: '#f3f4f6', borderDark: '#d1d5db', hover: '#f9fafb'
  };

  // Modals / Full views state
  const [viewAllCategories, setViewAllCategories] = useState(false);
  const [viewAllProducts, setViewAllProducts] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, ordersRes] = await Promise.all([
        api.get(`/reports/dashboard?range=${encodeURIComponent(range)}`),
        api.get('/orders')
      ]);
      setData(dashRes.data.data);
      if (ordersRes.data.success && Array.isArray(ordersRes.data.data)) {
        setRecentOrders(ordersRes.data.data.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
      setError('Error loading dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Setup WebSocket
    let socket;
    import('socket.io-client').then(module => {
      const io = module.default;
      socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
      socket.on('dashboard_update', () => {
        fetchDashboard();
      });
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [range]);

  // --- UI Helpers ---
  const getGrowthIndicator = (current, previous) => {
    if (previous === undefined || previous === null || previous === 0) return null;
    const pct = ((current - previous) / previous) * 100;
    const color = pct >= 0 ? '#16a34a' : '#ef4444';
    const icon = pct >= 0 ? '↑' : '↓';
    return (
      <div style={{ color, fontSize: '0.75rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
        <span>{icon} {Math.abs(pct).toFixed(1)}%</span>
        <span style={{ color: theme.textSec, fontWeight: '400' }}>vs last period</span>
      </div>
    );
  };
  const formatCurrency = (val) => {
    return '₹' + parseFloat(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const Card = ({ children, style = {}, className = '' }) => (
    <div className={`dashboard-card ${className}`} style={{ 
      background: theme.card, 
      borderRadius: '12px', 
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      padding: '1.5rem',
      ...style 
    }}>
      {children}
    </div>
  );

  const StatusBadge = ({ status }) => {
    const colors = {
      COMPLETED: { bg: '#dcfce7', text: '#166534' },
      PENDING: { bg: '#fef9c3', text: '#854d0e' },
      CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
      RETURNED: { bg: theme.border, text: theme.text },
      PARTIAL_RETURN: { bg: '#ffedd5', text: '#9a3412' }
    };
    const style = colors[status] || { bg: theme.border, text: theme.text };
    return (
      <span style={{ background: style.bg, color: style.text, padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600' }}>
        {status}
      </span>
    );
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: 0.7, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ height: '40px', background: theme.border, borderRadius: '8px', width: '300px' }} />
          <div style={{ height: '40px', background: theme.border, borderRadius: '8px', width: '200px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {[1,2,3,4,5].map(i => <Card key={i} style={{ height: '120px', background: theme.border }} />)}
        </div>
        <Card style={{ height: '350px', background: theme.border }} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', background: theme.card, borderRadius: '12px', margin: '2rem' }}>
        <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Failed to load dashboard</h3>
        <p style={{ color: theme.textSec, marginBottom: '1.5rem' }}>{error}</p>
        <button onClick={fetchDashboard} style={{ padding: '0.5rem 1.5rem', background: '#3b82f6', color: theme.card, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
          Try Again
        </button>
      </div>
    );
  }

  const { 
    summary = {}, 
    paymentSummary = { CASH: { amount: 0 }, QR: { amount: 0 } }, 
    lowStock = [], 
    topProducts = [], 
    topCategories = [], 
    customerStats = { new: 0, returning: 0, total: 0 }, 
    chart = [] 
  } = data;

  // --- Computed Metrics ---
  const totalPayment = paymentSummary.CASH.amount + paymentSummary.QR.amount;
  const cashPct = totalPayment > 0 ? ((paymentSummary.CASH.amount / totalPayment) * 100).toFixed(0) : 0;
  const qrPct = totalPayment > 0 ? ((paymentSummary.QR.amount / totalPayment) * 100).toFixed(0) : 0;

  const paymentData = [
    { name: 'Cash', value: paymentSummary.CASH.amount, color: '#10b981' },
    { name: 'QR / UPI', value: paymentSummary.QR.amount, color: '#3b82f6' }
  ].filter(d => d.value > 0);

  const top5Categories = (topCategories || []).slice(0, 5).map(c => ({
    name: c.category,
    revenue: parseFloat(c.total)
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '1rem', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: '600', color: theme.text }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: 0, color: entry.color, fontSize: '0.875rem' }}>
              {entry.name}: {entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('profit') ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // --- Sub Views ---
  if (viewAllCategories) {
    const [catSearch, setCatSearch] = useState('');
    const [catSort, setCatSort] = useState('total');
    const [catPage, setCatPage] = useState(1);
    const catItemsPerPage = 10;

    let filteredCats = (topCategories || []).filter(c => c.category.toLowerCase().includes(catSearch.toLowerCase()));
    if (catSort === 'total') filteredCats.sort((a, b) => b.total - a.total);
    if (catSort === 'quantity') filteredCats.sort((a, b) => b.quantity - a.quantity);
    if (catSort === 'name') filteredCats.sort((a, b) => a.category.localeCompare(b.category));

    return (
      <div style={{ padding: '1.5rem', background: theme.bg, minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setViewAllCategories(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSec }}>
              <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <h2 style={{ margin: 0 }}>All Category Sales</h2>
          </div>
          <select 
            value={range} 
            onChange={(e) => setRange(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', background: theme.card }}
          >
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Month">This Month</option>
          </select>
        </div>

        <Card>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: theme.border, padding: '0.5rem 1rem', borderRadius: '6px', flex: '1 1 200px' }}>
              <Search size={16} color="#6b7280" />
              <input 
                type="text" 
                placeholder="Search categories..." 
                value={catSearch} 
                onChange={e => setCatSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
              />
            </div>
            <select 
              value={catSort} 
              onChange={e => setCatSort(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', background: theme.card }}
            >
              <option value="total">Highest Sales</option>
              <option value="quantity">Highest Units Sold</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f3f4f6', color: theme.textSec, fontSize: '0.875rem' }}>
                  <th style={{ padding: '1rem' }}>Rank</th>
                  <th style={{ padding: '1rem' }}>Category</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Units Sold</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {filteredCats.slice((catPage - 1) * catItemsPerPage, catPage * catItemsPerPage).map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem', color: theme.textSec, fontWeight: '500' }}>#{i + 1}</td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{c.category}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{c.quantity}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCats.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: theme.textSec }}>No categories found.</div>}
          </div>
          {filteredCats.length > catItemsPerPage && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', background: theme.bg, borderRadius: '8px' }}>
              <button 
                onClick={() => setCatPage(p => Math.max(1, p - 1))} 
                disabled={catPage === 1}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid ' + theme.borderDark, background: theme.card, color: theme.text, cursor: catPage === 1 ? 'not-allowed' : 'pointer', opacity: catPage === 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ChevronLeft size={16} /> Previous
              </button>
              <span style={{ color: theme.textSec, fontSize: '0.875rem' }}>Page {catPage} of {Math.ceil(filteredCats.length / catItemsPerPage)}</span>
              <button 
                onClick={() => setCatPage(p => Math.min(Math.ceil(filteredCats.length / catItemsPerPage), p + 1))} 
                disabled={catPage === Math.ceil(filteredCats.length / catItemsPerPage)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid ' + theme.borderDark, background: theme.card, color: theme.text, cursor: catPage === Math.ceil(filteredCats.length / catItemsPerPage) ? 'not-allowed' : 'pointer', opacity: catPage === Math.ceil(filteredCats.length / catItemsPerPage) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (viewAllProducts) {
    const [prodSearch, setProdSearch] = useState('');
    const [prodSort, setProdSort] = useState('total');
    const [prodPage, setProdPage] = useState(1);
    const prodItemsPerPage = 10;

    let filteredProds = (topProducts || []).filter(p => p.productNameSnapshot.toLowerCase().includes(prodSearch.toLowerCase()) || p.skuSnapshot.toLowerCase().includes(prodSearch.toLowerCase()));
    
    if (prodSort === 'total') filteredProds.sort((a, b) => b._sum.total - a._sum.total);
    if (prodSort === 'quantity') filteredProds.sort((a, b) => b._sum.quantity - a._sum.quantity);
    if (prodSort === 'name') filteredProds.sort((a, b) => a.productNameSnapshot.localeCompare(b.productNameSnapshot));

    return (
      <div style={{ padding: '1.5rem', background: theme.bg, minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setViewAllProducts(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textSec }}>
              <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <h2 style={{ margin: 0 }}>All Top Selling Products</h2>
          </div>
          <select 
            value={range} 
            onChange={(e) => setRange(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', background: theme.card }}
          >
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Month">This Month</option>
          </select>
        </div>
        
        <Card>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: theme.border, padding: '0.5rem 1rem', borderRadius: '6px', flex: '1 1 200px' }}>
              <Search size={16} color="#6b7280" />
              <input 
                type="text" 
                placeholder="Search products by name or SKU..." 
                value={prodSearch} 
                onChange={e => setProdSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
              />
            </div>
            <select 
              value={prodSort} 
              onChange={e => setProdSort(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', background: theme.card }}
            >
              <option value="total">Highest Revenue</option>
              <option value="quantity">Highest Units Sold</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f3f4f6', color: theme.textSec, fontSize: '0.875rem' }}>
                  <th style={{ padding: '1rem' }}>Rank</th>
                  <th style={{ padding: '1rem' }}>Product</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Units Sold</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {filteredProds.slice((prodPage - 1) * prodItemsPerPage, prodPage * prodItemsPerPage).map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '1rem', color: theme.textSec, fontWeight: '500' }}>#{i + 1}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '500' }}>{p.productNameSnapshot}</div>
                      <div style={{ fontSize: '0.75rem', color: theme.textSec }}>
                        {p.sizeSnapshot} {p.colorSnapshot ? `/ ${p.colorSnapshot}` : ''} ({p.skuSnapshot})
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{p._sum.quantity}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>{formatCurrency(p._sum.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProds.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: theme.textSec }}>No products found.</div>}
          </div>
          {filteredProds.length > prodItemsPerPage && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '1rem', background: theme.bg, borderRadius: '8px' }}>
              <button 
                onClick={() => setProdPage(p => Math.max(1, p - 1))} 
                disabled={prodPage === 1}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid ' + theme.borderDark, background: theme.card, color: theme.text, cursor: prodPage === 1 ? 'not-allowed' : 'pointer', opacity: prodPage === 1 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ChevronLeft size={16} /> Previous
              </button>
              <span style={{ color: theme.textSec, fontSize: '0.875rem' }}>Page {prodPage} of {Math.ceil(filteredProds.length / prodItemsPerPage)}</span>
              <button 
                onClick={() => setProdPage(p => Math.min(Math.ceil(filteredProds.length / prodItemsPerPage), p + 1))} 
                disabled={prodPage === Math.ceil(filteredProds.length / prodItemsPerPage)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid ' + theme.borderDark, background: theme.card, color: theme.text, cursor: prodPage === Math.ceil(filteredProds.length / prodItemsPerPage) ? 'not-allowed' : 'pointer', opacity: prodPage === Math.ceil(filteredProds.length / prodItemsPerPage) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // --- Layout Return ---
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: theme.bg, minHeight: '100vh' }}>
      {/* 1. HEADER */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#dcfce7', color: '#166534', padding: '0.5rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', fontWeight: '500' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
            Store Online
          </div>
          <select 
            value={range} 
            onChange={(e) => setRange(e.target.value)}
            style={{ 
              padding: '0.625rem 1rem', 
              borderRadius: '8px', 
              border: '1px solid #d1d5db', 
              background: theme.card, 
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              color: theme.text,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Month">This Month</option>
          </select>
          <div style={{ width: '40px', height: '40px', background: theme.card, border: '1px solid #e5e7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.textSec }}>
            <Bell size={20} />
          </div>
          <div onClick={() => setIsDarkMode(!isDarkMode)} style={{ width: '40px', height: '40px', background: theme.card, border: '1px solid ' + theme.borderDark, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.textSec }}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </div>
          <div style={{ width: '40px', height: '40px', background: theme.border, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textSec }}>
            <User size={20} />
          </div>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <p style={{ margin: 0, color: theme.textSec, fontSize: '0.875rem', fontWeight: '500' }}>Net Sales</p>
            <div style={{ background: '#eff6ff', color: '#2563eb', padding: '0.5rem', borderRadius: '8px' }}><IndianRupee size={20} /></div>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700', color: theme.text }}><CountUp start={0} end={summary.revenue} duration={1.5} separator="," prefix="₹" decimals={2} /></h3>
          {getGrowthIndicator(summary.revenue, summary.prevRevenue)}
        </Card>
        
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <p style={{ margin: 0, color: theme.textSec, fontSize: '0.875rem', fontWeight: '500' }}>Gross Profit</p>
            <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.5rem', borderRadius: '8px' }}><TrendingUp size={20} /></div>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700', color: theme.text }}><CountUp start={0} end={summary.profit || 0} duration={1.5} separator="," prefix="₹" decimals={2} /></h3>
          {getGrowthIndicator(summary.profit || 0, summary.prevProfit)}
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <p style={{ margin: 0, color: theme.textSec, fontSize: '0.875rem', fontWeight: '500' }}>Orders</p>
            <div style={{ background: '#ffedd5', color: '#ea580c', padding: '0.5rem', borderRadius: '8px' }}><ShoppingCart size={20} /></div>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700', color: theme.text }}><CountUp start={0} end={summary.orders} duration={1.5} separator="," /></h3>
          {getGrowthIndicator(summary.orders, summary.prevOrders)}
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <p style={{ margin: 0, color: theme.textSec, fontSize: '0.875rem', fontWeight: '500' }}>Items Sold</p>
            <div style={{ background: '#f3e8ff', color: '#9333ea', padding: '0.5rem', borderRadius: '8px' }}><ShoppingBag size={20} /></div>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700', color: theme.text }}><CountUp start={0} end={summary.itemsSold} duration={1.5} separator="," /></h3>
          {getGrowthIndicator(summary.itemsSold, summary.prevItemsSold)}
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <p style={{ margin: 0, color: theme.textSec, fontSize: '0.875rem', fontWeight: '500' }}>Average Order Value</p>
            <div style={{ background: '#fce7f3', color: '#db2777', padding: '0.5rem', borderRadius: '8px' }}><CreditCard size={20} /></div>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700', color: theme.text }}><CountUp start={0} end={summary.aov} duration={1.5} separator="," prefix="₹" decimals={2} /></h3>
          {getGrowthIndicator(summary.aov, summary.prevAov)}
        </Card>
      </div>

      {/* 3. SALES OVERVIEW + QUICK ACTIONS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        <Card style={{ flex: '2 1 600px', minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: theme.text }}>Sales Overview</h3>
          </div>
          {(!chart || chart.length === 0) ? (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: theme.textSec }}>
              <TrendingUp size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No sales recorded for this period</p>
            </div>
          ) : (
            <div style={{ height: '320px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: theme.textSec, fontSize: 12 }}
                    tickFormatter={(val) => val ? val.split('-').slice(1).join('/') : ''}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: theme.textSec, fontSize: 12 }}
                    tickFormatter={(val) => `₹${val/1000}k`}
                    width={60}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card style={{ flex: '1 1 300px' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: theme.text }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button onClick={() => navigate('/pos')} style={{ width: '100%', padding: '1rem', background: '#2563eb', color: theme.card, border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#1d4ed8'} onMouseOut={e => e.currentTarget.style.background = '#2563eb'}>
              <ShoppingCart size={20} />
              New Sale
            </button>
            <button onClick={() => navigate('/pos')} style={{ width: '100%', padding: '1rem', background: theme.border, color: theme.text, border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = theme.border} onMouseOut={e => e.currentTarget.style.background = theme.border}>
              <Barcode size={20} />
              Scan Barcode
            </button>
            <div style={{ height: '1px', background: theme.border, margin: '0.5rem 0' }} />
            <button onClick={() => navigate('/products')} style={{ width: '100%', padding: '0.75rem', background: 'transparent', color: theme.textSec, border: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '500', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.color = theme.text} onMouseOut={e => e.currentTarget.style.color = theme.textSec}>
              <div style={{ background: theme.border, padding: '0.4rem', borderRadius: '6px' }}><Package size={18} /></div>
              Add Product
            </button>
            <button onClick={() => navigate('/customers')} style={{ width: '100%', padding: '0.75rem', background: 'transparent', color: theme.textSec, border: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '500', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.color = theme.text} onMouseOut={e => e.currentTarget.style.color = theme.textSec}>
              <div style={{ background: theme.border, padding: '0.4rem', borderRadius: '6px' }}><Users size={18} /></div>
              Add Customer
            </button>
            <button onClick={() => navigate('/inventory')} style={{ width: '100%', padding: '0.75rem', background: 'transparent', color: theme.textSec, border: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '500', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.color = theme.text} onMouseOut={e => e.currentTarget.style.color = theme.textSec}>
              <div style={{ background: theme.border, padding: '0.4rem', borderRadius: '6px' }}><Box size={18} /></div>
              View Inventory
            </button>
          </div>
        </Card>
      </div>

      {/* 4. TOP SELLING CATEGORIES + PAYMENT METHODS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        <Card style={{ flex: '2 1 500px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: theme.text }}>Top Selling Categories</h3>
            {topCategories && topCategories.length > 5 && (
              <button onClick={() => setViewAllCategories(true)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                View All <ArrowRight size={16} />
              </button>
            )}
          </div>
          {(!topCategories || topCategories.length === 0) ? (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textSec }}>
              No category data available.
            </div>
          ) : (
            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top5Categories} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fill: theme.textSec, fontSize: 13, fontWeight: 500 }} />
                  <RechartsTooltip cursor={{fill: theme.border}} content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} barSize={24} animationDuration={1000}>
                    {top5Categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card style={{ flex: '1 1 300px' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: theme.text }}>Payment Methods</h3>
          {totalPayment === 0 ? (
            <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textSec }}>
              No payments recorded.
            </div>
          ) : (
            <div style={{ height: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ height: '180px', width: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none" animationDuration={1000}>
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '0.75rem', color: theme.textSec, fontWeight: '500' }}>Total Collected</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: '700', color: theme.text }}>{formatCurrency(totalPayment)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: theme.text }}>Cash {cashPct}%</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3b82f6' }} />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: theme.text }}>QR {qrPct}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 5. CUSTOMER SUMMARY + TOP SELLING PRODUCTS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        <Card style={{ flex: '1 1 350px' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.125rem', fontWeight: '600', color: theme.text }}>Customer Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#faf5ff', borderRadius: '8px', border: '1px solid #f3e8ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#e9d5ff', color: '#9333ea', padding: '0.6rem', borderRadius: '8px' }}><User size={20} /></div>
                <span style={{ fontWeight: '500', color: theme.textSec }}>New Customers</span>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: theme.text }}>{customerStats.new}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#bbf7d0', color: '#16a34a', padding: '0.6rem', borderRadius: '8px' }}><Users size={20} /></div>
                <span style={{ fontWeight: '500', color: theme.textSec }}>Returning Customers</span>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: theme.text }}>{customerStats.returning}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #dbeafe' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: '#bfdbfe', color: '#2563eb', padding: '0.6rem', borderRadius: '8px' }}><CheckCircle2 size={20} /></div>
                <span style={{ fontWeight: '500', color: theme.textSec }}>Total Registered</span>
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: theme.text }}>{customerStats.total}</span>
            </div>
          </div>
          
          {/* Proportional Bar */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '600', color: theme.textSec }}>
              <span>New vs Returning (Current Period)</span>
            </div>
            <div style={{ display: 'flex', height: '12px', borderRadius: '999px', overflow: 'hidden', background: theme.border }}>
              {customerStats.new + customerStats.returning > 0 && (
                <>
                  <div style={{ width: `${(customerStats.new / (customerStats.new + customerStats.returning)) * 100}%`, background: '#a855f7' }} title={`New: ${customerStats.new}`} />
                  <div style={{ width: `${(customerStats.returning / (customerStats.new + customerStats.returning)) * 100}%`, background: '#22c55e' }} title={`Returning: ${customerStats.returning}`} />
                </>
              )}
            </div>
          </div>
        </Card>

        <Card style={{ flex: '2 1 500px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: theme.text }}>Top Selling Products</h3>
            {topProducts && topProducts.length > 5 && (
              <button onClick={() => setViewAllProducts(true)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                View All <ArrowRight size={16} />
              </button>
            )}
          </div>
          {(!topProducts || topProducts.length === 0) ? (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textSec }}>
              No products sold in this period.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(topProducts || []).slice(0, 5).map((tp, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: idx < 4 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: idx === 0 ? '#fef08a' : idx === 1 ? theme.border : idx === 2 ? '#fed7aa' : theme.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', color: idx < 3 ? theme.text : theme.textSec }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: theme.text }}>{tp.productNameSnapshot}</div>
                      <div style={{ fontSize: '0.75rem', color: theme.textSec, marginTop: '0.125rem' }}>
                        {tp.sizeSnapshot} {tp.colorSnapshot ? `/ ${tp.colorSnapshot}` : ''} • {tp.skuSnapshot}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600', color: theme.text }}>{formatCurrency(tp._sum.total)}</div>
                    <div style={{ fontSize: '0.75rem', color: theme.textSec, marginTop: '0.125rem' }}>{tp._sum.quantity} sold</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 6. LOW STOCK + RECENT ORDERS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
        <Card style={{ flex: '1 1 350px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <AlertTriangle color="#ea580c" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: theme.text }}>Low Stock Items</h3>
          </div>
          {lowStock.length === 0 ? (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: theme.textSec }}>
              <CheckCircle2 size={32} color="#22c55e" style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>All products are well stocked.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(lowStock || []).slice(0, 5).map((ls) => (
                <div key={ls.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#9a3412', fontSize: '0.875rem' }}>{ls.product.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#b45309' }}>{ls.size} {ls.color ? `/ ${ls.color}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '700', color: ls.stock <= 0 ? '#dc2626' : '#d97706' }}>{ls.stock} left</span>
                  </div>
                </div>
              ))}
              {lowStock.length > 5 && (
                <button onClick={() => navigate('/inventory')} style={{ marginTop: '0.5rem', width: '100%', padding: '0.75rem', background: theme.card, color: '#ea580c', border: '1px solid #ffedd5', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  View All {lowStock.length} Items
                </button>
              )}
            </div>
          )}
        </Card>

        <Card style={{ flex: '2 1 500px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: theme.text }}>Recent Orders</h3>
            <button onClick={() => navigate('/orders')} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View All <ArrowRight size={16} />
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textSec }}>
              No recent orders found.
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', color: theme.textSec, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Order ID</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Customer</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: '500', color: theme.text, fontSize: '0.875rem' }}>
                        #{order.id ? order.id.slice(-6).toUpperCase() : 'N/A'}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontSize: '0.875rem', color: theme.textSec }}>
                        {order.customer ? order.customer.name : 'Walk-in Customer'}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontSize: '0.875rem', color: theme.textSec }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <StatusBadge status={order.status} />
                      </td>
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'right', fontWeight: '600', color: theme.text }}>
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
