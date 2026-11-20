import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Aapka Backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Har request ke sath Token bhejne ke liye
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);