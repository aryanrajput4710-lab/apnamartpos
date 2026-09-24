const fs = require('fs');
let file = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

file = file.replace(/paymentMethod,\s*idempotencyKey\s*\};/, 
    'paymentMethod,\n        extraDiscount: parseFloat(extraDiscount) || 0,\n        idempotencyKey\n      };'
);

fs.writeFileSync('client/src/pages/POS.jsx', file, 'utf8');
console.log('Fixed payload');
