const fs = require('fs');
let file = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

const target = "{/* Camera Scanner Modal */}";

const modalUI = `
      {/* Held Carts Modal */}
      {showHeldModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '5vh', zIndex: 60 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setShowHeldModal(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>X</button>
            <h3 style={{ marginTop: 0 }}>Held Carts</h3>
            {heldCarts.length === 0 ? (
              <p>No held carts.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {heldCarts.map(hc => (
                  <div key={hc.id} style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>Time: {hc.time}</div>
                      <div style={{ color: '#4b5563', fontSize: '0.9rem' }}>Items: {hc.cart.length} | Customer: {hc.customer ? hc.customer.phone : 'Guest'}</div>
                    </div>
                    <button onClick={() => handleRestoreCart(hc.id)} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Resume</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
            <button onClick={() => setShowShiftModal(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>X</button>
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

      {/* Camera Scanner Modal */}`;

file = file.replace(target, modalUI);
fs.writeFileSync('client/src/pages/POS.jsx', file, 'utf8');
console.log('Injected missing modals');
