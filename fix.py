import re

with open("client/src/pages/POS.jsx", "r", encoding="utf-8") as f:
    content = f.read()

new_custom_item = """
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
"""

content = re.sub(r'const addCustomItem = async \(\) => \{.*?\n  \};\n', new_custom_item, content, flags=re.DOTALL)

with open("client/src/pages/POS.jsx", "w", encoding="utf-8") as f:
    f.write(content)
