import { createContext, useContext, useState } from 'react';
import api, { setAccessToken } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);

  const signup = async (name, email, password) => {
    const res = await api.post('/auth/signup', { name, email, password });
    setUser(res.data.user);
    setAccessTokenState(res.data.accessToken);
    setAccessToken(res.data.accessToken);
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
    setAccessTokenState(res.data.accessToken);
    setAccessToken(res.data.accessToken);
  };

  const logout = () => {
    setUser(null);
    setAccessTokenState(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);