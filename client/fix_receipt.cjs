const fs = require('fs');

let code = fs.readFileSync('src/components/Receipt.jsx', 'utf-8');

const regex = /\{\(item\.sizeSnapshot \|\| item\.colorSnapshot\) && \([\s\S]*?\)\}/;
const newCode = `{(item.sizeSnapshot?.trim() || item.colorSnapshot?.trim() || item.netQuantitySnapshot?.trim()) && (
                <div className="receipt-item-details">
                  {item.sizeSnapshot?.trim() && ('Size: ' + item.sizeSnapshot.trim())}
                  {item.sizeSnapshot?.trim() && item.colorSnapshot?.trim() && ' | '}
                  {item.colorSnapshot?.trim() && ('Color: ' + item.colorSnapshot.trim())}
                  {(item.sizeSnapshot?.trim() || item.colorSnapshot?.trim()) && item.netQuantitySnapshot?.trim() && ' | '}
                  {item.netQuantitySnapshot?.trim() && ('Net Quantity: ' + item.netQuantitySnapshot.trim())}
                </div>
              )}`;

code = code.replace(regex, newCode);

fs.writeFileSync('src/components/Receipt.jsx', code, 'utf-8');
