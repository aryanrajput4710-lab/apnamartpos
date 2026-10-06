const fs = require('fs');
let c = fs.readFileSync('client/src/pages/BatchRestock.jsx', 'utf8');

c = c.replace(
  "api.get(`/products/search?q=${encodeURIComponent(search)}`)",
  "api.get(`/pos/search?q=${encodeURIComponent(search)}`)"
);

fs.writeFileSync('client/src/pages/BatchRestock.jsx', c);
