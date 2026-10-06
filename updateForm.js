const fs = require('fs');
let c = fs.readFileSync('client/src/pages/ProductForm.jsx', 'utf8');

c = c.replace(
  "{ size: '', color: '', netQuantity: '', costPrice: '', mrp: '', sellingPrice: '', discountPercent: '', stock: 0 }",
  "{ size: '', color: '', netQuantity: '', costPrice: '', mrp: '', sellingPrice: '', discountPercent: '', stock: 0, remarks: '' }"
);
c = c.replace(
  "{ size: '', color: '', netQuantity: '', costPrice: '', mrp: '', sellingPrice: '', discountPercent: '', stock: 0 }",
  "{ size: '', color: '', netQuantity: '', costPrice: '', mrp: '', sellingPrice: '', discountPercent: '', stock: 0, remarks: '' }"
);

// Add the remarks input field in the variant form
const remarksInput = `
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Remarks (Offers / Free Items - Prints on Label)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. BUY 1 GET 1 FREE"
                      value={v.remarks} 
                      onChange={e => updateVariant(index, 'remarks', e.target.value)}
                      style={{ width: '100%', height: '40px', padding: '0 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
`;

c = c.replace(/<div style={{ gridColumn: '1 \/ -1', display: 'flex', gap: '1rem', marginTop: '0\.5rem' }}>/, remarksInput + "\n                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>");

fs.writeFileSync('client/src/pages/ProductForm.jsx', c);
