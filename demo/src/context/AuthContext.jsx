import React, { createContext, useState } from 'react';
import axios from 'axios';

// Set default Authorization header for all axios requests (development only)
axios.defaults.headers.common['Authorization'] = 'Bearer mock-token';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // MOCK USER: Always authenticated as Admin
  const mockUser = { _id: '1', name: 'Demo Admin', email: 'admin@example.com', role: 'Admin' };
  const [user, setUser] = useState(mockUser);
  const [token, setToken] = useState('mock-token');
  const [loading, setLoading] = useState(false);

  const login = async () => {};
  const signup = async () => {};
  const logout = () => {};
  const updateUser = (newUser) => setUser(newUser);

  const isAdmin = user?.role === 'Admin';
  const isStaff = user?.role === 'Staff';
  const isTrainee = user?.role === 'Trainee';
  const isGuest = user?.role === 'Guest';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, isAdmin, isStaff, isTrainee, isGuest, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}; 