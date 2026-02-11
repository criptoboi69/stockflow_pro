import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";

const NotFound = lazy(() => import("pages/NotFound"));
const Settings = lazy(() => import("./pages/settings"));
const StockMovements = lazy(() => import("./pages/stock-movements"));
const DataManagement = lazy(() => import("./pages/data-management"));
const LoginPage = lazy(() => import("./pages/login"));
const Products = lazy(() => import("./pages/products"));
const QRScanner = lazy(() => import("./pages/qr-scanner"));
const UserManagement = lazy(() => import("./pages/user-management"));
const Dashboard = lazy(() => import("./pages/dashboard"));
const CategoriesPage = lazy(() => import("./pages/categories"));
const LocationsPage = lazy(() => import("./pages/locations"));
const ForgotPasswordPage = lazy(() => import("./pages/forgot-password"));
const ResetPasswordPage = lazy(() => import("./pages/reset-password"));
const AuditTrail = lazy(() => import("./pages/audit-trail"));

const AppLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <p className="text-sm text-text-muted">Chargement...</p>
  </div>
);

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <Suspense fallback={<AppLoadingFallback />}>
          <RouterRoutes>
            {/* Define your route here */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/settings" element={<ProtectedRoute roles={["super_admin", "administrator"]}><Settings /></ProtectedRoute>} />
            <Route path="/stock-movements" element={<ProtectedRoute><StockMovements /></ProtectedRoute>} />
            <Route path="/data-management" element={<ProtectedRoute roles={["super_admin", "administrator", "manager"]}><DataManagement /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/qr-scanner" element={<ProtectedRoute><QRScanner /></ProtectedRoute>} />
            <Route path="/user-management" element={<ProtectedRoute roles={["super_admin", "administrator"]}><UserManagement /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
            <Route path="/locations" element={<ProtectedRoute><LocationsPage /></ProtectedRoute>} />
            <Route path="/audit-trail" element={<ProtectedRoute roles={["super_admin", "administrator"]}><AuditTrail /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
