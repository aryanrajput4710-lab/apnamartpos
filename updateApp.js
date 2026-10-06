const fs = require('fs');
let c = fs.readFileSync('server/src/app.js', 'utf8');

c = c.replace(
  "const integrityRoutes = require('./routes/integrityRoutes');",
  "const integrityRoutes = require('./routes/integrityRoutes');\nconst expenseRoutes = require('./routes/expenseRoutes');"
);

c = c.replace(
  "app.use('/api/integrity', integrityRoutes);",
  "app.use('/api/integrity', integrityRoutes);\napp.use('/api/expenses', expenseRoutes);"
);

fs.writeFileSync('server/src/app.js', c);
