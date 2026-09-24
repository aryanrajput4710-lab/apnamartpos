const fs = require('fs');
let file = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

// 1. Add heldCarts state
file = file.replace('const [offers, setOffers] = useState([]);', 'const [offers, setOffers] = useState([]);\n  const [heldCarts, setHeldCarts] = useState(() => JSON.parse(localStorage.getItem("heldCarts") || "[]"));\n  const [showHeldModal, setShowHeldModal] = useState(false);');

// 2. Add useEffect for localStorage sync
file = file.replace('api.get(\'/settings\').then(res => setSettings(res.data.data)).catch(console.error);', 'api.get(\'/settings\').then(res => setSettings(res.data.data)).catch(console.error);\n    localStorage.setItem("heldCarts", JSON.stringify(heldCarts));\n');
// Wait, putting it inside the empty dependency array useEffect won't sync it when it updates.
// I will just add another useEffect right after the first one.

const extraUseEffect = `
  useEffect(() => {
    localStorage.setItem('heldCarts', JSON.stringify(heldCarts));
  }, [heldCarts]);
`;
file = file.replace('const [settings, setSettings] = useState(null);', 'const [settings, setSettings] = useState(null);' + extraUseEffect);


// 3. Add handleHoldCart and handleRestoreCart
const holdCartLogic = `
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const holdData = {
      id: Date.now(),
      cart,
      customer,
      extraDiscount,
      time: new Date().toLocaleTimeString()
    };
    setHeldCarts([...heldCarts, holdData]);
    setCart([]);
    setCustomer(null);
    setExtraDiscount('');
  };

  const handleRestoreCart = (heldId) => {
    const target = heldCarts.find(hc => hc.id === heldId);
    if (!target) return;
    // If current cart is not empty, maybe alert?
    if (cart.length > 0 && !confirm("Current cart will be replaced. Continue?")) return;
    setCart(target.cart);
    setCustomer(target.customer);
    setExtraDiscount(target.extraDiscount);
    setHeldCarts(heldCarts.filter(hc => hc.id !== heldId));
    setShowHeldModal(false);
  };
`;
file = file.replace('const [settings, setSettings] = useState(null);', holdCartLogic + 'const [settings, setSettings] = useState(null);');


// 4. Inject "Hold Cart" UI
const clearCartTarget = `<button onClick={clearCart} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', fontWeight: 'bold' }}>`;
const holdCartUI = `
            <button onClick={handleHoldCart} disabled={cart.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: cart.length > 0 ? '#f59e0b' : '#9ca3af', background: 'none', border: 'none', cursor: cart.length > 0 ? 'pointer' : 'default', padding: '0.5rem', fontWeight: 'bold' }}>
              Hold Cart
            </button>
            <button onClick={() => setShowHeldModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', fontWeight: 'bold' }}>
              Held ({heldCarts.length})
            </button>
            <button onClick={clearCart} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', fontWeight: 'bold' }}>`;

file = file.replace(clearCartTarget, holdCartUI);


// 5. Inject Held Carts Modal
const modalTarget = `{/* Modals */}`;
const heldModalUI = `{/* Modals */}
      {showHeldModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '5vh', zIndex: 60 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setShowHeldModal(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
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
`;

file = file.replace(modalTarget, heldModalUI);

fs.writeFileSync('client/src/pages/POS.jsx', file, 'utf8');
console.log('Hold Cart Feature Injected Successfully');
