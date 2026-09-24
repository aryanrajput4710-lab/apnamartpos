const fs = require('fs');
let file = fs.readFileSync('server/prisma/schema.prisma', 'utf8');

file = file.replace('category    String?', 'category    String?\n  subcategory String?');

fs.writeFileSync('server/prisma/schema.prisma', file, 'utf8');
console.log('Schema updated');
