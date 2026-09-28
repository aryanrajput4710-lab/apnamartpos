const fs = require('fs');
let c = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');
c = c.replace(/const confirmClearCart = \(\) => \{\s*setCart\(\[\]\);\s*setCustomer\(null\);\s*setExtraDiscount\(""\);\s*\}\s*\};\s*/g, "const confirmClearCart = () => { setCart([]); setCustomer(null); setExtraDiscount(''); };\n\n");
fs.writeFileSync('client/src/pages/POS.jsx', c, 'utf8');
console.log('Fixed POS.jsx regex');
