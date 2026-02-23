import api from './api';
import * as SecureStore from 'expo-secure-store';

export const authService = {
    async sendOtp(identifier) {
        const response = await api.post('auth/send-otp', { identifier });
        return response.data;
    },

    async verifyOtp(identifier, otp) {
        const response = await api.post('auth/verify-otp', { identifier, otp, persistent: true });
        const { access_token, user } = response.data;
        if (access_token) {
            await SecureStore.setItemAsync('access_token', access_token);
            await SecureStore.setItemAsync('user', JSON.stringify(user));
        }
        return response.data;
    },

    async login(identifier, password) {
        const response = await api.post('auth/login', { identifier, password, persistent: true });
        const { access_token, user } = response.data;
        if (access_token) {
            await SecureStore.setItemAsync('access_token', access_token);
            await SecureStore.setItemAsync('user', JSON.stringify(user));
        }
        return response.data;
    },

    async register(userData) {
        const response = await api.post('auth/register', { ...userData, persistent: true });
        const { access_token, user } = response.data;
        if (access_token) {
            await SecureStore.setItemAsync('access_token', access_token);
            await SecureStore.setItemAsync('user', JSON.stringify(user));
        }
        return response.data;
    },

    async logout() {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('user');
    },

    async isAuthenticated() {
        const token = await SecureStore.getItemAsync('access_token');
        return !!token;
    },

    async getUser() {
        const userStr = await SecureStore.getItemAsync('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    async getProfile() {
        const response = await api.get('auth/profile');
        const user = response.data.user;
        if (user) {
            await SecureStore.setItemAsync('user', JSON.stringify(user));
        }
        return user;
    },

    async validateSession() {
        try {
            const token = await SecureStore.getItemAsync('access_token');
            if (!token) return false;
            // The interceptor likely adds the token, but we might need X-User-Id and X-Session-Id headers 
            // if the backend requires them specifically, or just rely on the token claims.
            // Based on AuthController, it expects X-User-Id and X-Session-Id.
            // However, usually these are extracted from the JWT token in a real Gateway or Filter.
            // Assuming the API client handles headers or we pass them here.

            // For now, let's try a simple call. If the backend needs headers, we might need to exact from stored user.
            const userStr = await SecureStore.getItemAsync('user');
            if (!userStr) return false;
            const user = JSON.parse(userStr);

            // We need the sessionId. Is it in the user object? 
            // Looking at AuthService.verifyOtp, it saves activeSessionId to the user.
            // Check if user object has activeSessionId.

            if (!user.activeSessionId) return true; // Optimistic if not present? Or false?

            const response = await api.get('auth/validate-session', {
                headers: {
                    'X-User-Id': user.id,
                    'X-Session-Id': user.activeSessionId
                }
            });
            return response.data.valid;
        } catch (error) {
            console.error("Session validation failed:", error);
            return false;
        }
    }
};
