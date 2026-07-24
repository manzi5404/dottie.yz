export const initHeroAnimation = () => {
    const heroSection = document.querySelector('.hero-animate');
    if (!heroSection) return;

    if (typeof gsap === 'undefined') {
        console.warn('GSAP is not loaded');
        return;
    }

    const heroText = heroSection.querySelector('.hero-text');
    const heroMedia = heroSection.querySelector('.hero-media');
    const heroLabel = heroSection.querySelector('.hero-label');
    const heroHeading = heroSection.querySelector('.hero-heading');
    const heroSubtitle = heroSection.querySelector('.hero-subtitle');
    const heroCta = heroSection.querySelector('.hero-cta');
    const heroImage = heroSection.querySelector('.hero-image');
    const heroShape = heroSection.querySelector('.hero-shape');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (heroLabel) {
        tl.fromTo(heroLabel, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, 0);
    }
    if (heroHeading) {
        tl.fromTo(heroHeading, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1 }, 0.2);
    }
    if (heroSubtitle) {
        tl.fromTo(heroSubtitle, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, 0.5);
    }
    if (heroCta) {
        tl.fromTo(heroCta, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, 0.7);
    }
    if (heroImage) {
        tl.fromTo(heroImage, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 1.2 }, 0.3);
    }
    if (heroShape) {
        tl.fromTo(heroShape, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 1 }, 0.4);
    }
};

export const initScrollReveal = () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.reveal-up').forEach(el => {
        gsap.fromTo(el, 
            { opacity: 0, y: 40 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });

    gsap.utils.toArray('.reveal-fade').forEach(el => {
        gsap.fromTo(el,
            { opacity: 0 },
            {
                opacity: 1,
                duration: 1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            }
        );
    });
};
