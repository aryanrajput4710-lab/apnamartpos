const fs = require('fs');
let content = fs.readFileSync('src/pages/Orders.jsx', 'utf8');

content = content.replace(
  "'Are you sure you want to completely delete this order? This action cannot be undone and will not restore inventory.'",
  "'Are you sure you want to completely delete this order? This action cannot be undone, but inventory will be restored.'"
);

fs.writeFileSync('src/pages/Orders.jsx', content, 'utf8');
