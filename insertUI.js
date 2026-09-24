const fs = require('fs');
let file = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

const searchStr = "<span>Total</span>";
const targetIndex = file.indexOf(searchStr);
const beforeTargetIndex = file.lastIndexOf("<div", targetIndex);

const insertHTML = `
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', color: '#16a34a' }}>
            <span>Extra Discount</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Rs. <input type="number" min="0" placeholder="0" value={extraDiscount} onChange={e => setExtraDiscount(e.target.value)} style={{ width: '80px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
            </div>
          </div>
`;

if (!file.includes('Extra Discount')) {
    file = file.slice(0, beforeTargetIndex) + insertHTML + file.slice(beforeTargetIndex);
    fs.writeFileSync('client/src/pages/POS.jsx', file, 'utf8');
    console.log("Success");
} else {
    console.log("Already there");
}
