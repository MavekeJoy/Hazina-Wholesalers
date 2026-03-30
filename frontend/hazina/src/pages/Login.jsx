import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "", role: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: "Administrator",  label: "Administrator" },
    { value: "Manager",        label: "Manager" },
    { value: "Warehouse Staff",label: "Warehouse Staff" },
    { value: "Delivery Staff", label: "Delivery Staff" },
    { value: "System Auditor", label: "System Auditor" },
  ];

  const getFriendlyError = (code) => {
    switch (code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password. Please try again.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please wait a moment and try again.";
      case "auth/user-disabled":
        return "This account has been disabled. Contact your administrator.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();

    if (!formData.role) { setError("Please select your role."); return; }
    if (!formData.email || !formData.password) { setError("Please enter your email and password."); return; }

    setLoading(true);
    setError("");

    try {
      // Step 1: Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Step 2: Save profile to localStorage FIRST before navigating
      // This is critical — AuthContext reads this on auth state change
      const profile = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || formData.email.split("@")[0],
        role: formData.role,
      };

      localStorage.setItem("hazina_user_profile", JSON.stringify(profile));

      // Step 3: Small delay to ensure localStorage is written and
      // AuthContext has time to pick it up before route protection runs
      await new Promise((r) => setTimeout(r, 100));

      // Step 4: Navigate to dashboard
      navigate("/admin/dashboard");

    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-5/12 bg-green-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white opacity-5" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white opacity-5" />
        <div className="absolute top-1/2 right-8 w-32 h-32 rounded-full bg-green-700 opacity-30" />
        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">🛒 Hazina</h1>
          <p className="text-green-300 text-sm uppercase tracking-widest">
            Wholesale Management System
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-green-800">🛒 Hazina</h1>
            <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">
              Wholesale Management System
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm mb-7">Sign in to your Hazina account</p>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-7">
              <button
                type="button"
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-white text-green-700 shadow-sm"
              >
                👤 Staff / Admin
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition"
              >
                🛒 Retail Buyer
              </button>
            </div>

            <form onSubmit={handleStaffLogin} className="space-y-5">

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  ⚠️ {error}
                </div>
              )}

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Select your role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white text-gray-700"
                >
                  <option value="">-- Choose your role --</option>
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@hazina.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Password</label>
                  <button type="button" className="text-xs text-green-600 hover:text-green-700 font-semibold">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition pr-12"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="animate-spin">⏳</span> Signing in...</>
                ) : (
                  "Sign in to dashboard →"
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              Don't have an account?{" "}
              <span className="text-green-600 font-semibold">
                Contact your system administrator.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;