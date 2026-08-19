const REVEAL = '[data-reveal]';
const GATE = '[data-anim-scope]';

const nativeTimeline = () =>
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('animation-timeline', 'view()');

function initReveals() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || nativeTimeline() || !('IntersectionObserver' in window)) return;

  const nodes = Array.from(document.querySelectorAll<HTMLElement>(REVEAL)).filter(
    (node) => node.dataset.revealed === undefined
  );
  if (!nodes.length) return;

  for (const node of nodes) {
    node.dataset.revealed = 'pending';
    node.style.opacity = '0';
    node.style.transform = `translateY(var(--reveal-rise, 14px))`;
    node.style.transition =
      'opacity var(--dur-reveal) var(--ease), transform var(--dur-reveal) var(--ease)';
  }

  const observer = new IntersectionObserver(
    (entries) => {
      let index = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.style.transitionDelay = `calc(var(--reveal-stagger, 60ms) * ${index})`;
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.dataset.revealed = 'done';
        observer.unobserve(el);
        index += 1;
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
  );

  for (const node of nodes) observer.observe(node);
}

function initAnimGating() {
  if (!('IntersectionObserver' in window)) return;

  const scopes = Array.from(document.querySelectorAll<HTMLElement>(GATE)).filter(
    (scope) => scope.dataset.animGated === undefined
  );
  if (!scopes.length) return;

  const animated = new Map<Element, HTMLElement[]>();

  for (const scope of scopes) {
    scope.dataset.animGated = '';
    const list = [scope, ...Array.from(scope.querySelectorAll<HTMLElement>('*'))].filter(
      (el) => getComputedStyle(el).animationName !== 'none'
    );
    animated.set(scope, list);
    for (const el of list) el.style.animationPlayState = 'paused';
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const list = animated.get(entry.target) ?? [];
        const state = entry.isIntersecting ? 'running' : 'paused';
        for (const el of list) el.style.animationPlayState = state;
      }
    },
    { rootMargin: '140px 0px' }
  );

  for (const scope of scopes) observer.observe(scope);
}

function boot() {
  initReveals();
  initAnimGating();
}

boot();
document.addEventListener('astro:after-swap', boot);
