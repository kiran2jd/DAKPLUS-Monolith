import api from './api';

export const notificationService = {
    getNotifications: async () => {
        const response = await api.get('/auth/notifications');
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await api.get('/auth/notifications/unread-count');
        return response.data;
    },

    markAsRead: async (id) => {
        const response = await api.put(`/auth/notifications/${id}/read`);
        return response.data;
    },

    deleteNotification: async (id) => {
        const response = await api.delete(`/auth/notifications/${id}`);
        return response.data;
    }
};
