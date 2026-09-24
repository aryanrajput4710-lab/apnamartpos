const fs = require('fs');
let file = fs.readFileSync('client/src/components/Receipt.css', 'utf8');

file = file.replace('.col-item { flex: 2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }', '.col-item { flex: 1.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }');
file = file.replace('.col-price { flex: 1; text-align: right; }', '.col-price { flex: 1.2; text-align: right; white-space: nowrap; }');
file = file.replace('.col-disc { flex: 1; text-align: right; }', '.col-disc { flex: 1.1; text-align: right; white-space: nowrap; }');
file = file.replace('.col-sub { flex: 1.2; text-align: right; }', '.col-sub { flex: 1.3; text-align: right; white-space: nowrap; }');

// Also in .receipt-item-main, maybe slightly reduce font size so numbers fit better
file = file.replace('.receipt-item-main {\n  display: flex;\n  font-weight: bold;\n}', '.receipt-item-main {\n  display: flex;\n  font-weight: bold;\n  font-size: 13px;\n}');

fs.writeFileSync('client/src/components/Receipt.css', file, 'utf8');
console.log('Fixed receipt columns');
