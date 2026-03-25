import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { currentUser, userProfile, loading } = useAuth();

  // Wait for Firebase to finish checking auth state before deciding
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-4xl mb-4">🛒</p>
          <p className="text-green-700 font-semibold text-lg">Hazina</p>
          <p className="text-gray-400 text-sm mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in at all → send to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If no role restriction, allow all logged-in users
  if (allowedRoles.length === 0) {
    return children;
  }

  // Administrator can access everything — never block them
  if (userProfile?.role === "Administrator") {
    return children;
  }

  // Check if user's role is in the allowed list
  if (allowedRoles.includes(userProfile?.role)) {
    return children;
  }

  // Role not allowed → send back to login
  return <Navigate to="/login" replace />;
}

export default ProtectedRoute;