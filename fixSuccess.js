const fs = require('fs');
let file = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

file = file.replace(/setCustomerPhone\(''\);/, 
    'setCustomerPhone(\'\');\n        setExtraDiscount(\'\');'
);

fs.writeFileSync('client/src/pages/POS.jsx', file, 'utf8');
