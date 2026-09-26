const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');
code = code.replace(/<CountUp /g, '<CountUpComp ');
fs.writeFileSync('src/pages/Dashboard.jsx', code);
