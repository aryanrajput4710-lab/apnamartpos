const fs = require('fs');
let c = fs.readFileSync('client/src/pages/ProductForm.jsx', 'utf8');

c = c.replace(
  "const handleSubmit = async (e) => {\n    e.preventDefault();\n    setLoading(true);\n    try {\n      await api.post('/products', { ...formData, variants });\n      navigate('/products');\n    } catch (err) {\n      toast(err.response?.data?.message || 'Error creating product');\n    } finally {\n      setLoading(false);\n    }\n  };",
  "const handleSubmit = async (e, addAnother = false) => {\n    e.preventDefault();\n    setLoading(true);\n    try {\n      await api.post('/products', { ...formData, variants });\n      toast.success('Product saved!');\n      if (addAnother) {\n        setFormData({ ...formData, name: '', description: '' });\n        setVariants([{ size: '', sku: '', barcode: '', costPrice: '', sellingPrice: '', mrp: '', discountPercent: '', stock: 0, remarks: '' }]);\n        window.scrollTo(0, 0);\n      } else {\n        navigate('/products');\n      }\n    } catch (err) {\n      toast(err.response?.data?.message || 'Error creating product');\n    } finally {\n      setLoading(false);\n    }\n  };"
);

c = c.replace(
  "<form onSubmit={handleSubmit}>",
  "<form onSubmit={e => handleSubmit(e, false)}>"
);

c = c.replace(
  "      <button \n            type=\"submit\" \n            disabled={loading}\n            style={{ \n              display: 'inline-flex',\n              alignItems: 'center',\n              gap: '0.5rem',\n              padding: '0.65rem 1.5rem', \n              background: '#2563eb', \n              color: 'white', \n              border: 'none', \n              borderRadius: '8px',\n              fontWeight: '600',\n              fontSize: '0.95rem',\n              cursor: loading ? 'not-allowed' : 'pointer',\n              boxShadow: '0 2px 4px rgba(37,99,235,0.2)'\n            }}\n          >\n            <Save size={18} />\n            {loading ? 'Saving...' : 'Save Product'}\n          </button>\n        </div>",
  "      <div style={{ display: 'flex', gap: '0.75rem' }}>\n            <button \n              type=\"button\" \n              disabled={loading}\n              onClick={(e) => handleSubmit(e, true)}\n              style={{ \n                display: 'inline-flex',\n                alignItems: 'center',\n                gap: '0.5rem',\n                padding: '0.65rem 1.5rem', \n                background: '#f59e0b', \n                color: 'white', \n                border: 'none', \n                borderRadius: '8px',\n                fontWeight: '600',\n                fontSize: '0.95rem',\n                cursor: loading ? 'not-allowed' : 'pointer',\n                boxShadow: '0 2px 4px rgba(245,158,11,0.2)'\n              }}\n            >\n              <Save size={18} />\n              Save & Add Another\n            </button>\n            <button \n              type=\"submit\" \n              disabled={loading}\n              style={{ \n                display: 'inline-flex',\n                alignItems: 'center',\n                gap: '0.5rem',\n                padding: '0.65rem 1.5rem', \n                background: '#2563eb', \n                color: 'white', \n                border: 'none', \n                borderRadius: '8px',\n                fontWeight: '600',\n                fontSize: '0.95rem',\n                cursor: loading ? 'not-allowed' : 'pointer',\n                boxShadow: '0 2px 4px rgba(37,99,235,0.2)'\n              }}\n            >\n              <Save size={18} />\n              {loading ? 'Saving...' : 'Save Product'}\n            </button>\n          </div>\n        </div>"
);

fs.writeFileSync('client/src/pages/ProductForm.jsx', c);
