const fs = require('fs');
let file = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

file = file.replace(/return \{\s*subtotal,\s*discount: totalDiscount,\s*total: subtotal - totalDiscount\s*\};/, 
    'const manualDiscount = parseFloat(extraDiscount) || 0;\n      const finalDiscount = totalDiscount + manualDiscount;\n      return {\n        subtotal,\n        discount: finalDiscount,\n        total: Math.max(0, subtotal - finalDiscount)\n      };'
);

fs.writeFileSync('client/src/pages/POS.jsx', file, 'utf8');
console.log('Fixed calculation');
