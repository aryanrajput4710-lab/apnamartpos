const fs = require('fs');
let file = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

const targetStr = '<div style={{ display: \'flex\', justifyContent: \'space-between\', margin: \'1rem 0\', fontSize: \'1.5rem\', fontWeight: \'bold\' }}>';

const newStr =             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', color: '#16a34a' }}>
              <span>Extra Discount</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Rs. <input type="number" min="0" placeholder="0" value={extraDiscount} onChange={e => setExtraDiscount(e.target.value)} style={{ width: '80px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>;

// We have two places with this target string. 
// One is in the main Totals & Actions block, the other is in the Checkout Modal.
// Actually, let's just replace the FIRST one which is the Totals & Actions block, or both?
// If they want extra discount, doing it before checkout is better. The checkout modal just shows "Total to Pay".

file = file.replace(targetStr, newStr);

fs.writeFileSync('client/src/pages/POS.jsx', file, 'utf8');
