const fs = require('fs');
let file = fs.readFileSync('server/src/controllers/productController.js', 'utf8');

// Update createProduct
file = file.replace('const { name, description, category, brand, variants } = req.body;', 'const { name, description, category, subcategory, brand, variants } = req.body;');
file = file.replace('category: category || null,', 'category: category || null,\n      subcategory: subcategory || null,');

// Update getProducts
file = file.replace('const { search, category, page = 1, limit = 50 } = req.query;', 'const { search, category, subcategory, page = 1, limit = 50 } = req.query;');
file = file.replace('if (category) {\n      where.category = category;\n    }', 'if (category) {\n      where.category = category;\n    }\n    if (subcategory) {\n      where.subcategory = subcategory;\n    }');

// Update updateProduct
file = file.replace('const { name, description, category, brand } = req.body;', 'const { name, description, category, subcategory, brand } = req.body;');
file = file.replace('data: { name, description, category, brand }', 'data: { name, description, category, subcategory, brand }');

// Update importProducts
file = file.replace('category: p.category || null,', 'category: p.category || null,\n            subcategory: p.subcategory || null,');

fs.writeFileSync('server/src/controllers/productController.js', file, 'utf8');
console.log("productController updated");
