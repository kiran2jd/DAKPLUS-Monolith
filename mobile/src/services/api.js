import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import Constants from 'expo-constants';

// Strategy for resolving API URL:
// 1. Process environment (for local dev/web)
// 2. Expo Constants (for EAS builds/standalone APKs)
// 3. Last resort hardcoded production URL
const getApiUrl = () => {
    let url = '';
    if (process.env.EXPO_PUBLIC_API_URL) {
        url = process.env.EXPO_PUBLIC_API_URL;
    } else if (Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL) {
        url = Constants.expoConfig.extra.EXPO_PUBLIC_API_URL;
    } else {
        // Primary custom domain (api.dakplus.in)
        // Fallback to Railway direct URL if custom domain is blocked by DNS/ISP
        url = 'https://api-v2.dakplus.in/api/';
    }

    // Ensure it ends with / for consistent path joining
    return url.endsWith('/') ? url : `${url}/`;
};

// Secondary fallback for robust connectivity on mobile data
const RAILWAY_BACKUP_URL = 'https://api-gateway-production-bb02.up.railway.app/api/';

const API_BASE_URL = getApiUrl();

console.log('Mobile App API Configuration:');
console.log('Primary API_BASE_URL:', API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        Accept: 'application/json',
    },
    timeout: 60000, // 60 second timeout for mobile data resilience
});

// Interceptor to add JWT token and User ID
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Force Axios to recalculate Content-Type for FormData to ensure boundary is present
    if (config.data instanceof FormData) {
        if (config.headers['Content-Type']) {
            delete config.headers['Content-Type'];
        }
    }

    const userStr = await SecureStore.getItemAsync('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        // Inject user ID and Session ID for backend identification & security
        const userId = user.id || user._id || user.userId;
        if (userId) {
            config.headers['X-User-Id'] = userId;
        }

        const sessionId = user.activeSessionId || user.sessionId;
        if (sessionId) {
            config.headers['X-Session-Id'] = sessionId;
        }
    }

    // DEBUG: Log header size if large
    const headerSize = JSON.stringify(config.headers).length;
    if (headerSize > 8192) {
        console.warn(`[API] Large headers detected: ${headerSize} bytes`);
    }

    return config;
});

// Response interceptor for better error handling/logging
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        console.error('API Error Details:');
        if (error.response) {
            // The server responded with a status code out of the 2xx range
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('URL:', error.config.url);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received. Possible network or DNS issue.');
            console.error('Request info:', error.request);
            console.error('Config URL:', error.config.url);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error Message:', error.message);
        }
        return Promise.reject(error);
    }
);

export { API_BASE_URL };
export default api;
