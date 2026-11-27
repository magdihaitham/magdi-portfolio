/* =========================================================
   PUBLIC PORTFOLIO RENDERER v4 (data-driven)
   Reads the same single data file the Visual Builder Studio edits.
   Public API kept: window.PublicRenderer = { uiState, getActiveDecks, renderAll }
   ========================================================= */

window.PublicRenderer = (function () {
  const { escapeHtml, sanitizeRichHtml } = window.PortfolioState;
  const esc = escapeHtml;
  const rich = v => (typeof sanitizeRichHtml === 'function' ? sanitizeRichHtml(v) : esc(v || ''));

  const uiState = { activeDeckId: 'deck-kanan', activeSlideIndex: 0, activeCaseId: '', scriptFilter: 'All', videoFilter: 'All', designFilter: 'All' };
  let currentData = null;
  let gallery = { items: [], index: 0 };
  let scriptIndex = 0;
  let bound = false;

  function sec(data, id, kicker, title, sub) {
    const s = (data.layout && data.layout.sectionSettings && data.layout.sectionSettings[id]) || {};
    return { kicker: s.kicker || kicker, title: s.title || title, subtitle: s.subtitle !== undefined && s.subtitle !== '' ? s.subtitle : sub };
  }
  function vis(data, id) {
    const s = (data.layout && data.layout.sectionSettings && data.layout.sectionSettings[id]) || {};
    const c = [];
    if (s.visibleDesktop === false) c.push('hide-desktop');
    if (s.visibleTablet === false) c.push('hide-tablet');
    if (s.visibleMobile === false) c.push('hide-mobile');
    return c.join(' ');
  }
  const gfx = (data, id) => (window.BuilderStyleEngine ? window.BuilderStyleEngine.renderSectionGraphicsHtml(data, id) : '');
  const modOn = (data, k) => !data.moduleVisibility || data.moduleVisibility[k] !== false;
  const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const brandKey = p => (/kanan/i.test(p) ? 'kanan' : /aibe/i.test(p) ? 'aibe' : /divan/i.test(p) ? 'divan' : slug(p));

  function getActiveDecks(data) {
    return (data.presentations || []).map(dk => ({ ...dk, visibleSlides: (dk.slides || []).filter(s => s.published !== false && !s.isInternal) }));
  }

  function hiddenIds(data) {
    const h = new Set();
    (data.sections || []).forEach(s => { if (s.visible === false) h.add(s.id); });
    if (data.cv && data.cv.showSection === false) h.add('cv');
    return h;
  }

  /* ---------- masthead ---------- */
  function renderNav(data) {
    const g = data.general;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('edition-label', g.editionLabel || '');
    set('issue-tag', g.issueTag || '');
    set('masthead-name', g.shortName || g.fullName);
    set('masthead-role', g.primaryTitle);
    const hid = hiddenIds(data);
    const list = document.getElementById('public-nav-links');
    if (list) {
      const chev = '<svg class="dd-chev" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 3.5 5 7l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      const cases = (data.caseStudies || []).filter(c => c.visible !== false);
      list.innerHTML = (data.navigation || []).filter(n => n.visible !== false && !((n.href || '').startsWith('#') && hid.has(n.href.slice(1))))
        .map(n => {
          if (n.dropdown === 'projects' && cases.length) {
            return `<li class="has-dd"><a href="${esc(n.href)}" class="dd-toggle" aria-haspopup="true" aria-expanded="false">${esc(n.label)}${chev}</a>
              <ul class="dd" role="menu">${cases.map(c => `<li role="none"><a role="menuitem" href="#${esc(c.id)}" style="--dd-accent:${esc(c.brandAccent || c.brandColor || '#C99E3F')}"><i class="dd-dot" aria-hidden="true"></i><span><b>${esc(c.title)}</b><small>${esc(String(c.subtitle || '').split('\u00b7')[0].trim())}</small></span></a></li>`).join('')}
              <li role="none" class="dd-foot"><a role="menuitem" href="${esc(n.href)}">All projects</a></li></ul></li>`;
          }
          return `<li><a href="${esc(n.href)}">${esc(n.label)}</a></li>`;
        }).join('');
    }
  }

  const NOTE_ARROW = '<svg viewBox="0 0 60 40" width="46" height="30" aria-hidden="true"><path d="M3 6 C 20 2, 38 10, 50 30" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M40 27 L51 32 L53 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function note(data, key, cls, arrow) {
    const t = data.general && data.general.notes && data.general.notes[key];
    if (!t) return '';
    return `<span class="v4-note ${cls || ''}" aria-hidden="true"><span>${esc(t)}</span>${arrow ? NOTE_ARROW : ''}</span>`;
  }

  /* ---------- hero ---------- */
  function renderHero(data) {
    const g = data.general, c = g.contact || {}, ct = data.contentText || {};
    const cvUrl = cvLink(data);
    const centered = (data.theme && data.theme.heroLayout) === 'centered';
    const ctas = `
              <a class="btn btn-primary" href="#proof">${esc(ct.heroCtaPrimary || 'See the work')}</a>
              <a class="btn" href="#lab">${esc(ct.heroCtaSecondary || 'Concepts Lab')}</a>
              ${cvUrl ? `<a class="btn" href="${esc(cvUrl)}" target="_blank" rel="noopener">${esc(ct.heroCtaTertiary || 'Open CV')}</a>` : ''}`;
    const links = `
              ${c.email ? `<a href="mailto:${esc(c.email)}?subject=${encodeURIComponent('Hello Magdi')}">${esc(c.email)}</a>` : ''}
              ${c.linkedin ? `<a href="${esc(c.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a>` : ''}
              ${c.behance ? `<a href="${esc(c.behance)}" target="_blank" rel="noopener">Behance ↗</a>` : ''}`;
    const tags = `
        <div class="v4-tags" aria-label="What I work on">
          ${(g.highlights || []).map(h => `<div class="v4-tag"><strong>${esc(h.value)}</strong><span>${esc(h.label)}</span></div>`).join('')}
        </div>`;
    if ((data.theme && data.theme.heroLayout) === 'poster') {
      const full = String(g.shortName || 'Magdi Haitham').toUpperCase();
      const echoWord = (g.posterWord || 'DIFFERENT').toUpperCase();
      const echo = [0, 1, 2, 3].map(i => `<span class="vp-e vp-e${i}" style="--i:${i}">${esc(echoWord)}</span>`).join('');
      return `
    <section id="hero" class="v4-hero v4-hero--poster ${vis(data, 'hero')}">
      ${gfx(data, 'hero')}
      <div class="vp-bg" aria-hidden="true"><i class="vp-cloud c1"></i><i class="vp-cloud c2"></i><i class="vp-cloud c3"></i>${posterAtmos()}<i class="vp-shade"></i><i class="v4-smoke v4-smoke--0"></i><i class="v4-smoke v4-smoke--1"></i>
        <i class="v4-spark" style="left:9%;top:20%;--ss:22px"></i><i class="v4-spark" style="left:90%;top:14%;--ss:16px;animation-delay:.8s"></i><i class="v4-spark" style="left:78%;top:62%;--ss:26px;animation-delay:1.6s"></i><i class="v4-spark" style="left:16%;top:70%;--ss:14px;animation-delay:2.2s"></i><i class="v4-spark" style="left:50%;top:8%;--ss:12px;animation-delay:.4s"></i></div>
      <div class="container section-content-z">
        <div class="vp-stage" id="vp-stage">
          <div class="vp-eyebrow">${esc(g.heroEyebrow || g.fullName)}</div>
          <div class="vp-echo" aria-hidden="true">${echo}</div>
          <figure class="vp-figure"><img src="${esc(g.profilePhoto)}" alt="${esc(g.fullName)}" loading="eager" /></figure>
          <h1 class="vp-statement" aria-label="${esc(g.heroHeadline || g.primaryTitle || '')}">${posterStatement(String(g.heroHeadline || g.primaryTitle || ''))}</h1>
          <div class="vp-name"><b>${esc(full)}</b><span>${esc(g.primaryTitle || '')}</span></div>
          <p class="v4-hero-sub vp-sub">${esc(g.heroSub || '')}</p>
          <div class="v4-cta-row vp-cta">${ctas}
          </div>
          <div class="v4-hero-links vp-links">${links}
          </div>
        </div>${tags}
      </div>
    </section>`;
    }
    if (centered) {
      const headline = String(g.heroHeadline || g.primaryTitle || '');
      const words = headline.split(/\s+/).filter(Boolean);
      const cut = Math.ceil(words.length / 2);
      const a = words.slice(0, cut).join(' '), b = words.slice(cut).join(' ');
      return `
    <section id="hero" class="v4-hero v4-hero--center ${vis(data, 'hero')}">
      ${gfx(data, 'hero')}
      <div class="container section-content-z">
        <div class="v4c-stage">
          <div class="v4-eyebrow v4c-eyebrow">${esc(g.heroEyebrow || g.fullName)}</div>
          <figure class="v4-portrait v4c-figure">
            <img src="${esc(g.profilePhoto)}" alt="${esc(g.fullName)}" loading="eager" />
            ${(data.theme && data.theme.heroParticles === false) ? '' : '<canvas class="v4c-particles" aria-hidden="true"></canvas>'}
            ${note(data, 'hero', 'v4-note-hero', true)}
          </figure>
          <h1 class="v4-hero-title v4c-title"><span class="v4c-a">${esc(a)}</span> <span class="v4c-b">${esc(b)}</span></h1>
          <div class="v4c-bl">
            <p class="v4-hero-sub">${esc(g.heroSub || '')}</p>
            <div class="v4-cta-row">${ctas}
            </div>
          </div>
          <div class="v4c-br">
            <div class="v4c-name">${esc(g.profileCaption || g.shortName || '')}</div>
            <div class="v4-hero-links">${links}
            </div>
          </div>
        </div>${tags}
      </div>
    </section>`;
    }
    return `
    <section id="hero" class="v4-hero ${vis(data, 'hero')}">
      ${gfx(data, 'hero')}
      <div class="container section-content-z">
        <div class="v4-hero-grid">
          <div class="v4-hero-copy">
            <div class="v4-eyebrow">${esc(g.heroEyebrow || g.fullName)}</div>
            <h1 class="v4-hero-title">${esc(g.heroHeadline || g.primaryTitle)}</h1>
            <p class="v4-hero-sub">${esc(g.heroSub || '')}</p>
            <div class="v4-cta-row">${ctas}
            </div>
            <div class="v4-hero-links">${links}
            </div>
          </div>
          <figure class="v4-portrait">
            <img src="${esc(g.profilePhoto)}" alt="${esc(g.fullName)}" loading="eager" />
            <figcaption>${esc(g.profileCaption || g.shortName)}</figcaption>
          </figure>
        </div>${tags}
      </div>
    </section>`;
  }

  const railWrap = (cls, inner) => `<div class="v4-railwrap" data-rail><button type="button" class="v4-arrow prev" data-rail-dir="-1" aria-label="Scroll left">&#8249;</button><div class="v4-rail ${cls}"><div class="v4-track">${inner}</div></div><button type="button" class="v4-arrow next" data-rail-dir="1" aria-label="Scroll right">&#8250;</button></div>`;

  /* ---------- proof rails: Selected work — reels on top, designs below ---------- */
  function renderProof(data) {
    const reels = (data.videos || []).filter(v => v.published !== false && v.src && v.selectedWork);
    const designs = (data.designs || []).filter(x => x.published !== false && x.selectedDesign);
    if (!reels.length && !designs.length) return '';
    const reelItems = reels.map(t => `<button type="button" class="v4-tile v4-tile-video" data-watch-tape="${esc(tapeKey(t.project))}" data-watch-vid="${esc(t.id)}" aria-label="Watch ${esc(t.title)} on the Screening Room TV"><img src="${esc(t.thumbnail)}" alt="" loading="lazy"><span class="v4-play">▶</span><span class="v4-tile-cap"><b>${esc(t.project)}</b>${esc(t.title)}</span></button>`).join('');
    const designItems = designs.map(t => `<button type="button" class="v4-tile" data-open-design="${esc(t.id)}" aria-label="Open ${esc(t.title)}"><img src="${esc(t.image)}" alt="${esc(t.title)}" loading="lazy"><span class="v4-tile-cap"><b>${esc(t.project)}</b>${esc(t.category || '')}</span></button>`).join('');
    return `
    <section id="proof" class="v4-proof ${vis(data, 'proof')}" aria-label="Selected work">
      <div class="v4-proof-head container"><span class="v4-kicker">Selected work</span><span class="v4-proof-hint">Scroll →</span></div>
      ${reels.length ? railWrap("v4-rail-proof", reelItems) : ''}
      ${designs.length ? railWrap("v4-rail-proof v4-rail-proof-designs", designItems) : ''}
    </section>`;
  }

  /* ---------- case studies ---------- */
  function designsFor(data, key) {
    return (data.designs || []).filter(x => x.published !== false && brandKey(x.project) === key);
  }
  function renderCase(data, cs) {
    const key = brandKey(cs.title);
    const all = designsFor(data, key);
    const featured = all.filter(x => x.featured).sort((a, b) => (a.featuredOrder || 99) - (b.featuredOrder || 99)).slice(0, 8);
    const feat = featured.length ? featured : all.slice(0, 8);
    const rest = all.filter(x => !feat.includes(x));
    const vids = (data.videos || []).filter(v => v.published !== false && v.src && brandKey(v.project) === key);
    const deck = getActiveDecks(data).find(x => x.id === cs.relatedDeckId);
    const scripts = (data.scripts || []).filter(s => s.published !== false && brandKey(s.project) === key);
    const st = cs.story || {};
    const lighten = (hex, t) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '')); if (!m) return '#C99E3F'; const n = parseInt(m[1], 16); const f = c => Math.round(c + (255 - c) * t); return '#' + [f(n >> 16 & 255), f(n >> 8 & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join(''); };
    const th = cs.theme || {};
    const accent = cs.brandAccent || (cs.brandColor ? lighten(cs.brandColor, 0.45) : '#C99E3F');
    const tint = cs.brandColor || accent;
    const wm = th.watermark === false ? '' : String(th.watermarkText || cs.title || '').split(' ')[0].toUpperCase();
    const glow = Math.max(0, Math.min(60, Number(th.glow == null ? 22 : th.glow)));
    const themeVars = `--case-accent:${esc(accent)};--case-tint:${esc(tint)};--glow:${glow}%;--glow-l:${Math.round(glow * 0.6)}%;--gx:${Number(th.glowX == null ? 85 : th.glowX)}%;--gy:${Number(th.glowY == null ? 8 : th.glowY)}%;--bgmix:${Number(th.tintStrength == null ? 26 : th.tintStrength)}%;--bgmix-l:${Math.round(Number(th.tintStrength == null ? 26 : th.tintStrength) * 0.45)}%`;
    const designCard = (x, extra) => `<button type="button" class="v4-design ${extra || ''}" data-open-design="${esc(x.id)}" aria-label="Open ${esc(x.title)}"><img src="${esc(x.image)}" alt="${esc(x.title)}" loading="lazy"></button>`;
    return `
    <section class="v4-project" id="${esc(cs.id)}" style="${themeVars}" data-spy>
    ${th.bgImage ? `<div class="v4-project-bg" aria-hidden="true" style="background-image:url('${esc(th.bgImage)}');opacity:${Number(th.bgImageOpacity == null ? 0.18 : th.bgImageOpacity)}"></div>` : ''}
    ${wm ? `<div class="v4-project-wm" aria-hidden="true" data-pan="-0.35">${esc(wm)}</div>` : ''}
    <div class="container section-content-z">
    <article class="v4-case">
      <header class="v4-case-head">
        <div class="v4-case-num"><small>Project</small>${esc(cs.number)}</div>
        <div class="v4-case-title">
          ${cs.logo ? `<span class="v4-logo-plate ${esc(cs.logoPlate || '')}"><img src="${esc(cs.logo)}" alt="${esc(cs.title)} logo" loading="lazy"></span>` : ''}
          <div>
            <h3>${esc(cs.title)}</h3>
            <p class="v4-case-tagline">${esc(cs.tagline || cs.subtitle)}</p>
            <p class="v4-case-meta">${[cs.subtitle, cs.role, cs.period].filter((v, i, a) => v && a.indexOf(v) === i).map(esc).join(' · ')}</p>
          </div>
        </div>
      </header>

      <div class="v4-story">
        <div><h4>The problem</h4><p>${esc(st.problem || '')}</p></div>
        <div><h4>The idea</h4><p>${esc(st.idea || '')}</p></div>
        <div><h4>What I made</h4><ul>${(st.made || []).map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>
      </div>

      ${vids.length ? `<div class="v4-case-reels"><span class="v4-case-reels-ico" aria-hidden="true">${SR_ICO.play}</span><p><b>${vids.length} ${vids.length === 1 ? 'reel' : 'reels'} for this project</b><small>They play on the Screening Room TV, on this project's tape.</small></p><a class="btn btn-sm btn-primary" href="#reels" data-watch-tape="${esc(tapeKey(cs.title))}">Watch the reels on the TV</a></div>` : ''}

      <div class="v4-design-grid" data-case-grid="${esc(cs.id)}">
        ${feat.map(x => designCard(x)).join('')}
        ${rest.map(x => designCard(x, 'v4-extra')).join('')}
      </div>
      <div class="v4-case-actions">
        ${rest.length ? `<button type="button" class="btn btn-sm" data-toggle-grid="${esc(cs.id)}" data-more="See all designs" data-less="Show fewer">See all designs</button>` : ''}
        ${deck && deck.visibleSlides.length ? `<button type="button" class="btn btn-sm" data-open-deck="${esc(deck.id)}">Browse the deck</button>` : ''}
        ${scripts.length ? `<a class="btn btn-sm" href="#content-archive" data-script-filter="${esc(cs.title)}">Read the scripts</a>` : ''}
      </div>
      ${cs.credit ? `<p class="v4-credit">${esc(cs.credit)}</p>` : ''}
    </article>
    </div>
    </section>`;
  }
  function renderCases(data) {
    const cases = (data.caseStudies || []).filter(c => c.visible !== false);
    if (!cases.length) return '';
    const cfg = sec(data, 'case-studies', 'Projects', 'Five projects, five audiences', 'The strongest pieces from each, with the thinking behind them.');
    return `
    <section id="case-studies" class="v4-section v4-projects-intro ${vis(data, 'case-studies')}" data-spy>
      ${gfx(data, 'case-studies')}
      <div class="container section-content-z">
        ${head(cfg)}${note(data, 'cases', 'v4-note-head', true)}
        <div class="v4-project-index">${cases.map(c => `<a href="#${esc(c.id)}" style="--case-accent:${esc(c.brandAccent || c.brandColor || '#C99E3F')};--case-tint:${esc(c.brandColor || '#C99E3F')}"><span>${esc(c.number)}</span><b>${esc(c.title)}</b><small>${esc(String(c.subtitle || '').split('\u00b7')[0].trim())}</small></a>`).join('')}</div>
      </div>
    </section>
    ${cases.map(c => renderCase(data, c)).join('')}`;
  }
  function head(cfg) {
    return `<div class="v4-head"><span class="v4-kicker">${esc(cfg.kicker)}</span><h2 class="v4-h2">${esc(cfg.title)}</h2>${cfg.subtitle ? `<p class="v4-lead">${esc(cfg.subtitle)}</p>` : ''}</div>`;
  }

  /* ---------- reels = The Screening Room: a CRT TV, a VCR, one tape per project, a remote ---------- */
  const TAPE_ORDER = ['kanan', 'aibe', 'divan', 'hassan', 'irt', 'personal'];
  const tapeKey = p => /kanan/i.test(p) ? 'kanan' : /aibe/i.test(p) ? 'aibe' : /divan/i.test(p) ? 'divan' : /hassan/i.test(p) ? 'hassan' : /ir\.?t\b/i.test(p) ? 'irt' : 'personal';
  const TAPE_LOGO = { kanan: './assets/brand-logos/kanan-guide-01.png', aibe: './assets/brand-logos/aibe-purple.png', divan: './assets/brand-logos/divan-logo.png', hassan: './assets/brand-logos/hassan1-logo.webp', irt: './assets/brand-logos/irt-logo.webp', personal: '' };
  const TAPE_STYLE = { hassan: { color: '#17161a', accent: '#C9A227' }, personal: { color: '#1d1d22', accent: '#c99e3f' } };
  const SR_PLATES = { d: './assets/room/screening-desktop.webp', m: './assets/room/screening-mobile.webp' };
  const SR_ICO = {
    eject: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5 4.5 14h15z"/><rect x="5" y="16.5" width="14" height="2.6" rx="1"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5v14l11-7z"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2.4v14H6zM20 5v14L9.5 12z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.6 5H18v14h-2.4zM4 5l10.5 7L4 19z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16M4 12h16M4 17.5h16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6 5 17h14z"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 18 5 7h14z"/></svg>',
    mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.6L12 18.5v-13L7.6 9.5z"/><path class="w" d="M15 9a4.2 4.2 0 0 1 0 6M17.4 6.5a7.6 7.6 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };
  const TAPE_SHORT = { kanan: 'Kanan' };
  function tapeGroups(data) {
    const vids = (data.videos || []).filter(v => v.published !== false && v.src);
    const g = {}; vids.forEach(v => { const k = tapeKey(v.project); (g[k] = g[k] || []).push(v); });
    return TAPE_ORDER.filter(k => g[k]).map(k => {
      const cs = (data.caseStudies || []).find(c => c.visible !== false && tapeKey(c.title) === k && k !== 'personal');
      const st = TAPE_STYLE[k] || {};
      return {
        key: k, name: cs ? cs.title : (k === 'personal' ? 'Personal' : g[k][0].project),
        color: st.color || (cs && cs.brandColor) || '#2a2a2e', accent: st.accent || (cs && cs.brandAccent) || '#c99e3f',
        logo: TAPE_LOGO[k], vids: g[k]
      };
    });
  }
  function renderReels(data) {
    if (!modOn(data, 'videos')) return '';
    const tapes = tapeGroups(data);
    if (!tapes.length) return '';
    const cfg = sec(data, 'reels', 'The Screening Room', 'Pick a tape', 'Each tape on the shelf is one project. Slide one in, then use the remote and its Menu to pick a reel.');
    const tapeBtn = (t, ti) => {
      const n = t.vids.length;
      return `<button type="button" class="sr-tape" data-tape="${esc(t.key)}" data-name="${esc(t.name)}" data-count="${n} ${n === 1 ? 'reel' : 'reels'}" data-logo="${esc(t.logo || '')}" role="listitem" style="--tc:${esc(t.color)};--ta:${esc(t.accent)}" aria-label="Play the ${esc(t.name)} tape, ${n} ${n === 1 ? 'reel' : 'reels'}">
        <span class="sr-sleeve"><i class="sr-edge" aria-hidden="true"></i>
          <span class="sr-spine"><span class="sr-sp-em">${t.logo ? `<img src="${esc(t.logo)}" alt="" loading="lazy" decoding="async">` : 'MH'}</span><span class="sr-sp-t" dir="auto">${esc(TAPE_SHORT[t.key] || t.name)}</span><span class="sr-sp-no">${String(ti + 1).padStart(2, '0')}</span></span>
        </span></button>`;
    };
    const rowsHtml = []; for (let i = 0; i < tapes.length; i += 3) rowsHtml.push(`<div class="sr-row">${tapes.slice(i, i + 3).map((t, k) => tapeBtn(t, i + k)).join('')}</div>`);
    const tapeHtml = rowsHtml.join('');
    return `
    <section id="reels" class="v4-section sr-section ${vis(data, 'reels')}">
      ${gfx(data, 'reels')}
      <div class="sr" id="sr" data-state="idle">
        <div class="sr-stage">
          <div class="sr-plate" aria-hidden="true"><picture><source media="(max-width: 720px)" srcset="${SR_PLATES.m}"><img src="${SR_PLATES.d}" alt="" loading="lazy" decoding="async"></picture></div>
          <div class="sr-pull" id="sr-pull" aria-hidden="true"><div class="sr-pc-shell"><div class="sr-pc-sticker"><span class="sr-pc-em"><img alt="" src=""><b class="mh">MH</b></span><span class="sr-pc-txt"><b dir="auto"></b><small dir="auto"></small></span><i class="sr-pc-vhs">VHS</i></div><div class="sr-pc-win"><i></i><i></i></div></div></div>
          <div class="sr-title"><span class="sr-kicker">${esc(cfg.kicker)}</span><h2>${esc(cfg.title)}</h2></div>
          <div class="sr-rig">
            <div class="sr-vcr" aria-hidden="false">
              <div class="sr-slot"><i class="sr-cass" aria-hidden="true"><b></b></i></div>
              <span class="sr-disp" id="sr-disp" aria-hidden="true">--:--</span>
              <i class="sr-led" aria-hidden="true"></i>
              <button type="button" class="sr-ej" data-sr="eject" aria-label="Eject the tape">${SR_ICO.eject}</button>
            </div>
            <div class="sr-tv">
              <div class="sr-screen" id="sr-screen" tabindex="0" role="group" aria-label="Television. Press space to play or pause">
                <div class="sr-vid"><video id="sr-video" playsinline preload="none"></video></div>
                <canvas class="sr-static" width="160" height="120" aria-hidden="true"></canvas>
                <div class="sr-osd" aria-hidden="true"><b id="sr-osd-a">PICK A TAPE</b><span id="sr-osd-b"></span></div>
                <div class="sr-menu" id="sr-menu" hidden><div class="sm-head"><b id="sm-title">MENU</b><small>\u25B2\u25BC OK</small></div><div class="sm-list" id="sm-list" role="listbox"></div></div>
                <i class="sr-scan" aria-hidden="true"></i><i class="sr-glass" aria-hidden="true"></i>
              </div>
              <div class="sr-side" aria-hidden="true"><i class="sr-knob"></i><i class="sr-knob k2"></i><i class="sr-grille"></i></div>
            </div>
          </div>
          <div class="sr-shelf"><i class="sr-shelf-lamp" aria-hidden="true"></i><div class="sr-tapes" role="list" aria-label="Tapes on the shelf, one per project">${tapeHtml}</div></div>
          <div class="sr-remote" id="sr-remote" role="group" aria-label="TV remote. Hover or tap to open it">
            <div class="rm-body">
              <span class="rm-ir" aria-hidden="true"></span>
              <div class="rm-top"><button type="button" class="rm-b rm-red" data-sr="eject" aria-label="Eject the tape">${SR_ICO.eject}<em>Eject</em></button><button type="button" class="rm-b rm-mute" data-sr="mute" aria-label="Mute or unmute" aria-pressed="false">${SR_ICO.mute}<em>Mute</em></button></div>
              <button type="button" class="rm-b rm-menu" data-sr="menu" aria-label="Menu: list of reels" aria-pressed="false">${SR_ICO.menu}<em>Menu</em></button>
              <div class="rm-pad" role="group" aria-label="Arrows">
                <button type="button" class="rm-b rm-u" data-sr="up" aria-label="Up">${SR_ICO.up}</button>
                <button type="button" class="rm-b rm-l" data-sr="prev" aria-label="Previous reel">${SR_ICO.prev}</button>
                <button type="button" class="rm-b rm-ok" data-sr="ok" aria-label="OK, play or pause">OK</button>
                <button type="button" class="rm-b rm-r" data-sr="next" aria-label="Next reel">${SR_ICO.next}</button>
                <button type="button" class="rm-b rm-d" data-sr="down" aria-label="Down">${SR_ICO.down}</button>
              </div>
              <button type="button" class="rm-b rm-play" data-sr="play" aria-label="Play or pause">${SR_ICO.play}<em>Play</em></button>
              <div class="rm-keys" aria-hidden="true"><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i><i>8</i><i>9</i><i></i><i>0</i><i></i></div>
              <span class="rm-brand" aria-hidden="true">MH</span>
            </div>
            <span class="rm-hint" aria-hidden="true">Remote</span>
          </div>
        </div>
        <div class="container section-content-z sr-foot">${note(data, 'reels', 'v4-note-head', true)}
          <p class="sr-cap" id="sr-cap" aria-live="polite">Pick a tape from the shelf. Then hover or tap the remote and press Menu to choose a reel.</p>
        </div>
      </div>
    </section>`;
  }
  const SR = { menuSel: 0, tape: null, idx: 0, busy: false, muted: false, timer: 0, tapes: [], raf: 0, vis: true };
  function srEl(sel) { return document.querySelector('#sr ' + sel); }
  const srReduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function srFmt(t) { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); }
  function srSet(state, osdA) { const r = $('sr'); if (!r) return; r.dataset.state = state; if (osdA !== undefined) { const a = $('sr-osd-a'); if (a) a.textContent = osdA; } }
  function srStaticLoop() {
    const cv = srEl('.sr-static'); if (!cv) return;
    const ctx = cv.getContext('2d'); let last = 0;
    const draw = () => {
      const id = ctx.createImageData(160, 120), d = id.data;
      for (let i = 0; i < d.length; i += 4) { const g = (Math.random() * 255) | 0; d[i] = g; d[i + 1] = g; d[i + 2] = g; d[i + 3] = 255; }
      ctx.putImageData(id, 0, 0);
    };
    draw();
    if (srReduce()) return;
    const tick = t => {
      SR.raf = requestAnimationFrame(tick);
      const r = $('sr'); if (!r || !SR.vis) return;
      const st = r.dataset.state; if (st === 'play' || st === 'pause') return;
      if (t - last < (st === 'static' ? 45 : 110)) return; last = t; draw();
    };
    cancelAnimationFrame(SR.raf); SR.raf = requestAnimationFrame(tick);
  }
  function srShowReel(i, withStatic) {
    const t = SR.tapes.find(x => x.key === SR.tape); if (!t) return;
    const v = $('sr-video'), n = t.vids.length;
    SR.idx = (i + n) % n; const vid = t.vids[SR.idx];
    clearTimeout(SR.timer);
    const cap = $('sr-cap'); if (cap) cap.textContent = `${vid.title}${vid.category ? ' · ' + vid.category : ''}${vid.description ? '. ' + vid.description : ''}`;
    const osd = $('sr-osd-b'); if (osd) osd.textContent = `${SR.idx + 1}/${n}  ${vid.title}`;
    const go = () => {
      const src = new URL(vid.src, location.href).href;
      if (v.src !== src) { v.src = vid.src; v.load(); }
      v.currentTime = 0;
      v.muted = SR.muted;
      const p = v.play();
      const ok = () => { srSet('play', '\u25B6 PLAY'); const d = $('sr-disp'); if (d) d.textContent = srFmt(0); };
      if (p && p.then) p.then(ok).catch(() => { v.muted = true; const q = v.play(); if (q && q.then) q.then(ok).catch(() => { srSet('pause', '\u275A\u275A PAUSE'); }); }); else ok();
    };
    if (withStatic === false) return go();
    srSet('static', 'TRACKING'); v.pause();
    SR.timer = setTimeout(go, srReduce() ? 150 : 1000);
  }
  function srUnlock(vid) {
    /* start the file inside the click so mobile browsers allow later playback, then hold it behind the static */
    const v = $('sr-video'); if (!v) return;
    v.muted = true; v.src = vid.src; v.load();
    const p = v.play(); if (p && p.catch) p.catch(() => {});
    const hold = () => { const r = $('sr'); if (r && r.dataset.state === 'play') return; v.pause(); try { v.currentTime = 0; } catch (e) {} };
    v.addEventListener('playing', hold, { once: true });
  }
  function srEject(instant) {
    clearTimeout(SR.timer); srMenuOpen(false);
    const v = $('sr-video'); if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
    document.querySelectorAll('#sr .sr-tape.out').forEach(b => { b.classList.remove('out'); if (!instant && !srReduce()) { b.classList.add('back'); setTimeout(() => b.classList.remove('back'), 700); } });
    const r = $('sr'); if (r) r.classList.remove('loaded');
    SR.tape = null; SR.busy = false;
    srSet('idle', 'PICK A TAPE'); const o = $('sr-osd-b'); if (o) o.textContent = '';
    const d = $('sr-disp'); if (d) d.textContent = '--:--';
    const cap = $('sr-cap'); if (cap) cap.textContent = 'Pick a tape from the shelf. Then hover or tap the remote and press Menu to choose a reel.';
  }
  function srInsert(key, startIdx) {
    const r = $('sr'); if (!r || SR.busy) return;
    const t = SR.tapes.find(x => x.key === key); if (!t) return;
    if (SR.tape === key) { if (startIdx != null) srShowReel(startIdx, true); return; }
    if (SR.tape) srEject(true);
    SR.busy = true; SR.tape = key;
    const btn = r.querySelector(`.sr-tape[data-tape="${key}"]`), stage = r.querySelector('.sr-stage'), slot = r.querySelector('.sr-slot'), cass = r.querySelector('.sr-cass');
    const idx = startIdx || 0;
    srUnlock(t.vids[idx]);
    cass.style.setProperty('--tc', t.color); cass.style.setProperty('--ta', t.accent);
    srSet('loading', 'LOADING'); const d = $('sr-disp'); if (d) d.textContent = 'LOAD';
    const finish = () => { r.classList.add('loaded'); SR.busy = false; srShowReel(idx, true); };
    if (!btn || srReduce() || !btn.querySelector('.sr-sleeve').animate) { if (btn) btn.classList.add('out'); return finish(); }
    const sl = btn.querySelector('.sr-sleeve'), sr = stage.getBoundingClientRect(), tr = sl.getBoundingClientRect(), vr = slot.getBoundingClientRect();
    const clone = sl.cloneNode(true); clone.classList.add('sr-fly');
    Object.assign(clone.style, { position: 'absolute', left: (tr.left - sr.left) + 'px', top: (tr.top - sr.top) + 'px', width: tr.width + 'px', height: tr.height + 'px', margin: 0, zIndex: 8, transformOrigin: '50% 50%', pointerEvents: 'none' });
    clone.style.setProperty('--tc', t.color); clone.style.setProperty('--ta', t.accent);
    stage.appendChild(clone); btn.classList.add('out');
    const dx = (vr.left + vr.width / 2) - (tr.left + tr.width / 2), dy = (vr.top + vr.height / 2) - (tr.top + tr.height / 2);
    const sx = vr.width * .94 / tr.width, sy = Math.max(.06, vr.height * .7 / tr.height);
    const a = clone.animate([
      { transform: 'translate(0,0) scale(1) rotateX(0)', opacity: 1, offset: 0 },
      { transform: `translate(${dx * .15}px,${-tr.height * .22}px) scale(1.08) rotateX(8deg)`, opacity: 1, offset: .28 },
      { transform: `translate(${dx * .96}px,${dy * .9}px) scale(${sx * 1.05},${sy * 1.6}) rotateX(55deg)`, opacity: 1, offset: .82 },
      { transform: `translate(${dx}px,${dy}px) scale(${sx},${sy}) rotateX(70deg)`, opacity: .0, offset: 1 }
    ], { duration: 950, easing: 'cubic-bezier(.5,.05,.3,1)', fill: 'forwards' });
    a.onfinish = () => { clone.remove(); finish(); };
    a.oncancel = () => { clone.remove(); finish(); };
  }

  function srMenuItems() {
    if (SR.tape) {
      const t = SR.tapes.find(x => x.key === SR.tape); if (!t) return { title: 'MENU', items: [] };
      const items = t.vids.map((v, i) => ({ kind: 'reel', i, title: v.title, sub: v.category || '', thumb: v.thumbnail, now: i === SR.idx }));
      items.push({ kind: 'tapes', title: 'All tapes', sub: 'Pick another project', thumb: '' });
      return { title: `MENU \u00B7 ${t.name}`, items };
    }
    return { title: 'MENU \u00B7 TAPES', items: SR.tapes.map(t => ({ kind: 'tape', key: t.key, title: t.name, sub: `${t.vids.length} ${t.vids.length === 1 ? 'reel' : 'reels'}`, thumb: t.logo, logo: true })) };
  }
  function srMenuBuild() {
    const m = srMenuItems(), list = $('sm-list'); if (!list) return m;
    $('sm-title').textContent = m.title;
    list.innerHTML = m.items.map((it, n) => `<button type="button" class="sm-it${it.now ? ' now' : ''}" role="option" data-n="${n}" data-kind="${it.kind}"${it.kind === 'reel' ? ` data-i="${it.i}"` : ''}${it.kind === 'tape' ? ` data-key="${esc(it.key)}"` : ''}>
      ${it.thumb ? `<span class="sm-th${it.logo ? ' lg' : ''}"><img src="${esc(it.thumb)}" alt="" loading="lazy" decoding="async"></span>` : `<span class="sm-th ic">${it.kind === 'tapes' ? '\u23CF' : ''}</span>`}
      <span class="sm-tx"><b dir="auto">${it.kind === 'reel' ? (it.i + 1) + '. ' : ''}${esc(it.title)}</b>${it.sub ? `<small dir="auto">${esc(it.sub)}</small>` : ''}</span></button>`).join('');
    return m;
  }
  function srMenuSel(n, scroll) {
    const list = $('sm-list'); if (!list) return; const els = list.querySelectorAll('.sm-it'); if (!els.length) return;
    SR.menuSel = (n + els.length) % els.length;
    els.forEach((e, i) => { e.classList.toggle('sel', i === SR.menuSel); e.setAttribute('aria-selected', String(i === SR.menuSel)); });
    if (scroll !== false) { const e = els[SR.menuSel]; if (e && e.scrollIntoView) e.scrollIntoView({ block: 'nearest' }); }
  }
  function srMenuOpen(open) {
    const r = $('sr'), m = $('sr-menu'); if (!r || !m) return;
    if (open === undefined) open = m.hidden;
    if (open && SR.busy) return;
    m.hidden = !open; r.dataset.menu = open ? '1' : '0';
    document.querySelectorAll('#sr [data-sr="menu"]').forEach(b => { b.setAttribute('aria-pressed', String(!!open)); b.classList.toggle('on', !!open); });
    if (open) { srMenuBuild(); const cur = $('sm-list').querySelector('.sm-it.now'); srMenuSel(cur ? +cur.dataset.n : 0); const rem = $('sr-remote'); if (rem) rem.classList.add('open'); }
  }
  function srMenuPick(el) {
    if (!el) return; const k = el.dataset.kind;
    if (k === 'reel') { srMenuOpen(false); srShowReel(+el.dataset.i, true); }
    else if (k === 'tape') { srMenuOpen(false); srInsert(el.dataset.key); }
    else if (k === 'tapes') { const l = $('sm-list'); SR.tapeMode = true; const m = { title: 'MENU \u00B7 TAPES', items: SR.tapes.map(t => ({ kind: 'tape', key: t.key, title: t.name, sub: `${t.vids.length} ${t.vids.length === 1 ? 'reel' : 'reels'}`, thumb: t.logo, logo: true })) }; $('sm-title').textContent = m.title; l.innerHTML = m.items.map((it, n) => `<button type="button" class="sm-it" role="option" data-n="${n}" data-kind="tape" data-key="${esc(it.key)}"><span class="sm-th${it.logo ? ' lg' : ''}">${it.thumb ? `<img src="${esc(it.thumb)}" alt="" loading="lazy" decoding="async">` : 'MH'}</span><span class="sm-tx"><b dir="auto">${esc(it.title)}</b><small>${esc(it.sub)}</small></span></button>`).join(''); srMenuSel(0); }
  }
  function srAct(act) {
    const v = $('sr-video'); if (!v) return;
    if (act === 'eject') { srMenuOpen(false); return srEject(false); }
    if (act === 'menu') return srMenuOpen();
    const mo = $('sr-menu') && !$('sr-menu').hidden;
    if (mo && act === 'up') return srMenuSel(SR.menuSel - 1);
    if (mo && act === 'down') return srMenuSel(SR.menuSel + 1);
    if (mo && act === 'ok') return srMenuPick($('sm-list').querySelectorAll('.sm-it')[SR.menuSel]);
    if (act === 'up' || act === 'down') return srMenuOpen(true);
    if (act === 'ok') act = 'play';
    if (act === 'mute') { SR.muted = !SR.muted; v.muted = SR.muted; document.querySelectorAll('#sr [data-sr="mute"]').forEach(b => { b.setAttribute('aria-pressed', String(SR.muted)); b.classList.toggle('on', SR.muted); }); return; }
    if (!SR.tape || SR.busy) return;
    if (act === 'play') { if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); srSet('play', '\u25B6 PLAY'); } else { v.pause(); srSet('pause', '\u275A\u275A PAUSE'); } return; }
    if (act === 'next') return srShowReel(SR.idx + 1, true);
    if (act === 'prev') return srShowReel(SR.idx - 1, true);
  }
  function srWatch(key, vidId) {
    const sec = $('reels'); if (!sec) { return vidId && playVideo(vidId); }
    const t = SR.tapes.find(x => x.key === key); if (!t) return;
    const i = vidId ? Math.max(0, t.vids.findIndex(x => x.id === vidId)) : 0;
    sec.scrollIntoView({ behavior: srReduce() ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => srInsert(key, i), srReduce() ? 50 : 700);
  }
  function srInit() {
    const r = $('sr'); if (!r) { SR.tape = null; return; }
    SR.tapes = tapeGroups(currentData); SR.tape = null; SR.busy = false;
    const v = $('sr-video');
    const pull = $('sr-pull');
    const pullShow = tp => { if (!pull || tp.classList.contains('out')) return; pull.style.setProperty('--tc', tp.style.getPropertyValue('--tc')); pull.style.setProperty('--ta', tp.style.getPropertyValue('--ta')); const im = pull.querySelector('img'); if (tp.dataset.logo) { im.src = tp.dataset.logo; im.style.display = ''; } else { im.removeAttribute('src'); im.style.display = 'none'; } pull.querySelector('.sr-pc-txt b').textContent = tp.dataset.name || ''; pull.querySelector('.sr-pc-txt small').textContent = (tp.dataset.count || '').toUpperCase() + ' \u00B7 VHS'; pull.classList.add('show'); };
    const pullHide = () => { if (pull) pull.classList.remove('show'); };
    r.addEventListener('mouseover', e => { const tp = e.target.closest('.sr-tape'); if (tp) pullShow(tp); });
    r.addEventListener('mouseout', e => { if (e.target.closest('.sr-tape') && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.sr-tape'))) pullHide(); });
    r.addEventListener('focusin', e => { const tp = e.target.closest('.sr-tape'); if (tp) pullShow(tp); });
    r.addEventListener('focusout', e => { if (e.target.closest('.sr-tape')) pullHide(); });
    r.addEventListener('click', e => {
      const smi = e.target.closest('.sm-it'); if (smi) return srMenuPick(smi);
      const rem = e.target.closest('.sr-remote');
      if (rem && !rem.classList.contains('open') && window.matchMedia && window.matchMedia('(hover: none)').matches) { rem.classList.add('open'); return; }
      const tp = e.target.closest('.sr-tape'); if (tp) { if (tp.classList.contains('out')) return; pullHide(); return srInsert(tp.dataset.tape); }
      const b = e.target.closest('[data-sr]'); if (b) return srAct(b.dataset.sr);
      if (e.target.closest('.sr-vid')) srAct('play');
    });
    $('sr-screen').addEventListener('keydown', e => {
      const mo = !$('sr-menu').hidden;
      if (e.key === 'm' || e.key === 'M') { e.preventDefault(); srAct('menu'); }
      else if (e.key === 'Escape' && mo) { e.preventDefault(); srMenuOpen(false); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); srAct('up'); } else if (e.key === 'ArrowDown') { e.preventDefault(); srAct('down'); }
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); srAct('ok'); }
      else if (e.key === 'ArrowRight') srAct('next'); else if (e.key === 'ArrowLeft') srAct('prev');
    });
    document.addEventListener('pointerdown', e => { const rem = $('sr-remote'); if (rem && rem.classList.contains('open') && !e.target.closest('.sr-remote') && !e.target.closest('.sr-menu')) rem.classList.remove('open'); });
    v.addEventListener('ended', () => { const t = SR.tapes.find(x => x.key === SR.tape); if (t && t.vids.length > 1) srShowReel(SR.idx + 1, true); else srSet('pause', 'END'); });
    v.addEventListener('timeupdate', () => { if (r.dataset.state === 'play') { const d = $('sr-disp'); if (d) d.textContent = srFmt(v.currentTime); } });
    v.addEventListener('error', () => { if (SR.tape && v.getAttribute('src')) srSet('pause', 'NO SIGNAL'); });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { SR.vis = es[0].isIntersecting; if (!SR.vis && v && !v.paused) { v.pause(); srSet('pause', '\u275A\u275A PAUSE'); } }, { threshold: .15 }).observe(r);
    srStaticLoop();
  }

  /* ---------- designs = an Instagram-style profile held in a hand; every post opens as a carousel ---------- */
  const IG_PLATE = './assets/room/hand-phone.webp';
  const IG_ICO = {
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    car: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="13" height="13" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 4h11a2 2 0 0 1 2 2v11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    stack: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h11a2 2 0 0 1 2 2v11" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><rect x="3" y="7" width="13" height="13" rx="2" fill="#fff"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
  };
  let IGP = [];
  function igPosts(data) {
    const ds = (data.designs || []).filter(x => x.published !== false && !x.isInternal && x.image);
    const byProj = new Map();
    ds.forEach(x => { const k = tapeKey(x.project) + '|' + (/ir\.?t/i.test(x.project) ? 'irt' : x.project); if (!byProj.has(k)) byProj.set(k, []); byProj.get(k).push(x); });
    const lists = [];
    byProj.forEach((items, k) => {
      const cats = new Map(); items.forEach(x => { const c = x.category || ''; if (!cats.has(c)) cats.set(c, []); cats.get(c).push(x); });
      const posts = [];
      cats.forEach((arr, c) => {
        if (arr.length < 2) { arr.forEach(x => posts.push({ proj: x.project, cat: c, slides: [x] })); return; }
        for (let i = 0; i < arr.length; i += 10) { const ch = arr.slice(i, i + 10); posts.push({ proj: ch[0].project, cat: c, slides: ch }); }
      });
      lists.push(posts);
    });
    const out = []; let more = true, i = 0;
    while (more) { more = false; lists.forEach(l => { if (l[i]) { out.push(l[i]); more = true; } }); i++; }
    return out.map((p, n) => ({ ...p, id: 'igp-' + n, key: tapeKey(p.proj) }));
  }
  function renderDesigns(data) {
    if (!modOn(data, 'designs')) return '';
    const posts = igPosts(data); if (!posts.length) return '';
    IGP = posts;
    const cfg = sec(data, 'designs', 'Designs', 'Posts, carousels and covers', 'Scroll the profile. Tap any post to open it. Carousels swipe.');
    const g = data.general || {}, ct = g.contact || {};
    const projects = []; posts.forEach(p => { if (!projects.some(x => x.key === p.key)) projects.push({ key: p.key, name: p.proj }); });
    const tg = tapeGroups(data);
    const hl = projects.map(p => {
      const t = tg.find(x => x.key === p.key); const nm = (data.caseStudies || []).find(c => tapeKey(c.title) === p.key);
      const name = nm ? nm.title : p.name.replace(/\s*[—-].*$/, '');
      const logo = TAPE_LOGO[p.key];
      return `<button type="button" class="ig-hl" data-ig-filter="${esc(p.key)}" aria-label="Show ${esc(name)} posts"><span class="ig-hlring"><span class="ig-hlin" style="--hc:${esc((t && t.color) || '#222')}">${logo ? `<img src="${esc(logo)}" alt="" loading="lazy" decoding="async">` : '<b>MH</b>'}</span></span><small>${esc(name.split(' ')[0])}</small></button>`;
    }).join('');
    const tiles = posts.map((p, i) => `<button type="button" class="ig-tile ${p.slides.length > 1 ? 'is-car' : ''}" data-ig-post="${esc(p.id)}" data-ig-key="${esc(p.key)}" aria-label="Open ${esc(p.cat || p.proj)} ${p.slides.length > 1 ? 'carousel, ' + p.slides.length + ' slides' : 'post'}"><img src="${esc(p.slides[0].image)}" alt="" loading="lazy" decoding="async">${p.slides.length > 1 ? `<i class="ig-stack">${IG_ICO.stack}</i>` : ''}</button>`).join('');
    const avatar = g.profilePhoto || './assets/profile/magdi-profile-cutout.webp';
    return `
    <section id="designs" class="v4-section ig-section ${vis(data, 'designs')}">
      ${gfx(data, 'designs')}
      <div class="container section-content-z">
        <div class="v4-head ig-head"><span class="v4-kicker">${esc(cfg.kicker)}</span><h2 class="v4-h2">${esc(cfg.title)}</h2>${cfg.subtitle ? `<p class="v4-lead">${esc(cfg.subtitle)}</p>` : ''}</div>
        <div class="ig" id="ig" data-filter="all" data-tab="grid">
          <div class="ig-hand">
            <img class="ig-handimg" src="${IG_PLATE}" alt="A hand holding a phone showing the Designs profile" loading="lazy" decoding="async">
            <div class="ig-screen" id="ig-screen">
              <i class="ig-pill" aria-hidden="true"></i>
              <div class="ig-scroll" id="ig-scroll" tabindex="-1">
                <div class="ig-top">
                  <span class="ig-av"><img src="${esc(avatar)}" alt="${esc(g.shortName || 'Magdi Haitham')}" loading="lazy" decoding="async"></span>
                  <div class="ig-id"><b>${esc(g.shortName || g.fullName || '')}</b><small>${esc(g.primaryTitle || '')}</small>${ct.behance ? `<a class="ig-btn" href="${esc(ct.behance)}" target="_blank" rel="noopener">Behance</a>` : ''}</div>
                </div>
                <div class="ig-hls" role="group" aria-label="Filter by project"><button type="button" class="ig-hl on" data-ig-filter="all" aria-label="Show all posts"><span class="ig-hlring"><span class="ig-hlin"><b>All</b></span></span><small>All</small></button>${hl}</div>
                <div class="ig-tabs" role="tablist"><button type="button" role="tab" class="on" data-ig-tab="grid" aria-label="All posts" aria-selected="true">${IG_ICO.grid}</button><button type="button" role="tab" data-ig-tab="car" aria-label="Carousels only" aria-selected="false">${IG_ICO.car}</button></div>
                <div class="ig-grid" id="ig-grid">${tiles}</div>
              </div>
            </div>
          </div>
          <div class="ig-viewer" id="ig-viewer" role="dialog" aria-modal="false" aria-label="Post viewer" aria-hidden="true">
            <div class="ig-vhint"><span class="ig-vcursor" aria-hidden="true"></span><p>Tap a post on the phone.<br>Carousels open here and swipe.</p></div>
            <div class="ig-vcard">
              <button type="button" class="ig-vx" data-ig-close aria-label="Close post">${IG_ICO.x}</button>
              <div class="ig-vstage"><div class="ig-vtrack" id="ig-track"></div>
                <button type="button" class="ig-va prev" data-ig-step="-1" aria-label="Previous slide">${IG_ICO.prev}</button>
                <button type="button" class="ig-va next" data-ig-step="1" aria-label="Next slide">${IG_ICO.next}</button>
                <span class="ig-vcount" id="ig-count"></span></div>
              <div class="ig-vdots" id="ig-dots"></div>
              <div class="ig-vcap"><span class="ig-vproj" id="ig-vproj"></span><b id="ig-vtitle"></b><p id="ig-vdesc"></p></div>
            </div>
          </div>
        </div>
      </div>
    </section>`;
  }
  const IGS = { post: null, i: 0, x0: null };
  function igOpen(id) {
    const p = IGP.find(x => x.id === id); if (!p) return;
    IGS.post = p; IGS.i = 0;
    const v = $('ig-viewer'), tr = $('ig-track');
    tr.innerHTML = p.slides.map((s, k) => `<div class="ig-slide" data-k="${k}"><img src="${esc(s.image)}" alt="${esc(s.title || '')}" ${k > 1 ? 'loading="lazy"' : ''} decoding="async" draggable="false"></div>`).join('');
    $('ig-dots').innerHTML = p.slides.length > 1 ? p.slides.map((_, k) => `<i data-k="${k}"></i>`).join('') : '';
    v.classList.toggle('single', p.slides.length < 2);
    $('ig-vproj').textContent = p.proj;
    v.classList.add('open'); v.setAttribute('aria-hidden', 'false');
    document.querySelectorAll('#ig .ig-tile.cur').forEach(t => t.classList.remove('cur'));
    const tile = document.querySelector(`#ig .ig-tile[data-ig-post="${id}"]`); if (tile) tile.classList.add('cur');
    if (window.matchMedia('(max-width: 900px)').matches) { document.body.classList.add('v4-modal-open'); v.classList.add('is-modal'); }
    igPaint();
  }
  function igClose() {
    const v = $('ig-viewer'); if (!v) return;
    v.classList.remove('open', 'is-modal'); v.setAttribute('aria-hidden', 'true'); IGS.post = null;
    if (!document.querySelector('.modal-backdrop.open')) document.body.classList.remove('v4-modal-open');
    document.querySelectorAll('#ig .ig-tile.cur').forEach(t => t.classList.remove('cur'));
  }
  function igPaint() {
    const p = IGS.post; if (!p) return; const s = p.slides[IGS.i];
    $('ig-track').style.transform = `translate3d(${-IGS.i * 100}%,0,0)`;
    document.querySelectorAll('#ig-dots i').forEach((d, k) => d.classList.toggle('on', k === IGS.i));
    $('ig-count').textContent = p.slides.length > 1 ? (IGS.i + 1) + ' / ' + p.slides.length : '';
    $('ig-vtitle').textContent = p.slides.length > 1 ? (p.cat || s.title) : (s.title || p.cat);
    $('ig-vdesc').textContent = [s.role ? 'Role: ' + s.role : '', s.description || ''].filter(Boolean).join(' · ');
    const pr = $('ig-viewer').querySelector('.ig-va.prev'), nx = $('ig-viewer').querySelector('.ig-va.next');
    if (pr) pr.disabled = IGS.i === 0; if (nx) nx.disabled = IGS.i === p.slides.length - 1;
    const nxt = p.slides[IGS.i + 1]; if (nxt) { const im = $('ig-track').querySelectorAll('img')[IGS.i + 1]; if (im) im.loading = 'eager'; }
  }
  function igStep(d) { const p = IGS.post; if (!p) return; const n = Math.max(0, Math.min(p.slides.length - 1, IGS.i + d)); if (n !== IGS.i) { IGS.i = n; igPaint(); } }
  function igApplyFilter() {
    const r = $('ig'); if (!r) return; const f = r.dataset.filter, tab = r.dataset.tab;
    r.querySelectorAll('.ig-tile').forEach(t => { t.hidden = !((f === 'all' || t.dataset.igKey === f) && (tab !== 'car' || t.classList.contains('is-car'))); });
    r.querySelectorAll('.ig-hl').forEach(b => b.classList.toggle('on', b.dataset.igFilter === f));
    r.querySelectorAll('.ig-tabs button').forEach(b => { const on = b.dataset.igTab === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    const sc = $('ig-scroll'); if (sc) sc.scrollTop = Math.min(sc.scrollTop, 0);
  }
  function igInit() {
    const r = $('ig'); if (!r) return; IGS.post = null;
    r.addEventListener('click', e => {
      const t = e.target.closest('[data-ig-post]'); if (t) return igOpen(t.dataset.igPost);
      const f = e.target.closest('[data-ig-filter]'); if (f) { r.dataset.filter = f.dataset.igFilter; return igApplyFilter(); }
      const tb = e.target.closest('[data-ig-tab]'); if (tb) { r.dataset.tab = tb.dataset.igTab; return igApplyFilter(); }
      if (e.target.closest('[data-ig-close]')) return igClose();
      const st = e.target.closest('[data-ig-step]'); if (st) return igStep(Number(st.dataset.igStep));
      if (e.target === $('ig-viewer') && $('ig-viewer').classList.contains('is-modal')) igClose();
    });
    const stage = r.querySelector('.ig-vstage');
    stage.addEventListener('pointerdown', e => { IGS.x0 = e.clientX; });
    stage.addEventListener('pointerup', e => { if (IGS.x0 != null && Math.abs(e.clientX - IGS.x0) > 40) igStep(e.clientX < IGS.x0 ? 1 : -1); IGS.x0 = null; });
    stage.addEventListener('pointercancel', () => { IGS.x0 = null; });
    if (!igInit._k) { igInit._k = 1; document.addEventListener('keydown', e => { if (!IGS.post || document.querySelector('.modal-backdrop.open')) return; if (e.key === 'ArrowRight') igStep(1); else if (e.key === 'ArrowLeft') igStep(-1); else if (e.key === 'Escape') igClose(); }); }
  }

  /* ---------- lab = The Idea Room: a dark room, one whiteboard per brand, sticky notes on threads ---------- */
  const ROOM_BRANDS = {
    aibe: { name: 'AIBE', bc: '#9b6bff', bd: '#9b6bff', th: '#6d3fd6', order: 0 },
    kanan: { name: 'Kanan Al Diyafa', bc: '#2ecf8a', bd: '#2ecf8a', th: '#12945c', order: 1 },
    divan: { name: 'Divan Gift', bc: '#4d8dff', bd: '#4d8dff', th: '#2b6be0', order: 2 },
    hassan: { name: 'Hassan1', bc: '#fbf4e2', bd: '#d4af5a', th: '#b8902f', order: 3 },
    interior: { name: 'Interior Design', bc: '#c2263a', bd: '#c2263a', th: '#a3182b', order: 4 },
    other: { name: '', bc: '#d4af5a', bd: '#d4af5a', th: '#b8902f', order: 9 }
  };
  const ROOM_KINDS = [['problem', 'The problem'], ['idea', 'The idea'], ['campaign', 'The campaign'], ['run', 'How we run it'], ['result', 'Expected result']];
  const ROOM_LOGOS = {
    aibe: './assets/brand-logos/aibe-purple.png',
    kanan: './assets/brand-logos/kanan-guide-01.png',
    divan: './assets/brand-logos/divan-logo.png',
    hassan: './assets/brand-logos/hassan1-logo.webp',
    interior: ''
  };
  const ROOM_ICON = '<svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 40 30 18l4 4L12 44l-6 2 2-6z"/><path d="M28 20l4 4"/><path d="M33 15l6-6 4 4-6 6z"/><path d="M36 12l4 4"/></svg>';
  const roomKey = p => /aibe/i.test(p) ? 'aibe' : /kanan/i.test(p) ? 'kanan' : /divan/i.test(p) ? 'divan' : /hassan/i.test(p) ? 'hassan' : /interior/i.test(p) ? 'interior' : 'other';
  function roomBoards(data) {
    const items = ((data.lab && data.lab.items) || []).filter(i => i.visible !== false);
    const map = {};
    items.forEach(i => { const k = roomKey(i.project || ''); (map[k] = map[k] || { key: k, project: i.project, items: [] }).items.push(i); });
    return Object.values(map).sort((a, b) => ROOM_BRANDS[a.key].order - ROOM_BRANDS[b.key].order);
  }
  function roomNotes(it) {
    const n = it.notes || {};
    const out = [];
    ROOM_KINDS.forEach(([k, label]) => {
      let v = n[k];
      if (!v && k === 'idea' && it.pitch) v = { short: it.title, full: it.pitch };
      if (!v && k === 'run' && (it.points || []).length) v = { short: 'How we run it', full: it.points.join('. ') + '.' };
      if (v) out.push({ kind: k, label, short: v.short || '', full: v.full || v.short || '' });
    });
    return out;
  }
  function roomStyle(b) { const c = ROOM_BRANDS[b.key]; return `--bc:${c.bc};--bd:${c.bd};--th:${c.th};--ink:${vbInk(c.bc)}`; }
  const ROOM_PLATES = { d: ['./assets/room/room-desktop-dim.webp', './assets/room/room-desktop-lit.webp'], m: ['./assets/room/room-mobile-dim.webp', './assets/room/room-mobile-lit.webp'] };
  function renderLab(data) {
    const items = ((data.lab && data.lab.items) || []).filter(i => i.visible !== false);
    const countFor = k => items.filter(i => roomKey(i.project || '') === k).length;
    const lab = data.lab || {};
    const cfg = sec(data, 'lab', lab.kicker || 'The Idea Room', lab.title || 'Where the ideas live', lab.subtitle || '');
    const order = ['kanan', 'hassan', 'interior'];
    const notes = order.map((k, i) => {
      const c = ROOM_BRANDS[k]; const n = countFor(k);
      const logo = ROOM_LOGOS[k];
      const media = k === 'hassan' ? `<span class="rm2-tile"><img class="rm2-logo" src="${esc(logo)}" alt="" loading="lazy" decoding="async"></span>`
        : logo ? `<img class="rm2-logo" src="${esc(logo)}" alt="" loading="lazy" decoding="async">` : `<i class="rm2-icon" aria-hidden="true">${ROOM_ICON}</i>`;
      const ideas = n + ' ' + (n === 1 ? 'idea' : 'ideas');
      return `<button type="button" class="rm-note rm2-note n-${k}" data-room-open="${k}" style="--bc:${c.bc};--bd:${c.bd};--th:${c.th}" aria-label="Open the ${esc(c.name)} board, ${ideas}">
        <i class="rm2-pool" aria-hidden="true"></i><i class="rm-pin" aria-hidden="true"></i>
        ${media}<em>${ideas}</em>
      </button>`;
    }).join('');
    return `
    <section id="lab" class="v4-section room-section ${vis(data, 'lab')}">
      ${gfx(data, 'lab')}
      <div class="rm rm2" id="rm-room">
        <div class="rm2-stage">
          <div class="rm2-plate" aria-hidden="true">
            <picture><source media="(max-width: 720px)" data-srcset="${ROOM_PLATES.m[0]}"><img class="rm2-bg rm2-dim" alt="" decoding="async" data-src="${ROOM_PLATES.d[0]}"></picture>
            <picture><source media="(max-width: 720px)" data-srcset="${ROOM_PLATES.m[1]}"><img class="rm2-bg rm2-lit" alt="" decoding="async" data-src="${ROOM_PLATES.d[1]}"></picture>
          </div>
          <i class="rm2-bulbglow" aria-hidden="true"></i>
          <i class="rm2-flash" aria-hidden="true"></i>
          <canvas class="rm2-dust" aria-hidden="true"></canvas>
          <div class="rm2-title"><span class="rm2-kicker">${esc(cfg.kicker || 'The Idea Room')}</span><h2>${esc(cfg.title || 'Where the ideas live')}</h2></div>
          <div class="rm2-notes">${notes}</div>
          <div class="rm2-chainwrap" id="rm-lamp">
            <div class="rm2-chain">
              <span class="rm2-beads" aria-hidden="true"></span>
              <span class="rm2-ferrule" aria-hidden="true"></span>
              <span class="rm2-ring" aria-hidden="true"></span>
              <button type="button" class="rm2-grab" id="rm-chain" aria-label="Pull the chain to light up the room" aria-pressed="false"></button>
            </div>
          </div>
          <button type="button" class="rm2-pill" id="rm-pull" tabindex="-1" aria-hidden="true">Pull to light up the room</button>
        </div>
        <div class="container section-content-z rm2-foot">${note(data, 'lab', 'v4-note-head', true)}
          ${cfg.subtitle ? `<p class="rm2-sub">${esc(cfg.subtitle)}</p>` : ''}
          <p class="vb-hint">Pull the chain, then open a note.</p>
        </div>
      </div>
    </section>`;
  }
  const RV = { el: null, board: null, idx: 0, note: -1, from: null, raf: 0 };
  function rvDraw() {
    const el = RV.el; if (!el) return;
    const stage = el.querySelector('.rv-stage'), svg = el.querySelector('.rv-threads'); if (!stage || !svg) return;
    const sr = stage.getBoundingClientRect();
    const pins = [...stage.querySelectorAll('.rv-note')].map(n => { const r = n.querySelector('.rv-pin').getBoundingClientRect(); return [r.left + r.width / 2 - sr.left, r.top + r.height / 2 - sr.top]; });
    svg.setAttribute('width', stage.scrollWidth); svg.setAttribute('height', stage.scrollHeight);
    svg.setAttribute('viewBox', `0 0 ${stage.scrollWidth} ${stage.scrollHeight}`);
    let d = '';
    for (let i = 0; i < pins.length - 1; i++) {
      const [x1, y1] = pins[i], [x2, y2] = pins[i + 1];
      const vert = Math.abs(y2 - y1) > Math.abs(x2 - x1) * 0.8;
      let cx, cy;
      if (vert) { cx = (x1 + x2) / 2 + (i % 2 ? -70 : 70); cy = (y1 + y2) / 2; }
      else { cx = (x1 + x2) / 2; cy = Math.min(y1, y2) - 100; }
      d += `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} `;
    }
    svg.innerHTML = `<path d="${d}" class="rv-thread"/>`;
  }
  function rvQueue() { cancelAnimationFrame(RV.raf); RV.raf = requestAnimationFrame(rvDraw); }
  function rvPaint() {
    const el = RV.el, b = RV.board;
    if (!b.items.length) {
      el.querySelector('.rv-chips').innerHTML = '';
      el.querySelector('.rv-title').innerHTML = '<small></small><span>No ideas pinned yet</span>';
      el.querySelector('.rv-notes').innerHTML = '<p class="rv-empty">This board is waiting for its first idea.</p>';
      const h0 = el.querySelector('.rv-hint'); if (h0) h0.style.display = 'none';
      return;
    }
    const h1 = el.querySelector('.rv-hint'); if (h1) h1.style.display = '';
    const it = b.items[RV.idx], notes = roomNotes(it);
    el.querySelector('.rv-chips').innerHTML = b.items.map((x, i) => `<button type="button" class="rv-chip ${i === RV.idx ? 'on' : ''}" data-rv-idea="${i}" dir="auto">${esc(x.title)}</button>`).join('');
    el.querySelector('.rv-title').innerHTML = `<small>${esc(it.status || '')}</small><span dir="auto">${esc(it.title)}</span>`;
    el.querySelector('.rv-notes').innerHTML = notes.map((n, i) => `<button type="button" class="rv-note k-${n.kind}" data-rv-note="${i}" style="--i:${i}" aria-label="${esc(n.label)}: ${esc(n.short)}">
        <i class="rv-pin"></i><span class="rv-label">${esc(n.label)}</span><b dir="auto">${esc(n.short)}</b></button>`).join('');
    RV.notes = notes; RV.note = -1;
    el.querySelector('.rv-detail').classList.remove('open');
    el.querySelector('.rv-svgwrap').classList.remove('drawn');
    rvQueue(); setTimeout(() => { rvDraw(); el.querySelector('.rv-svgwrap').classList.add('drawn'); }, 60);
    const ch = el.querySelector('.rv-chip.on'); if (ch && ch.scrollIntoView) ch.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function rvDetail(i) {
    const el = RV.el, n = RV.notes[i]; if (!n) return;
    RV.note = i;
    const d = el.querySelector('.rv-detail');
    d.className = 'rv-detail open k-' + n.kind;
    d.querySelector('.rv-d-body').innerHTML = `<small>${esc(n.label)} · ${i + 1} of ${RV.notes.length}</small><h3 dir="auto">${esc(n.short)}</h3><p dir="auto">${esc(n.full)}</p>`;
    const cl = d.querySelector('.rv-d-close'); if (cl) cl.focus({ preventScroll: true });
  }
  function rvKey(e) {
    if (!RV.el) return;
    const det = RV.el.querySelector('.rv-detail');
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (det.classList.contains('open')) { det.classList.remove('open'); const nb = RV.el.querySelector(`[data-rv-note="${RV.note}"]`); if (nb) nb.focus({ preventScroll: true }); } else rvClose(); }
    else if (det.classList.contains('open') && e.key === 'ArrowRight') { e.preventDefault(); rvDetail(Math.min(RV.notes.length - 1, RV.note + 1)); }
    else if (det.classList.contains('open') && e.key === 'ArrowLeft') { e.preventDefault(); rvDetail(Math.max(0, RV.note - 1)); }
  }
  function rvClose() {
    if (!RV.el) return;
    const el = RV.el; RV.el = null;
    document.removeEventListener('keydown', rvKey, true); window.removeEventListener('resize', rvQueue);
    document.documentElement.classList.remove('rv-lock');
    el.classList.add('closing'); setTimeout(() => el.remove(), 300);
    if (RV.from) { try { RV.from.focus({ preventScroll: true }); } catch (e) {} }
  }
  function openRoom(key, btn) {
    if (RV.el) return;
    let b = roomBoards(currentData).find(x => x.key === key);
    if (!b && ROOM_BRANDS[key]) b = { key: key, project: ROOM_BRANDS[key].name, items: [] };
    if (!b) return;
    RV.board = b; RV.idx = 0; RV.from = btn || null;
    const el = document.createElement('div'); el.className = 'rv'; el.style.cssText = roomStyle(b);
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', (ROOM_BRANDS[key].name || b.project) + ' idea board');
    el.innerHTML = `<div class="rv-light" aria-hidden="true"></div>
      <header class="rv-top"><div class="rv-brand"><small>The Idea Room</small><b>${esc(ROOM_BRANDS[key].name || b.project || '')}</b></div>
        <button type="button" class="rv-close" data-rv-close aria-label="Close board">&times;</button></header>
      <div class="rv-chips" role="tablist"></div>
      <div class="rv-board"><h3 class="rv-title"></h3>
        <div class="rv-stage"><div class="rv-svgwrap"><svg class="rv-threads" aria-hidden="true"></svg></div><div class="rv-notes"></div></div>
        <p class="rv-hint">Tap a note to read it.</p></div>
      <div class="rv-detail" role="dialog" aria-label="Note"><div class="rv-d-card"><button type="button" class="rv-d-close" data-rv-dclose aria-label="Close note">&times;</button><div class="rv-d-body"></div>
        <div class="rv-d-nav"><button type="button" data-rv-dstep="-1" aria-label="Previous note">&#8592;</button><button type="button" data-rv-dstep="1" aria-label="Next note">&#8594;</button></div></div></div>`;
    document.body.appendChild(el); RV.el = el;
    document.documentElement.classList.add('rv-lock');
    el.addEventListener('click', ev => {
      const t = ev.target;
      if (t.closest('[data-rv-close]')) return rvClose();
      let x;
      if ((x = t.closest('[data-rv-idea]'))) { RV.idx = Number(x.dataset.rvIdea); return rvPaint(); }
      if ((x = t.closest('[data-rv-note]'))) return rvDetail(Number(x.dataset.rvNote));
      if (t.closest('[data-rv-dclose]') || t.classList.contains('rv-detail')) { el.querySelector('.rv-detail').classList.remove('open'); return; }
      if ((x = t.closest('[data-rv-dstep]'))) return rvDetail(Math.max(0, Math.min(RV.notes.length - 1, RV.note + Number(x.dataset.rvDstep))));
    });
    document.addEventListener('keydown', rvKey, true); window.addEventListener('resize', rvQueue);
    rvPaint();
    el.querySelector('.rv-close').focus({ preventScroll: true });
  }
  let roomBound = false;
  function bindRoom() {
    if (roomBound) return; roomBound = true;
    document.addEventListener('click', e => { const t = e.target.closest('[data-room-open]'); if (t) openRoom(t.dataset.roomOpen, t); });
    const reduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const armChain = () => {
      const chain = document.getElementById('rm-chain'); if (!chain || chain.dataset.armed) return; chain.dataset.armed = '1';
      const room = chain.closest('.rm');
      const pill = document.getElementById('rm-pull');
      const isM = () => window.matchMedia('(max-width: 720px)').matches;
      let dragging = false, dragged = false, startY = 0;
      /* lazy plates: dim loads when the section nears the viewport, lit right after (idle) */
      const setImg = (img) => {
        if (!img || img.dataset.done) return; img.dataset.done = '1';
        const src = img.parentNode.querySelector('source'); const m = isM();
        const url = m && src && src.dataset.srcset ? src.dataset.srcset : img.dataset.src;
        img.src = url;
      };
      const dim = room.querySelector('.rm2-dim'), lit = room.querySelector('.rm2-lit');
      const loadPlates = () => {
        if (room.dataset.plates === 'x') return; room.dataset.plates = 'x';
        const done = () => { room.classList.add('ready'); const idle = window.requestIdleCallback || (f => setTimeout(f, 300)); idle(() => setImg(lit)); };
        if (dim) { dim.addEventListener('load', done, { once: true }); setImg(dim); }
      };
      if ('IntersectionObserver' in window) {
        const io0 = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io0.disconnect(); loadPlates(); } }, { rootMargin: '900px 0px' });
        io0.observe(room);
      } else loadPlates();
      const setPull = px => room.style.setProperty('--pull', px + 'px');
      const toggle = () => {
        const on = room.classList.toggle('lit');
        setImg(lit);
        chain.setAttribute('aria-pressed', on ? 'true' : 'false');
        chain.setAttribute('aria-label', on ? 'Pull the chain to dim the lights' : 'Pull the chain to light up the room');
        if (pill) pill.textContent = on ? 'Pull to dim the lights' : 'Pull to light up the room';
        room.classList.remove('flick'); void room.offsetWidth; room.classList.add('flick');
        room.classList.remove('swung'); void room.offsetWidth; room.classList.add('swung');
      };
      const tug = () => { room.classList.add('tugging'); setPull(isM() ? 26 : 34); setTimeout(() => { room.classList.remove('tugging'); setPull(0); }, 150); };
      chain.addEventListener('click', () => { if (dragged) { dragged = false; return; } tug(); toggle(); });
      if (pill) pill.addEventListener('click', () => { tug(); toggle(); });
      chain.addEventListener('pointerdown', e => { dragging = true; dragged = false; startY = e.clientY; room.classList.add('tugging'); try { chain.setPointerCapture(e.pointerId); } catch (_) {} });
      chain.addEventListener('pointermove', e => {
        if (!dragging) return;
        const dy = e.clientY - startY;
        setPull(Math.max(0, Math.min(isM() ? 56 : 74, dy)));
        if (dy > 30) { dragging = false; dragged = true; room.classList.remove('tugging'); setPull(0); toggle(); }
      });
      const end = () => { if (dragging) { dragging = false; room.classList.remove('tugging'); setPull(0); } };
      chain.addEventListener('pointerup', end); chain.addEventListener('pointercancel', end);
      /* dust: a few slow gold motes, only while the room is on screen */
      const cv = room.querySelector('.rm2-dust');
      if (cv && !reduce()) {
        const ctx = cv.getContext('2d'); let W = 0, H = 0, raf = 0, vis = false;
        const P = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), r: .5 + Math.random() * 1.4, vx: (Math.random() - .5) * .00006, vy: -.00002 - Math.random() * .00006, a: Math.random() * 6.28 }));
        const size = () => { const r = cv.getBoundingClientRect(); W = cv.width = Math.max(1, Math.round(r.width)); H = cv.height = Math.max(1, Math.round(r.height)); };
        const tick = () => {
          if (!vis) { raf = 0; return; }
          ctx.clearRect(0, 0, W, H); const l = room.classList.contains('lit');
          P.forEach(p => { p.x += p.vx * 16; p.y += p.vy * 16; p.a += .02; if (p.y < -.02) p.y = 1.02; if (p.x < -.02) p.x = 1.02; if (p.x > 1.02) p.x = -.02;
            const al = (l ? .5 : .28) * (.55 + .45 * Math.sin(p.a)); ctx.fillStyle = 'rgba(255,214,140,' + al.toFixed(3) + ')'; ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r, 0, 6.283); ctx.fill(); });
          raf = requestAnimationFrame(tick);
        };
        size(); window.addEventListener('resize', size);
        if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(en => { vis = en.isIntersecting; if (vis && !raf) { size(); raf = requestAnimationFrame(tick); } }), { threshold: 0 }).observe(room);
      }
    };
    const armLamp = () => {
      const lamp = document.getElementById('rm-lamp'); if (!lamp || lamp.dataset.w2) return; lamp.dataset.w2 = '1';
      if (!('IntersectionObserver' in window) || reduce()) return;
      const io = new IntersectionObserver(es => es.forEach(en => {
        if (en.intersectionRatio > 0.35) { lamp.classList.remove('dangle'); void lamp.offsetWidth; lamp.classList.add('dangle'); }
        else if (en.intersectionRatio === 0) lamp.classList.remove('dangle');
      }), { threshold: [0, 0.35, 1] });
      io.observe(lamp);
    };
    const arm = () => { armChain(); armLamp(); };
    arm(); new MutationObserver(arm).observe(document.body, { childList: true, subtree: true });
  }
  bindRoom();

  /* ---------- scripts ---------- */
  /* ---------- scripts = a library: shelf of books, pulled book opens as a journal, RTL page flip ---------- */
  function vbHash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; return Math.abs(h); }
  function vbColor(sc, i) {
    if (sc.bookColor && /^#[0-9a-f]{3,8}$/i.test(sc.bookColor)) return sc.bookColor;
    const pr = String(sc.project || '').toLowerCase();
    const pal = pr.includes('kanan') ? ['#127F54', '#0e6a46', '#1a8f61', '#0b5a3c'] : pr.includes('aibe') ? ['#5a2d91', '#4b2480', '#6a3aa6'] : pr.includes('divan') ? ['#1d4f9c', '#173f80', '#2a63b8'] : ['#6b4f14', '#7a5a18', '#554010'];
    return pal[i % pal.length];
  }
  function vbInk(hex) {
    let h = String(hex || '').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h.slice(0, 6), 16); if (isNaN(n)) return '#f6ecd0';
    const l = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
    return l > 0.6 ? '#1a1408' : '#f6ecd0';
  }
  function vbList(data) {
    const all = (data.scripts || []).filter(x => x.published !== false);
    return uiState.scriptFilter === 'All' ? all : all.filter(x => x.project === uiState.scriptFilter);
  }
  const VB_CHAIR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l1 9H6zM5 12h14v3H5zM7 15v6M17 15v6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const VB_EMBLEM = { kanan: './assets/brand-logos/kanan-guide-01.png', aibe: './assets/brand-logos/aibe-purple.png', divan: './assets/brand-logos/divan-logo.png', hassan: './assets/brand-logos/hassan1-logo.webp' };
  const vbKey = p => /kanan/i.test(p) ? 'kanan' : /aibe/i.test(p) ? 'aibe' : /divan/i.test(p) ? 'divan' : /hassan/i.test(p) ? 'hassan' : /interior/i.test(p) ? 'interior' : 'other';
  const VB_PLATE = './assets/room/library-plate.webp';
  function vbEmblem(sc) { const k = vbKey(sc.project); return VB_EMBLEM[k] ? `<img src="${esc(VB_EMBLEM[k])}" alt="" loading="lazy" decoding="async">` : (k === 'interior' ? VB_CHAIR : '<b>MH</b>'); }
  function vbFit() {
    document.querySelectorAll('.vb-t, .vb-cover b').forEach(t => {
      if (!t.offsetParent && !t.closest('.vb-book')) return;
      t.style.fontSize = ''; let fs = parseFloat(getComputedStyle(t).fontSize) || 14; const min = 6;
      const over = () => t.scrollHeight > t.clientHeight + 1 || t.scrollWidth > t.clientWidth + 1;
      let n = 0; while (over() && fs > min && n++ < 40) { fs -= .5; t.style.fontSize = fs + 'px'; }
    });
  }
  (function vbFitInstall() {
    if (window.__vbFit) return; window.__vbFit = 1;
    let tm = 0; const run = () => { clearTimeout(tm); tm = setTimeout(() => { try { vbFit(); } catch (e) {} }, 120); };
    window.addEventListener('resize', run); window.addEventListener('load', () => { run(); setTimeout(run, 900); setTimeout(run, 2500); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
    new MutationObserver(m => { if (m.some(x => [...x.addedNodes].some(n => n.nodeType === 1 && (n.matches && (n.matches('.vb-section,.vb-stage') || n.querySelector('.vb-t')))))) run(); }).observe(document.documentElement, { childList: true, subtree: true });
  })();
  function renderScripts(data) {
    if (!modOn(data, 'scripts')) return '';
    const scripts = (data.scripts || []).filter(x => x.published !== false);
    if (!scripts.length) return '';
    const projects = ['All', ...new Set(scripts.map(x => x.project))];
    const list = vbList(data);
    const cfg = sec(data, 'content-archive', 'Library', 'Scripts, written to be spoken', 'Every script is a book on the shelf. Turn one to face you, then open it and read it like a journal.');
    const groups = []; list.forEach(sc => { let g = groups.find(x => x.p === sc.project); if (!g) { g = { p: sc.project, items: [] }; groups.push(g); } g.items.push(sc); });
    const flat = []; groups.forEach(g => g.items.forEach(sc => flat.push({ sc, g })));
    const nrows = flat.length > 11 ? 2 : 1;
    let cut = flat.length;
    if (nrows === 2) { let best = 1e9, cum = 0; groups.forEach((g, gi) => { cum += g.items.length; if (gi < groups.length - 1 && Math.abs(cum - flat.length / 2) < best) { best = Math.abs(cum - flat.length / 2); cut = cum; } }); if (cut >= flat.length || cut < 4) cut = Math.ceil(flat.length / 2); }
    const allOf = p => (data.scripts || []).filter(x => x.published !== false && x.project === p);
    const bookHtml = sc => {
      const i = (data.scripts || []).indexOf(sc);
      const h = vbHash(sc.id || String(i)), col = vbColor(sc, i);
      const hv = ((h % 100) / 100).toFixed(2), wv = (((h >> 3) % 100) / 100).toFixed(2);
      const no = String(allOf(sc.project).indexOf(sc) + 1).padStart(2, '0');
      const type = sc.contentType ? sc.contentType.split(/[\s(&·]/)[0] : sc.project;
      const label = esc(sc.shelfTitle || sc.title);
      const tilt = h % 7 === 0 ? ((h >> 4) % 2 ? 1.3 : -1.3) : (h % 11 === 0 ? ((h >> 5) % 2 ? .8 : -.8) : 0);
      return `<div class="vb-slot" style="--bc:${esc(col)}${tilt ? `;--tilt:${tilt}deg` : ''}"><button type="button" class="vb-book" data-open-book="${esc(sc.id)}" style="--bc:${esc(col)};--ink:${vbInk(col)};--hv:${hv};--wv:${wv}" aria-label="Open script: ${esc(sc.title)}">
          <span class="vb-spine"><i class="vb-band"></i><span class="vb-em" aria-hidden="true">${vbEmblem(sc)}</span><small dir="auto">${esc(type)}</small><span class="vb-t" dir="auto">${label}</span><em>${no}</em><i class="vb-band b2"></i></span>
          <span class="vb-cover" aria-hidden="true"><i class="vb-frame"></i><small class="vb-proj">${esc(sc.project || '')}</small><span class="vb-no">Script ${no}</span><b dir="auto">${label}</b><i class="vb-rule"></i><span class="vb-type" dir="auto">${esc(sc.contentType || '')}</span><span class="vb-badge">${vbEmblem(sc)}</span><span class="vb-open">Open</span></span>
          <span class="vb-back" aria-hidden="true"></span>
        </button></div>`;
    };
    const rows = Array.from({ length: nrows }, (_, r) => {
      const part = r === 0 ? flat.slice(0, cut) : flat.slice(cut), segs = [];
      part.forEach(x => { let sg = segs[segs.length - 1]; if (!sg || sg.g !== x.g) { sg = { g: x.g, items: [] }; segs.push(sg); } sg.items.push(x.sc); });
      return `<div class="vb-row r${r + 1}"><div class="vb-books" role="list">${segs.map(sg => `<div class="vb-seg">${sg.items.map(bookHtml).join('')}<div class="vb-plaque"><b>${esc(sg.g.p)}</b>${sg.items.length > 2 ? `<small>${sg.g.items.length} ${sg.g.items.length === 1 ? 'script' : 'scripts'}</small>` : ''}</div></div>`).join('')}</div></div>`;
    }).join('');
    return `
    <section id="content-archive" class="v4-section v4-section-alt vb-section ${vis(data, 'content-archive')}">
      ${gfx(data, 'content-archive')}
      <div class="container section-content-z vb-top">
        ${head(cfg)}${note(data, 'scripts', 'v4-note-head', true)}
        <div class="v4-filters">${projects.map(p => `<button type="button" class="v4-filter ${p === uiState.scriptFilter ? 'active' : ''}" data-script-filter="${esc(p)}">${esc(p)}</button>`).join('')}</div>
      </div>
      <div class="vb-stage"${nrows === 1 ? ' data-solo="1"' : ''}>
        <div class="vb-plate" aria-hidden="true"><img src="${VB_PLATE}" alt="" loading="lazy" decoding="async"></div>
        <div class="vb-case"><i class="vb-lamp" aria-hidden="true"></i><div class="vb-shelf" data-rows="${nrows}">${rows}</div></div>
      </div>
      <div class="container section-content-z">
        <p class="vb-hint"><span class="vb-hint-d">Point at a book and it turns to face you. Click to open it. Arrow keys turn the pages, right to left.</span><span class="vb-hint-t">Tap a book to turn it. Tap again to open it.</span></p>
      </div>
    </section>`;
  }
  const VJ = { el: null, list: [], i: 0, busy: false, from: null, opening: false, openTimer: 0, cover: 0, busyTimer: 0 };
  /* fix v4.19: sweep any reader overlay left behind, so a stuck one can never block the page */
  function vjSweep(except) { document.querySelectorAll('.vj').forEach(n => { if (n !== except) n.remove(); }); if (!except) { document.documentElement.classList.remove('vj-lock', 'vj-covered'); } }
  const VJ_NOTES = ['read this one twice', 'the hook is everything', 'say it out loud', 'one idea, one line', 'written to be spoken', 'keep the first line'];
  function vjPage(sc, idx, total) {
    const rtl = sc.dir === 'rtl', col = vbColor(sc, (currentData.scripts || []).indexOf(sc));
    const note = VJ_NOTES[vbHash(sc.id || '') % VJ_NOTES.length];
    return `<div class="vj-page" style="--bc:${esc(col)}">
      <i class="vj-tape t1"></i><i class="vj-tape t2"></i>
      <header class="vj-head"><div class="vj-meta">${esc(sc.project || '')}${sc.contentType ? ' · ' + esc(sc.contentType) : ''}${sc.date ? ' · ' + esc(sc.date) : ''}</div>
        <h3 class="vj-title" dir="auto"><mark>${esc(sc.title)}</mark></h3>
        <p class="vj-hand">${esc(note)} <svg viewBox="0 0 60 24" aria-hidden="true"><path d="M2 18 C 18 2, 34 22, 56 6 M46 3 L57 6 L50 15"/></svg></p></header>
      <div class="vj-body" dir="${rtl ? 'rtl' : 'ltr'}">${esc(sc.fullText || sc.preview || '')}</div>
      <footer class="vj-foot"><span class="vj-hand">page ${idx + 1} of ${total}</span></footer>
    </div>`;
  }
  function vjCover(sc) {
    const col = vbColor(sc, (currentData.scripts || []).indexOf(sc));
    const img = sc.cover ? `<img src="${esc(sc.cover)}" alt="" />` : '';
    return `<div class="vj-cover" style="--bc:${esc(col)};--ink:${vbInk(col)}">${img}<div class="vj-cover-in"><small>${esc(sc.project || '')}</small><b dir="auto">${esc(sc.title)}</b><span>${esc(sc.contentType || '')}</span></div></div>`;
  }
  function vjSet(i, mode) {
    const list = VJ.list, sc = list[i]; if (!sc) return;
    const book = VJ.el.querySelector('.vj-book'), sheet = VJ.el.querySelector('.vj-sheet');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const html = vjPage(sc, i, list.length);
    VJ.el.querySelector('.vj-count').textContent = (i + 1) + ' / ' + list.length;
    if (reduce || !mode) { sheet.innerHTML = html; VJ.i = i; sheet.scrollTop = 0; return; }
    VJ.busy = true;
    const leaf = document.createElement('div'); leaf.className = 'vj-leaf ' + (mode === 'next' ? 'go-next' : 'go-prev');
    if (mode === 'next') { leaf.innerHTML = sheet.innerHTML; sheet.innerHTML = html; }
    else { leaf.innerHTML = html; }
    book.appendChild(leaf);
    let fin = false;
    const done = () => { if (fin) return; fin = true; clearTimeout(VJ.busyTimer); if (mode === 'prev' && sheet.isConnected) sheet.innerHTML = html; leaf.remove(); VJ.busy = false; };
    leaf.addEventListener('animationend', done, { once: true });
    leaf.addEventListener('animationcancel', done, { once: true });
    clearTimeout(VJ.busyTimer); VJ.busyTimer = setTimeout(done, 1100); /* never stay busy if animationend does not fire */
    VJ.i = i; sheet.scrollTop = 0;
  }
  function vjStep(d) {
    if (VJ.busy || !VJ.list.length) return;
    const n = (VJ.i + d + VJ.list.length) % VJ.list.length;
    vjSet(n, d > 0 ? 'next' : 'prev');
  }
  function vjClose() {
    if (!VJ.el) return;
    const el = VJ.el; VJ.el = null; VJ.busy = false; clearTimeout(VJ.busyTimer); clearTimeout(VJ.cover);
    document.documentElement.classList.remove('vj-lock', 'vj-covered');
    document.removeEventListener('keydown', vjKey, true);
    el.classList.add('closing'); setTimeout(() => el.remove(), 320);
    setTimeout(() => { if (!VJ.el && !VJ.opening) vjSweep(); }, 340);
    if (VJ.from) { VJ.from.classList.remove('pulling'); try { VJ.from.focus({ preventScroll: true }); } catch (e) {} }
  }
  function vjKey(e) {
    if (!VJ.el) { if (e.key === 'Escape' && document.querySelector('.vj')) { vjSweep(); } return; }
    if (e.key === 'Escape') { e.preventDefault(); vjClose(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); vjStep(1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); vjStep(-1); }
  }
  function openBook(id, btn) {
    if (VJ.el || VJ.opening) return; /* ignore extra clicks while a book is already opening */
    vjSweep();
    const list = vbList(currentData); const i = Math.max(0, list.findIndex(x => x.id === id));
    VJ.list = list; VJ.from = btn || null;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const go = () => {
      VJ.opening = false; VJ.openTimer = 0;
      if (VJ.el) return;
      vjSweep();
      const el = document.createElement('div'); el.className = 'vj' + (reduce ? ' still' : '');
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Script reader');
      el.innerHTML = `<div class="vj-back" data-vj-close></div><div class="vj-book">${reduce ? '' : vjCover(list[i])}<div class="vj-sheet" tabindex="0"></div>
        <button type="button" class="vj-nav vj-next" aria-label="Next script (page turns right to left)">&#8249;</button>
        <button type="button" class="vj-nav vj-prev" aria-label="Previous script">&#8250;</button>
        <button type="button" class="vj-close" aria-label="Close reader" data-vj-close>&times;</button><div class="vj-count"></div></div>`;
      document.body.appendChild(el); VJ.el = el; VJ.i = i; VJ.busy = false;
      document.documentElement.classList.add('vj-lock');
      vjSet(i, null);
      el.addEventListener('click', ev => { if (ev.target.closest('[data-vj-close]')) vjClose(); else if (ev.target.closest('.vj-next')) vjStep(1); else if (ev.target.closest('.vj-prev')) vjStep(-1); });
      let sx = null;
      el.addEventListener('pointerdown', ev => { sx = ev.clientX; });
      el.addEventListener('pointerup', ev => { if (sx !== null && Math.abs(ev.clientX - sx) > 80 && ev.target.closest('.vj-sheet')) vjStep(ev.clientX - sx > 0 ? 1 : -1); sx = null; });
      document.addEventListener('keydown', vjKey, true);
      el.querySelector('.vj-close').focus({ preventScroll: true });
      /* once the reader has faded in, stop rendering the shelf and animations underneath (this was the lag) */
      VJ.cover = setTimeout(() => { if (VJ.el === el) { document.documentElement.classList.add('vj-covered'); document.querySelectorAll('video').forEach(v => { try { v.pause(); } catch (e) {} }); } }, 420);
    };
    if (reduce || !btn) return go();
    VJ.opening = true;
    btn.classList.add('pulling');
    VJ.openTimer = setTimeout(go, 420);
    const cancelOpen = e => { if (e.key !== 'Escape' || !VJ.opening) return; clearTimeout(VJ.openTimer); VJ.opening = false; btn.classList.remove('pulling'); document.removeEventListener('keydown', cancelOpen, true); };
    document.addEventListener('keydown', cancelOpen, true);
    setTimeout(() => document.removeEventListener('keydown', cancelOpen, true), 600);
  }

  /* ---------- decks ---------- */
  /* ---------- deck viewer: same experience as the original portfolio (tabs, stage, prev/next, fullscreen, thumbnail marquee) ---------- */
  function shouldRunMarquee(data) {
    const ms = data.motionSettings || {}; const fx = ms.effects || {};
    return ms.enabled !== false && ms.reducedMotionMode !== 'force-minimal' && fx.horizontalMarquees !== false;
  }
  function marqueeRow(items, opts) {
    const o = Object.assign({ dir: 'left', durationSec: 56, pauseOnHover: true, label: 'Horizontal showcase', extraClass: '' }, opts || {});
    const cards = items.join('');
    return `<div class="marquee-shell ${o.dir === 'right' ? 'dir-right' : 'dir-left'} ${o.pauseOnHover ? 'pause-on-hover' : ''} ${o.extraClass}" style="--marquee-duration:${o.durationSec}s" role="region" aria-label="${esc(o.label)}"><div class="marquee-track"><div class="marquee-group">${cards}</div><div class="marquee-group" data-marquee-clone="true" aria-hidden="true">${cards}</div></div></div>`;
  }
  function deckViewerHtml(data) {
    const decks = getActiveDecks(data).filter(dk => dk.visibleSlides.length);
    if (!decks.length) return '';
    if (!decks.some(d => d.id === uiState.activeDeckId)) { uiState.activeDeckId = decks[0].id; uiState.activeSlideIndex = 0; }
    const activeDeck = decks.find(d => d.id === uiState.activeDeckId) || decks[0];
    const slides = activeDeck.visibleSlides;
    const safeIndex = Math.max(0, Math.min(uiState.activeSlideIndex || 0, slides.length - 1));
    uiState.activeSlideIndex = safeIndex;
    const cur = slides[safeIndex];
    const thumbs = (lazy) => slides.map((sl, idx) => `<button type="button" class="deck-thumb-btn ${idx === safeIndex ? 'active' : ''}" data-select-slide="${idx}" title="${esc(sl.title || '')}"><img src="${esc(sl.image)}" alt="Slide ${esc(sl.num)}" loading="${lazy ? 'lazy' : 'eager'}" /></button>`);
    return `
    <div class="deck-viewer-card" id="presentation-viewer">
      <div class="archive-bar">
        <div>
          <span class="pill-tag accent">Interactive Slide Deck Library</span>
          <h3 class="archive-bar-title" style="margin-top:0.4rem;">${esc(activeDeck.title)}</h3>
          <p class="archive-bar-sub">${esc(activeDeck.blurb || '')}</p>
        </div>
        <span class="pill-tag">Showing ${slides.length} slides</span>
      </div>
      <div class="deck-tabs" role="tablist" aria-label="Select presentation deck">
        ${decks.map(d => `<button type="button" role="tab" aria-selected="${d.id === activeDeck.id ? 'true' : 'false'}" class="case-tab-btn ${d.id === activeDeck.id ? 'active' : ''}" style="--tab-accent:${esc(d.accent || '#C99E3F')}" data-select-deck="${esc(d.id)}"><span class="case-swatch"></span><span>${esc(d.project)} (${d.visibleSlides.length})</span></button>`).join('')}
      </div>
      <div class="deck-stage">
        <div>
          <div class="deck-slide-frame is-animating"><img src="${esc(cur.image)}" alt="${esc(cur.title || '')}" /></div>
          <div class="deck-controls-bar">
            <div style="display:flex; gap:0.5rem;">
              <button type="button" class="btn btn-sm" data-slide-prev aria-label="Previous slide">← Prev Slide</button>
              <button type="button" class="btn btn-sm" data-slide-next aria-label="Next slide">Next Slide →</button>
            </div>
            <span style="font-family:var(--font-mono); font-size:0.78rem; color:var(--ink-secondary);">Slide ${safeIndex + 1} / ${slides.length}${cur.title ? ' — ' + esc(cur.title) : ''}</span>
            <button type="button" class="btn btn-sm btn-primary" data-zoom-slide>Fullscreen ↗</button>
          </div>
        </div>
        ${shouldRunMarquee(data) && slides.length >= 6
          ? marqueeRow(thumbs(false), { dir: 'left', durationSec: Math.max(40, slides.length * 2.3), pauseOnHover: (data.motionSettings || {}).pauseOnHover !== false, label: 'Slide thumbnails marquee', extraClass: 'deck-marquee-shell' })
          : `<div class="deck-strip" aria-label="Slide thumbnails">${thumbs(true).join('')}</div>`}
      </div>
    </div>`;
  }
  function renderDecks(data) {
    if (!modOn(data, 'presentations')) return '';
    const html = deckViewerHtml(data);
    if (!html) return '';
    const cfg = sec(data, 'research-decks', 'Decks', 'Strategy on slides', 'Plans, audits and training decks I built. Open one to flip through.');
    return `
    <section id="research-decks" class="v4-section ${vis(data, 'research-decks')}" data-spy>
      ${gfx(data, 'research-decks')}
      <div class="container section-content-z">
        ${head(cfg)}${note(data, 'decks', 'v4-note-head', true)}
        <div id="deck-viewer-root">${html}</div>
      </div>
    </section>`;
  }
  function repaintDeck() {
    const root = document.getElementById('deck-viewer-root'); if (!root) return;
    root.innerHTML = deckViewerHtml(currentData);
  }

  /* ---------- about ---------- */
  function renderAbout(data) {
    const g = data.general;
    const cfg = sec(data, 'approach', 'About', 'How I work', '');
    return `
    <section id="approach" class="v4-section v4-section-alt ${vis(data, 'approach')}">
      ${gfx(data, 'approach')}
      <div class="container section-content-z">
        ${head(cfg)}${note(data, 'approach', 'v4-note-head', true)}
        <div class="v4-about">
          <div class="v4-about-text">${rich(g.summary)}</div>
          <div class="v4-approach">${(g.approach || []).map(a => `<div><span>${esc(a.num)}</span><h4>${esc(a.title)}</h4><p>${esc(a.detail)}</p></div>`).join('')}</div>
        </div>
      </div>
    </section>`;
  }

  /* ---------- experience / skills ---------- */
  function renderInitiatives(data) {
    const exp = modOn(data, 'secondaryExperience') ? (data.secondaryExperience || []) : [];
    const cr = modOn(data, 'credentials') ? (data.credentials || {}) : {};
    if (!exp.length && !cr.education) return '';
    const cfg = sec(data, 'initiatives', 'Beyond the brands', 'Skills, tools and credentials', '');
    const chip = t => `<span class="sk-chip">${esc(t)}</span>`;
    return `
    <section id="initiatives" class="v4-section ${vis(data, 'initiatives')}">
      ${gfx(data, 'initiatives')}
      <div class="container section-content-z">
        ${head(cfg)}${note(data, 'initiatives', 'v4-note-head', true)}
        <div class="v4-exp">${exp.map(e => `<article><span class="v4-chip">${esc(e.type)} · ${esc(e.period)}</span><h4>${esc(e.title)}</h4><p class="v4-sub">${esc(e.subtitle)}</p><p>${esc(e.description)}</p></article>`).join('')}</div>
        <div class="sk-grid">
          <div class="sk-panel">
            <h4 class="sk-h">Strategy, creative and social skills</h4>
            ${(cr.skillsGroups || []).map(sg => `<div class="sk-group"><h5>${esc(sg.name)}</h5><div class="sk-chips">${(sg.items || []).map(chip).join('')}</div></div>`).join('')}
          </div>
          <div class="sk-panel">
            ${(cr.toolsConfirmed || []).length ? `<div class="sk-group"><h4 class="sk-h">Confirmed tools</h4><div class="sk-chips">${cr.toolsConfirmed.map(chip).join('')}</div></div>` : ''}
            ${(cr.languages || []).length ? `<div class="sk-group"><h4 class="sk-h">Languages</h4><div class="sk-chips">${cr.languages.map(l => chip(typeof l === 'string' ? l : (l.name || l.language || '') + (l.level ? ' (' + l.level + ')' : ''))).join('')}</div></div>` : ''}
          </div>
          <div class="sk-panel">
            <h4 class="sk-h">Education and certifications</h4>
            ${cr.education ? `<div class="sk-edu"><span class="sk-badge">In progress</span><h5>${esc(cr.education.institution)}</h5><p>${esc(cr.education.degree)}</p><p class="sk-dim">${esc(cr.education.status || cr.education.expected || '')}</p></div>` : ''}
            ${(cr.certifications || []).map(c => `<div class="sk-cert"><b>${esc(c.title)}</b><span>${esc(c.issuer)} · ${esc(c.year)}</span></div>`).join('')}
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ---------- cv: direct PDF, one swappable link ---------- */
  function cvLink(data) {
    const cv = data.cv || {};
    if (cv.showSection === false) return '';
    return cv.driveUrl || cv.pdfUrl || '';
  }
  function renderCv(data) {
    const cv = data.cv || {};
    if (cv.showSection === false) return '';
    const url = cvLink(data);
    if (!url) return '';
    const thumb = (cv.previewPages || [])[0];
    return `
    <section id="cv" class="v4-section v4-section-alt ${vis(data, 'cv')}">
      ${gfx(data, 'cv')}
      <div class="container section-content-z">
        <div class="v4-cv">
          ${thumb ? `<a class="v4-cv-thumb" href="${esc(url)}" target="_blank" rel="noopener" aria-label="Open my CV on Google Drive"><img src="${esc(thumb.image)}" alt="Preview of Magdi Haitham's CV" loading="lazy"><span class="v4-cv-open">Open on Google Drive ↗</span></a>` : ''}
          <div class="v4-cv-copy">
            <span class="v4-kicker">${esc(cv.kicker || 'Resume')}</span>
            <h2 class="v4-h2">${esc(cv.title || 'My CV')}</h2>
            <p class="v4-lead">${esc(cv.description || '')}</p>
            <div class="v4-cv-actions"><a class="btn btn-primary" href="${esc(url)}" target="_blank" rel="noopener">${esc(cv.viewButtonLabel || 'Open my CV')}</a></div>
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ---------- contact ---------- */
  function renderContact(data) {
    const c = data.general.contact || {};
    return `
    <section id="contact" class="v4-section v4-contact ${vis(data, 'contact')}">
      ${gfx(data, 'contact')}
      <div class="container section-content-z">
        <span class="v4-kicker">Contact</span>
        <h2 class="v4-h2 v4-contact-title">Have a brand that needs to be heard?</h2>
        <p class="v4-lead">Tell me who you want to reach. I will come back with an idea.</p>
        <div class="v4-cta-row">
          ${c.email ? `<a class="btn btn-primary" href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''}
          ${c.linkedin ? `<a class="btn" href="${esc(c.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a>` : ''}
          ${c.behance ? `<a class="btn" href="${esc(c.behance)}" target="_blank" rel="noopener">Behance ↗</a>` : ''}
          ${c.showPhonePublicly && c.phonePrivate ? `<a class="btn" href="https://wa.me/${esc(c.phonePrivate.replace(/\D/g, ''))}" target="_blank" rel="noopener">WhatsApp ${esc(c.phonePrivate)}</a>` : ''}
        </div>
        ${note(data, 'contact', 'v4-note-inline', false)}
        <p class="v4-loc">${esc(c.location || 'Cairo, Egypt')}</p>
      </div>
    </section>`;
  }

  /* ---------- modals / interactions ---------- */
  const $ = id => document.getElementById(id);
  const openM = el => { el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); document.body.classList.add('v4-modal-open'); };
  const closeM = el => {
    el.classList.remove('open'); el.setAttribute('aria-hidden', 'true');
    const v = el.querySelector('video'); if (v) { v.pause(); }
    if (!document.querySelector('.modal-backdrop.open')) document.body.classList.remove('v4-modal-open');
  };
  function showGallery(items, index) {
    gallery = { items, index };
    paintGallery();
    openM($('lightbox-modal'));
  }
  function paintGallery() {
    const it = gallery.items[gallery.index]; if (!it) return;
    $('lightbox-img').src = it.image; $('lightbox-img').alt = it.title || '';
    $('lightbox-title').textContent = it.title || '';
    const proj = it.project || it.meta || '';
    $('lightbox-meta').innerHTML = `${proj ? `<span class="pill-tag accent">${esc(proj)}</span>` : ''}${it.category ? `<span class="pill-tag">${esc(it.category)}</span>` : ''}<span class="pill-tag">${gallery.index + 1} / ${gallery.items.length}</span>`;
    $('lightbox-caption').textContent = [it.role ? 'Role: ' + it.role : '', it.description || it.caption || ''].filter(Boolean).join(' · ');
    const multi = gallery.items.length > 1;
    $('lightbox-prev').style.visibility = multi ? 'visible' : 'hidden';
    $('lightbox-next').style.visibility = multi ? 'visible' : 'hidden';
  }
  function stepGallery(n) { const L = gallery.items.length; if (L) { gallery.index = (gallery.index + n + L) % L; paintGallery(); } }

  function playVideo(id) {
    const v = (currentData.videos || []).find(x => x.id === id); if (!v) return;
    const m = $('video-modal'); if (!m) return;
    $('video-modal-title').textContent = v.title;
    $('video-modal-meta').textContent = `${v.project} · ${v.category}`;
    const el = $('video-modal-el'), msg = $('video-modal-msg');
    if (msg) { msg.hidden = true; msg.textContent = ''; }
    const fail = () => {
      if (!msg) return;
      msg.hidden = false;
      msg.innerHTML = `<b>This video could not be loaded.</b><br>Expected file: <code>${esc(v.src)}</code><br>Put the <code>assets/videos</code> folder from the videos zip next to <code>index.html</code>, then refresh.<br><span dir="rtl" lang="ar">الفيديو مش موجود: حط فولدر <code>assets/videos</code> جنب ملف <code>index.html</code> وبعدين اعمل ريفريش.</span>`;
    };
    el.onerror = fail;
    el.setAttribute('poster', v.thumbnail || '');
    el.src = v.src; el.load();
    openM(m);
    setTimeout(() => { if (el.readyState === 0 && (el.networkState === 3 || el.error)) fail(); }, 1500);
    const p = el.play(); if (p && p.catch) p.catch(() => {});
  }

  function openScript(id) {
    const list = (currentData.scripts || []).filter(s => s.published !== false);
    scriptIndex = Math.max(0, list.findIndex(s => s.id === id));
    paintScript(list);
    openM($('script-modal'));
  }
  function paintScript(list) {
    const s = list[scriptIndex]; if (!s) return;
    $('script-modal-meta').innerHTML = `<span class="pill-tag accent">${esc(s.project)}</span><span class="pill-tag">${esc(s.contentType || '')}</span>`;
    $('script-modal-title').textContent = s.title;
    const body = $('script-modal-body');
    body.textContent = s.fullText || s.preview || '';
    body.className = 'script-reader-box ' + (s.dir === 'rtl' ? 'rtl-text' : '');
    const att = $('script-modal-attachments'); if (att) att.style.display = 'none';
  }

  function bindOnce() {
    if (bound) return; bound = true;
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-play-video],[data-open-design],[data-select-deck],[data-select-slide],[data-slide-prev],[data-slide-next],[data-zoom-slide],[data-open-script],[data-open-book],[data-watch-tape],[data-toggle-grid],[data-script-filter],[data-open-lab],.modal-backdrop');
      if (!t) { if (!e.target.closest('.vb-book')) document.querySelectorAll('.vb-book.front').forEach(b => b.classList.remove('front')); return; }
      if (t.classList.contains('modal-backdrop')) { if (e.target === t) closeM(t); return; }
      const d = currentData;
      if (t.dataset.playVideo) return playVideo(t.dataset.playVideo);
      if (t.dataset.openDesign) {
        const el = t.closest('.v4-design-grid, .v4-rail, .v4-case');
        const proj = (d.designs || []).find(x => x.id === t.dataset.openDesign);
        const pool = (d.designs || []).filter(x => x.published !== false && proj && brandKey(x.project) === brandKey(proj.project));
        const items = pool.map(x => ({ image: x.image, title: x.title, meta: x.project, caption: [x.category, x.role].filter(Boolean).join(' · ') }));
        return showGallery(items, Math.max(0, pool.findIndex(x => x.id === t.dataset.openDesign)));
      }
      if (t.dataset.selectDeck) { uiState.activeDeckId = t.dataset.selectDeck; uiState.activeSlideIndex = 0; return repaintDeck(); }
      if (t.dataset.selectSlide !== undefined) { uiState.activeSlideIndex = Number(t.dataset.selectSlide); return repaintDeck(); }
      if (t.hasAttribute('data-slide-prev') || t.hasAttribute('data-slide-next')) {
        const dk = getActiveDecks(d).find(x => x.id === uiState.activeDeckId); const n = dk ? dk.visibleSlides.length : 0; if (!n) return;
        uiState.activeSlideIndex = (uiState.activeSlideIndex + (t.hasAttribute('data-slide-next') ? 1 : -1) + n) % n; return repaintDeck();
      }
      if (t.hasAttribute('data-zoom-slide')) {
        const dk = getActiveDecks(d).find(x => x.id === uiState.activeDeckId); if (!dk) return;
        return showGallery(dk.visibleSlides.map(sl => ({ image: sl.image, title: sl.title || dk.title, project: dk.project, category: dk.title, role: 'Presentation Deck', description: 'Slide ' + sl.num })), uiState.activeSlideIndex);
      }
      if (t.dataset.openLab) {
        const item = (d.lab.items || []).find(x => x.id === t.dataset.openLab);
        return showGallery(item.gallery.map(g => ({ image: g.image, title: g.title, meta: item.title })), Number(t.dataset.labIndex || 0));
      }
      if (t.dataset.openScript) return openScript(t.dataset.openScript);
      if (t.dataset.watchTape) { e.preventDefault(); return srWatch(t.dataset.watchTape, t.dataset.watchVid); }
      if (t.dataset.openBook) {
        if (window.matchMedia('(hover: none)').matches && !t.classList.contains('front')) {
          document.querySelectorAll('.vb-book.front').forEach(b => b.classList.remove('front'));
          t.classList.add('front'); return;
        }
        return openBook(t.dataset.openBook, t);
      }
      if (t.dataset.toggleGrid) {
        const grid = document.querySelector(`[data-case-grid="${t.dataset.toggleGrid}"]`);
        const open = grid.classList.toggle('show-all');
        t.textContent = open ? t.dataset.less : t.dataset.more; return;
      }
      if (t.dataset.scriptFilter !== undefined) {
        uiState.scriptFilter = t.dataset.scriptFilter === 'All' ? 'All' : (d.scripts || []).some(s => s.project === t.dataset.scriptFilter) ? t.dataset.scriptFilter : 'All';
        if (t.tagName === 'BUTTON') { e.preventDefault(); renderAll(d); document.getElementById('content-archive')?.scrollIntoView({ block: 'start' }); }
        else { renderAll(d); }
      }
    });
    const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
    on('lightbox-close', () => closeM($('lightbox-modal')));
    on('lightbox-prev', () => stepGallery(-1)); on('lightbox-next', () => stepGallery(1));
    on('script-modal-close', () => closeM($('script-modal')));
    on('video-modal-close', () => closeM($('video-modal')));
    const sl = () => (currentData.scripts || []).filter(s => s.published !== false);
    on('script-prev-btn', () => { const l = sl(); scriptIndex = (scriptIndex - 1 + l.length) % l.length; paintScript(l); });
    on('script-next-btn', () => { const l = sl(); scriptIndex = (scriptIndex + 1) % l.length; paintScript(l); });
    on('script-copy-btn', () => { const s = sl()[scriptIndex]; if (s && navigator.clipboard) navigator.clipboard.writeText(s.fullText || ''); });
    document.addEventListener('keydown', e => {
      const open = document.querySelector('.modal-backdrop.open');
      if (!open) return;
      if (e.key === 'Escape') closeM(open);
      if (open.id === 'lightbox-modal') { if (e.key === 'ArrowRight') stepGallery(1); if (e.key === 'ArrowLeft') stepGallery(-1); }
    });
  }

  function observeReveals(root) {
    const els = root.querySelectorAll('.v4-case, .v4-lab-card, .v4-reel, .v4-deck, .v4-script, .v4-head, .v4-exp article, .v4-approach > div');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach(el => el.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(el => { el.classList.add('v4-reveal'); io.observe(el); });
  }

  /* rails: transform-based carousel. Auto drift (rAF, delta-time), arrows, drag/swipe, keyboard. */
  let railRaf = 0;
  const SPEED = 62; // px per second
  function initRails(root) {
    cancelAnimationFrame(railRaf);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rails = [...root.querySelectorAll('[data-rail]')].map(w => {
      const el = w.querySelector('.v4-rail'), track = w.querySelector('.v4-track');
      return { w, el, track, x: 0, max: 0, dir: 1, hold: 0, visible: false, tween: null, drag: null, moved: 0 };
    });
    const measure = r => { r.max = Math.max(0, r.track.offsetWidth - r.el.clientWidth); r.x = Math.min(r.x, r.max); };
    const paint = r => { r.track.style.transform = `translate3d(${-r.x}px,0,0)`; };
    const pause = (r, ms) => { r.hold = performance.now() + ms; };
    const goTo = (r, target, ms) => { r.tween = { from: r.x, to: Math.max(0, Math.min(r.max, target)), t0: performance.now(), ms }; };
    rails.forEach(r => {
      measure(r);
      r.w.querySelectorAll('[data-rail-dir]').forEach(b => b.addEventListener('click', () => {
        measure(r); pause(r, 7000);
        goTo(r, r.x + Math.max(240, r.el.clientWidth * 0.75) * Number(b.dataset.railDir), 650);
      }));
      r.w.addEventListener('mouseenter', () => pause(r, 2500));
      r.w.addEventListener('mouseleave', () => pause(r, 800));
      r.w.addEventListener('focusin', () => pause(r, 4000));
      r.el.tabIndex = 0;
      r.el.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); measure(r); pause(r, 7000); goTo(r, r.x + (e.key === 'ArrowRight' ? 1 : -1) * 280, 450); } });
      r.el.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); r.tween = null; r.x = Math.max(0, Math.min(r.max, r.x + e.deltaX)); pause(r, 5000); } }, { passive: false });
      r.el.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button !== 0) return; measure(r); r.tween = null; r.drag = { x0: e.clientX, s0: r.x, id: e.pointerId, v: 0, last: e.clientX, tl: performance.now() }; r.moved = 0; pause(r, 8000); });
      r.el.addEventListener('pointermove', e => {
        const d = r.drag; if (!d) return;
        const dx = e.clientX - d.x0; r.moved = Math.max(r.moved, Math.abs(dx));
        if (r.moved > 6) { if (!r.el.hasPointerCapture(d.id)) { try { r.el.setPointerCapture(d.id); } catch (_) {} } r.el.classList.add('dragging'); }
        const now = performance.now(); d.v = (e.clientX - d.last) / Math.max(1, now - d.tl); d.last = e.clientX; d.tl = now;
        if (r.moved > 6) r.x = Math.max(0, Math.min(r.max, d.s0 - dx));
      });
      const end = () => { const d = r.drag; if (!d) return; r.drag = null; r.el.classList.remove('dragging'); if (r.moved > 6) { goTo(r, r.x - d.v * 260, 700); } pause(r, 8000); };
      r.el.addEventListener('pointerup', end); r.el.addEventListener('pointercancel', end);
      r.el.addEventListener('click', e => { if (r.moved > 6) { e.preventDefault(); e.stopPropagation(); r.moved = 0; } }, true);
    });
    let lastT = performance.now(), lastCheck = 0;
    const tick = now => {
      const dt = Math.min(64, now - lastT) / 1000; lastT = now;
      const doCheck = now - lastCheck > 250; if (doCheck) lastCheck = now;
      for (const r of rails) {
        if (doCheck) { const bb = r.w.getBoundingClientRect(); r.visible = bb.bottom > 0 && bb.top < (window.innerHeight || 800); measure(r); }
        if (!r.visible) continue;
        if (r.tween) {
          const k = Math.min(1, (now - r.tween.t0) / r.tween.ms), e = 1 - Math.pow(1 - k, 3);
          r.x = r.tween.from + (r.tween.to - r.tween.from) * e; if (k >= 1) r.tween = null; paint(r); continue;
        }
        if (r.drag) { paint(r); continue; }
        if (reduce || r.max <= 4 || now < r.hold || document.hidden) { paint(r); continue; }
        r.x += SPEED * r.dir * dt;
        if (r.x >= r.max) { r.x = r.max; r.dir = -1; r.hold = now + 1200; }
        else if (r.x <= 0) { r.x = 0; r.dir = 1; r.hold = now + 1200; }
        paint(r);
      }
      railRaf = requestAnimationFrame(tick);
    };
    railRaf = requestAnimationFrame(tick);
  }

  /* scroll: nav scrollspy + horizontal "camera pan" on watermarks and hero art */
  let scrollBound = false;
  function initScroll() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const update = () => {
      const vh = window.innerHeight || 800, line = vh * 0.38;
      let active = null;
      document.querySelectorAll('#public-main section[id]').forEach(el => { const r = el.getBoundingClientRect(); if (r.top <= line && r.bottom > line) active = el; });
      const id = active ? active.id : '';
      const isProject = !!(active && active.classList.contains('v4-project'));
      document.querySelectorAll('#public-nav-links a').forEach(a => {
        const h = (a.getAttribute('href') || '').slice(1);
        let on = h === id;
        if (a.classList.contains('dd-toggle') && (isProject || id === 'case-studies')) on = true;
        a.classList.toggle('active', !!on);
      });
      if (!reduce) document.querySelectorAll('[data-pan]').forEach(el => {
        const r = el.parentElement.getBoundingClientRect(); const off = r.top + r.height / 2 - vh / 2;
        if (Math.abs(off) > vh * 1.6) return;
        el.style.transform = `translate3d(${(off * Number(el.dataset.pan)).toFixed(1)}px,0,0)`;
      });
    };
    let queued = false;
    const onScroll = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; update(); }); };
    if (!scrollBound) { scrollBound = true; window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll, { passive: true }); }
    update();
  }


  /* ---------- hero particles: gold grain that scatters from the cursor and re-forms ---------- */
  function initHeroParticles(data) {
    if (initHeroParticles._stop) { initHeroParticles._stop(); initHeroParticles._stop = null; }
    const fig = document.querySelector('.v4c-figure');
    const cv = fig && fig.querySelector('canvas.v4c-particles');
    const img = fig && fig.querySelector('img');
    if (!cv || !img) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const live = !reduce && !coarse;
    const ctx = cv.getContext('2d');
    const ac = new AbortController();
    let ro = null, raf = 0, parts = [], R = null, dpr = 1, M = 0, visible = true, colorRGB = [201, 158, 63], stopped = false;
    const mouse = { x: -9999, y: -9999, on: false };
    const t0 = performance.now();

    function readColor() {
      const cs = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const m = /^#?([0-9a-f]{6})$/i.exec(cs);
      if (m) { const n = parseInt(m[1], 16); colorRGB = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    }
    function pointsFromImage() {
      try {
        const W = 160, H = Math.max(1, Math.round(img.naturalHeight * W / img.naturalWidth));
        const oc = document.createElement('canvas'); oc.width = W; oc.height = H;
        const c2 = oc.getContext('2d'); c2.drawImage(img, 0, 0, W, H);
        const px = c2.getImageData(0, 0, W, H).data;
        const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && px[(y * W + x) * 4 + 3] > 128;
        const edge = [], inside = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          if (!solid(x, y)) continue;
          if (!(solid(x - 1, y) && solid(x + 1, y) && solid(x, y - 1) && solid(x, y + 1))) { if (y < H - 2) edge.push([(x + .5) / W, (y + .5) / H]); }
          else if (px[(y * W + x) * 4 + 3] > 230 && Math.random() < 0.018) inside.push([(x + .5) / W, (y + .5) / H]);
        }
        return edge.length > 40 ? { edge, inside } : null;
      } catch (e) { return null; }   /* file:// pages cannot read pixels: use the stored map */
    }
    function build() {
      const map = (data.general && data.general.heroPointMap) || pointsFromImage() || null;
      parts = [];
      if (!map) return;
      const rnd = Math.random;
      const mk = (u, v, kind) => ({ hu: u, hv: v, kind, x: 0, y: 0, vx: 0, vy: 0, s: kind === 0 ? 1.4 + rnd() * 1.3 : kind === 1 ? 0.8 + rnd() * 1.0 : 0.7 + rnd() * 1.0, ph: rnd() * 6.28, w: 0.8 + rnd() * 1.6, a: kind === 0 ? 0.55 + rnd() * 0.4 : kind === 1 ? 0.3 + rnd() * 0.4 : 0.18 + rnd() * 0.3, jx: (rnd() - .5) * .012, jy: (rnd() - .5) * .012, sx: rnd(), sy: rnd() });
      map.edge.forEach(p => { const n = 1; for (let i = 0; i < n; i++) parts.push(mk(p[0] + (rnd() - .5) * .0016, p[1] + (rnd() - .5) * .0016, 0)); });
      map.inside.forEach(p => { for (let i = 0; i < 3; i++) parts.push(mk(p[0] + (rnd() - .5) * .03, p[1] + (rnd() - .5) * .03, 1)); });
      for (let i = 0; i < 260; i++) parts.push(mk(-0.18 + rnd() * 1.36, -0.05 + rnd() * 1.1, 2));
      layout(true);
    }
    function layout(first) {
      const bw = img.offsetWidth, bh = img.offsetHeight;
      if (!bw) return;
      dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 1.5));
      M = bw * 0.22;
      R = { w: bw, h: bh };
      const nw = img.naturalWidth || 625, nh = img.naturalHeight || 760;
      const cs = getComputedStyle(img), pp = (cs.objectPosition || '50% 50%').split(/\s+/).map(v => parseFloat(v) / 100);
      const sc = cs.objectFit === 'cover' ? Math.max(bw / nw, bh / nh) : cs.objectFit === 'fill' ? 1 : Math.min(bw / nw, bh / nh);
      R.ox = (bw - nw * sc) * (isNaN(pp[0]) ? .5 : pp[0]); R.oy = (bh - nh * sc) * (isNaN(pp[1]) ? .5 : pp[1]); R.pw = nw * sc; R.ph = nh * sc;
      const cw = bw + 2 * M, ch = bh + 2 * M;
      const ocw = cv._cw || cw, och = cv._ch || ch;
      cv._cw = cw; cv._ch = ch;
      cv.style.left = (img.offsetLeft - M) + 'px'; cv.style.top = (img.offsetTop - M) + 'px';
      cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
      cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
      parts.forEach(p => {
        p.hx = M + R.ox + p.hu * R.pw; p.hy = M + R.oy + p.hv * R.ph;
        if (first) { p.x = p.sx * cw; p.y = p.sy * ch; }
        else { p.x = p.x / ocw * cw; p.y = p.y / och * ch; p.vx = 0; p.vy = 0; }
      });
    }
    function draw(t, introK) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const [r, g, b] = colorRGB;
      const light = document.documentElement.getAttribute('data-theme') === 'light';
      const gain = light ? 0.8 : 1;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const tw = 0.6 + 0.4 * Math.sin(t * 0.001 * p.w + p.ph);
        const disp = Math.min(1, Math.hypot(p.x - p.hx, p.y - p.hy) / 40);
        const a = Math.min(1, p.a * tw * introK * gain + disp * 0.35);
        if (a < 0.02) continue;
        ctx.fillStyle = disp > 0.15 ? `rgba(${Math.min(255, r + 40 * disp)},${Math.min(255, g + 60 * disp)},${Math.min(255, b + 70 * disp)},${a})` : `rgba(${r},${g},${b},${a})`;
        const s = p.s * (1 + disp * 0.6);
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
    }
    function drawStatic() {
      parts.forEach(p => { p.x = p.hx; p.y = p.hy; });
      draw(0, 1);
    }
    function frame(now) {
      if (stopped) return;
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden || !R) { if (!R) layout(false); return; }
      const t = now - t0;
      const intro = Math.max(0, Math.min(1, (t - 200) / 1500));
      const ease = intro * intro * (3 - 2 * intro);
      const k = 0.008 + 0.06 * ease;
      const rad = R.w * 0.24, rad2 = rad * rad;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const hx = p.hx + Math.sin(t * 0.0006 * p.w + p.ph) * (p.kind === 2 ? 14 : 1.2), hy = p.hy + Math.cos(t * 0.0005 * p.w + p.ph) * (p.kind === 2 ? 14 : 1.2);
        p.vx += (hx - p.x) * k; p.vy += (hy - p.y) * k;
        if (mouse.on && intro > 0.6) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < rad2 && d2 > 0.01) {
            const d = Math.sqrt(d2), f = (1 - d / rad); const push = f * f * 11;
            p.vx += (dx / d) * push + (-dy / d) * push * 0.35; p.vy += (dy / d) * push + (dx / d) * push * 0.35;
          }
        }
        p.vx *= 0.9; p.vy *= 0.9; p.x += p.vx; p.y += p.vy;
      }
      draw(t, Math.min(1, 0.25 + ease));
    }
    function burst(x, y) {
      const rad = R.w * 0.45;
      parts.forEach(p => { const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy) || 1; if (d < rad) { const f = (1 - d / rad) * 26; p.vx += dx / d * f; p.vy += dy / d * f; } });
    }
    function stop() { stopped = true; cancelAnimationFrame(raf); ac.abort(); io && io.disconnect(); mo && mo.disconnect(); ro && ro.disconnect(); }
    initHeroParticles._stop = stop;

    const hero = fig.closest('.v4-hero') || fig;
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 });
    io.observe(hero);
    const mo = new MutationObserver(() => { readColor(); if (!live && parts.length) drawStatic(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });
    readColor();

    const start = () => {
      if (stopped) return;
      build();
      if (!parts.length) { cv.style.display = 'none'; return; }
      if (!live) { drawStatic(); }
      else {
        raf = requestAnimationFrame(frame);
        const rel = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
        hero.addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; const q = rel(e); mouse.x = q.x; mouse.y = q.y; mouse.on = true; }, { signal: ac.signal, passive: true });
        hero.addEventListener('pointerleave', () => { mouse.on = false; }, { signal: ac.signal });
        fig.addEventListener('pointerdown', e => { const q = rel(e); burst(q.x, q.y); }, { signal: ac.signal });
        fig.style.pointerEvents = 'auto';
      }
      let rt = 0;
      const relayout = () => { clearTimeout(rt); rt = setTimeout(() => { layout(false); if (!live) drawStatic(); }, 90); };
      window.addEventListener('resize', relayout, { signal: ac.signal });
      if (window.visualViewport) window.visualViewport.addEventListener('resize', relayout, { signal: ac.signal });
      if (window.ResizeObserver) { ro = new ResizeObserver(relayout); ro.observe(img); ro.observe(fig); }
      /* browser zoom changes devicePixelRatio: watch it and re-arm after each change */
      const watchDpr = () => {
        if (stopped) return;
        const mq = window.matchMedia('(resolution: ' + (window.devicePixelRatio || 1) + 'dppx)');
        const h = () => { relayout(); watchDpr(); };
        mq.addEventListener ? mq.addEventListener('change', h, { once: true, signal: ac.signal }) : 0;
      };
      watchDpr();
    };
    if (img.complete && img.naturalWidth) start(); else img.addEventListener('load', start, { once: true, signal: ac.signal });
  }


  /* ---------- ambient section decoration: sparse content/social shapes that draw in on scroll ---------- */
  const DECO = {
    play: '<circle cx="24" cy="24" r="18"/><path d="M20 15l13 9-13 9z"/>',
    youtube: '<rect x="4" y="11" width="40" height="26" rx="8"/><path d="M20 18l10 6-10 6z"/>',
    facebook: '<rect x="6" y="6" width="36" height="36" rx="9"/><path d="M30 42V28h5l1-6h-6v-4c0-2 1-3 3-3h3v-5h-4c-5 0-7 3-7 7v5h-5v6h5v14"/>',
    instagram: '<rect x="6" y="6" width="36" height="36" rx="11"/><circle cx="24" cy="24" r="8"/><circle cx="34.5" cy="13.5" r="1.3"/>',
    tiktok: '<path d="M28 6v24a8 8 0 11-8-8"/><path d="M28 6c1 6 5 9 11 9"/>',
    snap: '<path d="M24 6c-6 0-9 4-9 10v5c-1 1-3 1-5 1 1 2 3 3 5 3-1 3-3 4-6 5 3 2 6 1 8 3 1 1 3 2 7 2s6-1 7-2c2-2 5-1 8-3-3-1-5-2-6-5 2 0 4-1 5-3-2 0-4 0-5-1v-5c0-6-3-10-9-10z"/>',
    web: '<rect x="4" y="8" width="40" height="32" rx="4"/><path d="M4 16h40"/><circle cx="26" cy="28" r="7"/><path d="M19 28h14M26 21c-3 4-3 10 0 14M26 21c3 4 3 10 0 14"/>',
    chart: '<path d="M6 6v36h36"/><rect x="12" y="26" width="6" height="12"/><rect x="22" y="18" width="6" height="20"/><rect x="32" y="10" width="6" height="28"/>',
    heart: '<path d="M24 40C8 29 6 19 12 14c5-4 10-1 12 3 2-4 7-7 12-3 6 5 4 15-12 26z"/>',
    bubble: '<path d="M8 10h32a3 3 0 013 3v16a3 3 0 01-3 3H22l-9 8v-8H8a3 3 0 01-3-3V13a3 3 0 013-3z"/><path d="M14 19h20M14 25h12"/>',
    hash: '<path d="M18 8l-4 32M32 8l-4 32M8 19h32M6 30h32"/>',
    pen: '<path d="M8 40l4-14L32 6l10 10-20 20z"/><path d="M12 26l10 10M8 40l9-9"/>',
    quote: '<path d="M10 30v-8c0-6 3-10 9-12M28 30v-8c0-6 3-10 9-12"/><path d="M10 30h8v-8h-8zM28 30h8v-8h-8z"/>',
    spark: '<path d="M24 5c1 10 4 13 14 14-10 1-13 4-14 14-1-10-4-13-14-14 10-1 13-4 14-14z"/>',
    plane: '<path d="M5 22L43 6 31 42 22 28z"/><path d="M22 28l21-22"/>',
    at: '<circle cx="24" cy="24" r="6"/><path d="M30 18v9c0 3 3 4 5 3 3-2 4-6 4-9 0-9-7-15-15-15S9 13 9 24s7 16 16 16c4 0 7-1 10-3"/>',
    camera: '<rect x="5" y="14" width="38" height="26" rx="5"/><circle cx="24" cy="27" r="7"/><path d="M16 14l3-5h10l3 5"/>',
    mark: '<path d="M12 6h24v36l-12-9-12 9z"/>',
    script: '<rect x="9" y="5" width="30" height="38" rx="3"/><path d="M16 15h16M16 22h16M16 29h10"/>',
    bulb: '<path d="M24 5a13 13 0 00-7 24v6h14v-6A13 13 0 0024 5z"/><path d="M19 40h10M21 44h6"/>',
    cursor: '<path d="M10 6l26 14-11 3-5 11z"/>'
  };
  const DECO_SETS = {
    'case-studies': ['instagram', 'cursor', 'spark', 'chart', 'mark'], reels: ['youtube', 'play', 'camera', 'tiktok', 'spark'],
    lab: ['bulb', 'hash', 'web', 'spark', 'snap'], 'content-archive': ['pen', 'quote', 'facebook', 'script', 'bubble'],
    'research-decks': ['chart', 'mark', 'web', 'bubble', 'hash'], approach: ['heart', 'snap', 'bubble', 'instagram', 'spark'],
    initiatives: ['facebook', 'heart', 'hash', 'youtube', 'spark'], cv: ['script', 'web', 'pen', 'tiktok', 'spark'],
    contact: ['plane', 'at', 'heart', 'instagram', 'snap']
  };
  const DECO_SLOTS = [
    { side: 'l', top: 8, size: 66, rot: -10, sp: 0.10 },
    { side: 'r', top: 26, size: 56, rot: 8, sp: -0.07 },
    { side: 'l', top: 48, size: 60, rot: 12, sp: 0.06 },
    { side: 'r', top: 66, size: 58, rot: -7, sp: -0.09 },
    { side: 'l', top: 86, size: 50, rot: 9, sp: 0.05 }
  ];
  function initDeco(data) {
    if (initDeco._stop) { initDeco._stop(); initDeco._stop = null; }
    if (data.theme && data.theme.ambientShapes === false) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const secs = Array.from(document.querySelectorAll('#public-main .v4-section'));
    const live = [];
    secs.forEach(sec => {
      const set = DECO_SETS[sec.id] || ['spark', 'heart', 'hash'];
      const box = document.createElement('div'); box.className = 'v4-deco'; box.setAttribute('aria-hidden', 'true');
      set.forEach((k, i) => {
        const sl = DECO_SLOTS[i]; if (!sl || !DECO[k]) return;
        const el = document.createElement('span'); el.className = 'v4-shape v4-shape--' + sl.side;
        el.style.top = sl.top + '%'; el.style.setProperty('--sz', sl.size + 'px'); el.style.setProperty('--rot', sl.rot + 'deg');
        el.style.transitionDelay = (i * 160) + 'ms';
        el.innerHTML = '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + DECO[k].replace(/<(path|rect|circle)/g, '<$1 pathLength="1"') + '</svg>';
        box.appendChild(el); live.push({ el, sec, sp: sl.sp });
      });
      const AMB = [['s',12,18,16],['s',88,30,12],['s',70,72,20],['s',22,84,11],['m',0,0,0],['m',1,0,0],['l',0,0,0],['l',1,0,0]];
      AMB.forEach((a, i) => {
        const el = document.createElement('i');
        if (a[0] === 's') { el.className = 'v4-spark'; el.style.left = a[1] + '%'; el.style.top = a[2] + '%'; el.style.setProperty('--ss', a[3] + 'px'); el.style.animationDelay = (i * 0.9) + 's'; }
        else if (a[0] === 'm') { el.className = 'v4-smoke v4-smoke--' + a[1]; }
        else { el.className = 'v4-slash v4-slash--' + a[1]; }
        box.appendChild(el);
      });
      sec.appendChild(box);
    });
    if (!live.length) return;
    if (reduce || !('IntersectionObserver' in window)) { live.forEach(o => o.el.classList.add('in', 'still')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.25 });
    live.forEach(o => io.observe(o.el));
    let q = false;
    const upd = () => {
      q = false; const vh = window.innerHeight;
      live.forEach(o => {
        const r = o.sec.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
        o.el.style.setProperty('--py', ((r.top + r.height / 2 - vh / 2) * o.sp).toFixed(1) + 'px');
      });
    };
    const on = () => { if (!q) { q = true; requestAnimationFrame(upd); } };
    window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on, { passive: true }); upd();
    initDeco._stop = () => { io.disconnect(); window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }

  /* ---- Poster Noir helpers: woven 3D gold mesh + DPM-style warped statement ---- */
  function posterMesh() {
    const W = 1000, H = 700, vx = 500, vy = 330, f = [];
    const gold = (o) => `rgba(227,181,79,${o})`;
    // perspective floor + ceiling: radiating lines and depth lines
    for (let i = -14; i <= 14; i++) {
      const bx = 500 + i * 120;
      f.push(`<path class="vm-l" d="M${vx} ${vy} L${bx} ${H + 40}" stroke="${gold(0.75)}"/>`);
      f.push(`<path class="vm-l" d="M${vx} ${vy} L${bx} ${-40}" stroke="${gold(0.5)}"/>`);
    }
    for (let k = 1; k <= 10; k++) {
      const t = Math.pow(k / 10, 2.1), yb = vy + (H + 40 - vy) * t, yt = vy - (vy + 40) * t;
      const sx = 1 + t * 5.5;
      f.push(`<path class="vm-l" d="M${vx - 500 * sx} ${yb.toFixed(1)} L${vx + 500 * sx} ${yb.toFixed(1)}" stroke="${gold(0.7)}"/>`);
      f.push(`<path class="vm-l" d="M${vx - 500 * sx} ${yt.toFixed(1)} L${vx + 500 * sx} ${yt.toFixed(1)}" stroke="${gold(0.45)}"/>`);
    }
    // woven strands: two interlacing wave families bending around the centre
    for (let i = 0; i < 7; i++) {
      const y0 = 90 + i * 85, amp = 40 + (i % 3) * 14, ph = i * 0.9;
      let d = `M-20 ${y0}`;
      for (let x = 0; x <= 1040; x += 40) d += ` L${x} ${(y0 + Math.sin(x / 150 + ph) * amp + (x - 500) * (x - 500) / 7000 * (i - 3) * 0.12).toFixed(1)}`;
      f.push(`<path class="vm-w" d="${d}" stroke="${gold(0.5)}" fill="none"/>`);
      let d2 = `M${60 + i * 140} -20`;
      for (let y = 0; y <= 740; y += 40) d2 += ` L${(60 + i * 140 + Math.sin(y / 130 + ph) * 46 * (1 + (y - 350) * (y - 350) / 400000)).toFixed(1)} ${y}`;
      f.push(`<path class="vm-w" d="${d2}" stroke="${gold(0.4)}" fill="none"/>`);
    }
    // bold gold slashes crossing the net
    f.push(`<path class="vm-s" d="M-40 640 L1040 120" stroke="#e3b54f" stroke-width="2.6"/>`);
    f.push(`<path class="vm-s" d="M-40 700 L1040 190" stroke="#e3b54f" stroke-width="1" opacity=".6"/>`);
    return `<svg class="vp-mesh" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" fill="none" stroke-width="1"><defs><radialGradient id="vmM" cx="50%" cy="46%" r="62%"><stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset=".45" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#fff"/></radialGradient><mask id="vmMask"><rect width="${W}" height="${H}" fill="url(#vmM)"/></mask></defs><g mask="url(#vmMask)">${f.join('')}</g></svg>`;
  }
  function posterAtmos() {
    const neon = [
      'M-20 610 L230 390 L330 450 L480 240 L560 300',
      'M1020 570 L770 370 L680 440 L540 220',
      'M-30 190 C280 60 720 380 1030 130',
      'M120 700 C260 520 380 560 500 470'
    ].map(d => `<path class="vn-g" d="${d}"/><path class="vn-m" d="${d}"/><path class="vn-c" d="${d}"/>`).join('')
      + '<ellipse class="vn-m" cx="500" cy="360" rx="350" ry="262" transform="rotate(-14 500 360)" style="stroke-dasharray:2200 800"/><ellipse class="vn-c" cx="500" cy="360" rx="350" ry="262" transform="rotate(-14 500 360)" style="stroke-dasharray:420 1200"/>';
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    let dots = '';
    for (let g = 1; g <= 3; g++) { dots += `<g class="dg${g}">`; for (let i = 0; i < 26; i++) dots += `<circle cx="${(rnd() * 1000).toFixed(0)}" cy="${(rnd() * 700).toFixed(0)}" r="${(0.5 + rnd() * 1.5).toFixed(1)}" opacity="${(0.45 + rnd() * 0.55).toFixed(2)}"/>`; dots += '</g>'; }
    let stars = '';
    [[130, 150, 9], [880, 120, 7], [820, 520, 11], [90, 470, 7], [310, 80, 6], [660, 60, 6]].forEach(([x, y, r], i) => { stars += `<path class="dg${(i % 3) + 1}" d="M${x} ${y - r} L${x + r * .22} ${y - r * .22} L${x + r} ${y} L${x + r * .22} ${y + r * .22} L${x} ${y + r} L${x - r * .22} ${y + r * .22} L${x - r} ${y} L${x - r * .22} ${y - r * .22} Z"/>`; });
    return `<svg class="vp-dust" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">${dots}${stars}</svg>`;
  }
  function posterStatement(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    let ki = words.findIndex(w => /^stories[.,!]?$/i.test(w));
    if (ki < 2) ki = words.length - 1;
    const pre = words.slice(0, ki), key = words[ki], post = words.slice(ki + 1);
    const accent = pre.length > 1 ? pre.pop() : '';
    const l1 = pre.join(' ');
    const gi = post.findIndex(w => /^scroll/i.test(w));
    const l3a = (gi >= 0 ? post.slice(0, gi) : post).join(' '), l3g = gi >= 0 ? post[gi] : '', l3b = gi >= 0 ? post.slice(gi + 1).join(' ') : '';
    const K = esc(key.toUpperCase());
    const lines = `
      <path id="vpa1" d="M80 104 Q500 44 920 104" /><path id="vpa2" d="M70 372 Q500 250 930 372" /><path id="vpa3" d="M50 486 Q500 540 950 486" />
      <g id="vpL1"><text class="t1" font-family="Bowlby One, Anton, Impact, sans-serif" font-size="${l1.length > 20 ? 42 : 58}"><textPath href="#vpa1" startOffset="50%" text-anchor="middle">${esc(l1)}</textPath></text></g>
      <g id="vpAc"><text class="tc" font-family="Caveat, cursive" font-weight="600" font-size="78" style="fill:var(--gw,inherit)" x="40" y="212" transform="rotate(-10 40 212)">${esc(accent)}</text></g>
      <g id="vpK"><text class="tk" font-family="Bowlby One, Anton, Impact, sans-serif" font-size="158" style="fill:var(--gk,inherit)"><textPath href="#vpa2" startOffset="50%" text-anchor="middle">${K}</textPath></text></g>
      <g id="vpL3"><text class="t3" font-family="Bowlby One, Anton, Impact, sans-serif" font-size="46"><textPath href="#vpa3" startOffset="50%" text-anchor="middle">${esc(l3a)} <tspan style="fill:var(--gw,inherit)">${esc(l3g)}</tspan> ${esc(l3b)}</textPath></text></g>`;
    let ex = '';
    for (let k = 6; k >= 1; k--) ex += `<g class="vp-ex" style="--k:${k}"><use href="#vpL1"/><use href="#vpK"/><use href="#vpL3"/><use href="#vpAc"/></g>`;
    return `<svg class="vp-svg" viewBox="0 30 1000 ${l3a || l3g ? 520 : 400}" role="img" aria-hidden="true"><defs>${lines}<linearGradient id="vpFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#fff4d2"/><stop offset="1" stop-color="#e9bd55"/></linearGradient></defs>${ex}
      <g class="vp-top"><use href="#vpL1"/><use href="#vpK"/><use href="#vpL3"/><use href="#vpAc"/></g></svg>`;
  }
  /* ---- 3D tilted film-strip cards: resting perspective tilt, mouse-reactive depth + glare ---- */
  function initTilt(root) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SEL = '.v4-reel-poster, .v4-tile-video';
    if (reduce) return;
    root.querySelectorAll(SEL).forEach(el => { if (!el.querySelector('.v4-glare')) { const g = document.createElement('span'); g.className = 'v4-glare'; el.appendChild(g); } });
    if (initTilt._bound) return;
    initTilt._bound = true;
    let cur = null;
    const reset = el => { if (!el) return; el.style.removeProperty('--ry'); el.style.removeProperty('--rx'); el.style.removeProperty('--gx'); el.style.removeProperty('--gy'); el.classList.remove('tilt-on'); };
    document.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const el = e.target.closest && e.target.closest(SEL);
      if (cur && cur !== el) { reset(cur); cur = null; }
      if (!el) return;
      cur = el;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.classList.add('tilt-on');
      el.style.setProperty('--ry', ((px - 0.5) * 28).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((0.5 - py) * 20).toFixed(2) + 'deg');
      el.style.setProperty('--gx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
    }, { passive: true });
    document.addEventListener('pointerleave', () => { reset(cur); cur = null; }, true);
  }
  /* ---- scroll-driven section transitions: gold sweep line, heading rise, progress bar ---- */
  const FX = { secs: [], bar: null, ticking: false, bound: false };
  function fxUpdate() {
    FX.ticking = false;
    const vh = window.innerHeight || 800;
    FX.secs.forEach(sec => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const sp = Math.max(0, Math.min(1, (vh * 0.92 - r.top) / (vh * 0.55)));
      const sp2 = Math.max(0, Math.min(1, (vh * 0.5 - r.top) / Math.max(1, r.height * 0.8)));
      sec.style.setProperty('--sp', sp.toFixed(3)); sec.style.setProperty('--sp2', sp2.toFixed(3));
    });
    if (FX.bar) { const h = document.documentElement.scrollHeight - vh; FX.bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0).toFixed(4) + ')'; }
  }
  function initScrollFx(root) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    FX.secs = Array.from(root.querySelectorAll('.v4-section'));
    FX.secs.forEach(sec => {
      if (!sec.querySelector(':scope > .v4-sweep')) {
        const sw = document.createElement('div'); sw.className = 'v4-sweep'; sw.setAttribute('aria-hidden', 'true'); sw.innerHTML = '<i></i><b></b>';
        sec.appendChild(sw);
      }
    });
    if (!FX.bar) { const b = document.createElement('div'); b.className = 'v4-progress'; b.setAttribute('aria-hidden', 'true'); document.body.appendChild(b); FX.bar = b; }
    if (reduce) { FX.secs.forEach(sec => { sec.style.setProperty('--sp', 1); sec.style.setProperty('--sp2', 1); }); document.documentElement.classList.add('fx-still'); return; }
    document.documentElement.classList.remove('fx-still');
    if (!FX.bound) {
      FX.bound = true;
      const kick = () => { if (!FX.ticking) { FX.ticking = true; requestAnimationFrame(fxUpdate); } };
      window.addEventListener('scroll', kick, { passive: true }); window.addEventListener('resize', kick);
    }
    fxUpdate();
  }
  function initPoster(root) {
    const stage = document.getElementById('vp-stage'); if (!stage) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (reduce || coarse) { stage.classList.add('vp-still'); return; }
    const hero = stage.closest('section');
    const q = s => Array.from(hero.querySelectorAll(s));
    const layers = [];
    q('.vp-e').forEach((el, i) => layers.push({ el, x: -14 * (i + 1), y: -5 * (i + 1) }));
    q('.vp-figure').forEach(el => layers.push({ el, x: 9, y: 4 }));
    q('.vp-statement').forEach(el => layers.push({ el, x: 5, y: 2 }));
    q('.vp-mesh').forEach(el => layers.push({ el, x: -10, y: -6 }));
    q('.vp-neon').forEach(el => layers.push({ el, x: 14, y: 8 }));
    q('.vp-dust').forEach(el => layers.push({ el, x: -20, y: -12 }));
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, on = true, last = 0;
    const loop = () => {
      raf = 0;
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      for (let i = 0; i < layers.length; i++) { const L = layers[i]; L.el.style.transform = 'translate3d(' + (cx * L.x).toFixed(2) + 'px,' + (cy * L.y).toFixed(2) + 'px,0)'; }
      if (on && (Math.abs(tx - cx) > 0.003 || Math.abs(ty - cy) > 0.003)) raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf && on) raf = requestAnimationFrame(loop); };
    hero.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const n = performance.now(); if (n - last < 16) return; last = n;
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2; kick();
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { on = es[0].isIntersecting; if (!on && raf) { cancelAnimationFrame(raf); raf = 0; } }).observe(hero);
  }
  function renderAll(data) {
    currentData = data;
    const poster = !!(data.theme && data.theme.heroLayout === 'poster');
    document.documentElement.classList.toggle('theme-poster', poster);
    if (poster) { document.documentElement.setAttribute('data-theme', 'dark'); }
    renderNav(data);
    const root = $('public-main'); if (!root) return;
    const map = {
      hero: renderHero, proof: renderProof, 'case-studies': renderCases, reels: renderReels, designs: renderDesigns, lab: renderLab,
      'content-archive': renderScripts, 'research-decks': renderDecks, approach: renderAbout,
      initiatives: renderInitiatives, cv: renderCv, contact: renderContact
    };
    root.innerHTML = (data.sections || []).filter(s => s.visible !== false && map[s.id]).map(s => map[s.id](data)).join('');
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('footer-owner', data.general.fullName);
    set('footer-role-line', data.general.primaryTitle);
    set('footer-tagline', (data.contentText && data.contentText.footerTagline) || 'Portfolio');
    set('footer-updated', (data.meta && data.meta.lastUpdated) || '2026');
    bindOnce();
    try { srInit(); } catch (e) { console.warn('screening room', e); }
    try { igInit(); } catch (e) { console.warn('designs', e); }
    observeReveals(root);
    initRails(root);
    initScroll();
    try { initHeroParticles(data); } catch (e) { console.warn('hero particles', e); }
    try { initDeco(data); } catch (e) { console.warn('deco', e); }
    try { initTilt(root); } catch (e) { console.warn('tilt', e); }
    try { initScrollFx(root); } catch (e) { console.warn('fx', e); }
    if (poster) { try { initPoster(root); } catch (e) { console.warn('poster', e); } }
    const hash = location.hash && document.querySelector(location.hash);
    if (hash && !renderAll._scrolled) { renderAll._scrolled = true; hash.scrollIntoView(); }
  }

  try { console.log('%cHello, curious one. Magdi writes the ideas, the code is just the frame. The contact button is real.', 'color:#c99e3f;font:600 13px Georgia,serif'); } catch (_) {}
  return { uiState, getActiveDecks, renderAll };
})();
