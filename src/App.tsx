import { Routes, Route } from 'react-router-dom';
import { SetupPage } from './pages/SetupPage';
import { LoginPage } from './pages/LoginPage';
import { PosProfileSelectionPage } from './pages/PosProfileSelectionPage';
import { authService } from './services/authService';
import { AppLayout } from './components/AppLayout';
import { CatalogPage } from './pages/CatalogPage';
import { CartPage } from './pages/CartPage';
import { SettingsPage } from './pages/SettingsPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { SelectCustomerPage } from './pages/SelectCustomerPage';
import { OrdersPage } from './pages/OrdersPage';
import { PaymentPage } from './pages/PaymentPage';
import './App.css';

function App() {
  const erpNextUrl = localStorage.getItem('erpnext-url');
  const isAuthenticated = authService.isAuthenticated();
  const selectedProfile = localStorage.getItem('erpnext-pos-profile');

  if (!erpNextUrl) return <SetupPage />;
  if (!isAuthenticated) return <LoginPage />;
  if (!selectedProfile) return <PosProfileSelectionPage />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/select-customer" element={<SelectCustomerPage />} />
        <Route path="/payment/:orderId" element={<PaymentPage />} />
      </Route>
    </Routes>
  );
}

export default App;
