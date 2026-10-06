const fs = require('fs');

let c = fs.readFileSync('client/src/pages/BatchRestock.jsx', 'utf8');

c = c.replace(
  "v.size && \\`(\\${v.size})\\`",
  "v.size && `(${v.size})`"
);

c = c.replace(
  "v.size && \\`(\\$\\{v.size\\})\\`",
  "v.size && `(${v.size})`"
);

fs.writeFileSync('client/src/pages/BatchRestock.jsx', c);
