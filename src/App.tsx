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
import './App.css';

function App() {
  const erpNextUrl = localStorage.getItem('erpnext-url');
  const isAuthenticated = authService.isAuthenticated();
  const selectedProfile = localStorage.getItem('erpnext-pos-profile');

  // Render setup and authentication pages if not fully configured
  if (!erpNextUrl) return <SetupPage />;
  if (!isAuthenticated) return <LoginPage />;
  if (!selectedProfile) return <PosProfileSelectionPage />;

  // Once authenticated, render the main application with its routes
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* The default page will be the product catalog */}
        <Route path="/" element={<CatalogPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Route>
    </Routes>
  );
}

export default App;
