const fs = require('fs');
let content = fs.readFileSync('src/pages/Orders.jsx', 'utf8');

// Add Trash2 to imports
content = content.replace(
  "import { Search, Printer, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';",
  "import { Search, Printer, RotateCcw, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';"
);

// Add handleDeleteOrder function
const handleDeleteCode = `
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to completely delete this order? This action cannot be undone and will not restore inventory.')) return;
    try {
      await api.delete("/orders/" + orderId);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete order');
    }
  };

  return (
`;

content = content.replace('  return (', handleDeleteCode);

// Add Delete button
const deleteBtnHtml = `
                            {(currentUser?.role === 'ADMIN') && (
                              <button onClick={() => handleDeleteOrder(o.id)} style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500, backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'all 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}>
                                <Trash2 size={12}/> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>`;

content = content.replace(
  '                          </div>\n                        </td>\n                      </tr>',
  deleteBtnHtml
);

fs.writeFileSync('src/pages/Orders.jsx', content, 'utf8');
console.log('Added delete order logic');
