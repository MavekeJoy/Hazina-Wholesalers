import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { auth } from "../../firebase";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    customer: "",
    email: "",
    phone: "",
    delivery_address: "",
    payment_method: "Bank Transfer",
    items: [{ product_id: "", name: "", quantity: 1, price: 0 }],
  });

  const statuses = ["All", "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

  const statusColors = {
    Pending:   "bg-yellow-100 text-yellow-800 border-yellow-500",
    Confirmed: "bg-blue-100 text-blue-800 border-blue-500",
    Shipped:   "bg-purple-100 text-purple-800 border-purple-500",
    Delivered: "bg-green-100 text-green-800 border-green-500",
    Cancelled: "bg-red-100 text-red-800 border-red-500",
  };

  const statusIcons = {
    Pending: "⏳", Confirmed: "✓", Shipped: "📦", Delivered: "✅", Cancelled: "❌",
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getToken = async () => await auth.currentUser.getIdToken();

  // ── API calls ─────────────────────────────────────────────────────────────

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrders(data);
    } catch (err) {
      showToast("Failed to load orders: " + err.message, "error");
    } finally {
      setLoading(false);
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
    fetchOrders();
    fetchProducts();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];

    if (field === "product_id") {
      // Auto-fill name and price from selected product
      const product = products.find((p) => String(p.id) === String(value));
      updatedItems[index] = {
        ...updatedItems[index],
        product_id: value,
        name: product?.name || "",
        price: product?.price || 0,
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: field === "quantity" || field === "price"
          ? parseFloat(value) || 0
          : value,
      };
    }

    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const addItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { product_id: "", name: "", quantity: 1, price: 0 }],
    }));
  };

  const removeItemRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleCreateOrder = async () => {
    if (!formData.customer) {
      showToast("Customer name is required.", "error");
      return;
    }
    if (formData.items.some((i) => !i.name || !i.quantity || !i.price)) {
      showToast("Please fill in all product details.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer:         formData.customer,
          email:            formData.email,
          phone:            formData.phone,
          delivery_address: formData.delivery_address,
          payment_method:   formData.payment_method,
          products:         formData.items,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await fetchOrders();
      setShowForm(false);
      setFormData({
        customer: "", email: "", phone: "", delivery_address: "",
        payment_method: "Bank Transfer",
        items: [{ product_id: "", name: "", quantity: 1, price: 0 }],
      });
      showToast(`Order ${data.order.order_number} created successfully.`);
    } catch (err) {
      showToast("Failed to create order: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await fetchOrders();
      if (selectedOrder?.id === id) {
        setSelectedOrder((prev) => ({ ...prev, status }));
      }
      showToast(`Order status updated to ${status}.`);
    } catch (err) {
      showToast("Failed to update status: " + err.message, "error");
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/orders/${id}/payment`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await fetchOrders();
      if (selectedOrder?.id === id) {
        setSelectedOrder((prev) => ({ ...prev, payment_status: "Paid" }));
      }
      showToast("Payment marked as paid.");
    } catch (err) {
      showToast("Failed to update payment: " + err.message, "error");
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === "All" || o.status === filterStatus;
    const matchesSearch =
      o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total:     orders.length,
    pending:   orders.filter((o) => o.status === "Pending").length,
    confirmed: orders.filter((o) => o.status === "Confirmed").length,
    shipped:   orders.filter((o) => o.status === "Shipped").length,
    delivered: orders.filter((o) => o.status === "Delivered").length,
  };

  const totalRevenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);

  // Form totals
  const formSubtotal = formData.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const formDelivery = formSubtotal > 2000 ? 0 : 200;
  const formTotal    = formSubtotal + formDelivery;

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
              <h1 className="text-3xl font-bold">Customer Orders</h1>
              <p className="text-green-100 mt-2">Manage and track all retail customer orders</p>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-3xl font-bold">Ksh {totalRevenue.toLocaleString()}</p>
                <p className="text-green-100 text-sm">Total Revenue</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
              >
                <span>➕</span> New Order
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            <StatCard label="Total Orders" value={stats.total}     icon="📋" color="bg-blue-500" />
            <StatCard label="Pending"      value={stats.pending}   icon="⏳" color="bg-yellow-500" />
            <StatCard label="Confirmed"    value={stats.confirmed} icon="✓"  color="bg-purple-500" />
            <StatCard label="Shipped"      value={stats.shipped}   icon="📦" color="bg-orange-500" />
            <StatCard label="Delivered"    value={stats.delivered} icon="✅" color="bg-green-500" />
          </div>

          {/* Create Order Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-green-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Order</h2>

              {/* Customer Details */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Customer Name *</label>
                  <input type="text" name="customer" value={formData.customer}
                    onChange={handleInputChange} placeholder="e.g., Shoppers Grocery Market"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Email</label>
                  <input type="email" name="email" value={formData.email}
                    onChange={handleInputChange} placeholder="customer@mail.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Phone</label>
                  <input type="tel" name="phone" value={formData.phone}
                    onChange={handleInputChange} placeholder="0700000001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Payment Method</label>
                  <select name="payment_method" value={formData.payment_method}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    {["Bank Transfer", "M-Pesa", "Cash", "POS"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">Delivery Address</label>
                  <input type="text" name="delivery_address" value={formData.delivery_address}
                    onChange={handleInputChange} placeholder="e.g., 123 Nairobi Street, Nairobi"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-4">Products *</label>
                <div className="overflow-x-auto">
                  <table className="w-full mb-4">
                    <thead className="bg-gray-100">
                      <tr>
                        {["Product", "Qty", "Unit Price (Ksh)", "Total", ""].map((h) => (
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
                            <input type="number" value={item.price}
                              onChange={(e) => handleItemChange(index, "price", e.target.value)}
                              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                          </td>
                          <td className="px-4 py-2 font-semibold text-green-700">
                            Ksh {(item.quantity * item.price).toLocaleString()}
                          </td>
                          <td className="px-4 py-2">
                            {formData.items.length > 1 && (
                              <button onClick={() => removeItemRow(index)}
                                className="text-red-500 hover:text-red-700 font-semibold">🗑️</button>
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
                  <span>Delivery Fee</span>
                  <span className="font-semibold">{formDelivery === 0 ? "Free" : `Ksh ${formDelivery}`}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                  <span>Total</span>
                  <span className="text-green-700">Ksh {formTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleCreateOrder} disabled={submitting}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2">
                  {submitting ? <><span className="animate-spin">⏳</span> Saving...</> : "Create Order"}
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
              <input type="text" placeholder="Search by order number or customer..."
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

          {/* Orders Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-600 text-white">
                  <tr>
                    {["Order ID","Customer","Items","Amount","Status","Payment","Date","Actions"].map((h) => (
                      <th key={h} className="px-6 py-4 text-left font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">Loading orders...</td></tr>
                  ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-900">{order.order_number}</td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{order.customer}</p>
                          <p className="text-sm text-gray-500">{order.email}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {order.products?.length || 0} item{order.products?.length !== 1 ? "s" : ""}
                        </td>
                        <td className="px-6 py-4 font-semibold text-green-700">
                          Ksh {Number(order.total).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 w-fit border ${statusColors[order.status]}`}>
                            {statusIcons[order.status]} {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            order.payment_status === "Paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(order.order_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => setSelectedOrder(order)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition text-sm">
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">No orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-6 flex items-center justify-between sticky top-0">
              <div>
                <h2 className="text-2xl font-bold">{selectedOrder.order_number}</h2>
                <p className="text-green-100">{selectedOrder.customer}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-2xl hover:bg-green-500 rounded-lg p-2">✕</button>
            </div>

            <div className="p-8 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Customer</p>
                  <p className="text-gray-900 font-semibold">{selectedOrder.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Order Date</p>
                  <p className="text-gray-900 font-semibold">
                    {new Date(selectedOrder.order_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Email</p>
                  <p className="text-gray-900 font-semibold">{selectedOrder.email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Phone</p>
                  <p className="text-gray-900 font-semibold">{selectedOrder.phone || "—"}</p>
                </div>
              </div>

              {/* Delivery Address */}
              {selectedOrder.delivery_address && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 font-semibold mb-1">📍 Delivery Address</p>
                  <p className="text-gray-900">{selectedOrder.delivery_address}</p>
                </div>
              )}

              {/* Products */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 font-semibold mb-4">Products</p>
                <div className="space-y-3">
                  {(selectedOrder.products || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-green-700">
                        Ksh {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">Ksh {Number(selectedOrder.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold">
                    {Number(selectedOrder.delivery_fee) === 0 ? "Free" : `Ksh ${Number(selectedOrder.delivery_fee).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                  <span>Total</span>
                  <span className="text-green-700">Ksh {Number(selectedOrder.total).toLocaleString()}</span>
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 font-semibold mb-3">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {["Pending","Confirmed","Shipped","Delivered","Cancelled"].map((s) => (
                    <button key={s}
                      onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        selectedOrder.status === s
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Payment */}
              <div className="border-t pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Payment — {selectedOrder.payment_method}</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedOrder.payment_status === "Paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {selectedOrder.payment_status}
                  </span>
                </div>
                {selectedOrder.payment_status !== "Paid" && (
                  <button onClick={() => handleMarkPaid(selectedOrder.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition">
                    Mark as Paid
                  </button>
                )}
              </div>

              <div className="border-t pt-4">
                <button onClick={() => setSelectedOrder(null)}
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

export default Orders;