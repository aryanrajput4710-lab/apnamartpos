const fs = require('fs');
let file = fs.readFileSync('client/src/pages/ProductForm.jsx', 'utf8');

const constants = `
const CATEGORY_TREE = {
  "Clothing": ["Sarees", "T-shirts", "Kurta Sets", "Shirts", "Baby Set", "Tops", "Leggings", "Dress", "Trousers", "Kurtis", "Jeans", "Shorts", "Sweatshirts", "Baby Shorts", "Innerwear"],
  "Toys": [],
  "Footwear": ["Slipper", "Shoes", "Socks", "Sandals"],
  "Bags": [],
  "Accessories": ["Watch", "Belt", "Ladies Purse", "Mens Purse", "Chain", "Earrings", "Others"],
  "Gift Items": [],
  "Grocery": [],
  "Plastic Item": [],
  "Cookware": [],
  "Kitchen & Home Appliances": [],
  "Stationery": [],
  "Glass Set": [],
  "Crockery": []
};

export default function ProductForm() {
`;

file = file.replace('export default function ProductForm() {\n', constants);

file = file.replace(
  "name: '', description: '', category: '', brand: ''",
  "name: '', description: '', category: '', subcategory: '', brand: ''"
);

const oldCategoryUI = `<div style={{ flex: 1 }}>
            <label>Category (Optional)</label><br/>
            <input style={{ width: '100%' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
          </div>`;

const newCategoryUI = `<div style={{ flex: 1 }}>
            <label>Category (Optional)</label><br/>
            <select style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value, subcategory: '' })}>
              <option value="">-- Select Category --</option>
              {Object.keys(CATEGORY_TREE).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          {formData.category && CATEGORY_TREE[formData.category] && CATEGORY_TREE[formData.category].length > 0 && (
            <div style={{ flex: 1 }}>
              <label>Subcategory</label><br/>
              <select style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }} value={formData.subcategory} onChange={e => setFormData({ ...formData, subcategory: e.target.value })}>
                <option value="">-- Select Subcategory --</option>
                {CATEGORY_TREE[formData.category].map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
          )}`;

file = file.replace(oldCategoryUI, newCategoryUI);

fs.writeFileSync('client/src/pages/ProductForm.jsx', file, 'utf8');
console.log('ProductForm updated');
