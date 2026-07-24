const API_BASE_URL = window.API_BASE_URL || document.body?.dataset?.apiBaseUrl || (() => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5000';
    return 'https://DOTTIE-backend-production.up.railway.app';
})();

export const authAPI = {
    async register(email, password, name) {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Registration failed');
        return data;
    },

    async login(email, password) {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        return data;
    },

    async me() {
        const token = localStorage.getItem('dottie_token');
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch profile');
        return data;
    },

    setSession(token, user) {
        localStorage.setItem('dottie_token', token);
        localStorage.setItem('dottie_user', JSON.stringify(user));
    },

    clearSession() {
        localStorage.removeItem('dottie_token');
        localStorage.removeItem('dottie_user');
    },

    isLoggedIn() {
        return !!localStorage.getItem('dottie_token');
    },

    getUser() {
        return JSON.parse(localStorage.getItem('dottie_user') || 'null');
    }
};

