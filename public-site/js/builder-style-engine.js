/* =========================================================
   VISUAL BUILDER STYLE & GRAPHICS ENGINE
   Shared by Public Website, Live Preview, and ZIP Exporter.
   Generates clean CSS overrides + restrained SVG/CSS graphics.
   ========================================================= */

window.BuilderStyleEngine = (function () {
  const FONT_STACKS = {
    'Inter': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    'Manrope': "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
    'DM Sans': "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    'Plus Jakarta Sans': "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    'Montserrat': "'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif",
    'Lato': "'Lato', -apple-system, BlinkMacSystemFont, sans-serif",
    'Source Sans 3': "'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif",
    'Playfair Display': "'Playfair Display', Georgia, serif",
    'Cormorant Garamond': "'Cormorant Garamond', Georgia, serif",
    'IBM Plex Sans Arabic': "'IBM Plex Sans Arabic', 'Cairo', Tahoma, sans-serif",
    'Tajawal': "'Tajawal', 'Cairo', Tahoma, sans-serif",
    'Cairo': "'Cairo', 'IBM Plex Sans Arabic', Tahoma, sans-serif",
    'Alexandria': "'Alexandria', 'Cairo', Tahoma, sans-serif",
    'Noto Sans Arabic': "'Noto Sans Arabic', 'IBM Plex Sans Arabic', Tahoma, sans-serif"
  };

  function getFontStack(name, fallback) {
    if (!name) return fallback;
    return FONT_STACKS[name] || `'${String(name).replace(/['"\\;]/g, '')}', ${fallback}`;
  }

  function hexToRgba(hex, alpha = 1) {
    if (!hex || typeof hex !== 'string') return `rgba(201,158,63,${alpha})`;
    const clean = hex.trim().replace('#', '');
    let r = 201, g = 158, b = 63;
    if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
    } else if (clean.length >= 6) {
      r = parseInt(clean.slice(0, 2), 16) || 0;
      g = parseInt(clean.slice(2, 4), 16) || 0;
      b = parseInt(clean.slice(4, 6), 16) || 0;
    }
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, Number(alpha) || 0))})`;
  }

  function buildGradientCss(grad) {
    if (!grad) return '';
    const op = grad.opacity !== undefined ? Number(grad.opacity) : 0.96;
    const inten = grad.intensity !== undefined ? Number(grad.intensity) : 1;
    const c1 = hexToRgba(grad.color1 || '#08090c', Math.min(1, op));
    const c2 = hexToRgba(grad.color2 || '#17130c', Math.min(1, op * inten));
    const s1 = Number(grad.stop1 ?? 0);
    const s2 = Number(grad.stop2 ?? 55);
    const s3 = Number(grad.stop3 ?? 100);
    const stops = grad.useColor3
      ? `${c1} ${s1}%, ${c2} ${s2}%, ${hexToRgba(grad.color3 || '#2a200d', Math.min(1, op * inten))} ${s3}%`
      : `${c1} ${s1}%, ${c2} ${s2}%`;

    if (grad.type === 'radial') {
      const pos = grad.radialPosition || '80% 20%';
      return `radial-gradient(circle at ${pos}, ${stops})`;
    }
    const angle = Number(grad.angle ?? 135);
    return `linear-gradient(${angle}deg, ${stops})`;
  }

  function compileCss(data) {
    if (!data) return '';
    const theme = data.theme || {};
    const mode = document.documentElement.getAttribute('data-theme') || theme.mode || 'dark';
    const colors = (theme.colors && theme.colors[mode]) ? theme.colors[mode] : (theme.colors || {});
    const comp = theme.components || {};
    const typo = data.typography || {};
    const roles = typo.roles || {};
    const layout = data.layout || {};
    const media = (data.mediaSettings && data.mediaSettings.imagePresentation) || {};
    const grad = theme.gradients || {};

    const lines = ['/* === VISUAL BUILDER GENERATED CSS === */'];

    // 1. Global Theme Color Tokens
    const rootVars = [];
    const mapColor = (prop, val) => { if (val) rootVars.push(`${prop}: ${val};`); };
    mapColor('--bg-canvas', colors.bgCanvas);
    mapColor('--bg-surface', colors.bgSurface);
    mapColor('--bg-elevated', colors.bgElevated);
    mapColor('--bg-inset', colors.sectionAltBg);
    mapColor('--ink-primary', colors.inkPrimary);
    mapColor('--ink-secondary', colors.inkSecondary);
    mapColor('--ink-muted', colors.inkMuted);
    mapColor('--accent', colors.accent || (mode === 'light' ? theme.accentColorLight : theme.accentColorDark));
    mapColor('--accent-hover', colors.accentHover);
    mapColor('--border-hairline', colors.borderColor);
    mapColor('--border-strong', colors.dividerColor);
    mapColor('--font-scale', theme.fontScale || 1);

    // Layout Tokens
    if (layout.maxWidth) rootVars.push(`--max-width: ${Math.max(920, Math.min(1440, Number(layout.maxWidth)))}px;`);
    if (layout.cardRadius !== undefined) rootVars.push(`--builder-radius: ${Math.max(0, Math.min(24, Number(layout.cardRadius)))}px;`);
    if (layout.sectionPaddingY !== undefined) rootVars.push(`--builder-section-py: ${Math.max(32, Math.min(120, Number(layout.sectionPaddingY)))}px;`);
    if (layout.cardPadding !== undefined) rootVars.push(`--builder-card-pad: ${Math.max(12, Math.min(40, Number(layout.cardPadding)))}px;`);
    if (layout.gridGap !== undefined) rootVars.push(`--builder-gap: ${Math.max(10, Math.min(40, Number(layout.gridGap)))}px;`);

    // Typography Base Fonts
    const dispFont = getFontStack(typo.displayFont, "'Cormorant Garamond', Georgia, serif");
    const bodyFont = getFontStack(typo.englishFont, "'Plus Jakarta Sans', sans-serif");
    const arFont = getFontStack(typo.arabicFont, "'IBM Plex Sans Arabic', sans-serif");
    rootVars.push(`--font-display: ${dispFont};`);
    rootVars.push(`--font-sans: ${bodyFont};`);
    rootVars.push(`--font-arabic: ${arFont};`);

    lines.push(`:root, html[data-theme="${mode}"] { ${rootVars.join(' ')} }`);

    // Global Color Applications
    if (colors.bgNav) lines.push(`.masthead-wrap { background: ${colors.bgNav}; }`);
    if (colors.bgHeader) lines.push(`.edition-bar { background: ${colors.bgHeader}; }`);
    if (colors.bgFooter) lines.push(`.site-footer { background: ${colors.bgFooter}; }`);
    if (colors.linkColor) lines.push(`a:not(.btn):not(.hero-channel-link):not(.video-card) { color: ${colors.linkColor}; }`);
    if (colors.iconColor) lines.push(`.btn-icon, .video-play-badge { color: ${colors.iconColor}; }`);
    if (colors.btnBg || colors.btnText) {
      lines.push(`.btn-primary { ${colors.btnBg ? `background: ${colors.btnBg}; border-color: ${colors.btnBg};` : ''} ${colors.btnText ? `color: ${colors.btnText};` : ''} }`);
    }
    if (colors.btnHoverBg) {
      lines.push(`.btn-primary:hover { background: ${colors.btnHoverBg}; border-color: ${colors.btnHoverBg}; }`);
    }
    if (colors.selectionBg || colors.selectionText) {
      lines.push(`::selection { ${colors.selectionBg ? `background: ${colors.selectionBg};` : ''} ${colors.selectionText ? `color: ${colors.selectionText};` : ''} }`);
    }

    // 2. Advanced Component Color Overrides
    if (comp.enabled) {
      const cardRule = (sel, bg, border) => {
        const s = [];
        if (bg) s.push(`background: ${bg};`);
        if (border || comp.cardBorder) s.push(`border-color: ${border || comp.cardBorder};`);
        if (s.length) lines.push(`${sel} { ${s.join(' ')} }`);
        if (comp.cardHoverBorder) lines.push(`${sel}:hover { border-color: ${comp.cardHoverBorder}; }`);
      };
      cardRule('.brand-card, .case-dossier, .secondary-card', comp.projectCard, comp.cardBorder);
      cardRule('.script-card', comp.scriptCard, comp.cardBorder);
      cardRule('.video-card, .video-staged-notice-card', comp.videoCard, comp.cardBorder);
      cardRule('.design-card', comp.imageFrame, comp.cardBorder);
      cardRule('.research-panel', comp.researchCard, comp.cardBorder);
      cardRule('.deck-viewer-card', comp.presentationCard, comp.cardBorder);
      if (comp.galleryBg) lines.push(`.design-matte, .deck-slide-frame, .carousel-track { background: ${comp.galleryBg}; }`);
      if (comp.modalBg || comp.modalBorder) {
        lines.push(`.modal-dialog { ${comp.modalBg ? `background: ${comp.modalBg};` : ''} ${comp.modalBorder ? `border-color: ${comp.modalBorder};` : ''} }`);
      }
      if (comp.carouselArrowBg || comp.carouselArrowColor) {
        lines.push(`.archive-controls .btn-icon { ${comp.carouselArrowBg ? `background: ${comp.carouselArrowBg};` : ''} ${comp.carouselArrowColor ? `color: ${comp.carouselArrowColor};` : ''} }`);
      }
      if (comp.navActiveColor) lines.push(`.nav-links a:hover, .nav-links a:focus-visible { color: ${comp.navActiveColor}; }`);
      if (comp.badgeBg || comp.badgeText) {
        lines.push(`.pill-tag.accent { ${comp.badgeBg ? `background: ${comp.badgeBg};` : ''} ${comp.badgeText ? `color: ${comp.badgeText};` : ''} }`);
      }
    }

    // 3. Gradient Background Builder (Selective Section Targets)
    const gradCss = buildGradientCss(grad);
    if (gradCss && grad.targets) {
      const t = grad.targets;
      const mapSec = {
        hero: '#hero',
        brands: '#brands',
        approach: '#approach',
        caseStudies: '#case-studies',
        contentArchive: '#content-archive',
        researchDecks: '#research-decks',
        cv: '#cv',
        initiatives: '#initiatives',
        contact: '#contact',
        footer: '.site-footer'
      };
      Object.keys(mapSec).forEach(k => {
        if (t[k]) lines.push(`${mapSec[k]} { background-image: ${gradCss}; }`);
      });
      if (t.cards) {
        lines.push(`.case-dossier, .approach-card, .research-panel, .deck-viewer-card, .cv-editorial-card { background-image: ${gradCss}; }`);
      }
    }

    // Per-section custom background overrides from Section Editor
    if (layout.sectionSettings) {
      Object.keys(layout.sectionSettings).forEach(secId => {
        const cfg = layout.sectionSettings[secId];
        if (cfg && cfg.backgroundOverride) {
          lines.push(`#${secId} { background-color: ${cfg.backgroundOverride}; }`);
        }
      });
    }

    // 4. Layout Studio Safe Overrides
    lines.push(`.editorial-section { padding: var(--builder-section-py, clamp(3.2rem, 5.5vw, 5.2rem)) 0; }`);
    lines.push(`.approach-card, .case-dossier, .research-panel, .deck-viewer-card, .secondary-card, .script-card, .video-card, .design-card, .cv-editorial-card { border-radius: var(--builder-radius, var(--radius-xs)); }`);
    if (layout.cardBorderWidth) {
      const bw = Math.max(1, Math.min(3, Number(layout.cardBorderWidth)));
      lines.push(`.approach-card, .case-dossier, .research-panel, .secondary-card, .script-card, .video-card, .design-card, .cv-editorial-card { border-width: ${bw}px; }`);
    }
    if (layout.cardShadow === 'none') {
      lines.push(`.case-dossier, .hero-portrait-frame, .brand-card, .design-card { box-shadow: none; }`);
    } else if (layout.cardShadow === 'editorial') {
      lines.push(`.case-dossier, .research-panel, .deck-viewer-card, .cv-editorial-card { box-shadow: var(--shadow-editorial); }`);
    }
    if (layout.gridGap) {
      lines.push(`.approach-grid, .secondary-grid, .brand-logos-grid, .research-grid, .ref-desk-grid { gap: var(--builder-gap); }`);
    }
    if (layout.galleryColumns) {
      const cols = Math.max(2, Math.min(4, Number(layout.galleryColumns)));
      lines.push(`@media (min-width: 900px) { .custom-media-grid { grid-template-columns: repeat(${cols}, minmax(0, 1fr)); } }`);
    }
    if (layout.archiveCardWidth) {
      const cw = Math.max(250, Math.min(390, Number(layout.archiveCardWidth)));
      lines.push(`.script-card, .video-card, .design-card { flex: 0 0 min(${cw}px, 84vw); }`);
    }
    if (layout.navStyle === 'solid') {
      lines.push(`.masthead-wrap { backdrop-filter: none; background: var(--bg-surface); }`);
    } else if (layout.navStyle === 'minimal') {
      lines.push(`.edition-bar { display: none; } .masthead-wrap { border-bottom-color: transparent; }`);
    }

    // 5. Role-Based Responsive Typography Controls
    const roleMap = {
      h1: '.hero-title',
      sectionHeading: '.section-title',
      projectTitle: '.case-title, .brand-card h3',
      body: 'body, .hero-summary, .case-block p, .case-list li',
      nav: '.nav-links a',
      button: '.btn',
      caption: '.hero-portrait-caption, .calendar-thumb-btn span, .design-card-sub',
      card: '.approach-card p, .secondary-card p, .script-card-preview, .video-card-body p',
      meta: '.section-kicker, .hero-eyebrow, .case-meta-label, .pill-tag',
      scriptReader: '.script-reader-box, .script-card-title'
    };

    Object.keys(roleMap).forEach(rKey => {
      const r = roles[rKey];
      if (!r) return;
      const sel = roleMap[rKey];
      const rules = [];
      if (r.fontFamily) rules.push(`font-family: ${getFontStack(r.fontFamily, bodyFont)};`);
      if (r.sizeDesktop) rules.push(`font-size: ${r.sizeDesktop};`);
      if (r.weight) rules.push(`font-weight: ${r.weight};`);
      if (r.lineHeight) rules.push(`line-height: ${r.lineHeight};`);
      if (r.letterSpacing && r.letterSpacing !== 'normal') rules.push(`letter-spacing: ${r.letterSpacing};`);
      if (r.wordSpacing && r.wordSpacing !== 'normal') rules.push(`word-spacing: ${r.wordSpacing};`);
      if (r.transform && r.transform !== 'none') rules.push(`text-transform: ${r.transform};`);
      if (r.align && r.align !== 'inherit') rules.push(`text-align: ${r.align};`);
      if (r.color) rules.push(`color: ${r.color};`);
      if (rules.length) lines.push(`${sel} { ${rules.join(' ')} }`);

      if (r.sizeTablet) {
        lines.push(`@media (max-width: 960px) { ${sel} { font-size: ${r.sizeTablet}; } }`);
      }
      if (r.sizeMobile) {
        lines.push(`@media (max-width: 600px) { ${sel} { font-size: ${r.sizeMobile}; } }`);
      }
    });

    // Arabic RTL text safety
    lines.push(`.rtl-text, [dir="rtl"] { font-family: ${arFont}; letter-spacing: 0 !important; }`);

    // 6. Image Presentation Controls
    const imgSlots = {
      heroPhoto: '.hero-portrait-img-box img',
      designs: '.design-matte img',
      videos: '.video-thumb-box img',
      calendars: '.calendar-thumb-btn img',
      slides: '.deck-slide-frame img'
    };
    Object.keys(imgSlots).forEach(slotKey => {
      const cfg = media[slotKey];
      if (!cfg) return;
      const imgSel = imgSlots[slotKey];
      const st = [];
      if (cfg.objectFit) st.push(`object-fit: ${cfg.objectFit};`);
      if (cfg.objectPosition) st.push(`object-position: ${cfg.objectPosition};`);
      if (cfg.borderRadius !== undefined && cfg.borderRadius !== '') st.push(`border-radius: ${cfg.borderRadius}px;`);
      if (cfg.opacity !== undefined && cfg.opacity !== '') st.push(`opacity: ${cfg.opacity};`);
      if (cfg.borderWidth && Number(cfg.borderWidth) > 0) st.push(`border: ${cfg.borderWidth}px solid ${cfg.borderColor || 'var(--border-strong)'};`);
      if (cfg.shadow && cfg.shadow !== 'none') st.push(`box-shadow: var(--shadow-card);`);
      if (st.length) lines.push(`${imgSel} { ${st.join(' ')} }`);
      if (cfg.aspectRatio && cfg.aspectRatio !== 'auto') {
        const boxSel = imgSel.replace(' img', '');
        lines.push(`${boxSel} { aspect-ratio: ${cfg.aspectRatio}; }`);
      }
      if (cfg.overlayOpacity && Number(cfg.overlayOpacity) > 0) {
        const boxSel = imgSel.replace(' img', '');
        const ovCol = hexToRgba(cfg.overlayColor || '#000000', cfg.overlayOpacity);
        lines.push(`${boxSel}::after { content: ''; position: absolute; inset: 0; background: ${ovCol}; pointer-events: none; }`);
      }
    });

    return lines.join('\n');
  }

  function applyStyles(data) {
    let el = document.getElementById('builder-dynamic-css');
    if (!el) {
      el = document.createElement('style');
      el.id = 'builder-dynamic-css';
      document.head.appendChild(el);
    }
    el.textContent = compileCss(data);
  }

  function renderSectionGraphicsHtml(data, sectionId) {
    const gfx = (data.theme && data.theme.graphics) || {};
    const layers = [];

    const appliesTo = (item) => {
      if (!item || !item.enabled) return false;
      const secs = item.sections || ['hero'];
      return secs.includes('all') || secs.includes(sectionId);
    };

    if (appliesTo(gfx.gridPattern)) {
      const g = gfx.gridPattern;
      const col = hexToRgba(g.color || '#c99e3f', g.opacity ?? 0.08);
      const sz = Math.max(24, Number(g.size || 48));
      layers.push(`<div class="gfx-el gfx-grid" style="background-image:linear-gradient(${col} 1px,transparent 1px),linear-gradient(90deg,${col} 1px,transparent 1px);background-size:${sz}px ${sz}px;"></div>`);
    }

    if (appliesTo(gfx.radialLight)) {
      const r = gfx.radialLight;
      const col = hexToRgba(r.color || '#c99e3f', r.opacity ?? 0.14);
      const pos = r.position === 'top-left' ? '15% 15%' : r.position === 'bottom-right' ? '85% 85%' : r.position === 'center' ? '50% 45%' : '82% 18%';
      const sz = Math.max(30, Number(r.size || 62));
      const blur = Number(r.blur || 0);
      layers.push(`<div class="gfx-el gfx-radial" style="background:radial-gradient(circle at ${pos}, ${col} 0%, transparent ${sz}%); ${blur ? `filter:blur(${blur}px);` : ''}"></div>`);
    }

    if (appliesTo(gfx.geometricLines)) {
      const gl = gfx.geometricLines;
      const col = gl.color || '#c99e3f';
      const op = gl.opacity ?? 0.14;
      const dur = Math.max(8, Number(gl.speed || 26));
      layers.push(`
        <svg class="gfx-el gfx-svg-lines" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true" style="opacity:${op}; animation-duration:${dur}s;">
          <line x1="0" y1="70" x2="1200" y2="210" stroke="${col}" stroke-width="1" />
          <line x1="200" y1="0" x2="960" y2="400" stroke="${col}" stroke-width="0.8" stroke-dasharray="6 10" />
          <path d="M0,330 Q420,210 1200,310" fill="none" stroke="${col}" stroke-width="1.1" />
        </svg>`);
    }

    if (appliesTo(gfx.circularOutlines)) {
      const co = gfx.circularOutlines;
      const col = co.color || '#c99e3f';
      const op = co.opacity ?? 0.12;
      const sz = Math.max(140, Number(co.size || 360));
      const posCss = co.position === 'top-left' ? 'top:-80px;left:-80px;' : co.position === 'bottom-right' ? 'bottom:-90px;right:-90px;' : 'top:-70px;right:-70px;';
      layers.push(`
        <svg class="gfx-el gfx-svg-circles" width="${sz}" height="${sz}" viewBox="0 0 200 200" aria-hidden="true" style="opacity:${op}; ${posCss}">
          <circle cx="100" cy="100" r="88" fill="none" stroke="${col}" stroke-width="0.9" />
          <circle cx="100" cy="100" r="62" fill="none" stroke="${col}" stroke-width="0.7" stroke-dasharray="4 6" />
        </svg>`);
    }

    if (appliesTo(gfx.goldParticles)) {
      const gp = gfx.goldParticles;
      const col = gp.color || '#c99e3f';
      const op = gp.opacity ?? 0.22;
      const dur = Math.max(6, Number(gp.speed || 18));
      layers.push(`
        <svg class="gfx-el gfx-particles" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="opacity:${op}; animation-duration:${dur}s;">
          <circle cx="110" cy="60" r="2" fill="${col}" />
          <circle cx="290" cy="180" r="1.5" fill="${col}" />
          <circle cx="460" cy="70" r="2.2" fill="${col}" />
          <circle cx="620" cy="210" r="1.8" fill="${col}" />
          <circle cx="720" cy="95" r="2.4" fill="${col}" />
          <circle cx="210" cy="250" r="1.4" fill="${col}" />
        </svg>`);
    }

    if (appliesTo(gfx.abstractShapes)) {
      const ab = gfx.abstractShapes;
      const col = ab.color || '#c99e3f';
      const op = ab.opacity ?? 0.08;
      layers.push(`
        <svg class="gfx-el gfx-abstract" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true" style="opacity:${op};">
          <path d="M880,-40 C1020,80 960,240 1240,290 L1240,-40 Z" fill="${col}" />
        </svg>`);
    }

    return layers.length ? `<div class="section-gfx-layer" aria-hidden="true">${layers.join('')}</div>` : '';
  }

  return {
    FONT_STACKS,
    compileCss,
    applyStyles,
    renderSectionGraphicsHtml,
    buildGradientCss
  };
})();
