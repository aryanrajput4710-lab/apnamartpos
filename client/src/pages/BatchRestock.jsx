import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Search, Package, Plus, Trash2, ArrowLeft } from 'lucide-react';

export default function BatchRestock() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);

  const [items, setItems] = useState([]);
  const [overhead, setOverhead] = useState(0);
  const [distMethod, setDistMethod] = useState('PROPORTIONAL'); // EQUAL, PROPORTIONAL, MANUAL

  // Search products
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/products/search?q=${encodeURIComponent(search)}`);
        setSearchResults(res.data.data.slice(0, 15));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [search]);

  const addItem = (variant) => {
    if (items.find(i => i.variantId === variant.id)) {
      toast('Item already added');
      return;
    }
    setItems([...items, { 
      variantId: variant.id, 
      name: variant.product.name,
      sku: variant.sku,
      currentStock: variant.stock,
      oldCost: parseFloat(variant.costPrice || 0),
      quantity: 1, 
      supplierCost: parseFloat(variant.costPrice || 0),
      manualOverhead: 0
    }]);
    setSearch('');
    setSearchResults([]);
  };

  const removeItem = (variantId) => {
    setItems(items.filter(i => i.variantId !== variantId));
  };

  const updateItem = (variantId, field, value) => {
    setItems(items.map(i => i.variantId === variantId ? { ...i, [field]: value } : i));
  };

  // Calculate landed costs
  const calculatedItems = useMemo(() => {
    const totalQty = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0), 0);
    const totalSupplierValue = items.reduce((sum, i) => sum + ((parseFloat(i.quantity) || 0) * (parseFloat(i.supplierCost) || 0)), 0);
    const totalOverhead = parseFloat(overhead) || 0;

    return items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const suppCost = parseFloat(item.supplierCost) || 0;
      let allocatedOverhead = 0;

      if (qty > 0) {
        if (distMethod === 'EQUAL' && totalQty > 0) {
          allocatedOverhead = (totalOverhead / totalQty) * qty;
        } else if (distMethod === 'PROPORTIONAL' && totalSupplierValue > 0) {
          const itemValue = qty * suppCost;
          allocatedOverhead = totalOverhead * (itemValue / totalSupplierValue);
        } else if (distMethod === 'MANUAL') {
          allocatedOverhead = parseFloat(item.manualOverhead) || 0;
        }
      }

      const unitLandedCost = qty > 0 ? suppCost + (allocatedOverhead / qty) : suppCost;

      // Weighted Average Cost prediction
      const oldQty = Math.max(0, item.currentStock);
      const oldCost = item.oldCost;
      const newWAC = (oldQty + qty > 0) ? ((oldQty * oldCost) + (qty * unitLandedCost)) / (oldQty + qty) : oldCost;

      return {
        ...item,
        allocatedOverhead,
        unitLandedCost,
        newWAC
      };
    });
  }, [items, overhead, distMethod]);

  const handleSubmit = async () => {
    if (items.length === 0) return toast.error('Add items first');
    
    const payload = calculatedItems.map(i => ({
      variantId: i.variantId,
      quantity: i.quantity,
      unitLandedCost: i.unitLandedCost
    }));

    try {
      await api.post('/inventory/batch-stock-in', { items: payload, reference: 'BATCH_RESTOCK_WAC' });
      toast.success('Inventory updated successfully!');
      navigate('/inventory');
    } catch (err) {
      toast.error('Failed to process batch restock');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={() => navigate('/inventory')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '1rem' }}>
        <ArrowLeft size={16} /> Back to Inventory
      </button>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b' }}>Batch Restock (Landed Cost Calculator)</h2>
          <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>Receive multiple items, divide transport charges, and automatically update Weighted Average Cost.</p>
        </div>
        <button onClick={handleSubmit} style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          Confirm & Restock
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        {/* Left Column: Items */}
        <div>
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: '#94a3b8' }}><Search size={20} /></div>
            <input 
              type="text" 
              placeholder="Search products by name, SKU, or barcode to add..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '1rem 1rem 1rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
            />
            {search && searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', maxHeight: '300px', overflowY: 'auto' }}>
                {searchResults.map(v => (
                  <div key={v.id} onClick={() => addItem(v)} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#334155' }}>{v.product.name} {v.size && `(${v.size})`}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Current Stock: {v.stock} | Base Cost: Rs. {v.costPrice}</div>
                    </div>
                    <div style={{ color: '#3b82f6' }}><Plus size={20} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', fontSize: '0.85rem', color: '#475569' }}>
                <tr>
                  <th style={{ padding: '1rem' }}>Product</th>
                  <th style={{ padding: '1rem', width: '100px' }}>Qty Rcvd</th>
                  <th style={{ padding: '1rem', width: '120px' }}>Supplier Unit Cost</th>
                  {distMethod === 'MANUAL' && <th style={{ padding: '1rem', width: '120px' }}>Overhead Share</th>}
                  <th style={{ padding: '1rem', width: '120px' }}>New Unit Landed Cost</th>
                  <th style={{ padding: '1rem', width: '120px' }}>Resulting Avg Cost (WAC)</th>
                  <th style={{ padding: '1rem', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {calculatedItems.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Search and add products to begin restock</td></tr>
                ) : calculatedItems.map(item => (
                  <tr key={item.variantId} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '500', color: '#1e293b' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Old Cost: Rs. {item.oldCost} | Old Qty: {item.currentStock}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.variantId, 'quantity', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <input type="number" step="0.01" value={item.supplierCost} onChange={e => updateItem(item.variantId, 'supplierCost', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </td>
                    {distMethod === 'MANUAL' && (
                      <td style={{ padding: '1rem' }}>
                        <input type="number" step="0.01" value={item.manualOverhead} onChange={e => updateItem(item.variantId, 'manualOverhead', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </td>
                    )}
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#0f172a' }}>
                      Rs. {item.unitLandedCost.toFixed(2)}
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'normal' }}>(+{((item.unitLandedCost - item.supplierCost) || 0).toFixed(2)} overhead/unit)</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.5rem', background: '#ecfdf5', color: '#047857', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        Rs. {item.newWAC.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button onClick={() => removeItem(item.variantId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Overhead Config */}
        <div>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', border: '1px solid #e2e8f0', position: 'sticky', top: '2rem' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Package size={20} /> Overhead Charges</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Total Transport / Labour (Rs.)</label>
              <input 
                type="number" 
                value={overhead}
                onChange={e => setOverhead(e.target.value)}
                disabled={distMethod === 'MANUAL'}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1.1rem', fontWeight: 'bold' }}
              />
              {distMethod === 'MANUAL' && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Calculated from manual line items</div>}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Distribution Method</label>
              <select 
                value={distMethod} 
                onChange={e => setDistMethod(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}
              >
                <option value="PROPORTIONAL">By Cost Value (Recommended)</option>
                <option value="EQUAL">Equally by Quantity</option>
                <option value="MANUAL">Manually assign per item</option>
              </select>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '6px', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
              <strong>How it works:</strong>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem' }}>
                <li><strong>Proportional:</strong> Expensive items absorb more transport cost than cheap items.</li>
                <li><strong>WAC:</strong> The final "Avg Cost" accurately blends your old stock value with this new stock value.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
