import gsap from 'gsap';

const initSplash = () => {
    const logo = document.getElementById('splash-logo');
    const title = document.getElementById('splash-title');
    const loader = document.getElementById('splash-loader');
    const progress = document.getElementById('splash-progress');
    const tagline = document.getElementById('splash-tagline');

    if (!logo || !title || !loader) return;

    const tl = gsap.timeline({
        onComplete: () => {
            setTimeout(() => {
                window.location.href = '/shop.html';
            }, 600);
        }
    });

    tl.set([title, progress, tagline], { opacity: 0, y: 20 })
      .to(logo, { opacity: 1, scale: 1, duration: 1.2, ease: "back.out(1.4)" })
      .to(title, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, "-=0.6")
      .to(tagline, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.4")
      .to(progress, { width: "100%", duration: 2.2, ease: "power2.inOut" }, "-=0.2")
      .to([logo, title, tagline], { opacity: 0, scale: 0.8, duration: 0.6, ease: "power2.in" }, "+=0.3")
      .to(loader, { opacity: 0, duration: 0.5 }, "-=0.3");
};

export default initSplash;
