import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { auth } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import {
  LineChart, Line, PieChart, Pie, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function AdminDashboard() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Live stats from backend
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    outOfStock: 0,
    totalValue: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getToken = async () => await auth.currentUser.getIdToken();

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch in parallel
      const [inventoryRes, ordersRes] = await Promise.all([
        fetch(`${API}/api/inventory`, { headers }),
        fetch(`${API}/api/orders`, { headers }),
      ]);

      const inventory = await inventoryRes.json();
      const orders    = await ordersRes.json();

      // Calculate stats
      const totalProducts = Array.isArray(inventory) ? inventory.length : 0;
      const outOfStock    = Array.isArray(inventory)
        ? inventory.filter((p) => p.status === "Out of Stock").length
        : 0;
      const totalValue    = Array.isArray(inventory)
        ? inventory.reduce((sum, p) => sum + p.quantity * p.price, 0)
        : 0;

      const totalOrders   = Array.isArray(orders) ? orders.length : 0;
      const pendingOrders = Array.isArray(orders)
        ? orders.filter((o) => o.status === "Pending").length
        : 0;

      setStats({ totalProducts, totalOrders, pendingOrders, outOfStock, totalValue });

      // Recent 5 orders
      setRecentOrders(Array.isArray(orders) ? orders.slice(0, 5) : []);

      // Top products by value
      const sorted = Array.isArray(inventory)
        ? [...inventory]
            .sort((a, b) => b.quantity * b.price - a.quantity * a.price)
            .slice(0, 5)
        : [];
      setTopProducts(sorted);

    } catch (err) {
      console.error("Dashboard fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Poll every 30 seconds for new orders
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Chart data
  const inventoryStatusData = [
    { name: "In Stock",     value: stats.totalProducts - stats.outOfStock, fill: "#16a34a" },
    { name: "Out of Stock", value: stats.outOfStock,                        fill: "#e5e7eb" },
  ];

  const statusColors = {
    Pending:   "bg-yellow-100 text-yellow-800",
    Confirmed: "bg-blue-100 text-blue-800",
    Shipped:   "bg-purple-100 text-purple-800",
    Delivered: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-green-100 mt-1">
                Welcome back, {userProfile?.name || "Admin"}! 👋
              </p>
            </div>
            <div className="flex items-center gap-6">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              {/* Notification bell with pending orders badge */}
              <button
                onClick={() => navigate("/admin/orders")}
                className="relative w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-400 transition"
              >
                🔔
                {stats.pendingOrders > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {stats.pendingOrders > 9 ? "9+" : stats.pendingOrders}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8">

          {/* Overview Cards */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Overview</h2>
            <div className="grid grid-cols-4 gap-6">
              <OverviewCard
                title="Total Products"
                value={loading ? "..." : stats.totalProducts.toLocaleString()}
                icon="📦"
                bgColor="bg-green-50"
                borderColor="border-green-500"
              />
              <OverviewCard
                title="Total Orders"
                value={loading ? "..." : stats.totalOrders.toLocaleString()}
                icon="📋"
                bgColor="bg-blue-50"
                borderColor="border-blue-500"
                onClick={() => navigate("/admin/orders")}
              />
              <OverviewCard
                title="Pending Orders"
                value={loading ? "..." : stats.pendingOrders.toLocaleString()}
                icon="⏳"
                bgColor="bg-yellow-50"
                borderColor="border-yellow-500"
                badge={stats.pendingOrders > 0}
                onClick={() => navigate("/admin/orders")}
              />
              <OverviewCard
                title="Out of Stock"
                value={loading ? "..." : stats.outOfStock.toLocaleString()}
                icon="⚠️"
                bgColor="bg-red-50"
                borderColor="border-red-500"
                onClick={() => navigate("/admin/inventory")}
              />
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Inventory Value */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Inventory Value
              </h3>
              <div className="text-center">
                <p className="text-4xl font-bold text-green-700">
                  Ksh {loading ? "..." : `${(stats.totalValue / 1000).toFixed(0)}K`}
                </p>
                <p className="text-gray-500 mt-2">Total stock value</p>
              </div>
            </div>

            {/* Inventory Status Donut */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Stock Status
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={inventoryStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {inventoryStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 justify-center mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-600 rounded-full" />
                  <span>In Stock</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-300 rounded-full" />
                  <span>Out of Stock</span>
                </div>
              </div>
            </div>

            {/* Order Stats */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Order Summary
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Pending",   color: "bg-yellow-400" },
                  { label: "Confirmed", color: "bg-blue-400" },
                  { label: "Shipped",   color: "bg-purple-400" },
                  { label: "Delivered", color: "bg-green-500" },
                ].map((s) => {
                  const count = recentOrders.filter((o) => o.status === s.label).length;
                  return (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${s.color}`} />
                        <span className="text-sm text-gray-600">{s.label}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Recent Orders
              </h3>
              <button
                onClick={() => navigate("/admin/orders")}
                className="text-green-600 hover:text-green-700 font-semibold text-sm"
              >
                View all →
              </button>
            </div>

            {loading ? (
              <p className="text-center text-gray-500 py-8">Loading...</p>
            ) : recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Order #", "Customer", "Items", "Total", "Status", "Date"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-sm font-semibold text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => navigate("/admin/orders")}
                        className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition"
                      >
                        <td className="px-4 py-3 font-semibold text-green-700">{order.order_number}</td>
                        <td className="px-4 py-3 text-gray-900">{order.customer}</td>
                        <td className="px-4 py-3 text-gray-600">{order.products?.length || 0} items</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Ksh {Number(order.total).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No orders yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Orders from retail buyers will appear here
                </p>
              </div>
            )}
          </div>

          {/* Top Products by Value */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Top Products by Value</h3>
              <button
                onClick={() => navigate("/admin/inventory")}
                className="text-green-600 hover:text-green-700 font-semibold text-sm"
              >
                View all →
              </button>
            </div>
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product, idx) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm font-semibold w-5">{idx + 1}</span>
                      <span className="text-gray-900 font-medium">{product.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              (product.quantity * product.price) /
                              (topProducts[0].quantity * topProducts[0].price) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-24 text-right">
                        Ksh {(product.quantity * product.price / 1000).toFixed(0)}K
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No products in inventory yet</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function OverviewCard({ title, value, icon, bgColor, borderColor, badge, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`${bgColor} border-l-4 ${borderColor} p-6 rounded-lg shadow relative ${
        onClick ? "cursor-pointer hover:shadow-md transition" : ""
      }`}
    >
      {badge && (
        <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}

export default AdminDashboard;