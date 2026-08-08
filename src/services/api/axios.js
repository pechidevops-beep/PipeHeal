import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  withCredentials: true, // Crucial for sending httpOnly refresh cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

let currentAccessToken = null;

export const setAccessToken = (token) => {
  currentAccessToken = token;
};

// We will inject the interceptor dynamically from AuthContext 
// to avoid circular dependencies and properly handle the logout action.

export default apiClient;
