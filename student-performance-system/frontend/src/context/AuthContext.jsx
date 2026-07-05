import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Create custom API client with default configurations
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// GLOBAL CACHING LAYER to prevent continuous re-rendering and persist data globally
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Routes that should never be cached (real-time or frequently changing)
const NO_CACHE_PATTERNS = ['/messages', '/auth/me', '/unread-count'];
const shouldCache = (url) => !NO_CACHE_PATTERNS.some(p => url.includes(p));

// Helper to generate a unique cache key incorporating query parameters
const getCacheKey = (url, config) => {
  if (!config || !config.params) return url;
  try {
    // Stringify and sort query parameters to ensure consistency
    const sortedParams = Object.keys(config.params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = config.params[key];
        return acc;
      }, {});
    return `${url}?${new URLSearchParams(sortedParams).toString()}`;
  } catch (e) {
    return url;
  }
};

const originalGet = api.get;
api.get = async (url, config = {}) => {
  const cacheKey = getCacheKey(url, config);
  // Use cached data if available and valid (skip for real-time routes)
  if (!config.forceRefresh && shouldCache(url) && apiCache.has(cacheKey)) {
    const cached = apiCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return { data: cached.data, status: 200, statusText: 'OK', headers: {}, config };
    }
  }
  
  const response = await originalGet.call(api, url, config);
  // Persist response to cache (skip for real-time routes)
  if (shouldCache(url)) {
    apiCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
  }
  return response;
};

// Clear cache automatically on any DB modification
const clearCache = () => apiCache.clear();

const originalPost = api.post;
api.post = async (url, data, config) => { clearCache(); return originalPost.call(api, url, data, config); };

const originalPut = api.put;
api.put = async (url, data, config) => { clearCache(); return originalPut.call(api, url, data, config); };

const originalDelete = api.delete;
api.delete = async (url, config) => { clearCache(); return originalDelete.call(api, url, config); };

const originalPatch = api.patch;
api.patch = async (url, data, config) => { clearCache(); return originalPatch.call(api, url, data, config); };


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Configure api request interceptor to automatically inject token
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Clean up interceptor on unmount
    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, []);

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

  const login = useCallback(async (email, password) => {
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
  }, []);

  const register = useCallback(async (name, email, password, role = 'student') => {
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      if (res.data && res.data.success) {
        const { token: userToken, user: userData, profile: userProfile } = res.data;
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(userData);
        setProfile(userProfile);
        return { success: true, role: userData.role };
      }
      return { success: false, error: 'Registration failed.' };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Server error occurred during registration';
      return { success: false, error: errorMsg };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setProfile(null);
  }, []);

  const updateProfileLocally = useCallback((updatedProfile) => {
    setProfile(updatedProfile);
  }, []);

  const contextValue = useMemo(() => ({
    user, token, profile, loading, login, logout, register, updateProfileLocally
  }), [user, token, profile, loading, login, logout, register, updateProfileLocally]);

  return (
    <AuthContext.Provider value={contextValue}>
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
