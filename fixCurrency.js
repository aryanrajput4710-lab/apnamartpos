const fs = require('fs');

function fix(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // We want to replace whatever character is before {parseFloat with 'Rs. '
    content = content.replace(/(.)\{parseFloat/g, 'Rs. {parseFloat');
    content = content.replace(/(.)\{c\.revenue/g, 'Rs. {c.revenue');
    content = content.replace(/(.)\{order\.subtotal/g, 'Rs. {order.subtotal');
    content = content.replace(/(.)\{order\.discount/g, 'Rs. {order.discount');
    content = content.replace(/(.)\{order\.total/g, 'Rs. {order.total');
    content = content.replace(/(.)\{cashAmount/g, 'Rs. {cashAmount');
    
    // Also there are some hardcoded zeros like 0.00
    // e.g. <span className="col-disc">,10.00</span> or <span>,10.00</span>
    content = content.replace(/(.)0\.00/g, (match, p1) => {
        // Only replace if p1 is not a digit or standard ascii symbol
        if (!/[a-zA-Z0-9\s>\.\-]/.test(p1)) {
            return 'Rs. 0.00';
        }
        return match;
    });

    fs.writeFileSync(file, content, 'utf8');
}

fix('client/src/pages/Orders.jsx');
fix('client/src/components/Receipt.jsx');
fix('client/src/pages/Reports.jsx');
