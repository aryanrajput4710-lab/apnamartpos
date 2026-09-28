const fs = require('fs');
let content = fs.readFileSync('src/pages/ProductForm.jsx', 'utf8');

const target = `                        <input 
                          type="text" 
                          placeholder="e.g. S, M, L, XL"
                          value={v.size} 
                          onChange={e => updateVariant(i, 'size', e.target.value)} 
                          style={{ width: '100%', height: '40px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                        />`;

const replacement = `                        <input 
                          type="text" 
                          list="size-options"
                          placeholder="e.g. S, M, L, XL"
                          value={v.size} 
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

content = content.replace(target, replacement);
fs.writeFileSync('src/pages/ProductForm.jsx', content, 'utf8');
