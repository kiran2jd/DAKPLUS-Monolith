import api from './api';

export const topicService = {
    getAllTopics: async () => {
        const response = await api.get('/topics/');
        console.log('Topics API Response:', response.data);

        const data = response.data;

        // The API returns {value: [...], Count: N} format
        if (data && Array.isArray(data.value)) {
            console.log('Topics found in value property:', data.value.length);
            return data.value;
        }

        // Fallback: If it's already an array
        if (Array.isArray(data)) {
            console.log('Topics found (direct array):', data.length);
            return data;
        }

        // Fallback: If wrapped in data property
        if (data && Array.isArray(data.data)) {
            console.log('Topics found (wrapped in data):', data.data.length);
            return data.data;
        }

        // Fallback: If wrapped in topics property
        if (data && Array.isArray(data.topics)) {
            console.log('Topics found (wrapped in topics):', data.topics.length);
            return data.topics;
        }

        // If it's an object with no array, might be a single topic - wrap it
        if (data && typeof data === 'object' && data.id) {
            console.log('Single topic returned, wrapping in array');
            return [data];
        }

        console.error('Unexpected topics response format:', data);
        return [];
    },

    getTopicById: async (id) => {
        const response = await api.get(`/topics/${id}`);
        return response.data;
    },

    getSubtopics: async (topicId) => {
        const response = await api.get(`/topics/${topicId}/subtopics`);
        const data = response.data;

        // The API returns {value: [...], Count: N} format
        if (data && Array.isArray(data.value)) {
            return data.value;
        }

        // Fallbacks for other formats
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && Array.isArray(data.subtopics)) return data.subtopics;

        console.warn('Unexpected subtopics response format:', data);
        return [];
    },

    createTopic: async (topicData) => {
        const response = await api.post('/topics/', topicData);
        return response.data;
    },

    createSubtopic: async (subtopicData) => {
        const response = await api.post('/topics/subtopics', subtopicData);
        return response.data;
    },

    deleteTopic: async (id) => {
        const response = await api.delete(`/topics/${id}`);
        return response.data;
    },

    deleteSubtopic: async (id) => {
        const response = await api.delete(`/topics/subtopics/${id}`);
        return response.data;
    }
};
