const fs = require('fs');
let c = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

const startStr = '  const addCustomItem = async () => {';
const endStr = '  const updateQuantity = (id, delta) => {';

const startIndex = c.indexOf(startStr);
const endIndex = c.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newCustomItem = `
  const handleCreateCustomProduct = async (e) => {
    e.preventDefault();
    try {
      const { name, costPrice, sellingPrice, mrp, stock } = customProductForm;
      if (!name || !costPrice || !sellingPrice || !mrp || !stock) {
        toast('Please fill all fields');
        return;
      }
      
      const payload = {
        name,
        variants: [{
          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
          mrp: Number(mrp),
          stock: Number(stock)
        }]
      };
      
      const res = await api.post('/products', payload);
      const newProduct = res.data.data;
      const newVariant = { ...newProduct.variants[0], product: { name: newProduct.name } };
      addToCart(newVariant);
      setShowAddProductModal(false);
      toast('Product added and inventory updated!');
    } catch (err) {
      toast(err.response?.data?.message || 'Error creating product');
    }
  };

  const handleCustomItemClick = () => {
    setCustomProductForm({ name: '', costPrice: '', sellingPrice: '', mrp: '', stock: '' });
    setShowAddProductModal(true);
  };

`;

  c = c.substring(0, startIndex) + newCustomItem + c.substring(endIndex);
  fs.writeFileSync('client/src/pages/POS.jsx', c);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find start or end strings.");
}
