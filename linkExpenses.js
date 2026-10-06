const fs = require('fs');
let app = fs.readFileSync('client/src/App.jsx', 'utf8');

app = app.replace(
  "const AuditLogs = React.lazy(() => import('./pages/AuditLogs'));",
  "const AuditLogs = React.lazy(() => import('./pages/AuditLogs'));\nconst Expenses = React.lazy(() => import('./pages/Expenses'));"
);

app = app.replace(
  "<Route path=\"/reports\" element={<Reports />} />",
  "<Route path=\"/reports\" element={<Reports />} />\n                    <Route path=\"/expenses\" element={<Expenses />} />"
);

fs.writeFileSync('client/src/App.jsx', app);

let layout = fs.readFileSync('client/src/layouts/AppLayout.jsx', 'utf8');

layout = layout.replace(
  "const navItems = [",
  "const navItems = [\n      { name: 'Expenses', path: '/expenses', icon: FileText, roles: ['ADMIN'] },"
);

fs.writeFileSync('client/src/layouts/AppLayout.jsx', layout);
