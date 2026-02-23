import { Platform } from 'react-native';
import api from './api';

export const testService = {
    createTest: async (testData) => {
        const response = await api.post('tests/', testData);
        return response.data;
    },

    getMyTests: async () => {
        const response = await api.get('tests/my-tests');
        return response.data;
    },

    getTestById: async (testId) => {
        const response = await api.get(`tests/${testId}`);
        return response.data;
    },

    getAvailableTests: async () => {
        const response = await api.get('tests/available/all');
        return response.data;
    },

    takeTest: async (testId) => {
        const response = await api.get(`tests/${testId}/take`);
        return response.data;
    },

    updateTest: async (id, testData) => {
        const response = await api.put(`tests/${id}`, testData);
        return response.data;
    },

    deleteTest: async (testId) => {
        const response = await api.delete(`tests/${testId}`);
        return response.data;
    },

    extractQuestions: async (fileUri, fileName, fileType, topicId, subtopicId) => {
        const formData = new FormData();

        // In React Native, FormData requires a file object with uri, name, and type
        formData.append('file', {
            uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
            name: fileName || 'document.pdf',
            type: fileType || 'application/pdf'
        });

        if (topicId) formData.append('topicId', topicId);
        if (subtopicId) formData.append('subtopicId', subtopicId);

        const response = await api.post('tests/extract-questions', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    }
};
