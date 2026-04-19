import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import { AuthPage } from "../pages/AuthPage.jsx";

const Layout = lazy(() => import("../components/Layout.jsx"));
const CustomerHomePage = lazy(() => import("../pages/CustomerHomePage.jsx"));
const VendorProfilePage = lazy(() => import("../pages/VendorProfilePage.jsx"));
const VendorDashboardPage = lazy(() => import("../pages/VendorDashboardPage.jsx"));

function RequireAuth({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/auth" replace />;
  return children;
}

function RoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role === "vendor") return <Navigate to="/vendor/dashboard" replace />;
  return <Navigate to="/vendors" replace />;
}

export function App() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: 24 }}>Loading…</div>}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<RoleHome />} />
          <Route path="vendors" element={<CustomerHomePage />} />
          <Route path="vendor/:id" element={<VendorProfilePage />} />
          <Route path="vendor/dashboard" element={<VendorDashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

