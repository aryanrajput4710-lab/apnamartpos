const fs = require('fs');
let file = fs.readFileSync('client/src/components/Receipt.jsx', 'utf8');

// Fix Address
file = file.replace(
    '<p className="receipt-address">{settings?.storeAddress || \'Gaya Bhagat Chowk,Golma\'}</p>\n          <p className="receipt-location">District - Saharsa,PIN-852107</p>',
    '<p className="receipt-address">{settings?.storeAddress || \'Gaya Bhagat Chowk, Golma, District - Saharsa, PIN-852107\'}</p>'
);
// In case line endings mismatch, try regex:
file = file.replace(/<p className="receipt-address">\{settings\?\.storeAddress \|\| 'Gaya Bhagat Chowk,Golma'\}<\/p>\s*<p className="receipt-location">District - Saharsa,PIN-852107<\/p>/, '<p className="receipt-address">{settings?.storeAddress || \'Gaya Bhagat Chowk, Golma, District - Saharsa, PIN-852107\'}</p>');

// Fix Footer
const footerTarget = "<p>Please Visit Us Again</p>";
const footerReplacement = "<p>Please Visit Us Again</p>\n        {settings?.receiptFooter && <p style={{ marginTop: '10px', whiteSpace: 'pre-wrap', fontSize: '12px' }}>{settings.receiptFooter}</p>}";
file = file.replace(footerTarget, footerReplacement);

fs.writeFileSync('client/src/components/Receipt.jsx', file, 'utf8');
console.log('Fixed Receipt UI');
