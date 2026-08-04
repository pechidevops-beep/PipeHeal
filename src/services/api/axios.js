import axios from 'axios';

// The base URL can be defined in .env or default to localhost:3001
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // In a real app, retrieve the token from localStorage or context
    const token = localStorage.getItem('pipeheal_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data, // Simplify the response object
  (error) => {
    // Global error handling
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.status === 401) {
        // e.g. logout user, redirect to login
        console.error('Unauthorized, token may be invalid.');
      }
      return Promise.reject(error.response.data || new Error('Server Error'));
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject(new Error('Network Error: No response from server'));
    } else {
      // Something happened in setting up the request that triggered an Error
      return Promise.reject(error);
    }
  }
);

export default apiClient;
