const fs = require('fs');
let file = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

const regex = /<button onClick=\{clearCart\} disabled=\{cart\.length === 0\} style=\{\{ padding: '1rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: cart\.length === 0 \? 'not-allowed' : 'pointer' \}\}>\s*Clear\s*<\/button>/;

const holdCartUI = `<button onClick={handleHoldCart} disabled={cart.length === 0} style={{ padding: '1rem', background: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}>
                Hold
              </button>
              <button onClick={() => setShowHeldModal(true)} style={{ padding: '1rem', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                Held ({heldCarts.length})
              </button>
              <button onClick={clearCart} disabled={cart.length === 0} style={{ padding: '1rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}>
                Clear
              </button>`;

if (regex.test(file)) {
    file = file.replace(regex, holdCartUI);
    fs.writeFileSync('client/src/pages/POS.jsx', file, 'utf8');
    console.log("Injected Hold Cart Buttons!");
} else {
    console.log("Regex not found!");
}
