const fs = require('fs');

let ordersCode = fs.readFileSync('src/pages/Orders.jsx', 'utf-8');

// The line is:
// <p>Size: ` + (item.sizeSnapshot || ' ') + ` | Color: ` + (item.colorSnapshot || ' ') + `</p>
// Let's replace it with conditional logic.

const oldLine = "<p>Size: ` + (item.sizeSnapshot || ' ') + ` | Color: ` + (item.colorSnapshot || ' ') + `</p>";

const newCodeForReplacementLabel = `
            \${item.sizeSnapshot?.trim() ? \`<p>Size: \${item.sizeSnapshot.trim()}</p>\` : ''}
            \${item.colorSnapshot?.trim() ? \`<p>Color: \${item.colorSnapshot.trim()}</p>\` : ''}
            \${item.netQuantitySnapshot?.trim() ? \`<p>Net Quantity: \${item.netQuantitySnapshot.trim()}</p>\` : ''}
`;

ordersCode = ordersCode.replace(oldLine, newCodeForReplacementLabel.trim());

// Wait, the original was:
// <p>Size: ' + (item.sizeSnapshot || ' ') + ' | Color: ' + (item.colorSnapshot || ' ') + '</p>
// Let's just use regex because of formatting.
const oldLineRegex = /<p>Size:\s*.*?\|.*?Color:\s*.*?<\/p>/;
ordersCode = ordersCode.replace(oldLineRegex, `\` + (item.sizeSnapshot?.trim() ? \`<p>Size: \${item.sizeSnapshot.trim()}</p>\` : '') + \`
            \` + (item.colorSnapshot?.trim() ? \`<p>Color: \${item.colorSnapshot.trim()}</p>\` : '') + \`
            \` + (item.netQuantitySnapshot?.trim() ? \`<p>Net Quantity: \${item.netQuantitySnapshot.trim()}</p>\` : '') + \``);

fs.writeFileSync('src/pages/Orders.jsx', ordersCode, 'utf-8');
