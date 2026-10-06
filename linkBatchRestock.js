const fs = require('fs');

// App.jsx
let app = fs.readFileSync('client/src/App.jsx', 'utf8');
app = app.replace(
  "const InventoryHistory = React.lazy(() => import('./pages/InventoryHistory'));",
  "const InventoryHistory = React.lazy(() => import('./pages/InventoryHistory'));\nconst BatchRestock = React.lazy(() => import('./pages/BatchRestock'));"
);
app = app.replace(
  "<Route path=\"/inventory/:variantId/history\" element={<InventoryHistory />} />",
  "<Route path=\"/inventory/:variantId/history\" element={<InventoryHistory />} />\n                  <Route path=\"/inventory/batch-restock\" element={<BatchRestock />} />"
);
fs.writeFileSync('client/src/App.jsx', app);

// Inventory.jsx
let inv = fs.readFileSync('client/src/pages/Inventory.jsx', 'utf8');
inv = inv.replace(
  "<h2 style={{ margin: 0 }}>Inventory Management</h2>",
  "<h2 style={{ margin: 0 }}>Inventory Management</h2>\n          <button onClick={() => navigate('/inventory/batch-restock')} style={{ padding: '0.6rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center' }}><Package size={18} /> Batch Restock (Landed Cost)</button>"
);
fs.writeFileSync('client/src/pages/Inventory.jsx', inv);
