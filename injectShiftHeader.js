const fs = require('fs');
let file = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');

const regex = /\{\/\* Left Pane: Scanner & Search \*\/\}\s*<div style=\{\{ flex: '1', display: 'flex', flexDirection: 'column', padding: '1rem', borderRight: '1px solid #e5e7eb' \}\}>/;

const ui = `{/* Left Pane: Scanner & Search */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', padding: '1rem', borderRight: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            {shift ? (
              <button onClick={() => setShowShiftModal(true)} style={{ padding: '0.5rem 1rem', background: '#ecfdf5', color: '#059669', border: '1px solid #10b981', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Register: OPEN</button>
            ) : (
              <button onClick={() => setShowShiftModal(true)} style={{ padding: '0.5rem 1rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #ef4444', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Register: CLOSED (Click to Open)</button>
            )}
          </div>`;

if (regex.test(file)) {
    file = file.replace(regex, ui);
    fs.writeFileSync('client/src/pages/POS.jsx', file, 'utf8');
    console.log("Injected register header UI");
} else {
    console.log("Regex not found");
}
