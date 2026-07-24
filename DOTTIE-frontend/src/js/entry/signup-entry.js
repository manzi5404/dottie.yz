import Alpine from 'alpinejs';
import { authAPI } from '../auth.js';

window.Alpine = Alpine;

Alpine.data('signupLogic', () => ({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    loading: false,

    async signup() {
        if (this.password !== this.confirmPassword) {
            window.dispatchEvent(new CustomEvent('notify', { detail: { message: 'Passwords do not match', type: 'error' } }));
            return;
        }

        this.loading = true;
        try {
            await authAPI.register(this.email, this.password, this.name);

            let tokenData = null;
            try {
                tokenData = await authAPI.login(this.email, this.password);
            } catch (loginErr) {
                window.dispatchEvent(new CustomEvent('notify', { detail: { message: 'Account created. Please confirm your email, then log in.', type: 'success' } }));
                setTimeout(() => window.location.href = '/login.html', 1800);
                return;
            }

            if (tokenData && tokenData.access_token) {
                authAPI.setSession(tokenData.access_token, tokenData.user);
                window.dispatchEvent(new CustomEvent('notify', { detail: { message: 'Account created! Welcome to the movement.', type: 'success' } }));
                setTimeout(() => window.location.href = '/shop.html', 1500);
            } else {
                window.dispatchEvent(new CustomEvent('notify', { detail: { message: 'Account created. Please log in.', type: 'success' } }));
                setTimeout(() => window.location.href = '/login.html', 1500);
            }
        } catch (error) {
            window.dispatchEvent(new CustomEvent('notify', { detail: { message: error.message, type: 'error' } }));
        } finally {
            this.loading = false;
        }
    }
}));

Alpine.start();
