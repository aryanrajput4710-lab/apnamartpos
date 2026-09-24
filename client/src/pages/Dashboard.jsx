import { useState, useEffect } from 'react';
import api from '../services/api';
import { IndianRupee, ShoppingBag, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';

const SimpleBarChart = ({ data }) => {
  if (!data || data.length === 0) return <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No data for this period</div>;
  
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  const height = 200;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: `${height}px`, gap: '8px', padding: '1rem 0', overflowX: 'auto' }}>
      {data.map((d, i) => {
        const barHeight = (d.revenue / maxRevenue) * (height - 30);
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '40px' }}>
            <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '4px' }}>₹{d.revenue}</div>
            <div 
              style={{ 
                width: '100%', 
                height: `${Math.max(barHeight, 2)}px`, 
                backgroundColor: '#3b82f6', 
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s'
              }} 
              title={`${d.date}: ₹${d.revenue} (${d.orders} orders)`}
            />
            <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px', whiteSpace: 'nowrap' }}>
              {d.date.split('-').slice(1).join('/')}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('Today');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/dashboard?range=${encodeURIComponent(range)}`);
      setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [range]);

  if (loading && !data) return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;
  if (!data) return <div style={{ padding: '2rem', color: 'red' }}>Error loading dashboard data.</div>;

  const { summary, paymentSummary, lowStock, topProducts, customerStats, chart } = data;

  const StatCard = ({ title, value, icon, color }) => (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flex: '1 1 200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem', fontWeight: '500' }}>{title}</p>
        <div style={{ color, background: `${color}15`, padding: '0.5rem', borderRadius: '8px' }}>{icon}</div>
      </div>
      <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 'bold' }}>{value}</h3>
    </div>
  );

  const totalPayment = paymentSummary.CASH.amount + paymentSummary.QR.amount;
  const cashPct = totalPayment > 0 ? Math.round((paymentSummary.CASH.amount / totalPayment) * 100) : 0;
  const qrPct = totalPayment > 0 ? Math.round((paymentSummary.QR.amount / totalPayment) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <select 
          value={range} 
          onChange={(e) => setRange(e.target.value)}
          style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #d1d5db', background: 'white', fontSize: '1rem' }}
        >
          <option value="Today">Today</option>
          <option value="Yesterday">Yesterday</option>
          <option value="Last 7 Days">Last 7 Days</option>
          <option value="Last 30 Days">Last 30 Days</option>
          <option value="This Month">This Month</option>
        </select>
      </div>

      
        {/* Top Cards */}
        <div className="mobile-stack" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <StatCard title="Net Sales" value={`₹${parseFloat(summary.revenue).toFixed(2)}`} icon={<IndianRupee size={24} />} color="#10b981" />
          <StatCard title="Gross Profit" value={`₹${parseFloat(summary.profit || 0).toFixed(2)}`} icon={<TrendingUp size={24} />} color="#059669" />
          <StatCard title="Orders" value={summary.orders} icon={<ShoppingCart size={24} />} color="#3b82f6" />

        
        <StatCard title="Items Sold" value={summary.itemsSold} icon={<ShoppingBag size={24} />} color="#f59e0b" />
        <StatCard title="Avg Order Value" value={`₹${parseFloat(summary.aov).toFixed(2)}`} icon={<TrendingUp size={24} />} color="#8b5cf6" />
      </div>

      <div className="mobile-stack" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Revenue Chart */}
        <div style={{ flex: '2 1 100%', background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Revenue Trend</h3>
          <SimpleBarChart data={chart} />
        </div>

        {/* Payment & Customers */}
        <div style={{ flex: '1 1 100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Cash vs QR</h3>
            {totalPayment === 0 ? (
              <p style={{ color: '#6b7280' }}>No sales yet</p>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Cash ({cashPct}%)</span>
                  <strong>₹{paymentSummary.CASH.amount.toFixed(2)}</strong>
                </div>
                <div style={{ width: '100%', background: '#e5e7eb', height: '8px', borderRadius: '4px', marginBottom: '1rem' }}>
                  <div style={{ width: `${cashPct}%`, background: '#10b981', height: '100%', borderRadius: '4px' }} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>QR ({qrPct}%)</span>
                  <strong>₹{paymentSummary.QR.amount.toFixed(2)}</strong>
                </div>
                <div style={{ width: '100%', background: '#e5e7eb', height: '8px', borderRadius: '4px' }}>
                  <div style={{ width: `${qrPct}%`, background: '#3b82f6', height: '100%', borderRadius: '4px' }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Customer Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ margin: '0 0 0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>New</p>
                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{customerStats.new}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>Returning</p>
                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{customerStats.returning}</p>
              </div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <p style={{ margin: '0 0 0.25rem', color: '#6b7280', fontSize: '0.875rem' }}>Total Registered Customers</p>
                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{customerStats.total}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mobile-stack" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Top Products */}
        <div style={{ flex: '1 1 100%', background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Top Selling Products</h3>
          {topProducts.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No products sold in this period.</p>
          ) : (
            <div className="table-responsive"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#6b7280', fontSize: '0.875rem' }}>
                  <th style={{ paddingBottom: '0.5rem' }}>Product</th>
                  <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Sold</th>
                  <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((tp, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 0' }}>
                      <div style={{ fontWeight: '500' }}>{tp.productNameSnapshot}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {tp.sizeSnapshot} {tp.colorSnapshot ? `/ ${tp.colorSnapshot}` : ''} ({tp.skuSnapshot})
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>{tp._sum.quantity}</td>
                    <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: '500' }}>₹{parseFloat(tp._sum.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div style={{ flex: '1 1 100%', background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertTriangle color="#f59e0b" size={20} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Low Stock & Out of Stock</h3>
          </div>
          {lowStock.length === 0 ? (
            <p style={{ color: '#6b7280' }}>All products are well stocked.</p>
          ) : (
            <div className="table-responsive"><table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#6b7280', fontSize: '0.875rem' }}>
                  <th style={{ paddingBottom: '0.5rem' }}>Product</th>
                  <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((ls) => (
                  <tr key={ls.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 0' }}>
                      <div style={{ fontWeight: '500' }}>{ls.product.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {ls.size} {ls.color ? `/ ${ls.color}` : ''} ({ls.sku})
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold',
                        background: ls.stock <= 0 ? '#fee2e2' : '#fef3c7',
                        color: ls.stock <= 0 ? '#dc2626' : '#d97706'
                      }}>
                        {ls.stock} / {ls.lowStockThreshold}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      </div>
    </div>
  );
}

