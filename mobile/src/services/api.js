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
        url = 'https://api.dakplus.in/api/';
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
        'Content-Type': 'application/json',
    },
    timeout: 60000, // 60 second timeout for mobile data resilience
});

// Interceptor to add JWT token and User ID
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
    return config;
});

// Response interceptor for better error handling/logging
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check if we haven't already retried and it's a network/server error
        if (error.message !== 'canceled' && !originalRequest._retry &&
            (!error.response || error.response.status >= 500 || error.code === 'ERR_NETWORK')) {

            originalRequest._retry = true;
            console.log('Primary API failed, attempting fallback to Railway...', error.message);

            // Switch baseURL to backup
            // Note: axios instance baseURL isn't automatically updated for the retry, 
            // we must update the request url manually
            const backupUrl = RAILWAY_BACKUP_URL;

            // If the original URL was absolute and matched primary, replace it
            if (originalRequest.url?.startsWith('http')) {
                // It's already an absolute URL, we might need to be careful.
                // Simply replacing the baseURL in the instance for future requests might be better logic
                // but for this specific request, we need to correct the URL.
            }

            // Update instance defaults for future requests
            api.defaults.baseURL = backupUrl;

            // Fix the current request URL
            // If originalRequest.url is relative, axios uses baseURL. 
            // If we change baseURL on instance, does it apply to the retry? 
            // Better to force the new URL on the config.

            // Remove the old baseURL from the beginning if it exists, or just use the relative part
            let relativePath = originalRequest.url;
            if (relativePath.startsWith(API_BASE_URL)) {
                relativePath = relativePath.substring(API_BASE_URL.length);
            } else if (relativePath.startsWith('http')) {
                // Try to strip domain
                const urlObj = new URL(relativePath);
                relativePath = urlObj.pathname + urlObj.search;
                // Remove leading /api/ if it's doubled up (backupUrl has /api/)
                if (relativePath.startsWith('/api/')) {
                    relativePath = relativePath.substring(5);
                }
            }

            // Construct new absolute URL
            originalRequest.baseURL = backupUrl;
            originalRequest.url = relativePath;

            console.log(`Retrying request to: ${backupUrl}${relativePath}`);
            return api(originalRequest);
        }

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

export default api;
