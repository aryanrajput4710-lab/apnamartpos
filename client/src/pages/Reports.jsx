import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [range, setRange] = useState('This Month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ range });
      if (range === 'Custom Range') {
        params.append('customFrom', customFrom);
        params.append('customTo', customTo);
      }
      const res = await api.get(`/reports/dashboard?${params.toString()}`);
      setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (range !== 'Custom Range' || (customFrom && customTo)) {
      fetchReports();
    }
  }, [range, customFrom, customTo]);

  const exportCSV = () => {
    if (!data) return;
    
    // Basic CSV generation for Sales by Date
    const headers = ['Date', 'Orders', 'Revenue'];
    const rows = data.chart.map(c => [c.date, c.orders, c.revenue]);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_report_${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Revenue & Reports</h2>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select 
            value={range} 
            onChange={(e) => setRange(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
          >
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Month">This Month</option>
            <option value="Custom Range">Custom Range</option>
          </select>

          {range === 'Custom Range' && (
            <>
              <input 
                type="date" 
                value={customFrom} 
                onChange={e => setCustomFrom(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
              />
              <span>to</span>
              <input 
                type="date" 
                value={customTo} 
                onChange={e => setCustomTo(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
              />
            </>
          )}

          <button 
            onClick={exportCSV}
            style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading reports...</div>
      ) : !data ? (
        <div style={{ color: 'red' }}>Error loading data.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Sales Report</h3>
            {data.chart.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No sales for this period.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '1rem' }}>Date</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Orders</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.chart.map(c => (
                    <tr key={c.date} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem' }}>{c.date}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>{c.orders}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>₹{c.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f9fafb', fontWeight: 'bold' }}>
                    <td style={{ padding: '1rem' }}>Total</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{data.summary.orders}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', color: '#10b981' }}>₹{parseFloat(data.summary.revenue).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 400px', background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>Payment Report</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '1rem' }}>Method</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Orders</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem' }}>CASH</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{data.paymentSummary.CASH.orders}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>₹{data.paymentSummary.CASH.amount.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem' }}>QR</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>{data.paymentSummary.QR.orders}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>₹{data.paymentSummary.QR.amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ flex: '1 1 400px', background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>Product Report (Top 5)</h3>
              {data.topProducts.length === 0 ? (
                <p style={{ color: '#6b7280' }}>No products sold.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                      <th style={{ padding: '1rem' }}>Product Variant</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Quantity Sold</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((tp, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '500' }}>{tp.productNameSnapshot}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{tp.skuSnapshot}</div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>{tp._sum.quantity}</td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>₹{parseFloat(tp._sum.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
