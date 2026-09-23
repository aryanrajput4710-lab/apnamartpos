import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ProductForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', brand: ''
  });
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);

  const addVariant = () => {
    setVariants([...variants, { size: '', color: '', mrp: '', sellingPrice: '', stock: 0 }]);
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/products', { ...formData, variants });
      navigate('/products');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Add New Product</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
        <div>
          <label>Product Name*</label><br/>
          <input required style={{ width: '100%' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label>Category</label><br/>
            <input style={{ width: '100%' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Brand</label><br/>
            <input style={{ width: '100%' }} value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
          </div>
        </div>
        
        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h4>Variants</h4>
          <button type="button" onClick={addVariant}>+ Add Variant</button>
        </div>
        
        {variants.map((v, i) => (
          <div key={i} style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px', position: 'relative' }}>
            <button type="button" onClick={() => removeVariant(i)} style={{ position: 'absolute', right: '0.5rem', top: '0.5rem', color: 'red' }}>X</button>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div><label>Size</label><br/><input value={v.size} onChange={e => updateVariant(i, 'size', e.target.value)} /></div>
              <div><label>Color</label><br/><input value={v.color} onChange={e => updateVariant(i, 'color', e.target.value)} /></div>
              <div><label>MRP*</label><br/><input type="number" required value={v.mrp} onChange={e => updateVariant(i, 'mrp', parseFloat(e.target.value))} /></div>
              <div><label>Selling Price*</label><br/><input type="number" required value={v.sellingPrice} onChange={e => updateVariant(i, 'sellingPrice', parseFloat(e.target.value))} /></div>
              <div><label>Initial Stock</label><br/><input type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', parseInt(e.target.value))} /></div>
            </div>
          </div>
        ))}
        
        <button type="submit" disabled={loading} style={{ background: '#2563eb', color: 'white', padding: '0.75rem', marginTop: '1rem', border: 'none', borderRadius: '4px' }}>
          {loading ? 'Saving...' : 'Save Product'}
        </button>
      </form>
    </div>
  );
}

