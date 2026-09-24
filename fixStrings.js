const fs = require('fs');

function fix(file) {
    let content = fs.readFileSync(file, 'utf8');
    // Using string replace for the literal ,1 character combination or whatever it resolves to in JS
    // The safest way is to replace anything before {parseFloat that looks like a currency symbol
    // e.g. <td style={{ padding: '1rem', fontWeight: 'bold' }}>,1{parseFloat
    content = content.replace(/>,1\{/g, '>Rs. {');
    content = content.replace(/>,1\{/g, '>Rs. {');
    content = content.replace(/>,10\.00/g, '>Rs. 0.00');
    content = content.replace(/>,10\.00/g, '>Rs. 0.00');
    content = content.replace(/"col-price">,1\{/g, '"col-price">Rs. {');
    content = content.replace(/"col-price">,1\{/g, '"col-price">Rs. {');
    content = content.replace(/"col-disc">,1\{/g, '"col-disc">Rs. {');
    content = content.replace(/"col-disc">,1\{/g, '"col-disc">Rs. {');
    content = content.replace(/"col-sub">,1\{/g, '"col-sub">Rs. {');
    content = content.replace(/"col-sub">,1\{/g, '"col-sub">Rs. {');
    content = content.replace(/<span>,1\{/g, '<span>Rs. {');
    content = content.replace(/<span>,1\{/g, '<span>Rs. {');
    content = content.replace(/<span>,10\.00/g, '<span>Rs. 0.00');
    content = content.replace(/<span>,10\.00/g, '<span>Rs. 0.00');
    content = content.replace(/value">,1\{/g, 'value">Rs. {');
    content = content.replace(/value">,1\{/g, 'value">Rs. {');
    content = content.replace(/value">,10\.00/g, 'value">Rs. 0.00');
    content = content.replace(/value">,10\.00/g, 'value">Rs. 0.00');
    
    // Also, if we want to change Rs. to ? safely
    // Let's just use 'Rs.' for now so we don't have UTF issues
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
}

fix('client/src/pages/Orders.jsx');
fix('client/src/components/Receipt.jsx');
fix('client/src/pages/Reports.jsx');
