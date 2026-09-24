const fs = require('fs');
let file = fs.readFileSync('client/src/components/Receipt.jsx', 'utf8');

file = file.replace(/\{item\.sizeSnapshot && Size:\s*\+ item\.sizeSnapshot\}/g, "{item.sizeSnapshot && ('Size: ' + item.sizeSnapshot)}");
file = file.replace(/\{item\.colorSnapshot && Color:\s*\+ item\.colorSnapshot\}/g, "{item.colorSnapshot && ('Color: ' + item.colorSnapshot)}");

fs.writeFileSync('client/src/components/Receipt.jsx', file, 'utf8');
console.log('Fixed receipt errors');
