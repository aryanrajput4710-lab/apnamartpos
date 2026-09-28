const fs = require('fs');
const path = require('path');

const files = ['Products.jsx', 'Inventory.jsx', 'Orders.jsx', 'Customers.jsx'];
const dir = path.join(__dirname, 'client/src/pages');

files.forEach(file => {
  const p = path.join(dir, file);
  let c = fs.readFileSync(p, 'utf8');

  if (!c.includes('SkeletonRow')) {
    // Add imports
    c = c.replace(
      /import \{([^}]+)\} from 'lucide-react';/,
      "import {$1} from 'lucide-react';\nimport { SkeletonRow, SkeletonCard } from '../components/SkeletonRow';"
    );

    // Replace the loading state in Desktop Table
    // They usually look like:
    // {loading ? (
    //   <tr>
    //     <td colSpan="..." style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
    //       Loading...
    //     </td>
    //   </tr>
    // )
    // We'll replace the whole <tr>...</tr> with <SkeletonRow cols={6} /> (or whatever cols)
    
    // Replace table loading state
    c = c.replace(
      /\{loading \? \(\s*<tr[^>]*>\s*<td[^>]*colSpan=\{?(["']?\d+["']?)\}?[^>]*>[\s\S]*?<\/td>\s*<\/tr>\s*\) : /g,
      (match, p1) => {
        let cols = parseInt(p1.replace(/['"]/g, ''));
        return `{loading ? (\n  <SkeletonRow cols={${cols}} />\n) : `;
      }
    );

    // Some pages might not have a colSpan but a hardcoded loading div. Let's do Mobile first.
    // {loading ? (
    //   <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</div>
    // ) : 
    
    c = c.replace(
      /\{loading \? \(\s*<div[^>]*>[\s\S]*?Loading[\s\S]*?<\/div>\s*\)\s*:\s*\(/g,
      "{loading ? (\n  <div>\n    <SkeletonCard />\n    <SkeletonCard />\n    <SkeletonCard />\n  </div>\n) : ("
    );
    
    fs.writeFileSync(p, c, 'utf8');
    console.log('Patched', file);
  }
});
