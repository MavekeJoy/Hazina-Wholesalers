import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, logout } = useAuth();

  const menuItems = [
    { id: "dashboard",  label: "Dashboard",      icon: "📊", path: "/admin/dashboard" },
    { id: "users",      label: "Users",           icon: "👤", path: "/admin/users" },
    { id: "inventory",  label: "Inventory",       icon: "📦", path: "/admin/inventory" },
    { id: "orders",     label: "Orders",          icon: "📋", path: "/admin/orders" },
    { id: "purchases",  label: "Purchases",       icon: "🛍️", path: "/admin/purchases" },
    { id: "suppliers",  label: "Suppliers",       icon: "🤝", path: "/admin/suppliers" },
    { id: "dispatch",   label: "Dispatch",        icon: "🚚", path: "/admin/dispatch" },
    { id: "reporting",  label: "Reporting (AI)",  icon: "📈", path: "/admin/reporting" },
    { id: "audit",      label: "Audit Logs",      icon: "🔍", path: "/admin/audit-logs" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="w-64 bg-green-800 text-white min-h-screen p-6 flex flex-col">
      {/* Logo & Profile */}
      <div className="flex flex-col items-center mb-8 pb-6 border-b border-green-700">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-3 text-2xl">
          👤
        </div>
        <h3 className="text-lg font-semibold">
          {userProfile?.name || "Admin User"}
        </h3>
        <p className="text-green-200 text-sm">
          {userProfile?.email || ""}
        </p>
        <span className="mt-2 text-xs bg-green-700 text-green-100 px-3 py-1 rounded-full">
          {userProfile?.role || ""}
        </span>
      </div>

      {/* Menu Items */}
      <nav className="flex-grow space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              location.pathname === item.path
                ? "bg-green-600 text-white"
                : "text-green-100 hover:bg-green-700"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-green-100 hover:bg-red-700 transition border-t border-green-700 mt-8 pt-6"
      >
        <span className="text-xl">🚪</span>
        <span className="font-medium">Logout</span>
      </button>
    </div>
  );
}

export default Sidebar;