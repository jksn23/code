import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getProfile } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userData, setUserData] = useState(() => {
    try {
      const stored = localStorage.getItem('userData');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistUserData = (nextUserData) => {
    setUserData(nextUserData);
    if (nextUserData) {
      localStorage.setItem('userData', JSON.stringify(nextUserData));
    } else {
      localStorage.removeItem('userData');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setUserData(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
  };

  const refreshProfile = async () => {
    if (!token) return null;

    try {
      const res = await getProfile();
      const summary = res.data?.userSummary;
      if (summary) {
        persistUserData(summary);
        return summary;
      }
      return null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          const mergedUser = { ...decoded, ...(userData || {}) };
          setUser(mergedUser);
          localStorage.setItem('token', token);
        }
      } catch {
        logout();
      }
    } else {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    }
    setLoading(false);
  }, [token, userData]);

  useEffect(() => {
    if (!token) return;
    refreshProfile();
  }, [token]);

  const login = (newToken, newUserData) => {
    setToken(newToken);
    if (newUserData) {
      persistUserData(newUserData);
    }
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <AuthContext.Provider value={{ token, user, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
