const fs = require('fs');
let file = fs.readFileSync('server/src/app.js', 'utf8');

file = file.replace("const settingsRoutes = require('./routes/settingsRoutes');", "const settingsRoutes = require('./routes/settingsRoutes');\nconst offerRoutes = require('./routes/offerRoutes');");
file = file.replace("app.use('/api/settings', settingsRoutes);", "app.use('/api/settings', settingsRoutes);\napp.use('/api/offers', offerRoutes);");

fs.writeFileSync('server/src/app.js', file, 'utf8');
console.log('App.js updated');
