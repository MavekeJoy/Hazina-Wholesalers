import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { auth } from "../../firebase";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    phone: "",
    email: "",
    address: "",
    min_order_quantity: "",
  });

  const categories = [
    "Cooking Oils",
    "Body Oils",
    "Soaps",
    "Detergents",
    "Grains",
    "General",
    "Other",
  ];

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getToken = async () => await auth.currentUser.getIdToken();

  // ── API calls ─────────────────────────────────────────────────────────────

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
      showToast("Failed to load suppliers: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.category) {
      showToast("Name, email, phone and category are required.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const url = editingId
        ? `${API}/api/suppliers/${editingId}`
        : `${API}/api/suppliers`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await fetchSuppliers();
      handleCancel();
      showToast(editingId ? "Supplier updated successfully." : "Supplier added successfully.");
    } catch (err) {
      showToast("Failed to save supplier: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (supplier) => {
    setFormData({
      name:               supplier.name,
      category:           supplier.category || "",
      phone:              supplier.phone || "",
      email:              supplier.email || "",
      address:            supplier.address || "",
      min_order_quantity: supplier.min_order_quantity || "",
    });
    setEditingId(supplier.supplier_id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/suppliers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchSuppliers();
      showToast(`"${name}" deleted.`);
    } catch (err) {
      showToast("Failed to delete supplier: " + err.message, "error");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "", category: "", phone: "",
      email: "", address: "", min_order_quantity: "",
    });
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
              <h1 className="text-3xl font-bold">Suppliers Management</h1>
              <p className="text-green-100 mt-2">
                Manage your wholesale suppliers and product sources
              </p>
            </div>
            <button
              onClick={() => { setShowForm(!showForm); if (showForm) handleCancel(); }}
              className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <span>➕</span> Add New Supplier
            </button>
          </div>
        </div>

        <div className="p-8">

          {/* Add / Edit Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-green-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingId ? "Edit Supplier" : "Add New Supplier"}
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Supplier Name *</label>
                  <input
                    type="text" name="name" value={formData.name}
                    onChange={handleInputChange} placeholder="e.g., Uchumi Distributors"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Product Category *</label>
                  <select
                    name="category" value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Phone Number *</label>
                  <input
                    type="tel" name="phone" value={formData.phone}
                    onChange={handleInputChange} placeholder="e.g., 0700000000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Email Address *</label>
                  <input
                    type="email" name="email" value={formData.email}
                    onChange={handleInputChange} placeholder="e.g., supplier@company.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">Address</label>
                  <input
                    type="text" name="address" value={formData.address}
                    onChange={handleInputChange} placeholder="e.g., 123 Agriculture Road, Nairobi"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">Minimum Order Quantity</label>
                  <input
                    type="text" name="min_order_quantity" value={formData.min_order_quantity}
                    onChange={handleInputChange} placeholder="e.g., 500kg, 100L"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleSubmit} disabled={submitting}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                >
                  {submitting ? <><span className="animate-spin">⏳</span> Saving...</> : editingId ? "Update Supplier" : "Add Supplier"}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Suppliers Grid */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              All Suppliers ({suppliers.length})
            </h2>

            {loading ? (
              <div className="text-center py-16 text-gray-500">Loading suppliers...</div>
            ) : suppliers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.supplier_id}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition border-t-4 border-green-500 p-6"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{supplier.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                            {supplier.category || "General"}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            supplier.status === "Active"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {supplier.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-yellow-500">
                        ⭐ {Number(supplier.rating).toFixed(1)}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                      {supplier.address && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <span>📍</span>
                          <span className="text-sm">{supplier.address}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <span>📞</span>
                          <a href={`tel:${supplier.phone}`} className="text-green-600 hover:text-green-700 font-semibold text-sm">
                            {supplier.phone}
                          </a>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <span>📧</span>
                          <a href={`mailto:${supplier.email}`} className="text-green-600 hover:text-green-700 font-semibold text-sm">
                            {supplier.email}
                          </a>
                        </div>
                      )}
                      {supplier.min_order_quantity && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <span>📦</span>
                          <span className="text-sm">Min Order: {supplier.min_order_quantity}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.supplier_id, supplier.name)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <p className="text-4xl mb-4">📭</p>
                <p className="text-gray-600 text-lg mb-6">No suppliers added yet.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Add First Supplier
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Suppliers;