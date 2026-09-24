const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Using simple string replacement instead of regex to avoid encoding weirdness
    let modified = false;
    while (content.includes(',1')) {
        content = content.replace(',1', '₹');
        modified = true;
    }
    while (content.includes('')) {
        content = content.replace('', '₹');
        modified = true;
    }
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed', filePath);
    }
}

fixFile('client/src/pages/Orders.jsx');
fixFile('client/src/components/Receipt.jsx');
fixFile('client/src/pages/Reports.jsx');
