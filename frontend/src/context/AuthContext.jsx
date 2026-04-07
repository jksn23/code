import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  // userData menyimpan info tambahan seperti isVerified yang tidak ada di JWT
  const [userData, setUserData] = useState(() => {
    try {
      const stored = localStorage.getItem('userData');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if expired
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          // Gabungkan decoded JWT dengan userData tambahan (isVerified, nama, dll)
          const mergedUser = { ...decoded, ...(userData || {}) };
          setUser(mergedUser);
          localStorage.setItem('token', token);
        }
      } catch (e) {
        logout();
      }
    } else {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
    }
    setLoading(false);
  }, [token, userData]);

  const login = (newToken, newUserData) => {
    setToken(newToken);
    if (newUserData) {
      setUserData(newUserData);
      localStorage.setItem('userData', JSON.stringify(newUserData));
    }
    // user state akan diupdate oleh useEffect di atas
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setUserData(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
