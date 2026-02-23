import api from './api';
import * as SecureStore from 'expo-secure-store';

export const resultService = {
    submitTest: async (submissionData) => {
        const response = await api.post('results/submit', submissionData);
        return response.data;
    },

    getResultById: async (resultId) => {
        const response = await api.get(`results/${resultId}`);
        return response.data;
    },

    getResultsByUser: async (userId) => {
        const response = await api.get(`results/user/${userId}`);
        return response.data;
    },

    getMyResults: async () => {
        try {
            // Get user from SecureStore
            const userStr = await SecureStore.getItemAsync('user');
            if (!userStr) {
                console.log('No user found in SecureStore');
                return [];
            }

            const user = JSON.parse(userStr);
            const userId = user.id || user._id || user.userId;

            if (!userId) {
                console.log('No user ID found in user object');
                return [];
            }

            console.log('Fetching results for user:', userId);
            const response = await api.get(`results/user/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error in getMyResults:', error);
            return [];
        }
    },

    getLeaderboard: async (period = 'weekly') => {
        try {
            const response = await api.get(`results/leaderboard?period=${period}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    }
};
