const fs = require('fs');
let c = fs.readFileSync('server/src/controllers/productController.js', 'utf8');

c = c.replace(/lowStockThreshold: v\.lowStockThreshold \|\| 5,?/g, "lowStockThreshold: v.lowStockThreshold || 5,\n              remarks: v.remarks || null,");

fs.writeFileSync('server/src/controllers/productController.js', c);
