const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client/src/pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const p = path.join(dir, file);
  let c = fs.readFileSync(p, 'utf8');
  let changed = false;
  
  if (c.match(/>Loading[^<]*<\/div>/i) || c.match(/>Loading[^<]*<\/td>/i)) {
    if (!c.includes('SkeletonRow')) {
      c = c.replace(
        /import \{([^}]+)\} from 'lucide-react';/,
        "import {$1} from 'lucide-react';\nimport { SkeletonRow, SkeletonCard } from '../components/SkeletonRow';"
      );
    }
    
    // For divs (Products, Inventory, etc)
    c = c.replace(
      /<div[^>]*>\s*Loading[a-zA-Z\. ]*\s*<\/div>/gi,
      "<div><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>"
    );
    
    // For table cells if any
    c = c.replace(
      /<td[^>]*colSpan=\{?(["']?\d+["']?)\}?[^>]*>\s*Loading[a-zA-Z\. ]*\s*<\/td>/gi,
      (match, p1) => {
        let cols = parseInt(p1.replace(/['"]/g, ''));
        return `<td colSpan={${cols}} style={{ padding: 0 }}><SkeletonRow cols={${cols}} /><SkeletonRow cols={${cols}} /><SkeletonRow cols={${cols}} /></td>`;
      }
    );

    fs.writeFileSync(p, c, 'utf8');
    console.log('Patched loading state in', file);
  }
});
