import gsap from 'gsap';

const SESSION_KEY = 'dottie_intro_played';

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const markPlayed = () => {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* storage unavailable â€” animation simply plays each session */
  }
};

/* Measure an SVG geometry element's path length, with a safe fallback
   for environments where getTotalLength is unavailable. */
const lengthOf = (el, fallback) => {
  try {
    const len = el.getTotalLength();
    return Number.isFinite(len) && len > 0 ? len : fallback;
  } catch {
    return fallback;
  }
};

export const initIntro = () => {
  const overlay = document.getElementById('DOTTIE-intro');
  if (!overlay) return;

  // Repeat sessions / reduced motion are handled by the inline head script.
  if (
    document.documentElement.classList.contains('DOTTIE-intro-skip') ||
    prefersReducedMotion()
  ) {
    overlay.remove();
    return;
  }

  const stage = overlay.querySelector('.DOTTIE-intro__stage');
  const bagGroup = overlay.querySelector('.DOTTIE-intro__bag-group');
  const shadow = overlay.querySelector('.DOTTIE-intro__shadow');
  const ink = Array.from(overlay.querySelectorAll('.DOTTIE-intro__ink'));
  const ring = overlay.querySelector('.DOTTIE-intro__ring');
  const arc = overlay.querySelector('.DOTTIE-intro__arc');
  const shine = overlay.querySelector('.DOTTIE-intro__shine');
  const word = overlay.querySelector('.DOTTIE-intro__word');

  if (!stage || !bagGroup || !ink.length) {
    overlay.remove();
    return;
  }

  document.body.classList.add('DOTTIE-intro-active');

  let finished = false;
  let tl;
  let floatTween;

  const stopFloat = () => {
    if (floatTween) {
      floatTween.kill();
      floatTween = null;
    }
  };

  // A gentle, self-contained idle float. Kept as its own tween so it can
  // be stopped cleanly before the outro â€” no property fights on stage.y.
  const startFloat = () => {
    stopFloat();
    floatTween = gsap.to(stage, {
      y: -9,
      duration: 1.4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  };

  const onKey = (e) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      finish(false);
    }
  };

  const finish = (instant = false) => {
    if (finished) return;
    finished = true;

    stopFloat();
    if (tl) tl.kill();
    document.removeEventListener('keydown', onKey);
    overlay.removeEventListener('click', onClick);

    markPlayed();
    document.body.classList.remove('DOTTIE-intro-active');

    const cleanup = () => {
      overlay.remove();
      document.dispatchEvent(new CustomEvent('DOTTIE:intro-complete'));
    };

    if (instant) {
      cleanup();
      return;
    }

    gsap.to(overlay, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: cleanup,
    });
  };

  // Click / tap anywhere exits gracefully (no visible button).
  const onClick = () => finish(false);
  overlay.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);

  // --- Prepare elements for the sequence (measured, not guessed) ---
  ink.forEach((path) => {
    const len = lengthOf(path, 320);
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
  });

  const ringLen = ring ? lengthOf(ring, 578) : 0;
  if (ring) {
    gsap.set(ring, { strokeDasharray: ringLen, strokeDashoffset: ringLen, opacity: 0 });
  }

  gsap.set(bagGroup, { scale: 0.9, opacity: 0, transformOrigin: 'center' });
  if (arc) gsap.set(arc, { rotation: 0, opacity: 0 });
  if (shadow) gsap.set(shadow, { scale: 0.6, opacity: 0, transformOrigin: 'center' });
  if (shine) gsap.set(shine, { xPercent: -160, opacity: 0 });
  if (word) gsap.set(word, { opacity: 0, y: 14 });
  gsap.set(stage, { y: 0, opacity: 1 });

  // A calm, cinematic brand introduction on the same white / ink palette
  // as the storefront. ~4.7s total, then it dissolves into the shop.
  tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: () => finish(true),
  });

  // 1. The soft white stage settles in.
  tl.fromTo('.DOTTIE-intro__bg', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0);

  // 2. A fine ring draws itself fully closed around the centre.
  if (ring) {
    tl.to(ring, { opacity: 1, strokeDashoffset: 0, duration: 1.3, ease: 'power2.out' }, 0.2);
  }

  // 3. The bag arrives with a gentle lift.
  tl.to(bagGroup, { opacity: 1, scale: 1, duration: 0.9, ease: 'expo.out' }, 0.35);

  // 4. A soft contact shadow grounds the bag.
  if (shadow) {
    tl.to(shadow, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' }, 0.5);
  }

  // 5. The bag line-art draws itself on, stroke by stroke (even pacing).
  tl.to(ink, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out', stagger: 0.15 }, 0.55);

  // 6. An elegant arc sweeps a full revolution around the ring.
  if (arc) {
    tl.to(arc, { opacity: 1, duration: 0.3 }, 1.4);
    tl.to(arc, { rotation: 360, duration: 2.2, ease: 'power1.inOut', svgOrigin: '120 120' }, 1.4);
  }

  // 7. The DOTTIE.YZ wordmark rises in beneath the mark.
  if (word) {
    tl.to(word, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, 2.0);
  }

  // 8. A soft sheen passes across once.
  if (shine) {
    tl.to(shine, { opacity: 0.85, duration: 0.2 }, 2.5);
    tl.to(shine, { xPercent: 120, duration: 1.1, ease: 'power2.inOut' }, 2.6);
    tl.to(shine, { opacity: 0, duration: 0.3 }, 3.5);
  }

  // 9. Begin the premium idle float once the composition has settled.
  tl.add(startFloat, 1.7);

  // 10. Stop the float cleanly, then lift everything away and reveal the shop.
  tl.add(stopFloat, 3.9);
  tl.to(stage, { opacity: 0, y: -16, duration: 0.6, ease: 'power2.in' }, 3.95);
  tl.to(overlay, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 4.15);
};

export default initIntro;

