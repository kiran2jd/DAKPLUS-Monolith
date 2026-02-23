import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api', // Gateway Port
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to include token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr || '{}');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Inject user ID and Session ID for backend identification & security
    const userId = user.id || user._id || user.userId;
    if (userId) {
        config.headers['X-User-Id'] = userId;
    }

    const sessionId = user.activeSessionId || user.sessionId;
    if (sessionId) {
        config.headers['X-Session-Id'] = sessionId;
    }

    return config;
});

export default api;
