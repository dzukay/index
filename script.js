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
    heroHeight = window.innerHeight; 
    
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
        checkIntersectionsVirtual(); // Check intersections on scroll manually due to fixed position
        isTicking = false;
      });
      isTicking = true;
    }
  }

  // Initialize
  updateScrollHeights();
  renderScroll();

  window.addEventListener('resize', () => {
    updateScrollHeights();
    renderScroll();
    checkIntersectionsVirtual();
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
  // Because mainContent translates out-of-flow inside a fixed box,
  // native observers can sometimes be finicky. Here we use getBoundingClientRect manually.

  const revealElements = document.querySelectorAll('.reveal-up');
  const lazyMedia = document.querySelectorAll('.js-lazy-media');
  
  function checkIntersectionsVirtual() {
    const vh = window.innerHeight;
    
    // Check reveals
    revealElements.forEach(el => {
      if (el.classList.contains('visible')) return;
      const rect = el.getBoundingClientRect();
      // If the top of the element is within 90% of the viewport height, reveal it
      if (rect.top < vh * 0.9) { 
        el.classList.add('visible');
      }
    });

    // Check media autoplay (Pause when out of view)
    lazyMedia.forEach(media => {
      const rect = media.getBoundingClientRect();
      const isVisible = rect.top < vh && rect.bottom > 0;
      
      if (isVisible) {
        if (media.paused) media.play().catch(e => console.log('Autoplay prevented', e));
      } else {
        if (!media.paused) media.pause();
      }
    });
  }
  
  // Initial check (in case page refreshed half-scrolled)
  setTimeout(checkIntersectionsVirtual, 100);
});
