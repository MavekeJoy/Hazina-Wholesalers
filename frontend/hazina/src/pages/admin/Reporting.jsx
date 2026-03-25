import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { auth } from "../../firebase";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Reporting() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  const getToken = async () => await auth.currentUser.getIdToken();

  const fetchReports = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setReportData(data);
    } catch (err) {
      console.error("Failed to fetch reports:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  // ── AI Insights ───────────────────────────────────────────────────────────

  const handleGetAIInsights = async () => {
    if (!reportData) return;
    setAiLoading(true);
    setAiInsights("");
    setAiError("");

    try {
      const summary = {
        kpis: reportData.kpis,
        topProducts: reportData.topProducts.slice(0, 5),
        revenue: reportData.revenue,
        orderStatus: reportData.orderStatus,
        supplierSpend: reportData.supplierSpend,
        delivery: reportData.delivery,
        lowStockItems: reportData.inventory
          .filter((p) => p.status === "Low Stock" || p.status === "Out of Stock")
          .slice(0, 10),
      };

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are a business analyst for Hazina, a wholesale distribution company in Kenya.
              
Analyze this real business data and provide:
1. 3-4 KEY INSIGHTS about current business performance
2. 3-4 ACTIONABLE RECOMMENDATIONS the management should act on
3. A brief DEMAND FORECAST for the next 30 days based on trends

Keep it concise, specific and practical. Use Ksh for currency. Format with clear sections using ** for headers.

Business Data:
${JSON.stringify(summary, null, 2)}`,
            },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "AI request failed");

      const text = data.content?.[0]?.text || "";
      setAiInsights(text);
    } catch (err) {
      setAiError("Failed to get AI insights: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // ── Chart colors ──────────────────────────────────────────────────────────

  const COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

  const statusColors = {
    Pending:   "#f59e0b",
    Confirmed: "#3b82f6",
    Shipped:   "#8b5cf6",
    Delivered: "#16a34a",
    Cancelled: "#ef4444",
  };

  const sections = ["overview", "revenue", "products", "inventory", "suppliers", "delivery"];

  if (loading) {
    return (
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">📊</p>
            <p className="text-gray-500 text-lg">Loading report data...</p>
          </div>
        </div>
      </div>
    );
  }

  const kpis = reportData?.kpis || {};
  const deliveryRate = kpis.total_dispatches > 0
    ? ((kpis.deliveries_completed / kpis.total_dispatches) * 100).toFixed(1)
    : 0;

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Reports & Analytics</h1>
              <p className="text-green-100 mt-2">
                Real-time business intelligence from your data
              </p>
            </div>
            <button
              onClick={handleGetAIInsights}
              disabled={aiLoading}
              className="bg-white text-green-700 hover:bg-green-50 px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 disabled:opacity-60"
            >
              {aiLoading ? (
                <><span className="animate-spin">⏳</span> Analysing...</>
              ) : (
                <><span>🤖</span> Get AI Insights</>
              )}
            </button>
          </div>
        </div>

        <div className="p-8">

          {/* AI Insights Panel */}
          {(aiInsights || aiError || aiLoading) && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-8 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🤖</span> AI Analysis — Hazina Business Intelligence
              </h2>
              {aiLoading && (
                <div className="text-gray-500 animate-pulse">
                  Analysing your business data...
                </div>
              )}
              {aiError && (
                <div className="text-red-600 text-sm">{aiError}</div>
              )}
              {aiInsights && (
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {aiInsights.split("\n").map((line, i) => {
                    if (line.startsWith("**") && line.endsWith("**")) {
                      return (
                        <p key={i} className="font-bold text-gray-900 mt-4 mb-1">
                          {line.replace(/\*\*/g, "")}
                        </p>
                      );
                    }
                    return <p key={i} className="mb-1">{line}</p>;
                  })}
                </div>
              )}
            </div>
          )}

          {/* Section Nav */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={`px-5 py-2 rounded-lg font-semibold capitalize transition ${
                  activeSection === s
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {activeSection === "overview" && (
            <>
              <div className="grid grid-cols-4 gap-6 mb-8">
                <KPICard label="Total Revenue"       value={`Ksh ${Number(kpis.total_revenue || 0).toLocaleString()}`} icon="💰" color="border-green-500" />
                <KPICard label="Total Orders"        value={kpis.total_orders || 0}          icon="📋" color="border-blue-500" />
                <KPICard label="Pending Orders"      value={kpis.pending_orders || 0}         icon="⏳" color="border-yellow-500" />
                <KPICard label="Delivery Success"    value={`${deliveryRate}%`}               icon="🚚" color="border-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <KPICard label="Out of Stock Items"  value={kpis.out_of_stock || 0}           icon="❌" color="border-red-500" />
                <KPICard label="Low Stock Items"     value={kpis.low_stock || 0}              icon="⚠️" color="border-orange-500" />
              </div>

              {/* Order Status Pie */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status Breakdown</h3>
                  {reportData?.orderStatus?.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={reportData.orderStatus} dataKey="count" nameKey="status"
                            cx="50%" cy="50%" outerRadius={90} label={({ status, count }) => `${status}: ${count}`}>
                            {reportData.orderStatus.map((entry, i) => (
                              <Cell key={i} fill={statusColors[entry.status] || COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </>
                  ) : (
                    <p className="text-center text-gray-400 py-12">No order data yet</p>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Products by Revenue</h3>
                  {reportData?.topProducts?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={reportData.topProducts.slice(0, 5)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => `Ksh ${Number(v).toLocaleString()}`} />
                        <Bar dataKey="total_revenue" fill="#16a34a" radius={[0, 4, 4, 0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-400 py-12">No product sales data yet</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── REVENUE ── */}
          {activeSection === "revenue" && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Revenue Over Time (Last 6 Months)</h3>
              {reportData?.revenue?.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={reportData.revenue}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v) => `Ksh ${Number(v).toLocaleString()}`} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#16a34a" fillOpacity={1}
                      fill="url(#colorRevenue)" name="Revenue (Ksh)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16">
                  <p className="text-gray-400 text-lg">No revenue data yet</p>
                  <p className="text-gray-400 text-sm mt-2">Revenue will appear here as orders are placed and completed</p>
                </div>
              )}

              {/* Revenue table */}
              {reportData?.revenue?.length > 0 && (
                <div className="mt-8 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Month", "Orders", "Revenue"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.revenue.map((row, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-4 py-3 font-semibold text-gray-900">{row.month}</td>
                          <td className="px-4 py-3 text-gray-600">{row.order_count}</td>
                          <td className="px-4 py-3 font-semibold text-green-700">
                            Ksh {Number(row.revenue).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {activeSection === "products" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Top Selling Products</h3>
                {reportData?.topProducts?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-green-600 text-white">
                        <tr>
                          {["#", "Product", "Units Sold", "Revenue"].map((h) => (
                            <th key={h} className="px-6 py-4 text-left font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.topProducts.map((p, i) => (
                          <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-6 py-4 font-bold text-gray-400">{i + 1}</td>
                            <td className="px-6 py-4 font-semibold text-gray-900">{p.name}</td>
                            <td className="px-6 py-4 text-gray-600">{p.total_units}</td>
                            <td className="px-6 py-4 font-semibold text-green-700">
                              Ksh {Number(p.total_revenue).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-12">No product sales data yet</p>
                )}
              </div>
            </div>
          )}

          {/* ── INVENTORY ── */}
          {activeSection === "inventory" && (
            <div className="space-y-6">
              {/* Stock alerts */}
              {reportData?.inventory?.filter((p) => p.status !== "In Stock").length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-red-800 mb-4">⚠️ Stock Alerts</h3>
                  <div className="space-y-3">
                    {reportData.inventory
                      .filter((p) => p.status !== "In Stock")
                      .map((p, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-4 rounded-lg">
                          <div>
                            <p className="font-semibold text-gray-900">{p.name}</p>
                            <p className="text-sm text-gray-500">{p.category} — {p.supplier}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              p.status === "Out of Stock"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {p.status}
                            </span>
                            <p className="text-sm text-gray-500 mt-1">Qty: {p.quantity} / Min: {p.min_stock}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-md p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Full Inventory Status</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-green-600 text-white">
                      <tr>
                        {["Product", "SKU", "Category", "Qty", "Min Stock", "Price", "Value", "Status"].map((h) => (
                          <th key={h} className="px-4 py-4 text-left font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(reportData?.inventory || []).map((p, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-900">{p.name}</td>
                          <td className="px-4 py-3 text-gray-500 font-mono text-sm">{p.sku}</td>
                          <td className="px-4 py-3 text-gray-600">{p.category || "—"}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{p.quantity}</td>
                          <td className="px-4 py-3 text-gray-500">{p.min_stock}</td>
                          <td className="px-4 py-3 text-green-700 font-semibold">
                            Ksh {Number(p.price).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-semibold">
                            Ksh {(p.quantity * p.price).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              p.status === "In Stock"     ? "bg-green-100 text-green-800" :
                              p.status === "Low Stock"    ? "bg-yellow-100 text-yellow-800" :
                                                            "bg-red-100 text-red-800"
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SUPPLIERS ── */}
          {activeSection === "suppliers" && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Supplier Spending</h3>
              {reportData?.supplierSpend?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.supplierSpend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="supplier_name" />
                      <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v) => `Ksh ${Number(v).toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="total_spent" fill="#3b82f6" name="Total Spent" radius={[4,4,0,0]} />
                      <Bar dataKey="received_value" fill="#16a34a" name="Received" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-8 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {["Supplier", "Orders", "Total Spent", "Received Value"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.supplierSpend.map((s, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-4 py-3 font-semibold text-gray-900">{s.supplier_name}</td>
                            <td className="px-4 py-3 text-gray-600">{s.order_count}</td>
                            <td className="px-4 py-3 font-semibold text-blue-700">
                              Ksh {Number(s.total_spent).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 font-semibold text-green-700">
                              Ksh {Number(s.received_value).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-400 py-12">No purchase data yet</p>
              )}
            </div>
          )}

          {/* ── DELIVERY ── */}
          {activeSection === "delivery" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <KPICard label="Total Dispatches"    value={kpis.total_dispatches || 0}       icon="📦" color="border-blue-500" />
                <KPICard label="Delivered"           value={kpis.deliveries_completed || 0}   icon="✅" color="border-green-500" />
                <KPICard label="Success Rate"        value={`${deliveryRate}%`}               icon="🎯" color="border-purple-500" />
              </div>

              <div className="bg-white rounded-xl shadow-md p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Delivery Status Breakdown</h3>
                {reportData?.delivery?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.delivery}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#16a34a" radius={[4,4,0,0]} name="Deliveries" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-400 py-12">No delivery data yet</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, icon, color }) {
  return (
    <div className={`bg-white border-l-4 ${color} p-6 rounded-lg shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}

export default Reporting;