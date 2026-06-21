import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api.js';
// Create a context for authentication
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on app load
  useEffect(() => {
    API.getCurrentUser()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  // Login function
  const login = async (username, password) => {
    const u = await API.login(username, password);
    setUser(u);
    return u;
  };
  // Signup function
  const signup = async (username, email, password) => {
    const u = await API.signup(username, email, password);
    setUser(u); // signup also logs the user in immediately, same as login
    return u;
  };
  // Logout function
  const logout = async () => {
    await API.logout();
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
