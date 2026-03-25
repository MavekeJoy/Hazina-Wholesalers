import { useState } from "react";
import Sidebar from "../../components/Sidebar";

function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    // General Settings
    companyName: "Hazina Wholesalers",
    companyEmail: "admin@hazina.com",
    companyPhone: "+254 712 345 678",
    address: "Nairobi, Kenya",
    timezone: "East Africa Time (EAT)",
    language: "English",
    currency: "KES",

    // Notification Settings
    emailNotifications: true,
    smsNotifications: true,
    lowStockAlerts: true,
    deliveryAlerts: true,
    orderAlerts: true,
    systemAlerts: true,
    notificationEmail: "alerts@hazina.com",

    // Security Settings
    twoFactorAuth: true,
    biometricAuth: true,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginAttempts: 5,

    // API Settings
    apiKey: "sk_live_51234567890abcdef",
    webhookUrl: "https://api.hazina.com/webhooks",
    apiRateLimit: 1000,

    // Backup Settings
    autoBackup: true,
    backupFrequency: "daily",
    backupTime: "02:00",
    retentionDays: 30,
  });

  const [editMode, setEditMode] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTempSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveSettings = () => {
    setSettings(tempSettings);
    setSavedMessage(true);
    setEditMode(false);
    setTimeout(() => setSavedMessage(false), 3000);
    alert("Settings saved successfully!");
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setEditMode(false);
  };

  const handleResetPassword = () => {
    alert("Password reset email sent to your registered email address!");
  };

  const handleEnableBackup = () => {
    alert("Backup initiated! This may take a few minutes...");
  };

  const handleTestApi = () => {
    alert("API connection test successful! ✅");
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar />

      <div className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">System Settings</h1>
              <p className="text-green-100 mt-2">
                Configure system preferences, security, and integrations
              </p>
            </div>
            {editMode && (
              <div className="flex gap-3">
                <button
                  onClick={handleSaveSettings}
                  className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  💾 Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-red-500 hover:bg-red-400 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  ✕ Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        {savedMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 m-8 rounded-lg">
            ✅ Settings saved successfully!
          </div>
        )}

        {/* Main Content */}
        <div className="p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {[
              { id: "general", label: "⚙️ General", icon: "general" },
              { id: "notifications", label: "🔔 Notifications", icon: "notifications" },
              { id: "security", label: "🔒 Security", icon: "security" },
              { id: "api", label: "🔌 API & Webhooks", icon: "api" },
              { id: "backup", label: "💾 Backup & Recovery", icon: "backup" },
              { id: "users", label: "👥 User Management", icon: "users" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-green-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* GENERAL SETTINGS */}
          {activeTab === "general" && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  General Settings
                </h2>
                {!editMode && (
                  <button
                    onClick={() => {
                      setEditMode(true);
                      setTempSettings(settings);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Company Name
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="companyName"
                      value={tempSettings.companyName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-900 font-semibold">
                      {settings.companyName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Company Email
                  </label>
                  {editMode ? (
                    <input
                      type="email"
                      name="companyEmail"
                      value={tempSettings.companyEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-900 font-semibold">
                      {settings.companyEmail}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Company Phone
                  </label>
                  {editMode ? (
                    <input
                      type="tel"
                      name="companyPhone"
                      value={tempSettings.companyPhone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-900 font-semibold">
                      {settings.companyPhone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Address
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      name="address"
                      value={tempSettings.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-900 font-semibold">
                      {settings.address}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Timezone
                  </label>
                  {editMode ? (
                    <select
                      name="timezone"
                      value={tempSettings.timezone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option>East Africa Time (EAT)</option>
                      <option>GMT</option>
                      <option>UTC</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 font-semibold">
                      {settings.timezone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Currency
                  </label>
                  {editMode ? (
                    <select
                      name="currency"
                      value={tempSettings.currency}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option>KES</option>
                      <option>USD</option>
                      <option>EUR</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 font-semibold">
                      {settings.currency}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATION SETTINGS */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Notification Settings
                </h2>
                {!editMode && (
                  <button
                    onClick={() => {
                      setEditMode(true);
                      setTempSettings(settings);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Notification Channels
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={editMode ? tempSettings.emailNotifications : settings.emailNotifications}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        className="w-5 h-5 text-green-600 rounded"
                      />
                      <span className="text-gray-700 font-medium">
                        Email Notifications
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="smsNotifications"
                        checked={editMode ? tempSettings.smsNotifications : settings.smsNotifications}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        className="w-5 h-5 text-green-600 rounded"
                      />
                      <span className="text-gray-700 font-medium">
                        SMS Notifications
                      </span>
                    </label>
                  </div>
                </div>

                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Alert Types
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="lowStockAlerts"
                        checked={editMode ? tempSettings.lowStockAlerts : settings.lowStockAlerts}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        className="w-5 h-5 text-green-600 rounded"
                      />
                      <span className="text-gray-700 font-medium">
                        Low Stock Alerts
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="deliveryAlerts"
                        checked={editMode ? tempSettings.deliveryAlerts : settings.deliveryAlerts}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        className="w-5 h-5 text-green-600 rounded"
                      />
                      <span className="text-gray-700 font-medium">
                        Delivery Alerts
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="orderAlerts"
                        checked={editMode ? tempSettings.orderAlerts : settings.orderAlerts}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        className="w-5 h-5 text-green-600 rounded"
                      />
                      <span className="text-gray-700 font-medium">
                        Order Alerts
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="systemAlerts"
                        checked={editMode ? tempSettings.systemAlerts : settings.systemAlerts}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        className="w-5 h-5 text-green-600 rounded"
                      />
                      <span className="text-gray-700 font-medium">
                        System Alerts
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Notification Email Address
                  </label>
                  {editMode ? (
                    <input
                      type="email"
                      name="notificationEmail"
                      value={tempSettings.notificationEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <p className="text-gray-900 font-semibold">
                      {settings.notificationEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECURITY SETTINGS */}
          {activeTab === "security" && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Security Settings
              </h2>

              <div className="space-y-8">
                {/* Authentication */}
                <div className="border-b pb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Authentication
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Two-Factor Authentication
                        </p>
                        <p className="text-sm text-gray-600">
                          {editMode ? tempSettings.twoFactorAuth ? "Enabled" : "Disabled" : settings.twoFactorAuth ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="twoFactorAuth"
                          checked={editMode ? tempSettings.twoFactorAuth : settings.twoFactorAuth}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          className="w-5 h-5 text-green-600 rounded"
                        />
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Biometric Authentication
                        </p>
                        <p className="text-sm text-gray-600">
                          {editMode ? tempSettings.biometricAuth ? "Enabled" : "Disabled" : settings.biometricAuth ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="biometricAuth"
                          checked={editMode ? tempSettings.biometricAuth : settings.biometricAuth}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          className="w-5 h-5 text-green-600 rounded"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Password Policy */}
                <div className="border-b pb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Password Policy
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Password Expiry (Days)
                      </label>
                      {editMode ? (
                        <input
                          type="number"
                          name="passwordExpiry"
                          value={tempSettings.passwordExpiry}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      ) : (
                        <p className="text-gray-900 font-semibold">
                          {settings.passwordExpiry} days
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Max Login Attempts
                      </label>
                      {editMode ? (
                        <input
                          type="number"
                          name="loginAttempts"
                          value={tempSettings.loginAttempts}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      ) : (
                        <p className="text-gray-900 font-semibold">
                          {settings.loginAttempts} attempts
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Session Timeout (Minutes)
                      </label>
                      {editMode ? (
                        <input
                          type="number"
                          name="sessionTimeout"
                          value={tempSettings.sessionTimeout}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      ) : (
                        <p className="text-gray-900 font-semibold">
                          {settings.sessionTimeout} minutes
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Password Management */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Password Management
                  </h3>
                  <button
                    onClick={handleResetPassword}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                  >
                    🔑 Reset Your Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* API & WEBHOOKS */}
          {activeTab === "api" && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                API & Webhooks Configuration
              </h2>

              <div className="space-y-8">
                {/* API Key */}
                <div className="border-b pb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    API Key
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Your API Key</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="password"
                        value={settings.apiKey}
                        readOnly
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg font-mono text-sm"
                      />
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition">
                        👁️
                      </button>
                      <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition">
                        📋
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Use this key to authenticate API requests
                    </p>
                  </div>
                </div>

                {/* Webhook Configuration */}
                <div className="border-b pb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Webhook Configuration
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Webhook URL
                      </label>
                      <input
                        type="url"
                        value={settings.webhookUrl}
                        readOnly
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <button
                      onClick={handleTestApi}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                    >
                      🧪 Test Webhook
                    </button>
                  </div>
                </div>

                {/* Rate Limiting */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Rate Limiting
                  </h3>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Requests Per Hour
                    </label>
                    <input
                      type="number"
                      value={settings.apiRateLimit}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BACKUP & RECOVERY */}
          {activeTab === "backup" && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                Backup & Recovery Settings
              </h2>

              <div className="space-y-8">
                {/* Backup Configuration */}
                <div className="border-b pb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Automatic Backup Configuration
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Enable Automatic Backups
                        </p>
                        <p className="text-sm text-gray-600">
                          {editMode ? tempSettings.autoBackup ? "Enabled" : "Disabled" : settings.autoBackup ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="autoBackup"
                          checked={editMode ? tempSettings.autoBackup : settings.autoBackup}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          className="w-5 h-5 text-green-600 rounded"
                        />
                      </label>
                    </div>

                    {(editMode ? tempSettings.autoBackup : settings.autoBackup) && (
                      <>
                        <div>
                          <label className="block text-gray-700 font-semibold mb-2">
                            Backup Frequency
                          </label>
                          {editMode ? (
                            <select
                              name="backupFrequency"
                              value={tempSettings.backupFrequency}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option>hourly</option>
                              <option>daily</option>
                              <option>weekly</option>
                              <option>monthly</option>
                            </select>
                          ) : (
                            <p className="text-gray-900 font-semibold capitalize">
                              {settings.backupFrequency}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-gray-700 font-semibold mb-2">
                            Backup Time
                          </label>
                          {editMode ? (
                            <input
                              type="time"
                              name="backupTime"
                              value={tempSettings.backupTime}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <p className="text-gray-900 font-semibold">
                              {settings.backupTime}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-gray-700 font-semibold mb-2">
                            Backup Retention (Days)
                          </label>
                          {editMode ? (
                            <input
                              type="number"
                              name="retentionDays"
                              value={tempSettings.retentionDays}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          ) : (
                            <p className="text-gray-900 font-semibold">
                              {settings.retentionDays} days
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Manual Backup */}
                <div className="border-b pb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Manual Backup
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create an immediate backup of your data
                  </p>
                  <button
                    onClick={handleEnableBackup}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition"
                  >
                    💾 Create Backup Now
                  </button>
                </div>

                {/* Backup History */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Backups
                  </h3>
                  <div className="space-y-3">
                    {[
                      { date: "2024-03-07 02:00", size: "245 MB", status: "✅ Success" },
                      { date: "2024-03-06 02:00", size: "242 MB", status: "✅ Success" },
                      { date: "2024-03-05 02:00", size: "238 MB", status: "✅ Success" },
                    ].map((backup, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {backup.date}
                          </p>
                          <p className="text-sm text-gray-600">{backup.size}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold">
                            {backup.status}
                          </span>
                          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                            📥 Restore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USER MANAGEMENT */}
          {activeTab === "users" && (
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">
                User Management
              </h2>

              <div className="space-y-8">
                {/* Active Users */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Active Users (3)
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        name: "John Doe",
                        email: "john@hazina.com",
                        role: "Administrator",
                        status: "Active",
                      },
                      {
                        name: "Mary Jane",
                        email: "mary@hazina.com",
                        role: "Manager",
                        status: "Active",
                      },
                      {
                        name: "Samuel Kipchoge",
                        email: "samuel@hazina.com",
                        role: "Warehouse Staff",
                        status: "Active",
                      },
                    ].map((user, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {user.role}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                            {user.status}
                          </span>
                          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Roles */}
                <div className="border-t pt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    User Roles & Permissions
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        role: "Administrator",
                        description: "Full system access",
                        count: 1,
                      },
                      { role: "Manager", description: "Reporting & analytics", count: 1 },
                      {
                        role: "Warehouse Staff",
                        description: "Inventory management",
                        count: 1,
                      },
                      {
                        role: "Delivery Staff",
                        description: "Delivery tracking only",
                        count: 0,
                      },
                      {
                        role: "System Auditor",
                        description: "Audit logs access",
                        count: 0,
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.role}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {item.count} user{item.count !== 1 ? "s" : ""}
                          </span>
                          <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                            Edit Permissions
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;