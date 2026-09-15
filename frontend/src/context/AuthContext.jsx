import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/api";

const defaultAuthValue = {
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  refreshUser: async () => null,
  isLoggedIn: false,
};

const AuthContext = createContext(defaultAuthValue);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      return localStorage.getItem("token") || null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await API.get("/auth/profile");
      if (res.data && res.data.user) {
        setUser(res.data.user);
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
        return res.data.user;
      }
    } catch (e) {
      console.warn("Failed to refresh user profile:", e);
    }
    return null;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
      API.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      // Asynchronously refresh user status from database (e.g. check for admin approval)
      API.get("/auth/profile").then(res => {
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
      }).catch(() => {});
    }
    setLoading(false);
  }, []);

  const login = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("token", tokenStr);
      localStorage.setItem("user", JSON.stringify(userData));
    }
    API.defaults.headers.common["Authorization"] = `Bearer ${tokenStr}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    delete API.defaults.headers.common["Authorization"];
  };

  const updateUser = (updatedData) => {
    setUser(prev => {
      const next = typeof updatedData === 'function' ? updatedData(prev) : { ...prev, ...updatedData };
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("user", JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, refreshUser, loading, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext) || defaultAuthValue;

