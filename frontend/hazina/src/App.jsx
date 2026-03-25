import { Routes, Route, Navigate } from "react-router-dom";

// Public - Customer facing
import Landing from "./pages/Landing";
import Products from "./pages/Products";
import Checkout from "./pages/Checkout";

// Auth
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import Inventory from "./pages/admin/Inventory";
import Orders from "./pages/admin/Orders";
import Purchases from "./pages/admin/Purchases";
import Suppliers from "./pages/admin/Supplier";
import Dispatch from "./pages/admin/Dispatch";
import Reporting from "./pages/admin/Reporting";
import AuditLogs from "./pages/admin/AuditLogs";
import Users from "./pages/admin/Users";

function App() {
  return (
    <Routes>

      {/* ── PUBLIC ROUTES ── */}
      <Route path="/" element={<Landing />} />
      <Route path="/products" element={<Products />} />
      <Route path="/checkout" element={<Checkout />} />

      {/* ── AUTH ── */}
      <Route path="/login" element={<Login />} />

      {/* ── ADMIN ROUTES ── */}

      {/* Dashboard — all logged-in staff */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Inventory — Admin, Manager, Warehouse Staff */}
      <Route path="/admin/inventory" element={
        <ProtectedRoute allowedRoles={["Administrator", "Manager", "Warehouse Staff"]}>
          <Inventory />
        </ProtectedRoute>
      } />

      {/* Orders — Admin, Manager */}
      <Route path="/admin/orders" element={
        <ProtectedRoute allowedRoles={["Administrator", "Manager"]}>
          <Orders />
        </ProtectedRoute>
      } />

      {/* Purchases — Admin, Manager */}
      <Route path="/admin/purchases" element={
        <ProtectedRoute allowedRoles={["Administrator", "Manager"]}>
          <Purchases />
        </ProtectedRoute>
      } />

      {/* Suppliers — Admin, Manager */}
      <Route path="/admin/suppliers" element={
        <ProtectedRoute allowedRoles={["Administrator", "Manager"]}>
          <Suppliers />
        </ProtectedRoute>
      } />

      {/* Dispatch — Admin, Manager, Delivery Staff */}
      <Route path="/admin/dispatch" element={
        <ProtectedRoute allowedRoles={["Administrator", "Manager", "Delivery Staff"]}>
          <Dispatch />
        </ProtectedRoute>
      } />

      {/* Reporting — Admin, Manager, System Auditor */}
      <Route path="/admin/reporting" element={
        <ProtectedRoute allowedRoles={["Administrator", "Manager", "System Auditor"]}>
          <Reporting />
        </ProtectedRoute>
      } />

      {/* Audit Logs — Admin, Manager, System Auditor */}
      <Route path="/admin/audit-logs" element={
        <ProtectedRoute allowedRoles={["Administrator", "Manager", "System Auditor"]}>
          <AuditLogs />
        </ProtectedRoute>
      } />

      {/* Users — Administrator only */}
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={["Administrator"]}>
          <Users />
        </ProtectedRoute>
      } />

      {/* Catch-all → home */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

export default App;