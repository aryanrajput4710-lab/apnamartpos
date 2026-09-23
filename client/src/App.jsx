import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Unauthorized from './pages/Unauthorized';
import AppLayout from './layouts/AppLayout';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import ProductDetail from './pages/ProductDetail';
import Inventory from './pages/Inventory';
import InventoryHistory from './pages/InventoryHistory';
import POS from './pages/POS';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/inventory/:variantId/history" element={<InventoryHistory />} />
              
              <Route path="/customers" element={<div>Customers Page</div>} />
              <Route path="/orders" element={<div>Orders Page</div>} />
              
              {/* Admin Only Routes */}
              <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                <Route path="/products/new" element={<ProductForm />} />
                <Route path="/inventory/history" element={<InventoryHistory />} />
                <Route path="/users" element={<Users />} />
                <Route path="/settings" element={<div>Settings Page</div>} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
