const fs = require('fs');
const path = require('path');
const pagesDir = path.join(process.cwd(), 'client/src/pages');
fs.readdirSync(pagesDir).forEach(file => {
  if (file.endsWith('.jsx')) {
    let filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    if (content.includes('alert(') && !content.includes("import toast from 'react-hot-toast'")) {
      content = "import toast from 'react-hot-toast';\n" + content;
      content = content.replace(/alert\((['"`].*?error.*?['"`])\)/gi, 'toast.error($1)');
      content = content.replace(/alert\((['"`].*?failed.*?['"`])\)/gi, 'toast.error($1)');
      content = content.replace(/alert\((['"`].*?success.*?['"`])\)/gi, 'toast.success($1)');
      content = content.replace(/alert\(/g, 'toast(');
      changed = true;
    }
    
    if (file === 'Products.jsx' && !content.includes('useDebounce')) {
      content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { useDebounce } from 'use-debounce';");
      content = content.replace("const [search, setSearch] = useState('');", "const [search, setSearch] = useState('');\n  const [debouncedSearch] = useDebounce(search, 500);");
      content = content.replace("[search, categoryFilter, statusFilter, stockFilter]", "[debouncedSearch, categoryFilter, statusFilter, stockFilter]");
      content = content.replace("[search, categoryFilter, statusFilter, stockFilter, page]", "[debouncedSearch, categoryFilter, statusFilter, stockFilter, page]");
      content = content.replace("search=${encodeURIComponent(search)}", "search=${encodeURIComponent(debouncedSearch)}");
      changed = true;
    }
    if (file === 'Inventory.jsx' && !content.includes('useDebounce')) {
      content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { useDebounce } from 'use-debounce';");
      content = content.replace("const [search, setSearch] = useState('');", "const [search, setSearch] = useState('');\n  const [debouncedSearch] = useDebounce(search, 500);");
      content = content.replace("[search]", "[debouncedSearch]");
      content = content.replace("[search, page]", "[debouncedSearch, page]");
      content = content.replace("search=${encodeURIComponent(search)}", "search=${encodeURIComponent(debouncedSearch)}");
      changed = true;
    }
    if (file === 'Customers.jsx' && !content.includes('useDebounce')) {
      content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { useDebounce } from 'use-debounce';");
      content = content.replace("const [search, setSearch] = useState('');", "const [search, setSearch] = useState('');\n  const [debouncedSearch] = useDebounce(search, 500);");
      content = content.replace("[search, page]", "[debouncedSearch, page]");
      content = content.replace("[search]", "[debouncedSearch]");
      content = content.replace("search=${encodeURIComponent(search)}", "search=${encodeURIComponent(debouncedSearch)}");
      changed = true;
    }
    if (file === 'Orders.jsx' && !content.includes('useDebounce')) {
      content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport { useDebounce } from 'use-debounce';");
      content = content.replace("const [search, setSearch] = useState('');", "const [search, setSearch] = useState('');\n  const [debouncedSearch] = useDebounce(search, 500);");
      content = content.replace("[search, statusFilter]", "[debouncedSearch, statusFilter]");
      content = content.replace("[search, statusFilter, page]", "[debouncedSearch, statusFilter, page]");
      content = content.replace("search=${encodeURIComponent(search)}", "search=${encodeURIComponent(debouncedSearch)}");
      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + file);
    }
  }
});
