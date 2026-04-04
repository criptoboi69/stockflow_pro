import React, { lazy, Suspense } from "react";
import { Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";

const NotFound = lazy(() => import("pages/NotFound"));
const Settings = lazy(() => import("./pages/settings"));
const StockMovements = lazy(() => import("./pages/stock-movements"));
const DataManagement = lazy(() => import("./pages/data-management"));
const LoginPage = lazy(() => import("./pages/login"));
const Products = lazy(() => import("./pages/products"));
const ProductPhotoUpload = lazy(() => import("./pages/product-photo-upload"));
const AdminConsole = lazy(() => import("./pages/admin-console"));
const CompanyDetail = lazy(() => import("./pages/admin-console/company-detail"));
const AdminCompanies = lazy(() => import("./pages/admin-console/companies"));
const AdminOperations = lazy(() => import("./pages/admin-console/operations"));
const AdminDataQuality = lazy(() => import("./pages/admin-console/data-quality"));
const AdminActivity = lazy(() => import("./pages/admin-console/activity"));
const QRScanner = lazy(() => import("./pages/qr-scanner"));
const UserManagement = lazy(() => import("./pages/user-management"));
const Dashboard = lazy(() => import("./pages/dashboard"));
const CategoriesPage = lazy(() => import("./pages/categories"));
const LocationsPage = lazy(() => import("./pages/locations"));
const ForgotPasswordPage = lazy(() => import("./pages/forgot-password"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const ResetPasswordPage = lazy(() => import("./pages/reset-password"));

const AppLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <p className="text-sm text-text-muted">Chargement...</p>
  </div>
);

const Routes = () => {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<AppLoadingFallback />}>
        <RouterRoutes>
            {/* Define your route here */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/stock-movements" element={<ProtectedRoute><StockMovements /></ProtectedRoute>} />
            <Route path="/data-management" element={<ProtectedRoute roles={["super_admin", "administrator"]}><DataManagement /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/products/photo-upload" element={<ProtectedRoute><ProductPhotoUpload /></ProtectedRoute>} />
            <Route path="/qr-scanner" element={<ProtectedRoute><QRScanner /></ProtectedRoute>} />
            <Route path="/user-management" element={<ProtectedRoute roles={["super_admin", "administrator"]}><UserManagement /></ProtectedRoute>} />
            <Route path="/admin-console" element={<ProtectedRoute roles={["super_admin"]}><AdminConsole /></ProtectedRoute>} />
            <Route path="/admin-console/company/:companyId" element={<ProtectedRoute roles={["super_admin"]}><CompanyDetail /></ProtectedRoute>} />
            <Route path="/admin-console/companies" element={<ProtectedRoute roles={["super_admin"]}><AdminCompanies /></ProtectedRoute>} />
            <Route path="/admin-console/operations" element={<ProtectedRoute roles={["super_admin"]}><AdminOperations /></ProtectedRoute>} />
            <Route path="/admin-console/data-quality" element={<ProtectedRoute roles={["super_admin"]}><AdminDataQuality /></ProtectedRoute>} />
            <Route path="/admin-console/activity" element={<ProtectedRoute roles={["super_admin"]}><AdminActivity /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
            <Route path="/locations" element={<ProtectedRoute><LocationsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </Suspense>
      </ErrorBoundary>
  );
};

export default Routes;
