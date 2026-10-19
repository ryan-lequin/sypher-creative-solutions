/* Progressive enhancement: motion is optional and never blocks content. */
(() => {
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const eligible = () => !reduce.matches && !body.classList.contains('reduce-motion') && body.dataset.mode !== 'basic';
  const items = () => document.querySelectorAll('.section-kicker, .section-head, .two-col > div, .tile, .dashboard, .contact-form');
  let observer;
  function refresh() {
    observer?.disconnect();
    items().forEach(el => { el.classList.remove('reveal-ready', 'reveal-visible'); });
    if (!eligible() || !('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 60px 0px' });
    items().forEach((el, i) => {
      if (el.getBoundingClientRect().top < innerHeight * .92) return;
      el.classList.add('reveal-ready');
      el.style.setProperty('--reveal-delay', `${Math.min(i % 4, 3) * 70}ms`);
      observer.observe(el);
    });
  }
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  body.append(progress);
  let scrollPending = false;
  function onScroll() {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(() => {
      const total = document.documentElement.scrollHeight - innerHeight;
      progress.style.transform = `scaleX(${total > 0 ? Math.min(1, scrollY / total) : 0})`;
      scrollPending = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  const art = document.querySelector('.hero-art');
  if (art && matchMedia('(pointer: fine)').matches) {
    let pending = false, x = 0, y = 0;
    art.addEventListener('pointermove', event => {
      if (!eligible() || body.dataset.mode !== 'high') return;
      const r = art.getBoundingClientRect();
      x = (event.clientX - r.left) / r.width - .5;
      y = (event.clientY - r.top) / r.height - .5;
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        art.style.setProperty('--tilt-x', `${-y * 7}deg`);
        art.style.setProperty('--tilt-y', `${x * 7}deg`);
        pending = false;
      });
    }, { passive: true });
    art.addEventListener('pointerleave', () => {
      art.style.setProperty('--tilt-x', '0deg');
      art.style.setProperty('--tilt-y', '0deg');
    });
  }
  new MutationObserver(refresh).observe(body, { attributes: true, attributeFilter: ['data-mode', 'class'] });
  reduce.addEventListener?.('change', refresh);
  // Cards are populated asynchronously; refresh once content arrives.
  const cards = document.querySelector('#servicesGrid');
  if (cards) new MutationObserver(refresh).observe(cards, { childList: true });
  refresh(); onScroll();
})();
