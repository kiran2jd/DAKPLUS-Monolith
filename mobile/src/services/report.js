import api from './api';

export const reportService = {
    submitReport: async (reportData) => {
        const response = await api.post('reports/', reportData);
        return response.data;
    },

    getReportsByTest: async (testId) => {
        const response = await api.get(`reports/test/${testId}`);
        return response.data;
    }
};
