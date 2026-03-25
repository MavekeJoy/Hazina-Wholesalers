import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Inventory() {
  const { currentUser } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category_id: "",
    supplier_id: "",
    quantity: 0,
    min_stock: 0,
    max_stock: 0,
    price: 0,
    reorder_level: 0,
  });

  const statuses = ["All", "In Stock", "Low Stock", "Out of Stock"];

  const statusColors = {
    "In Stock":     "bg-green-100 text-green-800 border-green-500",
    "Low Stock":    "bg-yellow-100 text-yellow-800 border-yellow-500",
    "Out of Stock": "bg-red-100 text-red-800 border-red-500",
  };

  const statusIcons = {
    "In Stock":     "✅",
    "Low Stock":    "⚠️",
    "Out of Stock": "❌",
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getToken = async () => await auth.currentUser.getIdToken();

  // ── API calls ─────────────────────────────────────────────────────────────

  const fetchInventory = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProducts(data);
    } catch (err) {
      showToast("Failed to load inventory: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/inventory/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err.message);
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

  useEffect(() => {
    fetchInventory();
    fetchCategories();
    fetchSuppliers();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["quantity", "min_stock", "max_stock", "price", "reorder_level"].includes(name)
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.sku || !formData.price) {
      showToast("Product name, SKU and price are required.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const url = editingId
        ? `${API}/api/inventory/${editingId}`
        : `${API}/api/inventory`;
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

      await fetchInventory();
      handleCancel();
      showToast(editingId ? "Product updated successfully." : "Product added successfully.");
    } catch (err) {
      showToast("Failed to save product: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name:         product.name,
      sku:          product.sku,
      category_id:  product.category_id || "",
      supplier_id:  product.supplier_id || "",
      quantity:     product.quantity,
      min_stock:    product.min_stock,
      max_stock:    product.max_stock,
      price:        product.price,
      reorder_level: product.reorder_level || product.min_stock,
    });
    setEditingId(product.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/inventory/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchInventory();
      showToast(`"${name}" deleted.`);
    } catch (err) {
      showToast("Failed to delete product: " + err.message, "error");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "", sku: "", category_id: "", supplier_id: "",
      quantity: 0, min_stock: 0, max_stock: 0, price: 0, reorder_level: 0,
    });
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const categoryNames = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === "All" || p.category === filterCategory;
    const matchesStatus   = filterStatus === "All"   || p.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total:      products.length,
    lowStock:   products.filter((p) => p.status === "Low Stock").length,
    outOfStock: products.filter((p) => p.status === "Out of Stock").length,
    totalValue: products.reduce((sum, p) => sum + (p.quantity * p.price), 0),
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
              <h1 className="text-3xl font-bold">Inventory Management</h1>
              <p className="text-green-100 mt-2">
                Track stock levels, manage products, and monitor inventory
              </p>
            </div>
            <button
              onClick={() => { setShowForm(!showForm); if (showForm) handleCancel(); }}
              className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <span>➕</span> Add New Product
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Products"   value={stats.total}      icon="📦" color="bg-blue-500" />
            <StatCard label="Low Stock Items"  value={stats.lowStock}   icon="⚠️" color="bg-yellow-500" />
            <StatCard label="Out of Stock"     value={stats.outOfStock} icon="❌" color="bg-red-500" />
            <StatCard
              label="Inventory Value"
              value={`Ksh ${(stats.totalValue / 1000).toFixed(0)}K`}
              icon="💰"
              color="bg-green-500"
            />
          </div>

          {/* Add / Edit Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-green-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingId ? "Edit Product" : "Add New Product"}
              </h2>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Product Name *</label>
                  <input
                    type="text" name="name" value={formData.name}
                    onChange={handleInputChange} placeholder="e.g., Extra Virgin Olive Oil"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">SKU *</label>
                  <input
                    type="text" name="sku" value={formData.sku}
                    onChange={handleInputChange} placeholder="e.g., OIL-001"
                    disabled={!!editingId}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Category</label>
                  <select
                    name="category_id" value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Supplier</label>
                  <select
                    name="supplier_id" value={formData.supplier_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.supplier_id} value={s.supplier_id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Unit Price (Ksh) *</label>
                  <input
                    type="number" name="price" value={formData.price}
                    onChange={handleInputChange} placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Current Quantity</label>
                  <input
                    type="number" name="quantity" value={formData.quantity}
                    onChange={handleInputChange} placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Minimum Stock</label>
                  <input
                    type="number" name="min_stock" value={formData.min_stock}
                    onChange={handleInputChange} placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Maximum Stock</label>
                  <input
                    type="number" name="max_stock" value={formData.max_stock}
                    onChange={handleInputChange} placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit} disabled={submitting}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                >
                  {submitting ? <><span className="animate-spin">⏳</span> Saving...</> : editingId ? "Update Product" : "Add Product"}
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

          {/* Search & Filter */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="space-y-4">
              <input
                type="text" placeholder="Search by product name or SKU..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="flex gap-6 flex-wrap">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Category</label>
                  <div className="flex gap-2 flex-wrap">
                    {categoryNames.map((cat) => (
                      <button
                        key={cat} onClick={() => setFilterCategory(cat)}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          filterCategory === cat ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Status</label>
                  <div className="flex gap-2 flex-wrap">
                    {statuses.map((s) => (
                      <button
                        key={s} onClick={() => setFilterStatus(s)}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          filterStatus === s ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-600 text-white">
                  <tr>
                    {["Product Name","SKU","Category","Quantity","Unit Price","Status","Supplier","Last Restocked","Actions"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="9" className="px-6 py-12 text-center text-gray-500">Loading inventory...</td></tr>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{product.sku}</td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                            {product.category || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">{product.quantity}</span>
                          <span className="text-xs text-gray-500 ml-1">/ {product.max_stock}</span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-green-700">
                          Ksh {Number(product.price).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 w-fit border ${statusColors[product.status]}`}>
                            {statusIcons[product.status]} {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{product.supplier || "—"}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {product.last_restocked
                            ? new Date(product.last_restocked).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg font-semibold transition text-sm"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(product.id, product.name)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-semibold transition text-sm"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
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

export default Inventory;