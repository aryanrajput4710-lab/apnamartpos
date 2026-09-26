const fs = require('fs');

let posCode = fs.readFileSync('src/pages/POS.jsx', 'utf-8');

posCode = posCode.replace(/v\.size \?/g, "v.size?.trim() ?");
posCode = posCode.replace(/v\.color \?/g, "v.color?.trim() ?");
// The expression is actually `{v.size ? \`Size: \${v.size}\` : ''}`
// Let's replace the whole string to be safe.
posCode = posCode.replace(
  /\{v\.size \? `Size: \$\{v\.size\}` : ''\} \{v\.color \? `Color: \$\{v\.color\}` : ''\}/g,
  "{v.size?.trim() ? `Size: ${v.size.trim()}` : ''} {v.color?.trim() ? `Color: ${v.color.trim()}` : ''}"
);

fs.writeFileSync('src/pages/POS.jsx', posCode, 'utf-8');
