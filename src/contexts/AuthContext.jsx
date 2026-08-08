import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, setAccessToken } from '../services/api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync token to axios client
  const updateToken = useCallback((newToken) => {
    setTokenState(newToken);
    setAccessToken(newToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      updateToken(null);
    }
  }, [updateToken]);

  // Setup Axios Interceptors
  useEffect(() => {
    const requestInterceptor = apiClient.interceptors.request.use(
      (config) => {
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        const originalRequest = error.config;
        
        // Prevent infinite loops and don't retry auth routes
        if (
          error.response?.status === 401 && 
          !originalRequest._retry && 
          !originalRequest.url.includes('/auth/refresh') &&
          !originalRequest.url.includes('/auth/login')
        ) {
          originalRequest._retry = true;
          try {
            const res = await apiClient.post('/auth/refresh');
            if (res.success && res.data.accessToken) {
              updateToken(res.data.accessToken);
              setUser(res.data.user);
              originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
              return apiClient(originalRequest);
            }
          } catch (refreshError) {
            setUser(null);
            updateToken(null);
            return Promise.reject(refreshError?.response?.data || refreshError);
          }
        }
        return Promise.reject(error.response?.data || error);
      }
    );

    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [token, updateToken]);

  // Initial session check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        const githubConnected = params.get('github') === 'connected';
        
        if (urlToken) {
          // If we received a token from GitHub redirect, save it and strip URL
          updateToken(urlToken);
          window.history.replaceState({}, document.title, window.location.pathname);
          // Fetch user profile using the token
          const res = await apiClient.get('/auth/me');
          if (res.success) setUser(res.data.user);
        } else {
          // Otherwise do silent refresh to restore session
          const res = await apiClient.post('/auth/refresh');
          if (res.success) {
            updateToken(res.data.accessToken);
            setUser(res.data.user);
            
            // If they just connected github, refresh the user data (it should already be refreshed from the refresh token but just in case)
            if (githubConnected) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        }
      } catch (err) {
        // No valid session
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [updateToken]);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.success) {
      updateToken(res.data.accessToken);
      setUser(res.data.user);
    }
    return res;
  };

  const register = async (data) => {
    const res = await apiClient.post('/auth/register', data);
    if (res.success) {
      updateToken(res.data.accessToken);
      setUser(res.data.user);
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, isLoading, login, register, logout, updateToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
