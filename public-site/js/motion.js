/* =========================================================
   UNIFIED WEBSITE-WIDE MOTION & HORIZONTAL MARQUEE ENGINE
   Inspired by modern creative showcases:
   - Staged Hero Choreography + Split-Word Headline Reveal
   - Seamless Dual-Row Opposite-Direction CSS Marquees
   - Viewport-Triggered Animated Number Counters (Run Once)
   - Viewport-Aware Muted Video Preview Controller
   - Scroll-Spy Active Nav + Scroll Progress + Desktop Parallax
   - Full Admin Motion Settings & prefers-reduced-motion Support
   ========================================================= */

window.PortfolioMotion = (function () {
  let revealObserver = null;
  let videoObserver = null;
  let counterObserver = null;
  let scrollBound = false;
  let progressBarEl = null;
  let heroAnimatedOnce = false;
  let ticking = false;
  let currentData = null;

  const visitedSections = new Set();
  const countedKeys = new Set();

  const prefersReducedSystem = () =>
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getSettings(data) {
    const src = (data && data.motionSettings) || (currentData && currentData.motionSettings) || {};
    const fx = src.effects || {};
    return {
      enabled: src.enabled !== false,
      intensity: src.intensity || 'balanced',
      marqueeSpeed: src.marqueeSpeed || 'standard',
      pauseOnHover: src.pauseOnHover !== false,
      reducedMotionMode: src.reducedMotionMode || 'system',
      effects: {
        heroSequence: fx.heroSequence !== false,
        scrollReveals: fx.scrollReveals !== false,
        horizontalMarquees: fx.horizontalMarquees !== false,
        animatedCounters: fx.animatedCounters !== false,
        parallaxEffects: fx.parallaxEffects !== false,
        videoPreviews: fx.videoPreviews !== false,
        scrollSpy: fx.scrollSpy !== false
      }
    };
  }

  function isMotionActive(cfg) {
    if (!cfg.enabled) return false;
    if (cfg.reducedMotionMode === 'force-minimal') return false;
    if (prefersReducedSystem()) return false;
    return true;
  }

  function applyConfig(data) {
    if (data) currentData = data;
    const cfg = getSettings(currentData);
    const active = isMotionActive(cfg);

    const speedMap = { slow: '1.38', standard: '1', fast: '0.72' };
    document.documentElement.style.setProperty('--marquee-speed-factor', speedMap[cfg.marqueeSpeed] || '1');
    document.body.setAttribute('data-motion-intensity', cfg.intensity);
    document.body.classList.toggle('motion-disabled', !cfg.enabled);
    document.body.classList.toggle('reduced-motion-forced', cfg.reducedMotionMode === 'force-minimal');

    document.querySelectorAll('.marquee-shell').forEach(sh => {
      sh.classList.toggle('pause-on-hover', cfg.pauseOnHover);
    });

    return { cfg, active };
  }

  function ensureScrollProgressBar() {
    if (progressBarEl && document.body.contains(progressBarEl)) return progressBarEl;
    const header = document.querySelector('.masthead-wrap');
    if (!header) return null;
    let bar = document.getElementById('scroll-progress-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'scroll-progress-bar';
      bar.className = 'scroll-progress-bar';
      bar.setAttribute('aria-hidden', 'true');
      header.appendChild(bar);
    }
    progressBarEl = bar;
    return bar;
  }

  function updateScrollSpy(cfg) {
    if (!cfg.effects.scrollSpy) return;
    const navLinks = Array.from(document.querySelectorAll('#public-nav-links a[href^="#"]'));
    if (!navLinks.length) return;

    const thresholdY = 140;
    let currentId = '';
    document.querySelectorAll('main section[id]').forEach(sec => {
      const r = sec.getBoundingClientRect();
      if (r.top <= thresholdY && r.bottom >= 80) {
        currentId = sec.id;
      }
    });

    if (!currentId && (window.scrollY || 0) < 120) {
      currentId = 'hero';
    }

    navLinks.forEach(a => {
      const href = a.getAttribute('href') || '';
      const active = currentId && href === `#${currentId}`;
      a.classList.toggle('is-active', active);
    });
  }

  function updateScrollEffects() {
    ticking = false;
    const { cfg, active } = applyConfig();
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);

    if (progressBarEl) {
      const ratio = Math.max(0, Math.min(1, scrollTop / maxScroll));
      progressBarEl.style.transform = `scaleX(${ratio.toFixed(4)})`;
    }

    updateScrollSpy(cfg);

    if (!active || !cfg.effects.parallaxEffects || window.innerWidth < 960) {
      document.querySelectorAll('#hero .hero-portrait-aside, .section-gfx-layer').forEach(el => {
        el.style.transform = '';
      });
      return;
    }

    const portrait = document.querySelector('#hero .hero-portrait-aside');
    if (portrait) {
      const heroRect = document.getElementById('hero')?.getBoundingClientRect();
      if (heroRect && heroRect.bottom > 0 && heroRect.top < window.innerHeight) {
        const offset = Math.max(-16, Math.min(16, scrollTop * 0.048));
        portrait.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      }
    }

    document.querySelectorAll('.section-gfx-layer').forEach(layer => {
      const sec = layer.parentElement;
      if (!sec) return;
      const r = sec.getBoundingClientRect();
      if (r.bottom < -120 || r.top > window.innerHeight + 120) return;
      const centerDelta = (r.top + r.height * 0.5 - window.innerHeight * 0.5) / Math.max(1, window.innerHeight);
      const shift = Math.max(-18, Math.min(18, centerDelta * -22));
      layer.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
    });

    // Safety net: ensure any visible target triggers cleanly
    document.querySelectorAll('[data-motion]:not(.is-visible)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top <= window.innerHeight * 0.96 && r.bottom >= -40) {
        const sec = el.closest('section[id]');
        if (sec && sec.id) visitedSections.add(sec.id);
        el.classList.add('is-visible');
      }
    });
  }

  function bindGlobalScroll() {
    ensureScrollProgressBar();
    if (scrollBound) return;
    scrollBound = true;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateScrollEffects);
      }
    }, { passive: true });
    window.addEventListener('resize', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateScrollEffects);
      }
    }, { passive: true });
    requestAnimationFrame(updateScrollEffects);
  }

  /* Split Hero Headline Words cleanly while keeping aria-label intact */
  function prepareHeroHeadline(hero) {
    const h1 = hero.querySelector('.hero-title');
    if (!h1 || h1.dataset.splitDone === '1') return;
    const rawText = (h1.textContent || '').trim();
    if (!rawText) return;
    h1.setAttribute('aria-label', rawText);
    h1.innerHTML = rawText
      .split(/\s+/)
      .map((word, idx) => `<span class="split-word" style="--word-i:${idx}" aria-hidden="true">${word.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`)
      .join('');
    h1.dataset.splitDone = '1';
  }

  function tagHeroSequence(cfg) {
    const hero = document.getElementById('hero');
    if (!hero) return;
    if (!cfg.effects.heroSequence) {
      hero.querySelectorAll('[data-motion]').forEach(el => el.classList.add('is-visible'));
      return;
    }

    prepareHeroHeadline(hero);

    const stageSelectors = [
      { sel: '.section-gfx-layer', anim: 'fade', delay: 0 },
      { sel: '.hero-portrait-aside', anim: 'hero-portrait', delay: 80 },
      { sel: '.hero-eyebrow', anim: 'fade-up', delay: 110 },
      { sel: '.hero-title', anim: 'fade', delay: 140 },
      { sel: '.hero-role', anim: 'fade-up', delay: 290 },
      { sel: '.hero-positioning', anim: 'fade-up', delay: 340 },
      { sel: '.hero-summary', anim: 'fade-up-blur', delay: 390 },
      { sel: '.hero-cta-row', anim: 'fade-up', delay: 460 },
      { sel: '.hero-channels', anim: 'fade-up', delay: 520 }
    ];

    stageSelectors.forEach(item => {
      hero.querySelectorAll(item.sel).forEach(el => {
        el.setAttribute('data-motion', item.anim);
        el.style.setProperty('--motion-delay', `${heroAnimatedOnce ? 0 : item.delay}ms`);
      });
    });

    hero.querySelectorAll('.fact-cell').forEach((cell, idx) => {
      cell.setAttribute('data-motion', 'fade-up');
      cell.style.setProperty('--motion-delay', `${heroAnimatedOnce ? 0 : 480 + idx * 75}ms`);
    });

    heroAnimatedOnce = true;
  }

  function tagScrollTargets(root, cfg) {
    if (!root || !cfg.effects.scrollReveals) return;

    const addGroup = (parentSel, childSel, anim, baseDelay = 0, step = 65, cap = 6) => {
      root.querySelectorAll(parentSel).forEach(parent => {
        if (parent.closest('#hero')) return;
        parent.querySelectorAll(childSel).forEach((el, idx) => {
          if (el.closest('[data-marquee-clone="true"]')) return;
          if (el.hasAttribute('data-motion')) return;
          el.setAttribute('data-motion', anim);
          el.style.setProperty('--motion-delay', `${baseDelay + Math.min(idx, cap) * step}ms`);
        });
      });
    };

    root.querySelectorAll('.section-header').forEach(el => {
      if (!el.hasAttribute('data-motion')) el.setAttribute('data-motion', 'fade-up-blur');
    });

    // Distinct per-section choreography
    addGroup('.brand-logos-grid', '.brand-card', 'flip-up', 0, 85, 5);
    addGroup('.approach-grid', '.approach-card', 'fade-up-blur', 0, 70, 6);
    addGroup('.case-switcher', '.case-tab-btn', 'fade-up', 0, 60, 5);
    addGroup('#active-case-panel', '.case-block', 'flip-up', 0, 65, 6);
    addGroup('#active-case-panel', '.calendar-thumb-btn', 'image-reveal', 40, 80, 5);

    // Archive sections: animate the marquee wrappers smoothly without hiding loop cards
    root.querySelectorAll('.archive-bar, .filter-pills, .marquee-stack').forEach((el, idx) => {
      if (!el.hasAttribute('data-motion')) {
        el.setAttribute('data-motion', 'fade-up');
        el.style.setProperty('--motion-delay', `${Math.min(idx, 3) * 55}ms`);
      }
    });
    addGroup('.carousel-track', '.script-card, .video-card, .design-card', 'scale-reveal', 0, 50, 6);

    // Research & Decks
    root.querySelectorAll('.research-grid .research-panel').forEach((el, idx) => {
      if (!el.hasAttribute('data-motion')) {
        el.setAttribute('data-motion', idx % 2 === 0 ? 'fade-left' : 'fade-right');
        el.style.setProperty('--motion-delay', `${idx * 90}ms`);
      }
    });
    addGroup('.swot-grid', '.swot-cell', 'scale-reveal', 0, 55, 4);

    // CV Showcase
    addGroup('.cv-pages-grid', '.cv-page-card', 'image-reveal', 40, 120, 4);

    // Initiatives & Experience (alternating cadence)
    root.querySelectorAll('.secondary-grid .secondary-card').forEach((el, idx) => {
      if (!el.hasAttribute('data-motion')) {
        el.setAttribute('data-motion', idx % 2 === 0 ? 'fade-left' : 'fade-right');
        el.style.setProperty('--motion-delay', `${Math.min(idx, 4) * 75}ms`);
      }
    });
    addGroup('.ref-desk-grid', '.ref-column', 'flip-up', 0, 90, 4);

    // Contact rows
    addGroup('.contact-links-list', '.contact-row-card', 'fade-right', 60, 80, 4);
    addGroup('.custom-media-grid', '.custom-media-card', 'image-reveal', 0, 75, 5);

    root.querySelectorAll('.case-dossier, .deck-viewer-card, .cv-showcase-top, .cv-editorial-card, .cv-minimal-card, .cv-compact-box, .contact-banner').forEach(el => {
      if (!el.hasAttribute('data-motion')) el.setAttribute('data-motion', 'fade-up-blur');
    });
  }

  /* Animated Number Counters — parse leading integer, animate 0 -> target once */
  function animateSingleCounter(el) {
    const raw = (el.getAttribute('data-counter-target') || el.textContent || '').trim();
    const match = raw.match(/^(\d[\d,]*)(.*)$/);
    if (!match) return;
    const key = (el.getAttribute('data-counter-key') || raw).trim();
    if (countedKeys.has(key)) {
      el.textContent = raw;
      return;
    }
    countedKeys.add(key);

    const numStr = match[1].replace(/,/g, '');
    const target = parseInt(numStr, 10);
    const suffix = match[2] || '';
    if (!Number.isFinite(target) || target <= 0) return;

    const useComma = match[1].includes(',');
    const dur = Math.min(1300, Math.max(650, target * 18));
    const start = performance.now();

    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = Math.round(target * eased);
      const formatted = useComma ? current.toLocaleString('en-US') : String(current);
      el.textContent = formatted + suffix;
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = raw;
      }
    }
    requestAnimationFrame(step);
  }

  function bindCounters(root, cfg, active) {
    if (counterObserver) {
      counterObserver.disconnect();
      counterObserver = null;
    }
    const els = Array.from(root.querySelectorAll('[data-counter]'));
    if (!els.length) return;

    if (!active || !cfg.effects.animatedCounters || typeof IntersectionObserver === 'undefined') {
      els.forEach(el => {
        const t = el.getAttribute('data-counter-target');
        if (t) el.textContent = t;
      });
      return;
    }

    counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateSingleCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    els.forEach(el => {
      const raw = el.getAttribute('data-counter-target') || el.textContent || '';
      const key = (el.getAttribute('data-counter-key') || raw).trim();
      if (countedKeys.has(key)) {
        el.textContent = raw;
      } else {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.96) {
          animateSingleCounter(el);
        } else {
          counterObserver.observe(el);
        }
      }
    });
  }

  /* Viewport-Aware Muted Video Previews (Stop when leaving viewport) */
  function isInViewport(el) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 &&
      r.bottom > 0 && r.top < window.innerHeight &&
      r.right > 0 && r.left < window.innerWidth;
  }

  function bindVideoPreviews(root, cfg, active) {
    if (videoObserver) {
      videoObserver.disconnect();
      videoObserver = null;
    }
    const vids = Array.from(root.querySelectorAll('video[data-preview-video]'));
    if (!vids.length) return;

    if (!active || !cfg.effects.videoPreviews || typeof IntersectionObserver === 'undefined') {
      vids.forEach(v => { try { v.pause(); } catch {} });
      return;
    }

    const syncVid = (vid, shouldPlay) => {
      vid.defaultMuted = true;
      vid.muted = true;
      if (shouldPlay) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    };

    videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        syncVid(entry.target, entry.isIntersecting);
      });
    }, { threshold: 0.01 });

    vids.forEach(v => {
      videoObserver.observe(v);
      if (isInViewport(v)) syncVid(v, true);
    });
  }

  function bindMarqueeControls(root) {
    root.querySelectorAll('[data-marquee-toggle]').forEach(btn => {
      if (btn._mqBound) return;
      btn._mqBound = true;
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-marquee-toggle');
        const wrap = document.getElementById(targetId);
        if (!wrap) return;
        const shells = wrap.classList.contains('marquee-shell')
          ? [wrap]
          : Array.from(wrap.querySelectorAll('.marquee-shell'));
        const nextPaused = !btn.classList.contains('is-paused');
        btn.classList.toggle('is-paused', nextPaused);
        btn.setAttribute('aria-pressed', nextPaused ? 'true' : 'false');
        btn.textContent = nextPaused ? '▶ Resume' : '⏸ Pause';
        shells.forEach(s => s.classList.toggle('is-paused', nextPaused));
      });
    });
  }

  function revealImmediately(els) {
    els.forEach(el => el.classList.add('is-visible'));
  }

  function refresh(customRoot, data) {
    const root = customRoot || document.getElementById('public-main');
    if (!root) return;

    const { cfg, active } = applyConfig(data);
    bindGlobalScroll();
    bindMarqueeControls(root);
    bindVideoPreviews(root, cfg, active);
    bindCounters(root, cfg, active);

    if (!active || typeof IntersectionObserver === 'undefined') {
      document.body.classList.remove('motion-ready');
      revealImmediately(root.querySelectorAll('[data-motion]'));
      return;
    }

    document.body.classList.add('motion-ready');
    if (revealObserver) revealObserver.disconnect();

    tagHeroSequence(cfg);
    tagScrollTargets(root, cfg);

    const targets = Array.from(root.querySelectorAll('[data-motion]'));
    if (!targets.length) return;

    const foldLimit = window.innerHeight * 0.98;
    const toObserve = [];

    targets.forEach(el => {
      const sec = el.closest('section[id]');
      const secId = sec ? sec.id : '';
      const inHero = secId === 'hero';
      const inVisited = !!(secId && visitedSections.has(secId) && !el.closest('#active-case-panel'));
      const rect = el.getBoundingClientRect();

      if (inVisited || (inHero && heroAnimatedOnce && rect.bottom < 0)) {
        el.setAttribute('data-motion-instant', 'true');
        el.classList.add('is-visible');
      } else if (inHero || rect.top <= foldLimit) {
        if (secId) visitedSections.add(secId);
        requestAnimationFrame(() => el.classList.add('is-visible'));
      } else {
        toObserve.push(el);
      }
    });

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sec = entry.target.closest('section[id]');
          if (sec && sec.id) visitedSections.add(sec.id);
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.06,
      rootMargin: '0px 0px -28px 0px'
    });

    toObserve.forEach(el => revealObserver.observe(el));

    setTimeout(() => {
      root.querySelectorAll('[data-motion]:not(.is-visible)').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight + 60) {
          const sec = el.closest('section[id]');
          if (sec && sec.id) visitedSections.add(sec.id);
          el.classList.add('is-visible');
        }
      });
    }, 650);
  }

  return {
    refresh,
    applyConfig
  };
})();
