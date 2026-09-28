const fs = require('fs');
let c = fs.readFileSync('client/src/pages/Products.jsx', 'utf8');
if(!c.includes('SkeletonCard')) {
  c = c.replace(/import \{([^}]+)\} from 'lucide-react';/, "import {$1} from 'lucide-react';\nimport { SkeletonRow, SkeletonCard } from '../components/SkeletonRow';");
  c = c.replace(/<div[^>]*>\s*Loading products\.\.\.\s*<\/div>/, "<div><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>");
  fs.writeFileSync('client/src/pages/Products.jsx', c, 'utf8');
  console.log('Done Products');
}
