const fs = require('fs');
let file = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

const targetUI = "                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>\n                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', marginBottom: '0.5rem' }}>\n                      <span>Subtotal</span>";

const offersUI = `                  {offers.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#4b5563' }}>Available Offers</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {offers.map(offer => {
                          const isEligible = totals.subtotal >= offer.minCartValue;
                          const applyOffer = () => {
                            if (!isEligible) return;
                            let discountAmt = 0;
                            if (offer.discountType === 'PERCENTAGE') {
                              discountAmt = (totals.subtotal * (offer.discountValue / 100)).toFixed(2);
                            } else {
                              discountAmt = Number(offer.discountValue).toFixed(2);
                            }
                            setExtraDiscount(discountAmt);
                          };
                          
                          return (
                            <div key={offer.id} onClick={applyOffer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', background: isEligible ? '#ecfdf5' : '#f3f4f6', cursor: isEligible ? 'pointer' : 'not-allowed', opacity: isEligible ? 1 : 0.6 }}>
                              <div>
                                <strong style={{ color: '#065f46' }}>{offer.title}</strong>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{offer.description || ''} (Min: Rs. {offer.minCartValue})</div>
                              </div>
                              <span style={{ fontWeight: 'bold', color: '#16a34a' }}>
                                {offer.discountType === 'FIXED' ? 'Rs. ' : ''}{offer.discountValue}{offer.discountType === 'PERCENTAGE' ? '%' : ''} Off
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                      <span>Subtotal</span>`;

if (file.indexOf("<span>Subtotal</span>") !== -1) {
    file = file.replace(targetUI, offersUI);
    fs.writeFileSync('client/src/pages/POS.jsx', file, 'utf8');
    console.log('Injected offers into POS successfully');
} else {
    console.log('Target string not found');
}
