const fs = require('fs');
let file = fs.readFileSync('client/src/pages/ProductDetail.jsx', 'utf8');

file = file.replace('<p>Category: {product.category}</p>', '<p>Category: {product.category}{product.subcategory ? ` > ${product.subcategory}` : \'\'}</p>');

fs.writeFileSync('client/src/pages/ProductDetail.jsx', file, 'utf8');
console.log('ProductDetail.jsx updated');
