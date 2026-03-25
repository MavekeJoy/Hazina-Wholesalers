import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { auth } from "../../firebase";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Dispatch() {
  const [dispatches, setDispatches]         = useState([]);
  const [officers, setOfficers]             = useState([]);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [showForm, setShowForm]             = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [toast, setToast]                   = useState(null);
  const [activeTab, setActiveTab]           = useState("deliveries");
  const [filterStatus, setFilterStatus]     = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [searchQuery, setSearchQuery]       = useState("");

  const [formData, setFormData] = useState({
    order_id:            "",
    customer_name:       "",
    customer_phone:      "",
    delivery_address:    "",
    amount:              "",
    delivery_officer_id: "",
    priority:            "Normal",
    estimated_delivery:  "",
    distance:            "",
  });

  const statuses   = ["All", "Pending", "Assigned", "In Transit", "Delivered", "Failed"];
  const priorities = ["All", "Low", "Normal", "High", "Urgent"];

  const statusColors = {
    Pending:     "bg-gray-100 text-gray-800 border-gray-400",
    Assigned:    "bg-blue-100 text-blue-800 border-blue-400",
    "In Transit":"bg-purple-100 text-purple-800 border-purple-400",
    Delivered:   "bg-green-100 text-green-800 border-green-400",
    Failed:      "bg-red-100 text-red-800 border-red-400",
  };

  const statusIcons = {
    Pending: "⏳", Assigned: "✓", "In Transit": "🚚", Delivered: "✅", Failed: "❌",
  };

  const priorityColors = {
    Low: "bg-blue-100 text-blue-800", Normal: "bg-gray-100 text-gray-800",
    High: "bg-orange-100 text-orange-800", Urgent: "bg-red-100 text-red-800",
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getToken = async () => await auth.currentUser.getIdToken();

  // ── API calls ─────────────────────────────────────────────────────────────

  const fetchAll = async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [dispatchRes, officersRes, ordersRes] = await Promise.all([
        fetch(`${API}/api/dispatch`, { headers }),
        fetch(`${API}/api/dispatch/officers`, { headers }),
        fetch(`${API}/api/dispatch/confirmed-orders`, { headers }),
      ]);

      const [dispatchData, officersData, ordersData] = await Promise.all([
        dispatchRes.json(),
        officersRes.json(),
        ordersRes.json(),
      ]);

      setDispatches(Array.isArray(dispatchData) ? dispatchData : []);
      setOfficers(Array.isArray(officersData) ? officersData : []);
      setConfirmedOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      showToast("Failed to load data: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // When admin selects an order — auto-fill customer details
  const handleOrderSelect = (e) => {
    const orderId = e.target.value;
    if (!orderId) {
      setFormData((prev) => ({
        ...prev,
        order_id: "", customer_name: "", customer_phone: "",
        delivery_address: "", amount: "",
      }));
      return;
    }

    const order = confirmedOrders.find((o) => String(o.id) === String(orderId));
    if (order) {
      setFormData((prev) => ({
        ...prev,
        order_id:         order.id,
        customer_name:    order.customer,
        customer_phone:   order.phone || "",
        delivery_address: order.delivery_address || "",
        amount:           order.total,
      }));
    }
  };

  const handleCreateDispatch = async () => {
    if (!formData.customer_name) {
      showToast("Please select an order or enter a customer name.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/dispatch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await fetchAll();
      setShowForm(false);
      setFormData({
        order_id: "", customer_name: "", customer_phone: "",
        delivery_address: "", amount: "", delivery_officer_id: "",
        priority: "Normal", estimated_delivery: "", distance: "",
      });
      showToast("Dispatch created successfully. Order status updated to Shipped.");
    } catch (err) {
      showToast("Failed to create dispatch: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/dispatch/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await fetchAll();
      if (selectedDispatch?.id === id) {
        setSelectedDispatch((prev) => ({ ...prev, status }));
      }

      const msg = status === "Delivered"
        ? "Delivery confirmed! Order marked as Delivered."
        : `Status updated to ${status}.`;
      showToast(msg);
    } catch (err) {
      showToast("Failed to update status: " + err.message, "error");
    }
  };

  const handleVerifyBiometric = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/dispatch/${id}/biometric`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchAll();
      if (selectedDispatch?.id === id) {
        setSelectedDispatch((prev) => ({ ...prev, biometric_status: true }));
      }
      showToast("Biometric verification confirmed.");
    } catch (err) {
      showToast("Failed to verify biometric: " + err.message, "error");
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const filteredDispatches = dispatches.filter((d) => {
    const matchesStatus   = filterStatus   === "All" || d.status   === filterStatus;
    const matchesPriority = filterPriority === "All" || d.priority === filterPriority;
    const matchesSearch   =
      (d.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(d.id).includes(searchQuery);
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const stats = {
    total:     dispatches.length,
    pending:   dispatches.filter((d) => d.status === "Pending").length,
    inTransit: dispatches.filter((d) => d.status === "In Transit").length,
    delivered: dispatches.filter((d) => d.status === "Delivered").length,
    failed:    dispatches.filter((d) => d.status === "Failed").length,
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
              <h1 className="text-3xl font-bold">Dispatch & Delivery</h1>
              <p className="text-green-100 mt-2">
                Manage deliveries, officers, and track delivery status
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <span>➕</span> New Dispatch
            </button>
          </div>
        </div>

        <div className="p-8">

          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            {["deliveries", "officers"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold rounded-lg border-2 transition capitalize ${
                  activeTab === tab
                    ? "bg-white text-green-700 border-green-700"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {tab === "deliveries" ? "📦 Deliveries" : "🚗 Delivery Officers"}
              </button>
            ))}
          </div>

          {/* New Dispatch Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-green-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Dispatch</h2>

              {/* Order Selection */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Link to Confirmed Order
                  {confirmedOrders.length === 0 && (
                    <span className="text-yellow-600 text-sm font-normal ml-2">
                      (No confirmed orders — confirm an order first in Orders page)
                    </span>
                  )}
                </label>
                <select
                  name="order_id"
                  value={formData.order_id}
                  onChange={handleOrderSelect}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">— Select an order (optional) —</option>
                  {confirmedOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} — {o.customer} — Ksh {Number(o.total).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto-filled info box */}
              {formData.order_id && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-xs text-green-700 font-semibold uppercase tracking-wider mb-3">
                    ✅ Auto-filled from order
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Customer:</span>
                      <span className="font-semibold text-gray-900 ml-2">{formData.customer_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Phone:</span>
                      <span className="font-semibold text-gray-900 ml-2">{formData.customer_phone || "—"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Address:</span>
                      <span className="font-semibold text-gray-900 ml-2">{formData.delivery_address || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-semibold text-green-700 ml-2">
                        Ksh {Number(formData.amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-3">
                    Order status will be updated to <strong>Shipped</strong> when this dispatch is created.
                  </p>
                </div>
              )}

              {/* Manual entry if no order selected */}
              {!formData.order_id && (
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Customer Name *</label>
                    <input type="text" name="customer_name" value={formData.customer_name}
                      onChange={handleInputChange} placeholder="e.g., Shoppers Grocery"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Customer Phone</label>
                    <input type="tel" name="customer_phone" value={formData.customer_phone}
                      onChange={handleInputChange} placeholder="e.g., 0700000001"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-700 font-semibold mb-2">Delivery Address</label>
                    <input type="text" name="delivery_address" value={formData.delivery_address}
                      onChange={handleInputChange} placeholder="e.g., 123 Nairobi Street"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Amount (Ksh)</label>
                    <input type="number" name="amount" value={formData.amount}
                      onChange={handleInputChange} placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
              )}

              {/* Officer, Priority, Date, Distance */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Delivery Officer</label>
                  <select name="delivery_officer_id" value={formData.delivery_officer_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select Officer</option>
                    {officers.map((o) => (
                      <option key={o.id} value={o.id}>{o.name} — {o.phone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    {["Low", "Normal", "High", "Urgent"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Est. Delivery Date</label>
                  <input type="datetime-local" name="estimated_delivery" value={formData.estimated_delivery}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Distance</label>
                  <input type="text" name="distance" value={formData.distance}
                    onChange={handleInputChange} placeholder="e.g., 45km"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleCreateDispatch} disabled={submitting}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2">
                  {submitting ? <><span className="animate-spin">⏳</span> Creating...</> : "Create Dispatch"}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* DELIVERIES TAB */}
          {activeTab === "deliveries" && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-5 gap-4 mb-8">
                <StatCard label="Total"      value={stats.total}     icon="📦" color="bg-blue-500" />
                <StatCard label="Pending"    value={stats.pending}   icon="⏳" color="bg-gray-500" />
                <StatCard label="In Transit" value={stats.inTransit} icon="🚚" color="bg-purple-500" />
                <StatCard label="Delivered"  value={stats.delivered} icon="✅" color="bg-green-500" />
                <StatCard label="Failed"     value={stats.failed}    icon="❌" color="bg-red-500" />
              </div>

              {/* Search & Filter */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <input type="text" placeholder="Search by customer name or dispatch ID..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-4" />
                <div className="flex gap-6 flex-wrap">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Status</label>
                    <div className="flex gap-2 flex-wrap">
                      {statuses.map((s) => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                          className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filterStatus === s ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Priority</label>
                    <div className="flex gap-2 flex-wrap">
                      {priorities.map((p) => (
                        <button key={p} onClick={() => setFilterPriority(p)}
                          className={`px-4 py-2 rounded-lg font-semibold transition ${
                            filterPriority === p ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}>{p}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispatches Table */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-green-600 text-white">
                      <tr>
                        {["ID", "Order", "Customer", "Officer", "Amount", "Status", "Priority", "Est. Delivery", "Actions"].map((h) => (
                          <th key={h} className="px-6 py-4 text-left font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="9" className="px-6 py-12 text-center text-gray-500">Loading dispatches...</td></tr>
                      ) : filteredDispatches.length > 0 ? (
                        filteredDispatches.map((d) => (
                          <tr key={d.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              DEL-{String(d.id).padStart(3, "0")}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {d.order_id ? `ORD-${String(d.order_id).padStart(3, "0")}` : "—"}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-gray-900">{d.customer_name || "—"}</p>
                              <p className="text-xs text-gray-500">{d.customer_phone || ""}</p>
                            </td>
                            <td className="px-6 py-4 text-gray-700">{d.officer_name || "Unassigned"}</td>
                            <td className="px-6 py-4 font-semibold text-green-700">
                              {d.amount ? `Ksh ${Number(d.amount).toLocaleString()}` : "—"}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 w-fit border ${statusColors[d.status]}`}>
                                {statusIcons[d.status]} {d.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${priorityColors[d.priority]}`}>
                                {d.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {d.estimated_delivery
                                ? new Date(d.estimated_delivery).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="px-6 py-4">
                              <button onClick={() => setSelectedDispatch(d)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition text-sm">
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="9" className="px-6 py-12 text-center text-gray-500">No dispatches found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* OFFICERS TAB */}
          {activeTab === "officers" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {officers.length > 0 ? officers.map((o) => (
                <div key={o.id} className="bg-white rounded-xl shadow-md border-t-4 border-green-500 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl">👤</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{o.name}</h3>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                        Delivery Staff
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <span>📞</span>
                      <a href={`tel:${o.phone}`} className="text-green-600 font-semibold">{o.phone}</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📧</span>
                      <a href={`mailto:${o.email}`} className="text-green-600 font-semibold">{o.email}</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📦</span>
                      <span>
                        {dispatches.filter((d) => d.officer_id === o.id && d.status === "In Transit").length} active deliveries
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 bg-white rounded-xl shadow-md p-12 text-center">
                  <p className="text-4xl mb-4">🚗</p>
                  <p className="text-gray-600 text-lg">No delivery officers found.</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Add users with the "Delivery Staff" role in User Management.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dispatch Detail Modal */}
      {selectedDispatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-6 flex items-center justify-between sticky top-0">
              <div>
                <h2 className="text-2xl font-bold">
                  DEL-{String(selectedDispatch.id).padStart(3, "0")}
                </h2>
                <p className="text-green-100">{selectedDispatch.customer_name || "No customer"}</p>
              </div>
              <button onClick={() => setSelectedDispatch(null)} className="text-2xl hover:bg-green-500 rounded-lg p-2">✕</button>
            </div>

            <div className="p-8 space-y-6">
              {/* Linked Order */}
              {selectedDispatch.order_id && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-semibold">
                    🔗 Linked to Order ORD-{String(selectedDispatch.order_id).padStart(3, "0")}
                  </p>
                </div>
              )}

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Customer</p>
                  <p className="text-gray-900 font-semibold">{selectedDispatch.customer_name || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Phone</p>
                  <p className="text-gray-900 font-semibold">{selectedDispatch.customer_phone || "—"}</p>
                </div>
              </div>

              {selectedDispatch.delivery_address && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 font-semibold mb-1">📍 Delivery Address</p>
                  <p className="text-gray-900">{selectedDispatch.delivery_address}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 font-semibold mb-1">Delivery Officer</p>
                <p className="text-gray-900 font-semibold">{selectedDispatch.officer_name || "Unassigned"}</p>
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 w-fit border ${statusColors[selectedDispatch.status]}`}>
                    {statusIcons[selectedDispatch.status]} {selectedDispatch.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-2">Priority</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${priorityColors[selectedDispatch.priority]}`}>
                    {selectedDispatch.priority}
                  </span>
                </div>
              </div>

              {/* Biometric */}
              <div className="border-t pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Biometric Verification</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedDispatch.biometric_status
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {selectedDispatch.biometric_status ? "✅ Verified" : "⏳ Pending"}
                  </span>
                </div>
                {!selectedDispatch.biometric_status && (
                  <button onClick={() => handleVerifyBiometric(selectedDispatch.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition">
                    Verify Biometric
                  </button>
                )}
              </div>

              {/* Update Status */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 font-semibold mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {["Pending", "Assigned", "In Transit", "Delivered", "Failed"].map((s) => (
                    <button key={s}
                      onClick={() => handleUpdateStatus(selectedDispatch.id, s)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        selectedDispatch.status === s
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
                {selectedDispatch.order_id && (
                  <p className="text-xs text-gray-500 mt-2">
                    Setting to "Delivered" will also update the linked order to Delivered.
                  </p>
                )}
              </div>

              {selectedDispatch.amount && (
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Amount</span>
                  <span className="text-2xl font-bold text-green-700">
                    Ksh {Number(selectedDispatch.amount).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="border-t pt-4">
                <button onClick={() => setSelectedDispatch(null)}
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

export default Dispatch;