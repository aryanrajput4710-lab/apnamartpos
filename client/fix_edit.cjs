const fs = require('fs');
let content = fs.readFileSync('src/pages/EditProduct.jsx', 'utf8');

content = content.replace(
  'setVariants(p.variants || []);',
  `setVariants((p.variants || []).map(v => {
    let dp = '';
    if (v.mrp > 0 && v.sellingPrice > 0) {
      dp = (((v.mrp - v.sellingPrice) / v.mrp) * 100).toFixed(2);
      // Strip trailing zeros if it's a clean number
      dp = parseFloat(dp).toString(); 
    }
    return { ...v, discountPercent: dp };
  }));`
);

fs.writeFileSync('src/pages/EditProduct.jsx', content, 'utf8');
console.log('Fixed EditProduct initial load');
