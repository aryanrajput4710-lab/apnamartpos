const fs = require('fs');

function patchFile(file, isEdit) {
  let content = fs.readFileSync(file, 'utf8');
  const valStr = isEdit ? "value={v.size || ''}" : "value={v.size}";

  const block = `                        <input 
                          type="text" 
                          list="size-options"
                          placeholder="e.g. S, M, L, XL"
                          ${valStr} 
                          onChange={e => updateVariant(i, 'size', e.target.value)} 
                          style={{ width: '100%', height: '40px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                        />
                        <datalist id="size-options">
                          <option value="S" />
                          <option value="M" />
                          <option value="L" />
                          <option value="XL" />
                          <option value="XXL" />
                          <option value="Small" />
                          <option value="Big" />
                        </datalist>`;
                        
  const updated = content.replace(
    /<input[\s\n\r]*type="text"[\s\n\r]*placeholder="e\.g\. S, M, L, XL"[\s\n\r]*value=\{v\.size(\|\| '')?\}[\s\n\r]*onChange=\{e => updateVariant\(i, 'size', e\.target\.value\)\}[\s\n\r]*style=\{\{.*?\}\}[\s\n\r]*\/>/gs,
    block
  );

  if (updated !== content) {
    fs.writeFileSync(file, updated, 'utf8');
    console.log('Successfully patched ' + file);
  } else {
    console.log('No match found in ' + file);
  }
}

patchFile('src/pages/ProductForm.jsx', false);
patchFile('src/pages/EditProduct.jsx', true);
