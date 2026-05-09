import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api', // Gateway Port
});

// Add interceptor to include token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    let user = {};

    try {
        if (userStr && userStr !== 'undefined' && userStr !== 'null') {
            user = JSON.parse(userStr);
        }
    } catch (e) {
        console.warn("Failed to parse user from localStorage", e);
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Default to JSON if not specified and not FormData
    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    }

    // Ensure FormData doesn't have a Content-Type set (let the browser/Axios set it with boundary)
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    // Inject user ID and Session ID for backend identification & security
    const userId = user?.id || user?._id || user?.userId;
    if (userId) {
        config.headers['X-User-Id'] = userId;
    }

    const sessionId = user?.activeSessionId || user?.sessionId;
    if (sessionId) {
        config.headers['X-Session-Id'] = sessionId;
    }

    return config;
});

export const getImageURL = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1010/api';
    // Ensure we don't double slash
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanUrl}`;
};

export default api;
