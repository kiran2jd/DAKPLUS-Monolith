import api from './api';

export const reportService = {
    submitReport: async (reportData) => {
        const user = JSON.parse(localStorage.getItem('user'));
        const payload = {
            ...reportData,
            userId: user?.id || user?._id
        };
        const response = await api.post('/reports/', payload);
        return response.data;
    },

    getAllReports: async () => {
        const response = await api.get('/reports/');
        return response.data;
    },

    getReportsByTest: async (testId) => {
        const response = await api.get(`/reports/test/${testId}`);
        return response.data;
    }
};
