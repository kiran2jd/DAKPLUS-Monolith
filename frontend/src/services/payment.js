import api from './api';

export const paymentService = {
    /**
     * Create a Razorpay Order on the backend
     * @param {number} amount - Amount in INR
     * @returns {Promise<Object>} - Order details including orderId
     */
    async createOrder(amount, itemId = 'SUBSCRIPTION_PRO', itemType = 'SUBSCRIPTION') {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await api.post('/payments/create-order', {
            amount,
            userId: user?.id || user?._id,
            itemId,
            itemType
        });
        return response.data;
    },

    /**
     * Verify the payment signature on the backend
     * @param {Object} paymentData - Data returned by Razorpay Checkout
     * @returns {Promise<Object>} - Verification result
     */
    verifyPayment: async (paymentData) => {
        try {
            const response = await api.post('/payments/verify-payment', paymentData);
            return response.data;
        } catch (error) {
            console.error('Error verifying Razorpay payment:', error);
            throw error.response?.data || error.message;
        }
    },

    async checkAccess(itemId) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return false;
        try {
            const response = await api.get(`/payments/check-access?userId=${user.id || user._id}&itemId=${itemId}`);
            return response.data.hasAccess;
        } catch (error) {
            console.error("Failed to check access:", error);
            return false;
        }
    },

    async getUserPurchases() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return [];
        try {
            const response = await api.get(`/payments/user-purchases?userId=${user.id || user._id}`);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch purchases:", error);
            return [];
        }
    }
};
