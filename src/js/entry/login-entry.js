import Alpine from 'alpinejs';

window.authLogic = () => ({
    email: '',
    password: '',
    rememberMe: false,
    loading: false,

    async login() {
        this.loading = true;
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: this.email, password: this.password })
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || data.error || 'Login failed');

            localStorage.setItem('dottie_token', data.access_token || data.token);
            const userName = data.user?.name || data.name || this.email;
            localStorage.setItem('dottie_user', JSON.stringify({ name: userName, id: data.user?.id || data.userId }));
            
            window.dispatchEvent(new CustomEvent('notify', { detail: { message: 'Logged in successfully', type: 'success' } }));
            setTimeout(() => window.location.href = '/index.html', 1500);
        } catch (error) {
            window.dispatchEvent(new CustomEvent('notify', { detail: { message: error.message, type: 'error' } }));
        } finally {
            this.loading = false;
        }
    }
});

window.Alpine = Alpine;
Alpine.start();
