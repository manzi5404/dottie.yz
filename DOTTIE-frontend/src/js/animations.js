import gsap from 'gsap';

export const initHeroAnimation = () => {
    const r = document.getElementById("hero-bag");
    const t = document.querySelectorAll(".hero-particle");
    if (!r) return;

    gsap.to(r, { y: -30, rotation: 3, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
    const e = r.querySelector("path:nth-child(2)");
    if (e) gsap.to(e, { scaleY: 1.05, transformOrigin: "bottom center", duration: 1.5, repeat: -1, yoyo: true, ease: "sine.inOut" });

    t.forEach((i, n) => {
        gsap.to(i, {
            y: n % 2 === 0 ? "-=40" : "+=40",
            x: n % 2 === 0 ? "+=20" : "-=20",
            opacity: 0.6,
            duration: 2 + Math.random() * 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: n * 0.5
        });
    });
};
