import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import gsap from 'gsap';
import shopLogic from './shop.js';
import productLogic from './product.js';
import { initHeroAnimation } from './animations.js';
import './announcement-entry.jsx';

const API_BASE_URL = (() => {
    const host = window.location.hostname;
    if (host === 'localhost') return 'http://localhost:3000';
    if (host === '127.0.0.1') return 'http://localhost:3000';
    return 'https://DOTTIE-backend-production.up.railway.app';
})();

window.API_BASE_URL = API_BASE_URL;

window.Alpine = Alpine;
window.gsap = gsap;
Alpine.plugin(collapse);

document.addEventListener("alpine:init", () => {
    Alpine.data("shopLogic", shopLogic);
    Alpine.data("productLogic", productLogic);
});

Alpine.start();

document.addEventListener("DOMContentLoaded", () => {
    initHeroAnimation();

    // Header Scroll Logic
    const header = document.querySelector(".site-header");
    let lastScrollTop = 0;
    const threshold = 100;

    window.addEventListener("scroll", () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        // Handle scrolled state (glassmorphism) - sync with Alpine if needed, 
        // but here we just ensure the header-hidden logic works.

        if (scrollTop > lastScrollTop && scrollTop > threshold) {
            // Scrolling down
            header.classList.add("header-hidden");
        } else {
            // Scrolling up
            header.classList.remove("header-hidden");
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, { passive: true });

    // Authentication & Notification Logic
    const checkAuth = () => {
        const token = localStorage.getItem('dottie_token');
        const user = JSON.parse(localStorage.getItem('dottie_user') || 'null');
        return { isLoggedIn: !!token, user };
    };

    const showAuthNotification = () => {
        const { isLoggedIn } = checkAuth();
        const lastPrompt = localStorage.getItem('dottie_last_auth_prompt');
        const now = Date.now();

        // Only show if not logged in and haven't prompted in the last 24 hours
        if (!isLoggedIn && (!lastPrompt || now - parseInt(lastPrompt) > 24 * 60 * 60 * 1000)) {
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('show-auth-modal'));
                localStorage.setItem('dottie_last_auth_prompt', now.toString());
            }, 5000); // Show after 5 seconds
        }
    };

    // Global State for Settings & Announcements
    const fetchGlobalData = async () => {
        try {
            const [settingsRes, storeConfigRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/settings`).then(r => r.json()).catch(() => ({ success: false })),
                fetch(`${API_BASE_URL}/api/store-config`).then(r => r.json()).catch(() => ({ success: false }))
            ]);

            if (settingsRes.success) {
                window.storeSettings = settingsRes.settings;
                document.body.dispatchEvent(new CustomEvent('settings-loaded', { detail: settingsRes.settings }));
            }
            if (storeConfigRes.success) {
                window.storeConfig = storeConfigRes.config;
                document.body.dispatchEvent(new CustomEvent('store-config-loaded', { detail: storeConfigRes.config }));
            }
        } catch (err) {
            console.warn("Could not fetch global data, using defaults.");
        }
    };

    fetchGlobalData();

    // Intro Animation
    initIntroAnimation();

    // Scroll Reveal
    initScrollReveal();

    console.log("DOTTIE.YZ Frontend Loaded");
});

// ============================================
// SCROLL REVEAL
// ============================================
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (entry.target.classList.contains('stagger-children')) {
                    const children = entry.target.children;
                    Array.from(children).forEach((child, i) => {
                        child.style.transitionDelay = `${i * 0.1}s`;
                    });
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal-up, .reveal-fade, .stagger-children').forEach(el => {
        observer.observe(el);
    });
}

// ============================================
// INTRO ANIMATION
// ============================================
function initIntroAnimation() {
    if (typeof gsap === 'undefined') return;

    const overlay = document.getElementById('intro-overlay');
    if (!overlay || sessionStorage.getItem('dottie_intro_played')) return;

    sessionStorage.setItem('dottie_intro_played', 'true');

    overlay.style.display = 'flex';
    overlay.style.opacity = '1';

    const logo = overlay.querySelector('.intro-logo');
    const sweep = overlay.querySelector('.intro-sweep');
    const line = overlay.querySelector('.intro-line');
    const tagline = overlay.querySelector('.intro-tagline');

    const tl = gsap.timeline({
        onComplete: () => {
            gsap.to(overlay, {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.inOut',
                onComplete: () => {
                    overlay.style.display = 'none';
                    document.body.classList.add('intro-ready');
                }
            });
        }
    });

    tl.set(overlay, { opacity: 1 })
      .to(logo, { opacity: 1, scale: 1, duration: 1.2, ease: 'power3.out' }, 0.3)
      .to(sweep, { opacity: 1, x: '100%', duration: 1.5, ease: 'power2.inOut' }, 0.8)
      .to(line, { scaleX: 1, duration: 0.8, ease: 'power3.out' }, 1.5)
      .to(tagline, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 2)
      .to({}, { duration: 0.8 });

    // Safety timeout: always hide overlay after 5s even if animation fails
    setTimeout(() => {
        if (overlay.style.display !== 'none') {
            overlay.style.display = 'none';
            document.body.classList.add('intro-ready');
        }
    }, 5000);
}

