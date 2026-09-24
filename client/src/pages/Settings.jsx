import { useState, useEffect } from 'react';
import api from '../services/api';

export default function Settings() {
  const [settings, setSettings] = useState({
    storeName: '',
    storeAddress: '',
    storePhone: '',
    receiptFooter: '',
    paymentQrCodeUrl: ''
  });
  const [backupStatus, setBackupStatus] = useState(null);
  const [integrityIssues, setIntegrityIssues] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, backupRes] = await Promise.all([
        api.get('/settings'),
        api.get('/backup/status')
      ]);
      setSettings(settingsRes.data.data);
      setBackupStatus(backupRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings', settings);
      alert('Settings saved successfully');
    } catch (err) {
      alert('Failed to save settings');
    }
  };

  const handleCreateBackup = async () => {
    try {
      const res = await api.post('/backup/create');
      alert(res.data.message);
      fetchData();
    } catch (err) {
      alert('Failed to create backup');
    }
  };

  const handleRestoreBackup = async () => {
    const filename = prompt('WARNING: Restoring a backup will overwrite the current database.\\nEnter the filename of the backup to restore:');
    if (!filename) return;
    
    if (confirm(`Are you absolutely sure you want to restore from ${filename}? This cannot be undone.`)) {
      try {
        await api.post('/backup/restore', { filename });
        alert('Database restored successfully');
      } catch (err) {
        alert('Restore failed');
      }
    }
  };

  const runIntegrityChecks = async () => {
    try {
      const res = await api.get('/integrity');
      setIntegrityIssues(res.data.data);
    } catch (err) {
      alert('Failed to run integrity checks');
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div style={{ padding: '1rem', display: 'flex', gap: '2rem' }}>
      <div style={{ flex: 1, background: 'white', padding: '1rem', borderRadius: '8px' }}>
        <h2>Store Settings</h2>
        <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label>Store Name</label>
            <input value={settings.storeName || ''} onChange={e => setSettings({...settings, storeName: e.target.value})} style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          <div>
            <label>Store Address</label>
            <input value={settings.storeAddress || ''} onChange={e => setSettings({...settings, storeAddress: e.target.value})} style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          <div>
            <label>Store Phone</label>
            <input value={settings.storePhone || ''} onChange={e => setSettings({...settings, storePhone: e.target.value})} style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          <div>
            <label>Payment QR Image (Upload)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              {settings.paymentQrCodeUrl && (
                <img src={settings.paymentQrCodeUrl} alt="QR Code" style={{ width: '100px', height: '100px', objectFit: 'contain', border: '1px solid #d1d5db', borderRadius: '4px' }} />
              )}
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setSettings({ ...settings, paymentQrCodeUrl: ev.target.result });
                };
                reader.readAsDataURL(file);
              }} />
            </div>
            <small style={{ color: '#6b7280' }}>Upload your store's UPI QR code image to show it during checkout.</small>
          </div>
          <div>
            <label>Store Slogan</label>
            <textarea value={settings.receiptFooter || ''} onChange={e => setSettings({...settings, receiptFooter: e.target.value})} style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          <button type="submit" style={{ padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>Save Settings</button>
        </form>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
          <h2>Backup & Restore</h2>
          {backupStatus && (
            <div style={{ marginBottom: '1rem' }}>
              <p><strong>Status:</strong> {backupStatus.status}</p>
              <p><strong>Last Backup:</strong> {backupStatus.lastBackup ? new Date(backupStatus.lastBackup).toLocaleString() : 'N/A'}</p>
              <p><strong>Location:</strong> {backupStatus.location}</p>
            </div>
          )}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleCreateBackup} style={{ padding: '0.75rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px' }}>Create Backup</button>
            <button onClick={handleRestoreBackup} style={{ padding: '0.75rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px' }}>Restore Backup</button>
          </div>
        </div>

        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
          <h2>Data Integrity</h2>
          <button onClick={runIntegrityChecks} style={{ padding: '0.75rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', marginBottom: '1rem' }}>Run Checks</button>
          {integrityIssues && (
            <div>
              {integrityIssues.length === 0 ? (
                <p style={{ color: '#16a34a' }}>No integrity issues found.</p>
              ) : (
                <ul style={{ color: '#dc2626' }}>
                  {integrityIssues.map((issue, i) => <li key={i}>{issue}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
          <h2>Catalog Management</h2>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={async () => {
              try {
                const res = await api.get('/products/catalog/export');
                const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'catalog.json';
                a.click();
              } catch (e) { alert('Export failed'); }
            }} style={{ padding: '0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>Export Catalog</button>
            
            <label style={{ padding: '0.75rem', background: '#eab308', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Import Catalog
              <input type="file" style={{ display: 'none' }} accept="application/json" onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (ev) => {
                  try {
                    const products = JSON.parse(ev.target.result);
                    if (confirm(`Import ${products.length} products?`)) {
                      await api.post('/products/catalog/import', { products });
                      alert('Import successful!');
                    }
                  } catch (err) {
                    alert('Import failed: ' + (err.response?.data?.message || err.message));
                  }
                };
                reader.readAsText(file);
              }} />
            </label>
          </div>
        </div>
        
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


