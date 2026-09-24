const fs = require('fs');
let file = fs.readFileSync('client/src/pages/Settings.jsx', 'utf8');

const targetStr = `        </div>
      </div>
    </div>
  );
}`;

const replacement = `        </div>
        
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
          <h2>Store Offers</h2>
          <OffersManager />
        </div>
      </div>
    </div>
  );
}

function OffersManager() {
  const { useState, useEffect } = require('react');
  const api = require('../services/api').default;
  const [offers, setOffers] = useState([]);
  const [newOffer, setNewOffer] = useState({ title: '', description: '', discountType: 'FIXED', discountValue: '', minCartValue: '' });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await api.get('/offers');
      setOffers(res.data.data);
    } catch (err) { console.error(err); }
  };

  const createOffer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/offers', newOffer);
      setNewOffer({ title: '', description: '', discountType: 'FIXED', discountValue: '', minCartValue: '' });
      fetchOffers();
    } catch (err) { alert('Failed to create offer'); }
  };

  const toggleOffer = async (id, currentStatus) => {
    try {
      await api.patch('/offers/' + id, { isActive: !currentStatus });
      fetchOffers();
    } catch (err) { alert('Failed to toggle offer'); }
  };

  const deleteOffer = async (id) => {
    if (!confirm('Delete this offer?')) return;
    try {
      await api.delete('/offers/' + id);
      fetchOffers();
    } catch (err) { alert('Failed to delete offer'); }
  };

  return (
    <div>
      <form onSubmit={createOffer} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        <input placeholder="Offer Title (e.g. Flat Rs 50 Off)" value={newOffer.title} onChange={e => setNewOffer({...newOffer, title: e.target.value})} required style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
        <input placeholder="Description (e.g. On orders above 500)" value={newOffer.description} onChange={e => setNewOffer({...newOffer, description: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select value={newOffer.discountType} onChange={e => setNewOffer({...newOffer, discountType: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}>
            <option value="FIXED">Flat (Rs)</option>
            <option value="PERCENTAGE">Percentage (%)</option>
          </select>
          <input type="number" placeholder="Discount Value" value={newOffer.discountValue} onChange={e => setNewOffer({...newOffer, discountValue: e.target.value})} required style={{ padding: '0.5rem', flex: 1, border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>
        <input type="number" placeholder="Minimum Cart Value (0 for any)" value={newOffer.minCartValue} onChange={e => setNewOffer({...newOffer, minCartValue: e.target.value})} style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }} />
        <button type="submit" style={{ padding: '0.75rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Add Offer</button>
      </form>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {offers.map(o => (
          <div key={o.id} style={{ padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ color: o.isActive ? '#065f46' : '#6b7280' }}>{o.title}</strong>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{o.description} | {o.discountType === 'FIXED' ? 'Rs. ' : ''}{o.discountValue}{o.discountType === 'PERCENTAGE' ? '%' : ''} Off (Min: Rs. {o.minCartValue})</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => toggleOffer(o.id, o.isActive)} type="button" style={{ padding: '0.4rem 0.75rem', background: o.isActive ? '#eab308' : '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{o.isActive ? 'Disable' : 'Enable'}</button>
              <button onClick={() => deleteOffer(o.id)} type="button" style={{ padding: '0.4rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Del</button>
            </div>
          </div>
        ))}
        {offers.length === 0 && <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No offers created yet.</p>}
      </div>
    </div>
  );
}
`;

if (file.indexOf(targetStr) !== -1) {
    file = file.replace(targetStr, replacement);
    fs.writeFileSync('client/src/pages/Settings.jsx', file, 'utf8');
    console.log("Success OffersManager injected!");
} else {
    console.log("Target string not found!");
}
