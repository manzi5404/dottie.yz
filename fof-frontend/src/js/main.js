import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import gsap from 'gsap';
import shopLogic from './shop.js';
import productLogic from './product.js';
import collectionsLogic from './collections.js';
import { initHeroAnimation } from './animations.js';
import { initIntro } from './intro.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || document.body?.dataset?.apiBaseUrl || (() => {
    const host = window.location.hostname;
    if (host === 'localhost') return 'http://localhost:5000';
    if (host === '127.0.0.1') return 'http://localhost:5000';
    return 'https://dottie-backend.onrender.com';
})();

window.API_BASE_URL = API_BASE_URL;
window.Alpine = Alpine;
window.gsap = gsap;

Alpine.plugin(collapse);

document.addEventListener("alpine:init", () => {
Alpine.data("shopLogic", shopLogic);
Alpine.data("productLogic", productLogic);
Alpine.data("collectionsLogic", collectionsLogic);
});

Alpine.start();

document.addEventListener("DOMContentLoaded", () => {
    initIntro();
    initHeroAnimation();

    const header = document.querySelector(".site-header");
    let lastScrollTop = 0;
    window.addEventListener("scroll", () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            header.classList.add("header-hidden");
        } else {
            header.classList.remove("header-hidden");
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, { passive: true });

    console.log("F>F Frontend Loaded");
});

