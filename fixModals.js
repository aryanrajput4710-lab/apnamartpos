const fs = require('fs');
let file = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

// For Customer Modal
file = file.replace(
  "<div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>\n              <h3 style={{ marginTop: 0 }}>Add New Customer</h3>",
  "<div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>\n              <h3 style={{ marginTop: 0 }}>Add New Customer</h3>"
);

// For Checkout Modal
file = file.replace(
  "<div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>\n              \n              {checkoutStep === 'CUSTOMER' ? (",
  "<div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>\n              \n              {checkoutStep === 'CUSTOMER' ? ("
);

// I will also just use a generic regex replacement for all modal inner containers
file = file.replace(/maxWidth: '400px' \}\}>/g, "maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>");

fs.writeFileSync('client/src/pages/POS.jsx', file, 'utf8');
console.log("Fixed Modal Scrolling");
