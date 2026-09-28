import toast from 'react-hot-toast';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Tag, Check, Save } from 'lucide-react';
import api from '../services/api';

const CATEGORY_TREE = {
  "Clothing": ["Sarees", "T-shirts", "Kurta Sets", "Shirts", "Baby Set", "Tops", "Leggings", "Dress", "Trousers", "Kurtis", "Jeans", "Shorts", "Sweatshirts", "Baby Shorts", "Innerwear"],
  "Toys": [],
  "Footwear": ["Slipper", "Shoes", "Socks", "Sandals"],
  "Bags": [],
  "Accessories": ["Watch", "Belt", "Ladies Purse", "Mens Purse", "Chain", "Earrings", "Others"],
  "Gift Items": ["Birthday Items"],
  "Grocery": [],
  "Plastic Item": [],
  "Cookware": [],
  "Kitchen & Home Appliances": [],
  "Stationery": [],
  "Glass Set": [],
  "Crockery": [],
  "Beauty & Fashion": [],
  "Puja Items": [],
  "Other Items": []
};

export default function ProductForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', subcategory: '', brand: ''
  });
  const [variants, setVariants] = useState([
    { size: '', color: '', netQuantity: '', costPrice: '', mrp: '', sellingPrice: '', discountPercent: '', stock: 0 }
  ]);
  const [loading, setLoading] = useState(false);

  const addVariant = () => {
    setVariants([...variants, { size: '', color: '', netQuantity: '', costPrice: '', mrp: '', sellingPrice: '', discountPercent: '', stock: 0 }]);
  };

  const updateVariant = (index, field, value) => {
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
  };

  const removeVariant = (index) => {
    if (variants.length === 1) {
      toast('A product must have at least one variant.');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/products', { ...formData, variants });
      navigate('/products');
    } catch (err) {
      toast(err.response?.data?.message || 'Error creating product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '5rem' }}>
      
      {/* PAGE HEADER */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link 
          to="/products" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.375rem', 
            color: '#64748b', 
            textDecoration: 'none', 
            fontSize: '0.9rem', 
            fontWeight: '500', 
            marginBottom: '0.75rem' 
          }}
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', margin: '0 0 0.25rem 0' }}>Add New Product</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Create a product and configure its variants, pricing, stock and barcode information.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* BASIC INFORMATION CARD */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', marginTop: 0, marginBottom: '1.25rem' }}>Basic Information</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Product Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.375rem' }}>
                Product Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input 
                required 
                type="text"
                placeholder="e.g. Cotton T-Shirt, Face Wash, Basmati Rice"
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                style={{ 
                  width: '100%', 
                  height: '44px', 
                  padding: '0 12px', 
                  borderRadius: '8px', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Category, Subcategory, Brand Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              
              {/* Category */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.375rem' }}>
                  Category <span style={{ color: '#94a3b8', fontWeight: '400' }}>(Optional)</span>
                </label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                  style={{ 
                    width: '100%', 
                    height: '44px', 
                    padding: '0 12px', 
                    borderRadius: '8px', 
                    border: '1px solid #cbd5e1', 
                    fontSize: '0.95rem',
                    background: 'white',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">-- Select Category --</option>
                  {Object.keys(CATEGORY_TREE).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
              {formData.category && CATEGORY_TREE[formData.category] && CATEGORY_TREE[formData.category].length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.375rem' }}>
                    Subcategory <span style={{ color: '#94a3b8', fontWeight: '400' }}>(Optional)</span>
                  </label>
                  <select 
                    value={formData.subcategory} 
                    onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                    style={{ 
                      width: '100%', 
                      height: '44px', 
                      padding: '0 12px', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1', 
                      fontSize: '0.95rem',
                      background: 'white',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">-- Select Subcategory --</option>
                    {CATEGORY_TREE[formData.category].map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Brand */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.375rem' }}>
                  Brand <span style={{ color: '#94a3b8', fontWeight: '400' }}>(Optional)</span>
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Nike, Nivea, Fortune"
                  value={formData.brand} 
                  onChange={e => setFormData({ ...formData, brand: e.target.value })} 
                  style={{ 
                    width: '100%', 
                    height: '44px', 
                    padding: '0 12px', 
                    borderRadius: '8px', 
                    border: '1px solid #cbd5e1', 
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

            </div>

          </div>
        </div>

        {/* VARIANTS CARD */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a', margin: '0 0 0.25rem 0' }}>Variants</h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                Add size, color, quantity, pricing and stock information for each variant.
              </p>
            </div>
            <button 
              type="button" 
              onClick={addVariant}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.375rem', 
                padding: '0.5rem 1rem', 
                background: '#eff6ff', 
                color: '#2563eb', 
                border: '1px solid #bfdbfe', 
                borderRadius: '8px', 
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              Add Variant
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {variants.map((v, i) => {
              const mrpNum = parseFloat(v.mrp) || 0;
              const spNum = parseFloat(v.sellingPrice) || 0;
              const savings = mrpNum > spNum ? (mrpNum - spNum).toFixed(2) : 0;

              return (
                <div 
                  key={i} 
                  style={{ 
                    background: '#f8fafc', 
                    border: '1px solid #cbd5e1', 
                    borderRadius: '12px', 
                    padding: '1.25rem', 
                    position: 'relative' 
                  }}
                >
                  
                  {/* Variant Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#2563eb', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                        {i + 1}
                      </span>
                      Variant {i + 1}
                    </div>

                    {variants.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeVariant(i)}
                        title="Remove Variant"
                        style={{ 
                          background: '#fee2e2', 
                          color: '#dc2626', 
                          border: 'none', 
                          borderRadius: '6px', 
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem'
                        }}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Variant Fields Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    
                    {/* Size */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                        Size <span style={{ color: '#94a3b8', fontWeight: '400' }}>(Optional)</span>
                      </label>
                                              <input 
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
                        </datalist>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Leave blank if N/A</span>
                    </div>

                    {/* Color */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                        Color <span style={{ color: '#94a3b8', fontWeight: '400' }}>(Optional)</span>
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Black, Blue"
                        value={v.color} 
                        onChange={e => updateVariant(i, 'color', e.target.value)} 
                        style={{ width: '100%', height: '40px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Leave blank if N/A</span>
                    </div>

                    {/* Net Quantity */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                        Net Quantity <span style={{ color: '#94a3b8', fontWeight: '400' }}>(Optional)</span>
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. 500 ml, 1 kg, 10 pcs"
                        value={v.netQuantity || ''} 
                        onChange={e => updateVariant(i, 'netQuantity', e.target.value)} 
                        style={{ width: '100%', height: '40px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>e.g. 100 g / 500 ml / 1 L</span>
                    </div>

                    {/* Cost Price */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                        Cost Price <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        type="number" 
                        step="0.01"
                        required 
                        placeholder="₹ 0.00"
                        value={v.costPrice} 
                        onChange={e => updateVariant(i, 'costPrice', e.target.value)} 
                        style={{ width: '100%', height: '40px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                      />
                    </div>

                    {/* MRP */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                        MRP <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        type="number" 
                        step="0.01"
                        required 
                        placeholder="₹ 0.00"
                        value={v.mrp} 
                        onChange={e => updateVariant(i, 'mrp', e.target.value)} 
                        style={{ width: '100%', height: '40px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                      />
                    </div>

                    
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
                      </div>

                      {/* Selling Price */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                        Selling Price <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input 
                        type="number" 
                        step="0.01"
                        required 
                        placeholder="₹ 0.00"
                        value={v.sellingPrice} 
                        onChange={e => updateVariant(i, 'sellingPrice', e.target.value)} 
                        style={{ width: '100%', height: '40px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                      />
                    </div>

                    {/* Initial Stock */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                        Initial Stock
                      </label>
                      <input 
                        type="number" 
                        value={v.stock} 
                        onChange={e => updateVariant(i, 'stock', parseInt(e.target.value) || 0)} 
                        style={{ width: '100%', height: '40px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Units available on add</span>
                    </div>

                  </div>

                  {/* Price Savings Badge */}
                  {savings > 0 && (
                    <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: '#dcfce7', color: '#15803d', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                      <Check size={14} />
                      Save ₹{savings} on MRP
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>

        {/* BOTTOM FORM ACTIONS */}
        <div style={{ 
          marginTop: '1.5rem',
          background: 'white', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px', 
          padding: '1rem 1.5rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <Link 
            to="/products"
            style={{ 
              padding: '0.65rem 1.25rem', 
              background: '#f8fafc', 
              border: '1px solid #cbd5e1', 
              color: '#334155', 
              borderRadius: '8px', 
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            Cancel
          </Link>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.5rem', 
              background: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
            }}
          >
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>

      </form>
    </div>
  );
}
