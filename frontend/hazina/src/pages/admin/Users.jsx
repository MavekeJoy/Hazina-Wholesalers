import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Users() {
  const { currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", role: "", phone: "" });
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: "success" | "error" }

  const roles = [
    { id: "Administrator",  name: "Administrator",   description: "Full system access including user management.", permissions: ["Full system access"], icon: "👨‍💼", color: "bg-red-100 border-red-400" },
    { id: "Manager",        name: "Manager",         description: "Views reports, monitors performance, decision making.", permissions: ["Read-only access to reports", "Analytics and dashboards"], icon: "📊", color: "bg-blue-100 border-blue-400" },
    { id: "Warehouse Staff",name: "Warehouse Staff", description: "Records stock-in/out and monitors inventory levels.", permissions: ["Limited access to inventory module"], icon: "📦", color: "bg-green-100 border-green-400" },
    { id: "Delivery Staff", name: "Delivery Staff",  description: "Confirms dispatch and delivery completion.", permissions: ["Access limited to delivery"], icon: "🚚", color: "bg-yellow-100 border-yellow-400" },
    { id: "System Auditor", name: "System Auditor",  description: "Reviews audit logs and verifies system integrity.", permissions: ["Restricted access to audit trail", "Reporting modules"], icon: "🔍", color: "bg-purple-100 border-purple-400" },
  ];

  // ── Helpers ──────────────────────────────────────────────────────────────

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Get Firebase ID token to send to backend
  const getToken = async () => {
    return await auth.currentUser.getIdToken();
  };

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGeneratedPassword(password);
    setCopiedPassword(false);
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  // ── API calls ─────────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUsers(data);
    } catch (err) {
      showToast("Failed to load users: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.role || !generatedPassword) {
      showToast("Please fill all required fields and generate a password.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
          password: generatedPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await fetchUsers();
      handleCancel();
      showToast(`User ${formData.name} created successfully! Share their credentials securely.`);
    } catch (err) {
      showToast("Failed to create user: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!formData.name || !formData.role) {
      showToast("Please fill all required fields.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/users/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          role: formData.role,
          phone: formData.phone,
          status: "Active",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await fetchUsers();
      handleCancel();
      showToast("User updated successfully.");
    } catch (err) {
      showToast("Failed to update user: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisableUser = async (id, name) => {
    if (!window.confirm(`Disable ${name}? They will no longer be able to log in.`)) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/users/${id}/disable`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchUsers();
      showToast(`${name} has been disabled.`);
    } catch (err) {
      showToast("Failed to disable user: " + err.message, "error");
    }
  };

  const handleEnableUser = async (id, name) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/users/${id}/enable`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchUsers();
      showToast(`${name} has been re-enabled.`);
    } catch (err) {
      showToast("Failed to enable user: " + err.message, "error");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", email: "", role: "", phone: "" });
    setGeneratedPassword(null);
  };

  const startEdit = (user) => {
    const roleId = roles.find((r) => r.name === user.role)?.id;
    setFormData({ name: user.name, email: user.email, role: roleId || user.role, phone: user.phone || "" });
    setEditingId(user.id);
    setShowForm(true);
    generatePassword();
  };

  const getRoleData = (roleName) => roles.find((r) => r.name === roleName || r.id === roleName);

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg text-white font-semibold text-sm transition ${
            toast.type === "error" ? "bg-red-500" : "bg-green-600"
          }`}>
            {toast.type === "error" ? "⚠️" : "✅"} {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-green-100 mt-2">Manage staff members and their system access permissions</p>
            </div>
            <button
              onClick={() => { setShowForm(!showForm); if (!showForm) generatePassword(); }}
              className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <span>➕</span> Add New User
            </button>
          </div>
        </div>

        <div className="p-8">

          {/* Add / Edit Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-l-4 border-green-500">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingId ? "Edit User" : "Add New User"}
              </h2>

              {/* Role selection cards */}
              <div className="mb-8">
                <label className="block text-gray-700 font-semibold mb-4">Select User Role *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      onClick={() => setFormData((prev) => ({ ...prev, role: role.id }))}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                        formData.role === role.id ? `${role.color} border-current` : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{role.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{role.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {role.permissions.map((perm, idx) => (
                              <span key={idx} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                {perm}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User details */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g., john@hazina.com"
                    disabled={!!editingId}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  {editingId && <p className="text-xs text-gray-400 mt-1">Email cannot be changed after creation.</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-700 font-semibold mb-2">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g., 0700000000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <label className="block text-gray-700 font-semibold mb-3">Temporary Login Password</label>
                <div className="flex gap-3">
                  {generatedPassword ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={generatedPassword}
                        readOnly
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg font-mono text-sm"
                      />
                      <button
                        onClick={copyPasswordToClipboard}
                        className={`px-6 py-2 rounded-lg font-semibold transition ${
                          copiedPassword ? "bg-green-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                      >
                        {copiedPassword ? "✓ Copied" : "Copy"}
                      </button>
                      <button
                        onClick={generatePassword}
                        className="px-4 py-2 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
                      >
                        🔄
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={generatePassword}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold transition"
                    >
                      Generate Password
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  ⚠️ Share this password securely. The user should change it on first login.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={editingId ? handleEditUser : handleAddUser}
                  disabled={submitting}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                >
                  {submitting ? <><span className="animate-spin">⏳</span> Saving...</> : editingId ? "Update User" : "Add User"}
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

          {/* Users list */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Active Users ({users.filter((u) => u.status === "Active").length})
            </h2>

            {loading ? (
              <div className="text-center py-16 text-gray-500">Loading users...</div>
            ) : users.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {users.map((user) => {
                  const roleData = getRoleData(user.role);
                  return (
                    <div
                      key={user.id}
                      className={`rounded-xl shadow-md hover:shadow-xl transition border-l-4 p-6 ${
                        roleData?.color || "bg-gray-100 border-gray-400"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">{roleData?.icon || "👤"}</div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          user.status === "Active" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                        }`}>
                          {user.status}
                        </span>
                      </div>

                      <div className="mb-4 pb-4 border-b border-gray-300">
                        <p className="text-sm text-gray-600 font-semibold">Role</p>
                        <p className="text-gray-900 font-semibold">{user.role}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(roleData?.permissions || []).map((perm, idx) => (
                            <span key={idx} className="text-xs bg-white text-gray-700 px-3 py-1 rounded-full border border-gray-300">
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4 text-sm text-gray-600">
                        📅 Joined: {new Date(user.created_at).toLocaleDateString()}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(user)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                        >
                          ✏️ Edit
                        </button>
                        {user.status === "Active" ? (
                          <button
                            onClick={() => handleDisableUser(user.id, user.name)}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                          >
                            🚫 Disable
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnableUser(user.id, user.name)}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                          >
                            ✓ Enable
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <p className="text-4xl mb-4">👥</p>
                <p className="text-gray-600 text-lg mb-6">No users added yet. Start by adding your first team member!</p>
                <button
                  onClick={() => { setShowForm(true); generatePassword(); }}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Add First User
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Users;