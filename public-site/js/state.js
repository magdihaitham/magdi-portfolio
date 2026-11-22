/* =========================================================
   PUBLIC PORTFOLIO STATE & READ-ONLY HELPERS
   Static Read-Only Public Edition
   ========================================================= */

window.PortfolioState = (function () {
  const THEME_KEY = 'magdi_portfolio_theme_v1';

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* Safe Rich HTML Sanitizer — allows editorial formatting tags, strips scripts/handlers */
  function sanitizeRichHtml(input) {
    if (input === null || input === undefined) return '';
    const raw = String(input);
    if (!/[<>]/.test(raw)) return escapeHtml(raw).replace(/\n/g, '<br />');

    const ALLOWED = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'H3', 'H4', 'A', 'SPAN']);
    const tpl = document.createElement('template');
    tpl.innerHTML = raw;

    function cleanNode(node) {
      if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent);
      if (node.nodeType !== Node.ELEMENT_NODE) return document.createTextNode('');
      const tag = node.tagName.toUpperCase();
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT') {
        return document.createTextNode('');
      }
      if (!ALLOWED.has(tag)) {
        const frag = document.createDocumentFragment();
        Array.from(node.childNodes).forEach(ch => frag.appendChild(cleanNode(ch)));
        return frag;
      }
      const el = document.createElement(tag.toLowerCase());
      if (tag === 'A') {
        const href = (node.getAttribute('href') || '').trim();
        if (/^(https?:|mailto:|#)/i.test(href)) {
          el.setAttribute('href', href);
          if (/^https?:/i.test(href)) {
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
          }
        }
      }
      const style = node.getAttribute('style') || '';
      const alignM = style.match(/text-align:\s*(left|center|right|justify)/i);
      if (alignM) el.style.textAlign = alignM[1].toLowerCase();

      Array.from(node.childNodes).forEach(ch => el.appendChild(cleanNode(ch)));
      return el;
    }

    const wrap = document.createElement('div');
    Array.from(tpl.content.childNodes).forEach(ch => wrap.appendChild(cleanNode(ch)));
    return wrap.innerHTML;
  }

  function validateExternalUrl(url) {
    const raw = (url || '').trim();
    if (!raw) return { valid: false, status: 'pending', platform: 'None' };
    try {
      const u = new URL(raw);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return { valid: false, status: 'invalid', platform: 'Invalid' };
      return { valid: true, status: 'verified', platform: u.hostname };
    } catch (_) {
      return { valid: false, status: 'invalid', platform: 'Invalid' };
    }
  }

  function loadPublicData() {
    const d = clone(window.DEFAULT_PORTFOLIO_DATA || {});
    d.sections = Array.isArray(d.sections) ? d.sections : [];
    const defaultPages = [
      {
        id: 'cv-p1',
        label: 'Page 1 of 2 — Experience, Leadership & Education',
        image: './assets/cv/cv-page-01.webp',
        alt: 'Magdi Haitham Mabrok CV — Page 1'
      },
      {
        id: 'cv-p2',
        label: 'Page 2 of 2 — Projects, Core Skills & Certifications',
        image: './assets/cv/cv-page-02.webp',
        alt: 'Magdi Haitham Mabrok CV — Page 2'
      }
    ];
    d.cv = Object.assign({
      title: 'My CV / Professional Resume',
      kicker: 'Section VI · Curriculum Vitae',
      description: 'Preview the complete two-page Curriculum Vitae below. Click any page or select VIEW MY CV to open the official document folder directly in Google Drive.',
      shortNote: 'Interactive 2-page visual Curriculum Vitae with direct Google Drive access.',
      driveUrl: 'https://drive.google.com/drive/folders/1sE8wyU0JF4YzTlqEpL1VXbYp07hgoc-H?usp=sharing',
      viewButtonLabel: 'VIEW MY CV',
      clickHint: 'Click any CV page to open the full PDF folder in Google Drive ↗',
      displayMode: 'editorial-preview',
      downloadLabel: 'Download CV (PDF)',
      openLabel: 'Open PDF ↗',
      previewLabel: 'Quick Preview',
      requestLabel: 'Request Full CV via Email ↗',
      showSection: true,
      previewPages: defaultPages,
      publicPdf: null
    }, d.cv || {});
    if (!Array.isArray(d.cv.previewPages) || !d.cv.previewPages.length) {
      d.cv.previewPages = defaultPages;
    }
    d.moduleVisibility = Object.assign({
      scripts: true,
      videos: true,
      designs: true,
      researchStudies: true,
      presentations: true,
      secondaryExperience: true,
      credentials: true
    }, d.moduleVisibility || {});
    d.motionSettings = Object.assign({
      enabled: true,
      intensity: 'balanced',
      marqueeSpeed: 'standard',
      pauseOnHover: true,
      reducedMotionMode: 'system'
    }, d.motionSettings || {});
    d.motionSettings.effects = Object.assign({
      heroSequence: true,
      scrollReveals: true,
      horizontalMarquees: true,
      animatedCounters: true,
      parallaxEffects: true,
      videoPreviews: true,
      scrollSpy: true
    }, (d.motionSettings && d.motionSettings.effects) || {});
    if (!d.sections.some(s => s.id === 'cv')) {
      const idx = d.sections.findIndex(s => s.id === 'initiatives');
      const sec = { id: 'cv', title: 'My CV / Professional Resume', visible: d.cv.showSection !== false };
      if (idx >= 0) d.sections.splice(idx, 0, sec);
      else d.sections.push(sec);
    }
    return d;
  }

  return {
    THEME_KEY,
    clone,
    escapeHtml,
    sanitizeRichHtml,
    validateExternalUrl,
    loadPublicData
  };
})();
