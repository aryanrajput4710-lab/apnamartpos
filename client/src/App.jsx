import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, RoleRoute } from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

// Eagerly loaded for better UX on initial landing
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';

// Lazy loaded routes
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Users = React.lazy(() => import('./pages/Users'));
const Products = React.lazy(() => import('./pages/Products'));
const ProductForm = React.lazy(() => import('./pages/ProductForm'));
const EditProduct = React.lazy(() => import('./pages/EditProduct'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const InventoryHistory = React.lazy(() => import('./pages/InventoryHistory'));
const POS = React.lazy(() => import('./pages/POS'));
const ReceiptView = React.lazy(() => import('./pages/ReceiptView'));
const Customers = React.lazy(() => import('./pages/Customers'));
const CustomerDetail = React.lazy(() => import('./pages/CustomerDetail'));
const Orders = React.lazy(() => import('./pages/Orders'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs'));

// Loading fallback UI
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '50vh' }}>
    <div style={{ padding: '1rem', color: '#6b7280' }}>Loading...</div>
  </div>
);

const RootRedirect = () => {
  const { currentUser } = useAuth();
  if (currentUser?.role === 'ADMIN') {
    return <Dashboard />;
  }
  return <Navigate to="/pos" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/receipt/:id" element={<ReceiptView />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:id" element={<CustomerDetail />} />
                <Route path="/orders" element={<Orders />} />
                
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/products/:id/edit" element={<EditProduct />} />
                
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/inventory/:variantId/history" element={<InventoryHistory />} />
                
                {/* Admin Only Routes */}
                <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/products/new" element={<ProductForm />} />
                  <Route path="/inventory/history" element={<InventoryHistory />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
