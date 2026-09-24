const fs = require('fs');
let file = fs.readFileSync('client/src/components/Receipt.jsx', 'utf8');

// Replace header slogan
file = file.replace(
    '<p className="receipt-tagline">Best Quality Low Price</p>',
    '<p className="receipt-tagline">{settings?.receiptFooter || \'Best Quality Low Price\'}</p>'
);

// Remove footer display
const footerTarget = "{settings?.receiptFooter && <p style={{ marginTop: '10px', whiteSpace: 'pre-wrap', fontSize: '12px' }}>{settings.receiptFooter}</p>}";
file = file.replace(footerTarget + '\\n', ''); // Will try regex below if literal fails

file = file.replace(/\{settings\?\.receiptFooter && <p style=\{\{ marginTop: '10px', whiteSpace: 'pre-wrap', fontSize: '12px' \}\}>\{settings\.receiptFooter\}<\/p>\}\s*/, '');

fs.writeFileSync('client/src/components/Receipt.jsx', file, 'utf8');
console.log('Fixed Receipt Slogan');
