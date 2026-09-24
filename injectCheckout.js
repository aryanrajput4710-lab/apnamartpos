const fs = require('fs');
let file = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

const targetStr = "<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 'bold', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>";

const newStr = `                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#16a34a' }}>
                      <span>Extra Discount</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Rs. <input type="number" min="0" placeholder="0" value={extraDiscount} onChange={e => setExtraDiscount(e.target.value)} style={{ width: '80px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 'bold', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>`;

file = file.replace(targetStr, newStr);
fs.writeFileSync('client/src/pages/POS.jsx', file, 'utf8');
console.log("Success Checkout Modal");
