const fs = require('fs');

let content = fs.readFileSync('src/pages/POS.jsx', 'utf-8');

// Replace react-router-dom imports to include useOutletContext
content = content.replace(
  "import { Link } from 'react-router-dom';",
  "import { Link, useOutletContext } from 'react-router-dom';"
);

// Find where state variables are declared
const statePos = content.indexOf("const [drawerOpen, setDrawerOpen] = useState(false);");
if (statePos !== -1) {
  content = content.replace("const [drawerOpen, setDrawerOpen] = useState(false);", "const { setDrawerOpen } = useOutletContext();");
}

// Remove the Drawer and Overlay entirely from the JSX.
// We can use a regex or string replacement to remove:
//       {/* DRAWER OVERLAY */}
//       {drawerOpen && ( ... )}
//
//       {/* DRAWER */}
//       <div style={{ ... }}> ... </div>

const startDrawer = content.indexOf("{/* DRAWER OVERLAY */}");
const endDrawer = content.indexOf("{/* MAIN LAYOUT */}");

if (startDrawer !== -1 && endDrawer !== -1) {
  content = content.substring(0, startDrawer) + content.substring(endDrawer);
}

// Remove `height: '100vh'` from the main POS div, because AppLayout now provides flex: 1 and overflow hidden to the <main>.
// Actually `height: '100vh'` in POS is fine since AppLayout has `overflow: hidden` and flex 1, it will just fill it. Wait, `height: '100%'` is better.
content = content.replace(
  "<div style={{ display: 'flex', height: '100vh', background: '#f8fafc', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>",
  "<div style={{ display: 'flex', height: '100%', background: '#f8fafc', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>"
);

fs.writeFileSync('src/pages/POS.jsx', content, 'utf-8');
