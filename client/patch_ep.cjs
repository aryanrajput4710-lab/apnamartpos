const fs = require('fs');
let file = 'src/pages/EditProduct.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<input[^>]+placeholder="e\.g\. S, M, L, XL"[^>]+>/s;

const block = `<input 
                          type="text" 
                          list="size-options"
                          placeholder="e.g. S, M, L, XL"
                          value={v.size || ''} 
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

if (regex.test(content)) {
  content = content.replace(regex, block);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Patched EditProduct with simple regex!");
} else {
  console.log("Regex failed too.");
}
