import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (user) {
        // Try to get profile from localStorage
        const saved = localStorage.getItem("hazina_user_profile");
        if (saved) {
          try {
            const profile = JSON.parse(saved);
            setUserProfile(profile);
          } catch {
            setUserProfile(null);
          }
        } else {
          // Profile not in localStorage yet — wait a tick and try again
          // This handles the timing issue where onAuthStateChanged fires
          // before Login.jsx finishes saving to localStorage
          setTimeout(() => {
            const retried = localStorage.getItem("hazina_user_profile");
            if (retried) {
              try {
                setUserProfile(JSON.parse(retried));
              } catch {
                setUserProfile(null);
              }
            }
          }, 300);
        }
      } else {
        setUserProfile(null);
        localStorage.removeItem("hazina_user_profile");
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Also watch localStorage directly for profile changes
  // This ensures ProtectedRoute always has the latest profile
  useEffect(() => {
    if (currentUser && !userProfile) {
      const saved = localStorage.getItem("hazina_user_profile");
      if (saved) {
        try {
          setUserProfile(JSON.parse(saved));
        } catch {
          setUserProfile(null);
        }
      }
    }
  }, [currentUser, userProfile]);

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem("hazina_user_profile");
    setUserProfile(null);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    logout,
  };

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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}