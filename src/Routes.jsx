import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import Settings from './pages/settings';
import StockMovements from './pages/stock-movements';
import DataManagement from './pages/data-management';
import LoginPage from './pages/login';
import Products from './pages/products';
import QRScanner from './pages/qr-scanner';
import UserManagement from './pages/user-management';
import Dashboard from './pages/dashboard';
import CategoriesPage from './pages/categories';
import LocationsPage from './pages/locations';
import ForgotPasswordPage from './pages/forgot-password';
import ResetPasswordPage from './pages/reset-password';
import AuditTrail from './pages/audit-trail';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/stock-movements" element={<StockMovements />} />
        <Route path="/data-management" element={<DataManagement />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/qr-scanner" element={<QRScanner />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="/audit-trail" element={<AuditTrail />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;