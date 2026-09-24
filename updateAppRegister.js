const fs = require('fs');
let file = fs.readFileSync('server/src/app.js', 'utf8');

file = file.replace("const offerRoutes = require('./routes/offerRoutes');", "const offerRoutes = require('./routes/offerRoutes');\nconst registerRoutes = require('./routes/registerRoutes');");
file = file.replace("app.use('/api/offers', offerRoutes);", "app.use('/api/offers', offerRoutes);\napp.use('/api/register', registerRoutes);");

fs.writeFileSync('server/src/app.js', file, 'utf8');
console.log('App.js updated');
