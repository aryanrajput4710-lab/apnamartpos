const fs = require('fs');
let content = fs.readFileSync('src/pages/POS.jsx', 'utf8');

// Add Keyboard icon import
content = content.replace(
  "import { ShoppingCart, User, Search, Trash2, Plus, Minus, X, Camera, Menu, LayoutDashboard, Package, Users, FileText, TrendingUp, UserPlus, Settings, LogOut, ChevronRight } from 'lucide-react';",
  "import { ShoppingCart, User, Search, Trash2, Plus, Minus, X, Camera, Menu, LayoutDashboard, Package, Users, FileText, TrendingUp, UserPlus, Settings, LogOut, ChevronRight, Keyboard } from 'lucide-react';"
);

// Add state for shortcut modal
content = content.replace(
  "const [showCheckoutModal, setShowCheckoutModal] = useState(false);",
  "const [showCheckoutModal, setShowCheckoutModal] = useState(false);\n  const [showShortcuts, setShowShortcuts] = useState(false);"
);

// Add shortcut button to the header
const headerBtnHtml = `
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button onClick={() => setShowShortcuts(true)} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }} title="Keyboard Shortcuts">
                <Keyboard size={20} />
              </button>
              <button onClick={() => setShowCamera(true)} className="mobile-only" style={{ background: '#3b82f6', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
`;

content = content.replace(
  /<div style=\{\{ display: 'flex', gap: '0.75rem', alignItems: 'center' \}\}>\s*<button onClick=\{\(\) => setShowCamera\(true\)\} className="mobile-only" style=\{\{ background: '#3b82f6', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' \}\}>/g,
  headerBtnHtml
);

// Add Shortcuts Modal
const modalHtml = `
      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button onClick={() => setShowShortcuts(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Keyboard size={20}/> Keyboard Shortcuts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#475569' }}>Checkout / Pay</span>
                <kbd style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 'bold' }}>Enter</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#475569' }}>Hold Sale</span>
                <kbd style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 'bold' }}>F2</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#475569' }}>Close Modals</span>
                <kbd style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: 'bold' }}>Esc</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#475569' }}>Focus Search/Barcode</span>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Start scanning anywhere</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Scanner Modal */}
`;

content = content.replace('      {/* Camera Scanner Modal */}', modalHtml);

fs.writeFileSync('src/pages/POS.jsx', content, 'utf8');
console.log('Added Keyboard Shortcuts to POS');
