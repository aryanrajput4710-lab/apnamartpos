const fs = require('fs');
let pos = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

pos = pos.replace(
  /const clearCart = \(\) => \{\s*if \(cart\.length > 0\) \{ setConfirmModal\(true\); \}\s*const confirmClearCart = \(\) => \{/,
  "const clearCart = () => { if (cart.length > 0) { setConfirmModal(true); } };\n  const confirmClearCart = () => {"
);

fs.writeFileSync('client/src/pages/POS.jsx', pos, 'utf8');
console.log('Fixed POS.jsx scope');
