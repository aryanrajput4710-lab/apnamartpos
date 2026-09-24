const fs = require('fs');
let file = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

file = file.replace(/justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', color: '#16a34a'/g, 
  "justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem', color: '#16a34a'");

file = file.replace(/alignItems: 'center', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#16a34a'/g, 
  "alignItems: 'center', flexWrap: 'wrap', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#16a34a'");

fs.writeFileSync('client/src/pages/POS.jsx', file, 'utf8');
console.log("Fixed horizontal flex wrap");
