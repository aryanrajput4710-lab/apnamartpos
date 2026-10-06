const fs = require('fs');
let inv = fs.readFileSync('client/src/pages/Inventory.jsx', 'utf8');

inv = inv.replace(
  "<p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Track products, stock levels, and inventory value</p>\n        </div>\n        {currentUser?.role === 'ADMIN' && (",
  "<p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Track products, stock levels, and inventory value</p>\n        </div>\n        <div style={{ display: 'flex', gap: '0.5rem' }}>\n        {currentUser?.role === 'ADMIN' && (\n          <button onClick={() => window.location.href = '/inventory/batch-restock'} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>\n            <Package size={16} /> Batch Restock (Landed Cost)\n          </button>\n        )}\n        {currentUser?.role === 'ADMIN' && ("
);

// I should make sure it actually replaces it
// Let's also add the end tag for the div I opened
inv = inv.replace(
  "<History size={16} /> View Global History\n          </Link>\n        )}\n      </div>",
  "<History size={16} /> View Global History\n          </Link>\n        )}\n        </div>\n      </div>"
);

fs.writeFileSync('client/src/pages/Inventory.jsx', inv);
