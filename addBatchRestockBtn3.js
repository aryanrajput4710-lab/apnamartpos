const fs = require('fs');
let inv = fs.readFileSync('client/src/pages/Inventory.jsx', 'utf8');

const regex = /<p style=\{\{ color: '#6b7280', margin: 0, fontSize: '0.875rem' \}\}>Track products, stock levels, and inventory value<\/p>\r?\n\s*<\/div>/;

inv = inv.replace(
  regex,
  `<p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Track products, stock levels, and inventory value</p>\n        </div>\n        <div style={{ display: 'flex', gap: '0.5rem' }}>\n        {currentUser?.role === 'ADMIN' && (\n          <button onClick={() => window.location.href = '/inventory/batch-restock'} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>\n            <Package size={16} /> Batch Restock (Landed Cost)\n          </button>\n        )}`
);

const regex2 = /<History size=\{16\} \/> View Global History\r?\n\s*<\/Link>\r?\n\s*\)\}/;

inv = inv.replace(
  regex2,
  `<History size={16} /> View Global History\n          </Link>\n        )}\n        </div>`
);

fs.writeFileSync('client/src/pages/Inventory.jsx', inv);
