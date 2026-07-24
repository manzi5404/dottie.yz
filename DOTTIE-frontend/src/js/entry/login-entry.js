import Alpine from 'alpinejs';
import { authAPI } from '../auth.js';

window.Alpine = Alpine;

Alpine.data('authLogic', () => ({
    email: '',
    password: '',
    rememberMe: false,
    loading: false,

    async login() {
        this.loading = true;
        try {
            const data = await authAPI.login(this.email, this.password);
            authAPI.setSession(data.access_token, data.user);
            window.dispatchEvent(new CustomEvent('notify', { detail: { message: 'Logged in successfully', type: 'success' } }));
            setTimeout(() => window.location.href = '/shop.html', 1500);
        } catch (error) {
            window.dispatchEvent(new CustomEvent('notify', { detail: { message: error.message, type: 'error' } }));
        } finally {
            this.loading = false;
        }
    }
}));

Alpine.start();
