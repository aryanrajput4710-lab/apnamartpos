const fs = require('fs');
let c = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');
c = c.replace(
  /const confirmClearCart = \(\) => \{\n\s*setCart\(\[\]\);\n\s*setCustomer\(null\);\n\s*setExtraDiscount\(""\);\n\s*\}\n\s*\};/,
  "const confirmClearCart = () => { setCart([]); setCustomer(null); setExtraDiscount(''); };"
);
fs.writeFileSync('client/src/pages/POS.jsx', c, 'utf8');
console.log('Fixed POS.jsx');
