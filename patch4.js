const fs = require('fs');
let c = fs.readFileSync('client/src/pages/Orders.jsx', 'utf8');

c = c.replace(/setConfirmModal\(\{ open: true, action: 'deleteSingle', id: id \}\);/, "setConfirmModal({ open: true, action: 'deleteSingle', id: orderId });");
c = c.replace(/const api = require\('\.\.\/services\/api'\)\.default;\s+await api\.delete\('\/orders\/all-test-data'\);/, "await api.delete('/orders');");
c = c.replace(/const api = require\('\.\.\/services\/api'\)\.default;\s+await api\.delete\('\/orders\/' \+ id\);/, "await api.delete('/orders/' + id);");

fs.writeFileSync('client/src/pages/Orders.jsx', c, 'utf8');
console.log('Fixed Orders.jsx');
