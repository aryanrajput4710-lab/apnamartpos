import os

filepath = 'client/src/pages/Orders.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports for Receipt/Return
imports_to_add = '''
import { Printer } from 'lucide-react';
'''
if "Printer" not in content:
    content = content.replace("import { Search } from 'lucide-react';", "import { Search, Printer, RotateCcw } from 'lucide-react';")

# Add state variables
state_vars = '''
  const [returnOrder, setReturnOrder] = useState(null);
  const [returnItems, setReturnItems] = useState({});
  const [returnProcessing, setReturnProcessing] = useState(false);
'''
content = content.replace("const [pagination, setPagination] = useState({});", "const [pagination, setPagination] = useState({});" + state_vars)

# Add logic functions
logic_funcs = '''
  const openReturnModal = async (orderId) => {
    try {
      const res = await api.get(/orders/);
      const order = res.data.data;
      setReturnOrder(order);
      const initialItems = {};
      order.items.forEach(item => {
        initialItems[item.id] = { quantity: 0, reason: 'Customer Return' };
      });
      setReturnItems(initialItems);
    } catch (err) {
      alert('Error fetching order details');
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    const itemsToReturn = Object.entries(returnItems)
      .filter(([id, data]) => data.quantity > 0)
      .map(([id, data]) => ({ orderItemId: id, quantity: data.quantity, reason: data.reason }));
      
    if (itemsToReturn.length === 0) {
      alert('No items selected to return');
      return;
    }

    setReturnProcessing(true);
    try {
      await api.post(/orders//return, { items: itemsToReturn });
      alert('Return processed successfully!');
      setReturnOrder(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing return');
    } finally {
      setReturnProcessing(false);
    }
  };

  const printReplacementLabel = (item) => {
    const printWin = window.open('', '_blank');
    printWin.document.write(
      <html>
        <head><title>Replacement Label</title></head>
        <body style="font-family: monospace; text-align: center; padding: 20px;">
          <h2></h2>
          <p>Size:  | Color: </p>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" />
          <p><strong>Rs. </strong></p>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    );
    printWin.document.close();
  };
'''

content = content.replace("const fetchOrders =", logic_funcs + "\n  const fetchOrders =")

# Update table rows to include Return button
table_row_replacement = '''
                  <td style={{ padding: '0.75rem' }}>{o.status}</td>
                  <td style={{ padding: '0.75rem' }}>{o.user.name}</td>
                  <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <Link to={/orders/} style={{ padding: '0.25rem 0.5rem', background: '#e5e7eb', borderRadius: '4px', textDecoration: 'none', color: 'black' }}>View</Link>
                    {(o.status === 'COMPLETED' || o.status === 'PARTIAL_RETURN') && (
                      <button onClick={() => openReturnModal(o.id)} style={{ padding: '0.25rem 0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <RotateCcw size={14}/> Return
                      </button>
                    )}
                  </td>
'''

# Use regex for robust replacement
import re
content = re.sub(
    r'<td style={{ padding: ''0\.75rem'' }}>\{o\.status\}</td>\s*<td style={{ padding: ''0\.75rem'' }}>\{o\.user\.name\}</td>\s*<td style={{ padding: ''0\.75rem'' }}>\s*<Link to=\{/orders/\$\{o\.id\}\}>View Details</Link>\s*</td>',
    table_row_replacement,
    content
)

# Add Return Modal JSX
modal_jsx = '''
      {returnOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, overflowY: 'auto' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>Process Return (Order {returnOrder.orderNumber.split('-')[0]})</h2>
            
            <form onSubmit={handleReturnSubmit}>
              <div className="table-responsive" style={{ marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Product</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Purchased</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Returned</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Return Qty</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Reason</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>Missing Tag?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnOrder.items.map(item => {
                      const availableToReturn = item.quantity - item.returnedQty;
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '0.5rem' }}>{item.productNameSnapshot} <br/><small>{item.skuSnapshot}</small></td>
                          <td style={{ padding: '0.5rem' }}>{item.quantity}</td>
                          <td style={{ padding: '0.5rem' }}>{item.returnedQty}</td>
                          <td style={{ padding: '0.5rem' }}>
                            <input 
                              type="number" 
                              min="0" 
                              max={availableToReturn} 
                              value={returnItems[item.id]?.quantity || 0}
                              onChange={e => setReturnItems({...returnItems, [item.id]: { ...returnItems[item.id], quantity: parseInt(e.target.value) || 0 }})}
                              disabled={availableToReturn === 0}
                              style={{ width: '60px', padding: '0.25rem' }}
                            />
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <select 
                              value={returnItems[item.id]?.reason || 'Customer Return'}
                              onChange={e => setReturnItems({...returnItems, [item.id]: { ...returnItems[item.id], reason: e.target.value }})}
                              disabled={availableToReturn === 0}
                              style={{ padding: '0.25rem' }}
                            >
                              <option value="Customer Return">Customer Return</option>
                              <option value="Defective">Defective</option>
                              <option value="Wrong Item">Wrong Item</option>
                              <option value="Wrong Size">Wrong Size</option>
                            </select>
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            {returnItems[item.id]?.quantity > 0 && (
                              <button type="button" onClick={() => printReplacementLabel(item)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                                <Printer size={12}/> Print Tag
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setReturnOrder(null)} style={{ padding: '0.75rem 1.5rem', border: '1px solid #d1d5db', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={returnProcessing} style={{ padding: '0.75rem 1.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: returnProcessing ? 'not-allowed' : 'pointer' }}>
                  {returnProcessing ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
'''

content = content.replace("</div>\n  );\n}", modal_jsx + "</div>\n  );\n}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Orders.jsx modified")
