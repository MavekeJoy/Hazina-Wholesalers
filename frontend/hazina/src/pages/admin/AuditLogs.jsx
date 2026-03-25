import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { auth } from "../../firebase";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filterModule, setFilterModule] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterSeverity, setFilterSeverity] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  const modules = [
    "All", "Authentication", "User Management", "Inventory",
    "Orders", "Purchases", "Dispatch", "Reporting", "System",
  ];
  const statuses   = ["All", "Success", "Failed"];
  const severities = ["All", "Low", "Medium", "High"];

  const moduleColors = {
    Authentication:   "bg-red-100 text-red-800",
    "User Management":"bg-pink-100 text-pink-800",
    Inventory:        "bg-blue-100 text-blue-800",
    Orders:           "bg-green-100 text-green-800",
    Purchases:        "bg-purple-100 text-purple-800",
    Dispatch:         "bg-orange-100 text-orange-800",
    Reporting:        "bg-indigo-100 text-indigo-800",
    System:           "bg-gray-100 text-gray-800",
  };

  const severityColors = {
    Low:    "text-green-600",
    Medium: "text-yellow-600",
    High:   "text-red-600",
  };

  const getToken = async () => await auth.currentUser.getIdToken();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLogs = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/reports/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setLogs(data);
    } catch (err) {
      showToast("Failed to load audit logs: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Refresh every 60 seconds
    const interval = setInterval(fetchLogs, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesModule   = filterModule   === "All" || log.module   === filterModule;
    const matchesStatus   = filterStatus   === "All" || log.status   === filterStatus;
    const matchesSeverity = filterSeverity === "All" || log.severity === filterSeverity;
    const matchesSearch   =
      (log.user_name   || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.action      || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesStatus && matchesSeverity && matchesSearch;
  });

  const stats = {
    total:       logs.length,
    success:     logs.filter((l) => l.status === "Success").length,
    failed:      logs.filter((l) => l.status === "Failed").length,
    highSeverity:logs.filter((l) => l.severity === "High").length,
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg text-white font-semibold text-sm ${
            toast.type === "error" ? "bg-red-500" : "bg-green-600"
          }`}>
            {toast.type === "error" ? "⚠️" : "✅"} {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Audit Logs</h1>
              <p className="text-green-100 mt-2">
                Real-time system activity, user actions and security events
              </p>
            </div>
            <button
              onClick={fetchLogs}
              className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <span>🔄</span> Refresh
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Logs"    value={stats.total}        icon="📋" color="bg-blue-500" />
            <StatCard label="Success"       value={stats.success}      icon="✅" color="bg-green-500" />
            <StatCard label="Failed"        value={stats.failed}       icon="❌" color="bg-red-500" />
            <StatCard label="High Severity" value={stats.highSeverity} icon="⚠️" color="bg-orange-500" />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Search by user, action or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Module</label>
                  <select
                    value={filterModule}
                    onChange={(e) => setFilterModule(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {modules.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Severity</label>
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {severities.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-600 text-white">
                  <tr>
                    {["Timestamp", "User", "Action", "Module", "Status", "Severity", "IP", "Details"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">Loading audit logs...</td></tr>
                  ) : filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-gray-900 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{log.user_name || "System"}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{log.action}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${moduleColors[log.module] || "bg-gray-100 text-gray-800"}`}>
                            {log.module}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`flex items-center gap-1 font-semibold ${
                            log.status === "Success" ? "text-green-600" : "text-red-600"
                          }`}>
                            {log.status === "Success" ? "✅" : "❌"} {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`font-semibold ${severityColors[log.severity]}`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                          {log.ip_address || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-16 text-center">
                        <p className="text-gray-400 text-lg">No audit logs yet</p>
                        <p className="text-gray-400 text-sm mt-2">
                          Actions like creating users, orders and dispatches will appear here automatically
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-6 flex items-center justify-between sticky top-0">
              <div>
                <h2 className="text-2xl font-bold">Audit Log Details</h2>
                <p className="text-green-100">Log #{selectedLog.id}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-2xl hover:bg-green-500 rounded-lg p-2">✕</button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Timestamp</p>
                  <p className="text-gray-900 font-mono text-sm">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">User</p>
                  <p className="text-gray-900 font-semibold">{selectedLog.user_name || "System"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Action</p>
                  <p className="text-gray-900 font-semibold">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Module</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${moduleColors[selectedLog.module] || "bg-gray-100 text-gray-800"}`}>
                    {selectedLog.module}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 font-semibold mb-1">Description</p>
                <p className="text-gray-900">{selectedLog.description}</p>
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedLog.status === "Success"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {selectedLog.status === "Success" ? "✅" : "❌"} {selectedLog.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Severity</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedLog.severity === "High"   ? "bg-red-100 text-red-800" :
                    selectedLog.severity === "Medium" ? "bg-yellow-100 text-yellow-800" :
                                                        "bg-green-100 text-green-800"
                  }`}>
                    {selectedLog.severity}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 font-semibold mb-1">IP Address</p>
                <p className="text-gray-900 font-mono text-sm">{selectedLog.ip_address || "—"}</p>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 font-semibold mb-3">Additional Details</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {Object.entries(selectedLog.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm border-b border-gray-200 pb-2 last:border-0">
                        <span className="text-gray-600 font-semibold capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="text-gray-900 font-semibold">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <button onClick={() => setSelectedLog(null)}
                  className="w-full bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg font-semibold transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-semibold">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${color} text-white rounded-full w-14 h-14 flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;