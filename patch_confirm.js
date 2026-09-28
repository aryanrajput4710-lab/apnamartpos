const fs = require('fs');

let c = fs.readFileSync('client/src/pages/Orders.jsx', 'utf8');
if (!c.includes('ConfirmModal')) {
  c = c.replace(/import \{([^}]+)\} from 'lucide-react';/, "import {$1} from 'lucide-react';\nimport ConfirmModal from '../components/ConfirmModal';");
  
  c = c.replace(/const \[loading, setLoading\] = useState\(true\);/, "const [loading, setLoading] = useState(true);\n  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, id: null });");
  
  c = c.replace(/if \(!window\.confirm\('WARNING: Are you absolutely sure you want to delete ALL orders[^']+'\)\) return;/g, 
    "setConfirmModal({ open: true, action: 'deleteAll', id: null }); return;"
  );
  
  c = c.replace(/if \(!window\.confirm\('Are you sure you want to completely delete this order[^']+'\)\) return;/g,
    "setConfirmModal({ open: true, action: 'deleteSingle', id: id }); return;"
  );
  
  c = c.replace(/<\/div>\s*<\/div>\s*\)\s*;\s*\}\s*$/, 
    `</div>
      <ConfirmModal 
        isOpen={confirmModal.open} 
        title={confirmModal.action === 'deleteAll' ? 'Delete All Orders' : 'Delete Order'}
        message={confirmModal.action === 'deleteAll' 
          ? 'WARNING: Are you absolutely sure you want to delete ALL orders and related data (returns, payments, sale history)? This will NOT restore inventory! This is meant for clearing test data only.' 
          : 'Are you sure you want to completely delete this order? This action cannot be undone, but inventory will be restored.'}
        confirmText="Delete"
        confirmColor="#dc2626"
        onConfirm={async () => {
          const { action, id } = confirmModal;
          setConfirmModal({ open: false, action: null, id: null });
          try {
            if (action === 'deleteAll') {
              const api = require('../services/api').default; // in case api isn't imported, but it usually is
              await api.delete('/orders/all-test-data');
              toast.success('All test orders deleted');
            } else if (action === 'deleteSingle') {
              const api = require('../services/api').default;
              await api.delete('/orders/' + id);
              toast.success('Order deleted');
            }
            fetchOrders();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Error deleting');
          }
        }}
        onCancel={() => setConfirmModal({ open: false, action: null, id: null })}
      />
    </div>
  );
}`
  );
  
  fs.writeFileSync('client/src/pages/Orders.jsx', c, 'utf8');
  console.log('Patched Orders.jsx');
}

// For POS.jsx
let pos = fs.readFileSync('client/src/pages/POS.jsx', 'utf8');
if (!pos.includes('ConfirmModal')) {
  pos = pos.replace(/import \{([^}]+)\} from 'lucide-react';/, "import {$1} from 'lucide-react';\nimport ConfirmModal from '../components/ConfirmModal';");
  
  pos = pos.replace(/const \[cart, setCart\] = useState\(\[\]\);/, "const [cart, setCart] = useState([]);\n  const [confirmModal, setConfirmModal] = useState(false);");
  
  pos = pos.replace(/if \(cart\.length > 0 && window\.confirm\('Clear all items from this sale\?'\)\) \{/, 
    "if (cart.length > 0) { setConfirmModal(true); }\n  const confirmClearCart = () => {"
  );
  
  pos = pos.replace(/<\/div>\s*<\/div>\s*\)\s*;\s*\}\s*$/, 
    `</div>
      <ConfirmModal 
        isOpen={confirmModal} 
        title="Clear Sale"
        message="Are you sure you want to clear all items from this sale?"
        confirmText="Clear Sale"
        confirmColor="#dc2626"
        onConfirm={() => {
          confirmClearCart();
          setConfirmModal(false);
        }}
        onCancel={() => setConfirmModal(false)}
      />
    </div>
  );
}`
  );
  fs.writeFileSync('client/src/pages/POS.jsx', pos, 'utf8');
  console.log('Patched POS.jsx');
}
