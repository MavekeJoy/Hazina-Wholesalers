import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { auth } from "../../firebase";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    supplier_id: "",
    supplier_name: "",
    supplier_email: "",
    supplier_phone: "",
    invoice_number: "",
    payment_method: "Bank Transfer",
    expected_delivery: "",
    items: [{ product_id: "", name: "", quantity: 1, unit_price: 0 }],
  });

  const statuses = ["All", "Pending", "Confirmed", "Received", "Cancelled"];

  const statusColors = {
    Pending:   "bg-yellow-100 text-yellow-800 border-yellow-500",
    Confirmed: "bg-blue-100 text-blue-800 border-blue-500",
    Received:  "bg-green-100 text-green-800 border-green-500",
    Cancelled: "bg-red-100 text-red-800 border-red-500",
  };

  const statusIcons = {
    Pending: "⏳", Confirmed: "✓", Received: "📦", Cancelled: "❌",
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getToken = async () => await auth.currentUser.getIdToken();

  // ── API calls ─────────────────────────────────────────────────────────────

  const fetchPurchases = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/purchases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPurchases(data);
    } catch (err) {
      showToast("Failed to load purchases: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/suppliers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuppliers(data);
    } catch (err) {
      console.error("Failed to load suppliers:", err.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products:", err.message);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSupplierSelect = (e) => {
    const supplier = suppliers.find((s) => String(s.supplier_id) === e.target.value);
    if (supplier) {
      setFormData((prev) => ({
        ...prev,
        supplier_id:    supplier.supplier_id,
        supplier_name:  supplier.name,
        supplier_email: supplier.email || "",
        supplier_phone: supplier.phone || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        supplier_id: "", supplier_name: "",
        supplier_email: "", supplier_phone: "",
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];

    if (field === "product_id") {
      const product = products.find((p) => String(p.id) === String(value));
      updatedItems[index] = {
        ...updatedItems[index],
        product_id: value,
        name:       product?.name || "",
        unit_price: product?.price || 0,
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: field === "quantity" || field === "unit_price"
          ? parseFloat(value) || 0
          : value,
      };
    }

    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const addItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { product_id: "", name: "", quantity: 1, unit_price: 0 }],
    }));
  };

  const removeItemRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleCreatePurchase = async () => {
    if (!formData.supplier_name) {
      showToast("Please select a supplier.", "error"); return;
    }
    if (formData.items.some((i) => !i.name || !i.quantity || !i.unit_price)) {
      showToast("Please fill in all product details.", "error"); return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/purchases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          supplier_id:       formData.supplier_id,
          supplier_name:     formData.supplier_name,
          supplier_email:    formData.supplier_email,
          supplier_phone:    formData.supplier_phone,
          invoice_number:    formData.invoice_number,
          payment_method:    formData.payment_method,
          expected_delivery: formData.expected_delivery,
          products:          formData.items,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await fetchPurchases();
      setShowForm(false);
      setFormData({
        supplier_id: "", supplier_name: "", supplier_email: "",
        supplier_phone: "", invoice_number: "",
        payment_method: "Bank Transfer", expected_delivery: "",
        items: [{ product_id: "", name: "", quantity: 1, unit_price: 0 }],
      });
      showToast(`Purchase order ${data.purchase.purchase_number} created successfully.`);
    } catch (err) {
      showToast("Failed to create purchase: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/purchases/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchPurchases();
      if (selectedPurchase?.id === id) {
        setSelectedPurchase((prev) => ({ ...prev, status }));
      }
      showToast(`Status updated to ${status}.`);
    } catch (err) {
      showToast("Failed to update status: " + err.message, "error");
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/purchases/${id}/payment`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchPurchases();
      if (selectedPurchase?.id === id) {
        setSelectedPurchase((prev) => ({ ...prev, payment_status: "Paid" }));
      }
      showToast("Payment marked as paid.");
    } catch (err) {
      showToast("Failed to update payment: " + err.message, "error");
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const filteredPurchases = purchases.filter((p) => {
    const matchesStatus = filterStatus === "All" || p.status === filterStatus;
    const matchesSearch =
      p.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.purchase_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total:     purchases.length,
    pending:   purchases.filter((p) => p.status === "Pending").length,
    confirmed: purchases.filter((p) => p.status === "Confirmed").length,
    received:  purchases.filter((p) => p.status === "Received").length,
  };

  const totalSpent = purchases
    .filter((p) => p.status !== "Cancelled")
    .reduce((sum, p) => sum + Number(p.total), 0);

  // Form totals
  const formSubtotal = formData.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const formTax      = Math.round(formSubtotal * 0.16 * 100) / 100;
  const formTotal    = formSubtotal + formTax;

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
              <h1 className="text-3xl font-bold">Purchases</h1>
              <p className="text-green-100 mt-2">Manage wholesale supplier orders and inventory replenishment</p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-3xl font-bold">Ksh {totalSpent.toLocaleString()}</p>
                <p className="text-green-100 text-sm">Total Spent</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
              >
                <span>➕</span> New Purchase Order
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Orders" value={stats.total}     icon="📋" color="bg-blue-500" />
            <StatCard label="Pending"      value={stats.pending}   icon="⏳" color="bg-yellow-500" />
            <StatCard label="Confirmed"    value={stats.confirmed} icon="✓"  color="bg-purple-500" />
            <StatCard label="Received"     value={stats.received}  icon="📦" color="bg-green-500" />
          </div>

          {/* Create Purchase Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-green-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Purchase Order</h2>

              {/* Supplier Selection */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Select Supplier *</label>
                  <select
                    value={formData.supplier_id}
                    onChange={handleSupplierSelect}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Choose supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Supplier Email</label>
                  <input type="email" name="supplier_email" value={formData.supplier_email}
                    onChange={handleInputChange} placeholder="Auto-filled from supplier"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Supplier Phone</label>
                  <input type="tel" name="supplier_phone" value={formData.supplier_phone}
                    onChange={handleInputChange} placeholder="Auto-filled from supplier"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Invoice Number</label>
                  <input type="text" name="invoice_number" value={formData.invoice_number}
                    onChange={handleInputChange} placeholder="INV-0001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Expected Delivery</label>
                  <input type="date" name="expected_delivery" value={formData.expected_delivery}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Payment Method</label>
                  <select name="payment_method" value={formData.payment_method}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    {["Bank Transfer", "M-Pesa", "Cheque", "Cash"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-4">Products *</label>
                <div className="overflow-x-auto">
                  <table className="w-full mb-4">
                    <thead className="bg-gray-100">
                      <tr>
                        {["Product","Qty","Unit Price (Ksh)","Total",""].map((h) => (
                          <th key={h} className="px-4 py-2 text-left font-semibold text-gray-700">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="px-4 py-2">
                            <select value={item.product_id}
                              onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                              <option value="">Select product</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input type="number" value={item.quantity} min="1"
                              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                          </td>
                          <td className="px-4 py-2">
                            <input type="number" value={item.unit_price}
                              onChange={(e) => handleItemChange(index, "unit_price", e.target.value)}
                              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                          </td>
                          <td className="px-4 py-2 font-semibold text-green-700">
                            Ksh {(item.quantity * item.unit_price).toLocaleString()}
                          </td>
                          <td className="px-4 py-2">
                            {formData.items.length > 1 && (
                              <button onClick={() => removeItemRow(index)}
                                className="text-red-500 hover:text-red-700">🗑️</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={addItemRow}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold transition">
                  + Add Product
                </button>
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 p-6 rounded-lg mb-6 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">Ksh {formSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (16%)</span>
                  <span className="font-semibold">Ksh {formTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                  <span>Total</span>
                  <span className="text-green-700">Ksh {formTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleCreatePurchase} disabled={submitting}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2">
                  {submitting ? <><span className="animate-spin">⏳</span> Saving...</> : "Create Purchase Order"}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Search & Filter */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex gap-4 items-center flex-wrap">
              <input type="text" placeholder="Search by purchase number or supplier..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              <div className="flex gap-2 flex-wrap">
                {statuses.map((s) => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      filterStatus === s ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Purchases Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-600 text-white">
                  <tr>
                    {["Order ID","Supplier","Items","Amount","Status","Payment","Expected Date","Actions"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">Loading purchases...</td></tr>
                  ) : filteredPurchases.length > 0 ? (
                    filteredPurchases.map((purchase) => (
                      <tr key={purchase.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{purchase.purchase_number}</td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{purchase.supplier_name}</p>
                          <p className="text-sm text-gray-500">{purchase.supplier_email}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {purchase.products?.length || 0} item{purchase.products?.length !== 1 ? "s" : ""}
                        </td>
                        <td className="px-6 py-4 font-semibold text-green-700">
                          Ksh {Number(purchase.total).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 w-fit border ${statusColors[purchase.status]}`}>
                            {statusIcons[purchase.status]} {purchase.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            purchase.payment_status === "Paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {purchase.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {purchase.expected_delivery
                            ? new Date(purchase.expected_delivery).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => setSelectedPurchase(purchase)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition text-sm">
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">No purchase orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Detail Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-6 flex items-center justify-between sticky top-0">
              <div>
                <h2 className="text-2xl font-bold">{selectedPurchase.purchase_number}</h2>
                <p className="text-green-100">{selectedPurchase.supplier_name}</p>
              </div>
              <button onClick={() => setSelectedPurchase(null)} className="text-2xl hover:bg-green-500 rounded-lg p-2">✕</button>
            </div>

            <div className="p-8 space-y-6">
              {/* Supplier Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Supplier</p>
                  <p className="text-gray-900 font-semibold">{selectedPurchase.supplier_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Order Date</p>
                  <p className="text-gray-900 font-semibold">
                    {new Date(selectedPurchase.purchase_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Email</p>
                  <p className="text-gray-900 font-semibold">{selectedPurchase.supplier_email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Phone</p>
                  <p className="text-gray-900 font-semibold">{selectedPurchase.supplier_phone || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Invoice Number</p>
                  <p className="text-gray-900 font-semibold">{selectedPurchase.invoice_number || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Expected Delivery</p>
                  <p className="text-gray-900 font-semibold">
                    {selectedPurchase.expected_delivery
                      ? new Date(selectedPurchase.expected_delivery).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Products */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 font-semibold mb-4">Products Ordered</p>
                <div className="space-y-3">
                  {(selectedPurchase.products || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} × Ksh {Number(item.unit_price).toLocaleString()}
                        </p>
                      </div>
                      <p className="font-semibold text-green-700">
                        Ksh {(item.quantity * item.unit_price).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">Ksh {Number(selectedPurchase.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (16%)</span>
                  <span className="font-semibold">Ksh {Number(selectedPurchase.tax).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                  <span>Total</span>
                  <span className="text-green-700">Ksh {Number(selectedPurchase.total).toLocaleString()}</span>
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 font-semibold mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {["Pending","Confirmed","Received","Cancelled"].map((s) => (
                    <button key={s}
                      onClick={() => handleUpdateStatus(selectedPurchase.id, s)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        selectedPurchase.status === s
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Payment */}
              <div className="border-t pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">
                    Payment — {selectedPurchase.payment_method}
                  </p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedPurchase.payment_status === "Paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {selectedPurchase.payment_status}
                  </span>
                </div>
                {selectedPurchase.payment_status !== "Paid" && (
                  <button onClick={() => handleMarkPaid(selectedPurchase.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition">
                    Mark as Paid
                  </button>
                )}
              </div>

              <div className="border-t pt-4">
                <button onClick={() => setSelectedPurchase(null)}
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

export default Purchases;