import api from './api';

export const testService = {
    createTest: async (testData) => {
        const response = await api.post('/tests/', testData);
        return response.data;
    },

    getMyTests: async () => {
        const response = await api.get('/tests/my-tests');
        // Handle wrapped responses or unexpected formats
        const data = response.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && Array.isArray(data.tests)) return data.tests;
        console.warn('Unexpected my-tests response format:', data);
        return [];
    },

    getTestById: async (testId) => {
        const response = await api.get(`/tests/${testId}`);
        return response.data;
    },

    // Student Methods
    getAvailableTests: async () => {
        const response = await api.get('/tests/available/all');
        // Handle wrapped responses or unexpected formats
        const data = response.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && Array.isArray(data.tests)) return data.tests;
        console.warn('Unexpected available tests response format:', data);
        return [];
    },

    updateTest: async (id, testData) => {
        const response = await api.put(`/tests/${id}`, testData);
        return response.data;
    },

    takeTest: async (testId) => {
        const response = await api.get(`/tests/${testId}/take`);
        return response.data;
    },

    deleteTest: async (testId) => {
        const response = await api.delete(`/tests/${testId}`);
        return response.data;
    },

    extractQuestions: async (file, topicId, subtopicId) => {
        const formData = new FormData();
        formData.append('file', file);
        if (topicId) formData.append('topicId', topicId);
        if (subtopicId) formData.append('subtopicId', subtopicId);

        const response = await api.post('/tests/extract-questions', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};
