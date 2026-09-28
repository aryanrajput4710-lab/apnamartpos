const fs = require('fs');

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Add discountPercent to initial state if it doesn't exist
  if (!content.includes('discountPercent')) {
    content = content.replace(
      /{ size: '', color: '', netQuantity: '', costPrice: '', mrp: '', sellingPrice: '', stock: 0 }/g,
      "{ size: '', color: '', netQuantity: '', costPrice: '', mrp: '', sellingPrice: '', discountPercent: '', stock: 0 }"
    );
  }
  
  const newUpdateVariant = `  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;

    if (field === 'mrp' || field === 'discountPercent') {
      const mrp = parseFloat(newVariants[index].mrp);
      const discount = parseFloat(newVariants[index].discountPercent);
      if (!isNaN(mrp) && !isNaN(discount)) {
        newVariants[index].sellingPrice = (mrp - (mrp * discount / 100)).toFixed(2);
      }
    } else if (field === 'sellingPrice') {
      const mrp = parseFloat(newVariants[index].mrp);
      const sp = parseFloat(value);
      if (!isNaN(mrp) && !isNaN(sp) && mrp > 0) {
        newVariants[index].discountPercent = (((mrp - sp) / mrp) * 100).toFixed(2);
      } else {
        newVariants[index].discountPercent = '';
      }
    }

    setVariants(newVariants);
  };`;

  if (content.includes('const updateVariant = (index, field, value) => {')) {
    const startIndex = content.indexOf('  const updateVariant = (index, field, value) => {');
    const endIndex = content.indexOf('  };', startIndex) + 4;
    content = content.slice(0, startIndex) + newUpdateVariant + content.slice(endIndex);
  }

  // Inject Discount field into the UI
  const discountField = `
                      {/* Discount % */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                          Discount %
                        </label>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="%"
                          value={v.discountPercent || ''} 
                          onChange={e => updateVariant(i, 'discountPercent', e.target.value)} 
                          style={{ width: '100%', height: '40px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                        />
                      </div>`;
                      
  if (!content.includes('Discount %')) {
    content = content.replace(
      /{[^}]*Selling Price[^}]*}/,
      match => discountField + '\n\n                      ' + match
    );
  }

  fs.writeFileSync(filepath, content, 'utf8');
}

patchFile('src/pages/ProductForm.jsx');
patchFile('src/pages/EditProduct.jsx');
console.log('Patched forms');
