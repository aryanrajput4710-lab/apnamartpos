const fs = require('fs');
let content = fs.readFileSync('src/pages/Orders.jsx', 'utf8');

// Add handleClearTestOrders function
const handleClearCode = `
  const handleClearTestOrders = async () => {
    if (!window.confirm('WARNING: Are you absolutely sure you want to delete ALL orders and related data (returns, payments, sale history)? This will NOT restore inventory! This is meant for clearing test data only.')) return;
    try {
      await api.delete("/orders");
      fetchOrders();
      alert('All test orders cleared successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to clear orders');
    }
  };

  const handleDeleteOrder = async (orderId) => {
`;

content = content.replace('  const handleDeleteOrder = async (orderId) => {', handleClearCode);

// Add "Clear Test Orders" button in the header
const clearBtnHtml = `
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
        </div>`;

content = content.replace(
  /<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' \}\}>\s*<div>\s*<h1[^>]*>All Orders<\/h1>\s*<p[^>]*>View, track, and manage your orders and returns<\/p>\s*<\/div>\s*<\/div>/g,
  clearBtnHtml
);

fs.writeFileSync('src/pages/Orders.jsx', content, 'utf8');
console.log('Added Clear Test Orders logic');
