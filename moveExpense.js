const fs = require('fs');
let c = fs.readFileSync('client/src/layouts/AppLayout.jsx', 'utf8');

c = c.replace(
  "const navItems = [\n      { name: 'Expenses', path: '/expenses', icon: FileText, roles: ['ADMIN'] },",
  "const navItems = ["
);

c = c.replace(
  "{ name: 'Reports', path: '/reports', icon: TrendingUp, roles: ['ADMIN'] },",
  "{ name: 'Reports', path: '/reports', icon: TrendingUp, roles: ['ADMIN'] },\n      { name: 'Expenses', path: '/expenses', icon: FileText, roles: ['ADMIN'] },"
);

fs.writeFileSync('client/src/layouts/AppLayout.jsx', c);
