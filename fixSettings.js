const fs = require('fs');
let file = fs.readFileSync('client/src/pages/Settings.jsx', 'utf8');

file = file.replace('<label>Receipt Footer</label>', '<label>Store Slogan</label>');

fs.writeFileSync('client/src/pages/Settings.jsx', file, 'utf8');
console.log('Fixed settings slogan label');
