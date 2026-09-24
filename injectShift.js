const fs = require('fs');
let file = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

// 1. Add states for shift
const stateInjection = `  const [shift, setShift] = useState(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [openingFloat, setOpeningFloat] = useState('');
  const [actualCash, setActualCash] = useState('');`;
file = file.replace('const [showHeldModal, setShowHeldModal] = useState(false);', 'const [showHeldModal, setShowHeldModal] = useState(false);\n' + stateInjection);

// 2. Fetch shift status
const fetchInjection = `    api.get('/offers?active=true').then(res => setOffers(res.data.data)).catch(console.error);
    api.get('/register/status').then(res => setShift(res.data.data)).catch(console.error);`;
file = file.replace("api.get('/offers?active=true').then(res => setOffers(res.data.data)).catch(console.error);", fetchInjection);

// 3. Shift Logic functions
const shiftLogic = `
  const openRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/register/open', { openingFloat });
      setShift({ ...res.data.data, expectedCash: parseFloat(openingFloat), totalSalesCash: 0, totalSalesUPI: 0 });
    } catch (err) { alert('Failed to open register'); }
  };

  const closeRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post(\`/register/close/\${shift.id}\`, { 
        actualCash, 
        totalUPI: shift.totalSalesUPI, 
        expectedCash: shift.expectedCash 
      });
      alert('Register closed successfully. End of shift.');
      setShift(null);
      setShowShiftModal(false);
      setActualCash('');
      setOpeningFloat('');
    } catch (err) { alert('Failed to close register'); }
  };
`;
file = file.replace('const clearCart = () => {', shiftLogic + '\n  const clearCart = () => {');

// 4. Register checking in checkout
const checkoutTarget = "const handleCheckout = async () => {";
const checkoutCheck = `const handleCheckout = async () => {
    if (!shift) {
      alert("Please open the register first!");
      return;
    }`;
file = file.replace(checkoutTarget, checkoutCheck);

// 5. Shift UI in Header
const headerTarget = `<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, {currentUser.name}</span>`;
const headerUI = `<div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {shift ? (
            <button onClick={() => setShowShiftModal(true)} style={{ padding: '0.5rem 1rem', background: '#ecfdf5', color: '#059669', border: '1px solid #10b981', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Register: OPEN</button>
          ) : (
            <button style={{ padding: '0.5rem 1rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #ef4444', borderRadius: '4px', fontWeight: 'bold' }}>Register: CLOSED</button>
          )}
          <span>Welcome, {currentUser.name}</span>`;
file = file.replace(headerTarget, headerUI);

// 6. Shift Modal UI
const modalTarget = `{/* Modals */}`;
const shiftModalUI = `{/* Modals */}
      
      {/* Shift Start Overlay */}
      {!shift && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ marginTop: 0, color: '#dc2626' }}>Register Closed</h2>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>You must open the register to start billing.</p>
            <form onSubmit={openRegister}>
              <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
                <label>Opening Cash (Rs.)</label>
                <input type="number" required value={openingFloat} onChange={e => setOpeningFloat(e.target.value)} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }} placeholder="e.g. 500" />
              </div>
              <button type="submit" style={{ width: '100%', padding: '1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>Open Register</button>
            </form>
          </div>
        </div>
      )}

      {/* Shift Close Modal */}
      {showShiftModal && shift && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 60 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button onClick={() => setShowShiftModal(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            <h3 style={{ marginTop: 0, color: '#059669' }}>Current Shift Status</h3>
            
            <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Opening Float:</span> <strong>Rs. {shift.openingFloat}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Cash Sales:</span> <strong>Rs. {shift.totalSalesCash}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>UPI Sales:</span> <strong>Rs. {shift.totalSalesUPI}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #d1d5db', fontSize: '1.1rem' }}>
                <span>Expected Cash in Drawer:</span> <strong style={{ color: '#16a34a' }}>Rs. {shift.expectedCash}</strong>
              </div>
            </div>

            <form onSubmit={closeRegister}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 'bold' }}>Counted Cash (Actual)</label>
                <input type="number" required value={actualCash} onChange={e => setActualCash(e.target.value)} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '1.1rem' }} placeholder="e.g. 1500" />
              </div>
              <button type="submit" style={{ width: '100%', padding: '1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>Close Shift (Z-Report)</button>
            </form>
          </div>
        </div>
      )}
`;
file = file.replace(modalTarget, shiftModalUI);

fs.writeFileSync('client/src/pages/POS.jsx', file, 'utf8');
console.log('Injected shift management into POS');
