import { useEffect } from 'react';
import { gsap } from 'gsap';

const pageSelectors = [
  '.hero', '.page-title', '.customer-welcome', '.catalog', '.detail',
  '.auth', '.checkout', '.narrow', '.about', '.services-page', '.dash-main',
];

const cardSelectors = [
  '.product-card', '.feature-grid article', '.profile-card', '.stat',
  '.seller-product-grid article', '.seller-orders article', '.services-page article',
  '.cart-item', '.order-row', '.table-wrap', '.summary',
];

export default function SystemAnimations() {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    const animated = new WeakSet();
    const interactive = new WeakSet();
    const cleanups = [];

    const animateCollection = (selector, vars, target) => {
      const elements = [...target.querySelectorAll(selector)].filter(element => !animated.has(element));
      if (!elements.length) return;
      elements.forEach(element => animated.add(element));
      gsap.fromTo(elements, vars.from, { ...vars.to, stagger: vars.stagger || 0 });
    };

    const enhanceInteractions = target => {
      target.querySelectorAll('.btn, .product-card, .category-row > a, .profile-card').forEach(element => {
        if (interactive.has(element)) return;
        interactive.add(element);
        const enter = () => gsap.to(element, { y: -3, duration: 0.2, ease: 'power2.out' });
        const leave = () => gsap.to(element, { y: 0, duration: 0.3, ease: 'power2.out' });
        element.addEventListener('mouseenter', enter);
        element.addEventListener('mouseleave', leave);
        cleanups.push(() => {
          element.removeEventListener('mouseenter', enter);
          element.removeEventListener('mouseleave', leave);
        });
      });
    };

    const scan = () => {
      const root = document;
      animateCollection(pageSelectors.join(','), {
        from: { opacity: 0, y: 18 },
        to: { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', clearProps: 'transform' },
      }, root);
      animateCollection(cardSelectors.join(','), {
        from: { opacity: 0, y: 22, scale: 0.985 },
        to: { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out', clearProps: 'transform' },
        stagger: 0.055,
      }, root);
      animateCollection('.category-row:not([data-system-animated]) > a', {
        from: { opacity: 0, y: 30, scale: 0.93 },
        to: { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.35)', clearProps: 'transform' },
        stagger: 0.08,
      }, root);
      document.querySelectorAll('.category-row').forEach(row => { row.dataset.systemAnimated = 'true'; });
      animateCollection('.user-dropdown, .product-form, .review-form, .store-form, .dashboard-account', {
        from: { opacity: 0, y: -10, scale: 0.985 },
        to: { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power2.out', clearProps: 'transform' },
      }, root);
      enhanceInteractions(root);
    };

    let frame;
    const scheduleScan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    };
    scan();
    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.getElementById('root'), { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      cleanups.forEach(cleanup => cleanup());
      gsap.killTweensOf('*');
    };
  }, []);

  return null;
}
