import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Create custom API client with default configurations
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Configure api request interceptor to automatically inject token
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Clean up interceptor on token change
    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  // Load user profile on app load if token exists
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data && res.data.success) {
          setUser(res.data.user);
          setProfile(res.data.profile);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Error fetching current user:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.success) {
        const { token: userToken, user: userData, profile: userProfile } = res.data;
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
        setProfile(userProfile);
        return { success: true, role: userData.role };
      }
      return { success: false, error: 'Login failed. Please check credentials.' };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Server error occurred during login';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfileLocally = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  return (
    <AuthContext.Provider value={{ user, token, profile, loading, login, logout, updateProfileLocally }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
