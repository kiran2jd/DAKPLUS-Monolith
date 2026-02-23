import api from './api';

export const resultService = {
    submitTest: async (submissionData) => {
        const response = await api.post('/results/submit', submissionData);
        return response.data;
    },

    getResultById: async (resultId) => {
        const response = await api.get(`/results/${resultId}`);
        return response.data;
        return response.data;
    },

    getResultsByUser: async (userId) => {
        const response = await api.get(`/results/user/${userId}`);
        // Handle wrapped responses or unexpected formats
        const data = response.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && Array.isArray(data.results)) return data.results;
        console.warn('Unexpected results response format:', data);
        return [];
    },

    getLeaderboard: async (period = 'weekly') => {
        try {
            const response = await api.get(`/results/leaderboard?period=${period}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    },

    checkSubmission: async (userId, testId) => {
        const response = await api.get(`/results/check-submission?userId=${userId}&testId=${testId}`);
        return response.data.submitted;
    }
};
