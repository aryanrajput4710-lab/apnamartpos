const fs = require('fs');
let c = fs.readFileSync('server/src/controllers/productController.js', 'utf8');

c = c.replace(
  /const \{ color, size, netQuantity, costPrice, mrp, sellingPrice, discountType, discountValue, stock, lowStockThreshold, sku \} = req\.body;/g,
  "const { color, size, netQuantity, costPrice, mrp, sellingPrice, discountType, discountValue, stock, lowStockThreshold, sku, remarks } = req.body;"
);

c = c.replace(
  /const \{ color, size, netQuantity, costPrice, mrp, sellingPrice, discountType, discountValue, lowStockThreshold, sku, stock \} = req\.body;/g,
  "const { color, size, netQuantity, costPrice, mrp, sellingPrice, discountType, discountValue, lowStockThreshold, sku, stock, remarks } = req.body;"
);

c = c.replace(
  /lowStockThreshold: lowStockThreshold \|\| 5/g,
  "lowStockThreshold: lowStockThreshold || 5,\n          remarks: remarks || null,"
);

c = c.replace(
  /lowStockThreshold,/g,
  "lowStockThreshold,\n          remarks,"
);

fs.writeFileSync('server/src/controllers/productController.js', c);
