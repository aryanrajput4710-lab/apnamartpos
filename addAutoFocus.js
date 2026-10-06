const fs = require('fs');
let c = fs.readFileSync('client/src/pages/ProductForm.jsx', 'utf8');

if (!c.includes('nameInputRef')) {
  c = c.replace(
    'const [loading, setLoading] = useState(false);',
    'const [loading, setLoading] = useState(false);\n  const nameInputRef = useRef(null);'
  );

  c = c.replace(
    /window\.scrollTo\(0, 0\);/,
    'window.scrollTo(0, 0);\n        setTimeout(() => nameInputRef.current?.focus(), 100);'
  );

  c = c.replace(
    /type="text"\s*placeholder="e\.g\. Cotton T-Shirt, Face Wash, Basmati Rice"\s*value=\{formData\.name\}/,
    'type="text"\n                  ref={nameInputRef}\n                  placeholder="e.g. Cotton T-Shirt, Face Wash, Basmati Rice"\n                  value={formData.name}'
  );

  if(!c.includes('useRef')) {
    c = c.replace('useState, useEffect', 'useState, useEffect, useRef');
  }

  fs.writeFileSync('client/src/pages/ProductForm.jsx', c);
  console.log('Successfully updated ProductForm.jsx with autofocus');
} else {
  console.log('Already has nameInputRef');
}
