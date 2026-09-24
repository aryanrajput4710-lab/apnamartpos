const fs = require('fs');
function fix(file) {
    let content = fs.readFileSync(file, 'utf8');
    // Regex for any character that is not standard ascii, or \uFFFD, followed by ,1
    let newContent = content.replace(/[^\x00-\x7F],1/g, '?');
    newContent = newContent.replace(/\uFFFD,1/g, '?');
    newContent = newContent.replace(/,1/g, '?');
    if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log('Fixed:', file);
    }
}
fix('client/src/pages/Orders.jsx');
fix('client/src/components/Receipt.jsx');
fix('client/src/pages/Reports.jsx');
