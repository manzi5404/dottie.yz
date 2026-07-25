import axios from 'axios';

const isProduction = typeof window !== 'undefined' && window.location.hostname === 'dottie.yzrw.netlify.app';
const API_BASE_URL = isProduction ? 'https://dottie.yz-mqgz.onrender.com' : (import.meta.env.VITE_API_URL || 'http://localhost:3000');
const ADMIN_API_URL = `${API_BASE_URL}/api/admin/drops`;

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

// Attach auth token to all requests
axios.interceptors.request.use(
  (config) => {
      const token = localStorage.getItem('dottie_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    return config;
  },
  (error) => Promise.reject(error)
);

const DropService = {
    verifySession: async () => {
        try {
            const response = await axios.get('/api/auth/me');
            return response.data;
        } catch (error) {
            console.error('Session verification failed:', error);
            throw error;
        }
    },

    login: async (email, password) => {
        try {
            const response = await axios.post('/api/auth/login', { email, password });
            const data = response.data;
            if (data.success && data.access_token) {
                localStorage.setItem('dottie_token', data.access_token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
            }
            return data;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    },

    googleLogin: async (token) => {
        try {
            const response = await axios.post('/api/auth/google', { token });
            return response.data;
        } catch (error) {
            console.error('Google login failed:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
        localStorage.removeItem('dottie_token');
        delete axios.defaults.headers.common['Authorization'];
        const response = await axios.post('/api/auth/logout');
        return response.data;
        } catch (error) {
        localStorage.removeItem('dottie_token');
        delete axios.defaults.headers.common['Authorization'];
        console.error('Logout failed:', error);
        throw error;
        }
    },

    getDrops: async (activeOnly = false, includeProducts = false) => {
        try {
            const response = await axios.get('/api/drops', { params: { active: activeOnly, includeProducts } });
            return response.data.drops || [];
        } catch (error) {
            console.error('Error fetching drops:', error);
            throw error;
        }
    },

    createDrop: async (dropData) => {
        try {
            const response = await axios.post(ADMIN_API_URL, dropData);
            return response.data;
        } catch (error) {
            console.error('Error creating drop:', error);
            throw error;
        }
    },

    updateDrop: async (id, dropData) => {
        try {
            const response = await axios.put(`${ADMIN_API_URL}/${id}`, dropData);
            return response.data;
        } catch (error) {
            console.error('Error updating drop:', error);
            throw error;
        }
    },

    deleteDrop: async (id) => {
        try {
            const response = await axios.delete(`${ADMIN_API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting drop:', error);
            throw error;
        }
    },

    // Product APIs
    getProducts: async (dropId = null) => {
        try {
            const response = await axios.get('/api/products', { params: { dropId } });
            return response.data.products || [];
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    },

    createProduct: async (productData) => {
        try {
            const response = await axios.post('/api/products', productData);
            return response.data;
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    },

    updateProduct: async (id, productData) => {
        try {
            const response = await axios.put(`/api/products/${id}`, productData);
            return response.data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    },

    deleteProduct: async (id) => {
        try {
            const response = await axios.delete(`/api/products/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    },

    // Store Config APIs
    getStoreConfig: async () => {
        try {
            const response = await axios.get('/api/admin/store-config');
            return response.data;
        } catch (error) {
            console.error('Error fetching store config:', error);
            throw error;
        }
    },

    updateStoreConfig: async (configData) => {
        try {
            const response = await axios.put('/api/admin/store-config', configData);
            return response.data;
        } catch (error) {
            console.error('Error updating store config:', error);
            throw error;
        }
    },



    // Order APIs
    getOrders: async () => {
        try {
            const response = await axios.get('/api/orders');
            return response.data.orders || [];
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    },

    updateOrderStatus: async (id, status) => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await axios.put(`${API_BASE}/api/admin/orders/${id}/status`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    },

    // Settings APIs
    getSettings: async () => {
        try {
            const response = await axios.get('/api/settings');
            return response.data;
        } catch (error) {
            console.error('Error fetching settings:', error);
            throw error;
        }
    },

    updateSetting: async (settingKey, settingValue) => {
        try {
            const response = await axios.put('/api/settings', {
                setting_key: settingKey,
                setting_value: settingValue
            });
            return response.data;
        } catch (error) {
            console.error('Error updating setting:', error);
            throw error;
        }
    },

    getWaitlist: async () => {
        try {
            const response = await axios.get('/api/waitlist');
            return response.data;
        } catch (error) {
            console.error('Error fetching waitlist:', error);
            throw error;
        }
    },

    addToWaitlist: async (email, name = null) => {
        try {
            const response = await axios.post('/api/waitlist', {
                email,
                name,
                source: 'admin'
            });
            return response.data;
        } catch (error) {
            console.error('Error adding to waitlist:', error);
            throw error;
        }
    },

    uploadImage: async (file) => {
        try {
            const form = new FormData();
            form.append('file', file);
            const response = await axios.post('/api/upload', form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    },

    // Site status APIs
    broadcastSiteStatusEmails: async () => {
        try {
            const response = await axios.post('/api/site-status/broadcast');
            return response.data;
        } catch (error) {
            console.error('Error broadcasting site status emails:', error);
            throw error;
        }
    },

    // Announcement APIs

    getAnnouncement: async () => {
        try {
            const response = await axios.get('/api/announcement');
            return response.data.announcement || null;
        } catch (error) {
            console.error('Error fetching announcement:', error);
            throw error;
        }
    },

    updateAnnouncement: async (announcementData) => {
        try {
            const response = await axios.put('/api/admin/announcement', announcementData);
            return response.data;
        } catch (error) {
            console.error('Error updating announcement:', error);
            throw error;
        }
    },

    // Contact Messages APIs
    getMessages: async (status = '') => {
        try {
            const response = await axios.get('/api/admin/messages', { params: { status } });
            return response.data;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    },

    getMessageById: async (id) => {
        try {
            const response = await axios.get(`/api/admin/messages/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching message:', error);
            throw error;
        }
    },

    updateMessageStatus: async (id, status) => {
        try {
            const response = await axios.patch(`/api/admin/messages/${id}`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating message status:', error);
            throw error;
        }
    },

    // Notification APIs
    getNotifications: async (unseenOnly = false) => {
        try {
            const response = await axios.get('/api/admin/notifications', { params: { unseen: unseenOnly } });
            return response.data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    getNotificationCount: async () => {
        try {
            const response = await axios.get('/api/admin/notifications/count');
            return response.data;
        } catch (error) {
            console.error('Error fetching notification count:', error);
            throw error;
        }
    },

    markNotificationSeen: async (id) => {
        try {
            const response = await axios.patch(`/api/admin/notifications/${id}/seen`);
            return response.data;
        } catch (error) {
            console.error('Error marking notification:', error);
            throw error;
        }
    },

    markAllNotificationsSeen: async () => {
        try {
            const response = await axios.post('/api/admin/notifications/seen-all');
            return response.data;
        } catch (error) {
            console.error('Error marking all notifications:', error);
            throw error;
        }
    }
};

export default DropService;
