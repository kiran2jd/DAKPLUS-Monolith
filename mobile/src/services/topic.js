import { Platform } from 'react-native';
import api from './api';

export const topicService = {
    async getAllTopics(courseId) {
        const url = courseId ? `/topics/?courseId=${courseId}` : '/topics/';
        const response = await api.get(url);
        return response.data;
    },

    getSubtopics: async (topicId) => {
        const response = await api.get(`topics/${topicId}/subtopics`);
        return response.data;
    },

    createTopic: async (topicData) => {
        const response = await api.post('topics/', topicData);
        return response.data;
    },

    createSubtopic: async (subtopicData) => {
        const response = await api.post('topics/subtopics', subtopicData);
        return response.data;
    },

    updateTopic: async (id, topicData) => {
        const response = await api.put(`topics/${id}`, topicData);
        return response.data;
    },

    updateSubtopic: async (id, subtopicData) => {
        const response = await api.put(`topics/subtopics/${id}`, subtopicData);
        return response.data;
    },

    deleteTopic: async (id) => {
        const response = await api.delete(`topics/${id}`);
        return response.data;
    },

    deleteSubtopic: async (id) => {
        const response = await api.delete(`topics/subtopics/${id}`);
        return response.data;
    },

    uploadSyllabusFile: async (fileUri, fileName, mimeType) => {
        const formData = new FormData();
        formData.append('file', {
            uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
            name: fileName || 'image.jpg',
            type: mimeType || 'image/jpeg'
        });

        const response = await api.post('files/upload', formData, {
            headers: {
                Accept: 'application/json'
            },
        });
        return response.data;
    }
};
