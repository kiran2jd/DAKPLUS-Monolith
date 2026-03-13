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

        // Detect and fix missing extension in filename if necessary
        let finalName = fileName || 'document.pdf';
        
        // If fileName is generic or missing extension, fallback to URI parsing
        if (!finalName.includes('.') || finalName === 'document.pdf') {
            const uriParts = fileUri.split('/');
            const uriName = uriParts[uriParts.length - 1].split('?')[0]; // Remove query params
            if (uriName.includes('.')) {
                finalName = uriName;
                console.log("Fallback filename to URI segment:", finalName);
            } else if (fileType) {
                // Map common mime types if still no extension
                if (fileType.includes('pdf')) finalName = 'document.pdf';
                else if (fileType.includes('word') || fileType.includes('officedocument')) finalName = 'document.docx';
                else if (fileType.includes('text')) finalName = 'document.txt';
            }
        }

        if (fileType === 'application/pdf' && !finalName.toLowerCase().endsWith('.pdf')) finalName += '.pdf';
        if ((fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') && !finalName.toLowerCase().endsWith('.docx') && !finalName.toLowerCase().endsWith('.doc')) finalName += '.docx';
        if (fileType === 'text/plain' && !finalName.toLowerCase().endsWith('.txt')) finalName += '.txt';

        console.log(`Sending file: ${finalName} (${fileType})`);
        formData.append('file', {
            uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
            name: finalName,
            type: fileType || 'application/pdf'
        });

        if (topicId) formData.append('topicId', topicId);
        if (subtopicId) formData.append('subtopicId', subtopicId);

        console.log(`Sending file: ${finalName} (${fileType}) to ${api.defaults.baseURL}tests/extract-questions`);
        const response = await api.post('tests/extract-questions', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            timeout: 120000 // Match backend AI timeout (2 minutes)
        });
        return response.data;
    }
};
