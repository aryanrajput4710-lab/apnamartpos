const fs = require('fs');
let c = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

const shiftModalOld = `<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #d1d5db', fontSize: '1.1rem' }}>
                  <span>Expected Cash in Drawer:</span> <strong style={{ color: '#16a34a' }}>Rs. {shift.expectedCash}</strong>
                </div>
              </div>`;

const shiftModalNew = `<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Cash Added:</span> <strong>Rs. {shift.cashAdded || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Cash Removed:</span> <strong>Rs. {shift.cashRemoved || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #d1d5db', fontSize: '1.1rem' }}>
                  <span>Expected Cash in Drawer:</span> <strong style={{ color: '#16a34a' }}>Rs. {shift.expectedCash}</strong>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Add / Remove Cash</h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="number" id="cashAmount" placeholder="Amount" style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <input type="text" id="cashRemarks" placeholder="Remarks" style={{ flex: 2, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={async () => {
                    const amount = document.getElementById('cashAmount').value;
                    const remarks = document.getElementById('cashRemarks').value;
                    if(!amount || !remarks) return toast.error('Amount and remarks required');
                    await api.post('/register/cash-transaction', { registerId: shift.id, type: 'ADD', amount, remarks });
                    document.getElementById('cashAmount').value = '';
                    document.getElementById('cashRemarks').value = '';
                    toast.success('Cash added');
                    api.get('/register/status').then(res => setShift(res.data.data)).catch(console.error);
                  }} style={{ flex: 1, padding: '0.5rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Add Cash</button>
                  <button type="button" onClick={async () => {
                    const amount = document.getElementById('cashAmount').value;
                    const remarks = document.getElementById('cashRemarks').value;
                    if(!amount || !remarks) return toast.error('Amount and remarks required');
                    await api.post('/register/cash-transaction', { registerId: shift.id, type: 'REMOVE', amount, remarks });
                    document.getElementById('cashAmount').value = '';
                    document.getElementById('cashRemarks').value = '';
                    toast.success('Cash removed');
                    api.get('/register/status').then(res => setShift(res.data.data)).catch(console.error);
                  }} style={{ flex: 1, padding: '0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Remove Cash</button>
                </div>
              </div>`;

c = c.replace(shiftModalOld, shiftModalNew);

fs.writeFileSync('client/src/pages/POS.jsx', c);
