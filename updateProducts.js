const fs = require('fs');
let file = fs.readFileSync('client/src/pages/Products.jsx', 'utf8');

file = file.replace('<td style={{ padding: \'0.75rem\' }}>{p.category}</td>', '<td style={{ padding: \'0.75rem\' }}>{p.category}{p.subcategory ? ` > ${p.subcategory}` : \'\'}</td>');

fs.writeFileSync('client/src/pages/Products.jsx', file, 'utf8');
console.log('Products.jsx updated');
