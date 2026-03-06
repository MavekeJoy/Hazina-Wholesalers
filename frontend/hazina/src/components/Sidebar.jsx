import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", path: "/admin" },
    { id: "inventory", label: "Inventory", icon: "📦", path: "/admin/inventory" },
    { id: "orders", label: "Orders", icon: "📋", path: "/admin/orders" },
    { id: "purchase", label: "Purchase", icon: "🛍️", path: "/admin/purchase" },
    { id: "suppliers", label: "Suppliers", icon: "🤝", path: "/admin/suppliers" },
    { id: "dispatch", label: "Dispatch", icon: "🚚", path: "/admin/dispatch" },
    { id: "reporting", label: "Reporting (AI)", icon: "📈", path: "/admin/reporting" },
    { id: "settings", label: "Settings", icon: "⚙️", path: "/admin/settings" },
  ];

  const handleMenuClick = (item) => {
    setActiveMenu(item.id);
    navigate(item.path);
  };

  return (
    <div className="w-64 bg-green-800 text-white min-h-screen p-6 flex flex-col">
      {/* Logo & Profile */}
      <div className="flex flex-col items-center mb-8 pb-6 border-b border-green-700">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-3 text-2xl">
          👤
        </div>
        <h3 className="text-lg font-semibold">Admin User</h3>
        <p className="text-green-200 text-sm">admin@hazina.com</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-grow space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleMenuClick(item)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeMenu === item.id
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
      <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-green-100 hover:bg-green-700 transition border-t border-green-700 mt-8 pt-6">
        <span className="text-xl">🚪</span>
        <span className="font-medium">Logout</span>
      </button>
    </div>
  );
}

export default Sidebar;