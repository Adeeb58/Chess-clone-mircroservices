import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error
            const { status, data } = error.response;

            if (status === 401) {
                // Unauthorized - clear token and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }

            // Return structured error
            return Promise.reject({
                status,
                message: data.message || 'An error occurred',
                error: data.error || 'Error',
                ...data
            });
        } else if (error.request) {
            // Request made but no response
            return Promise.reject({
                status: 0,
                message: 'Network error. Please check your connection.',
                error: 'Network Error'
            });
        } else {
            // Something else happened
            return Promise.reject({
                status: 0,
                message: error.message || 'An unexpected error occurred',
                error: 'Error'
            });
        }
    }
);

export default api;
