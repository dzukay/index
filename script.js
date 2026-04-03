document.addEventListener('DOMContentLoaded', () => {
  /* ========================================================
     1. VIRTUAL SCROLL / CURTAIN REVEAL ENGINE
     ======================================================== */
  const scrollProxy = document.querySelector('.scroll-proxy');
  const heroSection = document.querySelector('.hero-section');
  const mainContent = document.querySelector('.main-content');
  
  let heroHeight = 0;
  let mainHeight = 0;
  
  // Calculate and apply required native scroll height
  function updateScrollHeights() {
    // physical height of the hero
    heroHeight = heroSection.offsetHeight; 
    
    // total height of all content underneath
    mainHeight = mainContent.offsetHeight; 
    
    // update proxy height so native scrollbar knows how long to be
    scrollProxy.style.height = `${heroHeight + mainHeight}px`;
  }
  
  // Use RequestAnimationFrame for smooth updates
  let isTicking = false;
  
  function renderScroll() {
    const y = window.scrollY;
    
    // 1. Hero ALWAYS translates up relative to scroll (natively scrolled out of viewport)
    heroSection.style.transform = `translate3d(0, -${y}px, 0)`;
    
    // 2. Main Content remains absolute at y=0, but we negate the scroll up to heroHeight
    // meaning it physically STAYS STILL until we've scrolled past 100vh.
    if (y < heroHeight) {
      mainContent.style.transform = `translate3d(0, 0, 0)`;
    } else {
      // Once we pass 100vh, we let it scroll by shifting its offset
      mainContent.style.transform = `translate3d(0, -${y - heroHeight}px, 0)`;
    }
  }

  function onScroll() {
    if (!isTicking) {
      window.requestAnimationFrame(() => {
        renderScroll();
        isTicking = false;
      });
      isTicking = true;
    }
  }

  // Initialize
  updateScrollHeights();
  renderScroll();

  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    // Only recount dimensions on width change to avoid jumps on mobile when scrollbar/URL bar hides
    if (window.innerWidth !== lastWidth) {
      lastWidth = window.innerWidth;
      updateScrollHeights();
      renderScroll();
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  
  // Observe changes inside mainContent (like font/image loads) to resize proxy
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      updateScrollHeights();
    });
    resizeObserver.observe(mainContent);
  }

  /* ========================================================
     2. "INTERSECTION" logic for Virtual Scroll
     ======================================================== */
  // Use IntersectionObserver to prevent layout thrashing on scroll

  const revealElements = document.querySelectorAll('.reveal-up');
  const lazyMedia = document.querySelectorAll('.js-lazy-media');
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  revealElements.forEach(el => revealObserver.observe(el));

  const mediaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.paused) entry.target.play().catch(e => console.log('Autoplay prevented', e));
      } else {
        if (!entry.target.paused) entry.target.pause();
      }
    });
  }, { rootMargin: '50px 0px' });

  lazyMedia.forEach(media => mediaObserver.observe(media));
});
