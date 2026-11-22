/* =========================================================
   PUBLIC PORTFOLIO RENDERER (DATA-DRIVEN & MODULAR)
   ========================================================= */

window.PublicRenderer = (function () {
  const { escapeHtml, sanitizeRichHtml, validateExternalUrl } = window.PortfolioState;

  function richHtml(val) {
    return typeof sanitizeRichHtml === 'function' ? sanitizeRichHtml(val) : escapeHtml(val || '');
  }

  function getSecCfg(data, id, defKicker, defTitle, defSub) {
    const s = (data.layout && data.layout.sectionSettings && data.layout.sectionSettings[id]) || {};
    return {
      kicker: s.kicker !== undefined && s.kicker !== '' ? s.kicker : defKicker,
      title: s.title !== undefined && s.title !== '' ? s.title : defTitle,
      subtitle: s.subtitle !== undefined && s.subtitle !== '' ? s.subtitle : defSub
    };
  }

  function getVisClasses(data, id) {
    const s = (data.layout && data.layout.sectionSettings && data.layout.sectionSettings[id]) || {};
    const cls = [];
    if (s.visibleDesktop === false) cls.push('hide-desktop');
    if (s.visibleTablet === false) cls.push('hide-tablet');
    if (s.visibleMobile === false) cls.push('hide-mobile');
    return cls.join(' ');
  }

  function gfxLayer(data, id) {
    return window.BuilderStyleEngine ? window.BuilderStyleEngine.renderSectionGraphicsHtml(data, id) : '';
  }

  function renderCustomMediaStrip(data, sectionId) {
    const slots = ((data.mediaSettings && data.mediaSettings.customMediaSlots) || [])
      .filter(m => m && m.visible !== false && m.targetSection === sectionId && m.src);
    if (!slots.length) return '';
    return `
      <div class="custom-media-grid">
        ${slots.map(m => `
          <figure class="custom-media-card" style="margin:0;">
            <button type="button" style="border:0;padding:0;background:transparent;cursor:zoom-in;width:100%;" data-open-custom-media="${escapeHtml(m.src)}" data-title="${escapeHtml(m.title || 'Media Item')}" data-project="${escapeHtml(m.project || 'Portfolio')}" data-caption="${escapeHtml(m.caption || '')}">
              <div class="custom-media-thumb">
                <img src="${escapeHtml(m.src)}" alt="${escapeHtml(m.title || 'Portfolio media')}" loading="lazy" style="object-fit:${escapeHtml(m.objectFit || 'cover')}; object-position:${escapeHtml(m.objectPosition || 'center')};" />
              </div>
            </button>
            ${(m.title || m.caption) ? `<figcaption class="custom-media-caption">${m.title ? `<strong>${escapeHtml(m.title)}</strong> ` : ''}${escapeHtml(m.caption || '')}</figcaption>` : ''}
          </figure>`).join('')}
      </div>`;
  }

  const uiState = {
    activeCaseId: 'case-kanan',
    scriptFilter: 'All',
    videoFilter: 'All',
    designFilter: 'All',
    activeDeckId: 'deck-kanan',
    activeSlideIndex: 0
  };

  function getActiveDecks(data) {
    return (data.presentations || []).map(deck => ({
      ...deck,
      visibleSlides: (deck.slides || []).filter(s => s.published !== false)
    }));
  }

  function isModuleVisible(data, key) {
    return !data.moduleVisibility || data.moduleVisibility[key] !== false;
  }

  function getHiddenSectionIds(data) {
    const hidden = new Set();
    (data.sections || []).forEach(s => {
      if (s.visible === false) hidden.add(s.id);
    });
    if (data.cv && data.cv.showSection === false) hidden.add('cv');
    const visCases = (data.caseStudies || []).filter(c => c.visible !== false);
    if (!visCases.length) hidden.add('case-studies');
    if (!isModuleVisible(data, 'scripts') && !isModuleVisible(data, 'videos') && !isModuleVisible(data, 'designs')) {
      hidden.add('content-archive');
    }
    if (!isModuleVisible(data, 'researchStudies') && !isModuleVisible(data, 'presentations')) {
      hidden.add('research-decks');
    }
    if (!isModuleVisible(data, 'secondaryExperience') && !isModuleVisible(data, 'credentials')) {
      hidden.add('initiatives');
    }
    return hidden;
  }

  function renderNavAndMasthead(data) {
    const editionEl = document.getElementById('edition-label');
    const issueEl = document.getElementById('issue-tag');
    if (editionEl) editionEl.textContent = data.general.editionLabel || '';
    if (issueEl) issueEl.textContent = data.general.issueTag || '';

    const brandTitle = document.getElementById('masthead-name');
    const brandSub = document.getElementById('masthead-role');
    if (brandTitle) brandTitle.textContent = data.general.shortName || data.general.fullName;
    if (brandSub) brandSub.textContent = data.general.primaryTitle;

    const hiddenSections = getHiddenSectionIds(data);
    const navList = document.getElementById('public-nav-links');
    if (navList) {
      navList.innerHTML = (data.navigation || [])
        .filter(n => {
          if (n.visible === false) return false;
          const href = (n.href || '').trim();
          if (href.startsWith('#')) {
            const targetId = href.slice(1);
            if (hiddenSections.has(targetId)) return false;
          }
          return true;
        })
        .map(n => `<li><a href="${escapeHtml(n.href)}">${escapeHtml(n.label)}</a></li>`)
        .join('');
    }
  }

  function renderSectionHero(data) {
    const g = data.general;
    const c = g.contact || {};
    const ct = data.contentText || {};
    const heroLayout = (data.layout && data.layout.heroLayout) || 'split-right';
    const layoutClass = heroLayout === 'split-left' ? 'hero-layout-split-left' : (heroLayout === 'centered' ? 'hero-layout-centered' : '');
    const visCls = getVisClasses(data, 'hero');
    const phoneLink = c.showPhonePublicly && c.phonePrivate
      ? `<span class="hero-channel-link"><strong>Phone:</strong> ${escapeHtml(c.phonePrivate)}</span>`
      : '';

    const factsHtml = (g.highlights || [])
      .map((h, idx) => `
        <div class="fact-cell">
          <div class="fact-value" data-counter data-counter-key="hero-fact-${idx}" data-counter-target="${escapeHtml(h.value)}">${escapeHtml(h.value)}</div>
          <div class="fact-label">${escapeHtml(h.label)}</div>
        </div>`)
      .join('');

    return `
      <section id="hero" class="hero-section ${layoutClass} ${visCls}">
        ${gfxLayer(data, 'hero')}
        <div class="container section-content-z">
          <div class="hero-grid">
            <div>
              <div class="hero-eyebrow">${escapeHtml(g.experienceNote || 'Portfolio 2026')}</div>
              <h1 class="hero-title">${escapeHtml(g.fullName)}</h1>
              <p class="hero-role">${escapeHtml(g.primaryTitle)}</p>
              <p class="hero-positioning">${escapeHtml(g.secondaryPositioning)}</p>
              <div class="hero-summary rich-text-content">${richHtml(g.summary)}</div>

              <div class="hero-cta-row">
                <a class="btn btn-primary" href="#case-studies">${escapeHtml(ct.heroCtaPrimary || 'Explore Case Studies')}</a>
                <a class="btn" href="#content-archive">${escapeHtml(ct.heroCtaSecondary || 'Browse Content Archive')}</a>
                <a class="btn" href="#research-decks">${escapeHtml(ct.heroCtaTertiary || 'Research & Decks')}</a>
              </div>

              <div class="hero-channels" aria-label="Public profile links">
                ${c.email ? `<a class="hero-channel-link" href="mailto:${escapeHtml(c.email)}"><strong>${escapeHtml(ct.emailLabel || 'Email:')}</strong> ${escapeHtml(c.email)}</a>` : ''}
                ${c.linkedin ? `<a class="hero-channel-link" href="${escapeHtml(c.linkedin)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(ct.linkedinLabel || 'LinkedIn ↗')}</strong></a>` : ''}
                ${c.behance ? `<a class="hero-channel-link" href="${escapeHtml(c.behance)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(ct.behanceLabel || 'Behance ↗')}</strong></a>` : ''}
                ${phoneLink}
              </div>
            </div>

            <aside class="hero-portrait-aside" aria-label="Portrait of ${escapeHtml(g.fullName)}">
              <div class="hero-portrait-frame">
                <div class="hero-portrait-img-box">
                  <img src="${escapeHtml(g.profilePhoto)}" alt="${escapeHtml(g.fullName)} — ${escapeHtml(g.primaryTitle)}" loading="eager" />
                </div>
                <div class="hero-portrait-caption">
                  <span class="hero-portrait-name">${escapeHtml(g.shortName)}</span>
                  <span class="hero-portrait-loc">${escapeHtml(c.location || 'Cairo, Egypt')}</span>
                </div>
              </div>
            </aside>
          </div>

          <div class="editorial-facts-strip" aria-label="Portfolio index summary">
            ${factsHtml}
          </div>
          ${renderCustomMediaStrip(data, 'hero')}
        </div>
      </section>`;
  }

  function renderSectionBrands(data) {
    const ct = data.contentText || {};
    const visCls = getVisClasses(data, 'brands');
    const cards = (data.brands || [])
      .map(b => `
        <article class="brand-card" style="--card-brand-color: ${escapeHtml(b.accent)}">
          <div class="brand-logo-plate ${escapeHtml(b.plateClass || 'plate-light')}">
            <img src="${escapeHtml(b.logo)}" alt="${escapeHtml(b.name)} logo" loading="lazy" />
          </div>
          <div class="brand-card-meta">
            <h3>${escapeHtml(b.name)}</h3>
            <p>${escapeHtml(b.subtitle)}</p>
          </div>
        </article>`)
      .join('');

    return `
      <section id="brands" class="brand-strip-band ${visCls}" aria-label="Primary featured brands">
        ${gfxLayer(data, 'brands')}
        <div class="container section-content-z">
          <div class="brand-strip-label">${escapeHtml(ct.brandsHeading || 'Primary Featured Case Studies & Leadership Dossiers')}</div>
          <div class="brand-logos-grid">${cards}</div>
        </div>
      </section>`;
  }

  function renderSectionApproach(data) {
    const cfg = getSecCfg(data, 'approach', 'Section I · Editorial Philosophy', 'How I Build Content & Campaigns', 'Structured marketing thinking combining audience clarity, creative production, and honest attribution.');
    const visCls = getVisClasses(data, 'approach');
    const items = (data.general.approach || [])
      .map(item => `
        <article class="approach-card">
          <span class="approach-num">METHOD // ${escapeHtml(item.num)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p style="margin:0; font-size:0.86rem; color:var(--ink-secondary);">${escapeHtml(item.detail)}</p>
        </article>`)
      .join('');

    const cv = data.cv || {};
    const compactCvHtml = (cv.showSection !== false && cv.displayMode === 'compact-about')
      ? renderCompactCvBox(data)
      : '';

    return `
      <section id="approach" class="editorial-section ${visCls}">
        ${gfxLayer(data, 'approach')}
        <div class="container section-content-z">
          <div class="section-header">
            <div>
              <div class="section-kicker">${escapeHtml(cfg.kicker)}</div>
              <h2 class="section-title">${escapeHtml(cfg.title)}</h2>
              <div class="section-subtitle rich-text-content">${richHtml(cfg.subtitle)}</div>
            </div>
          </div>
          <div class="approach-grid">${items}</div>
          ${compactCvHtml}
          ${renderCustomMediaStrip(data, 'approach')}
        </div>
      </section>`;
  }

  function renderCaseDossier(cs) {
    const attr = cs.attribution || {};
    const attrBlock = (title, list, tone) => {
      if (!list || !list.length) return '';
      return `
        <div class="attr-card" style="--attr-tone:${tone}">
          <h4>${escapeHtml(title)}</h4>
          <ul>${list.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
        </div>`;
    };

    const campaignsHtml = (cs.campaigns || [])
      .map(cp => `
        <div class="concept-card">
          <div><span class="pill-tag ${cp.status.toLowerCase().includes('propos') ? 'proposed' : 'verified'}">${escapeHtml(cp.status)}</span></div>
          <h4>${escapeHtml(cp.name)}</h4>
          <p>${escapeHtml(cp.description)}</p>
        </div>`)
      .join('');

    const calendarsHtml = (cs.calendars && cs.calendars.length)
      ? `<div class="case-block full-span">
           <h3 class="case-block-title"><span>Content Calendars &amp; Strategy Matrices</span><span class="pill-tag">${cs.calendars.length} Working Sheets</span></h3>
           <p>Multi-platform planning grids spanning Facebook (70% B2B), Instagram, TikTok, YouTube, WhatsApp Channel, and international exhibition prep. Click any sheet to inspect full-size.</p>
           <div class="calendar-thumbs-grid">
             ${cs.calendars.map((cal, i) => `
               <button type="button" class="calendar-thumb-btn" data-calendar-case="${escapeHtml(cs.id)}" data-calendar-index="${i}">
                 <img src="${escapeHtml(cal.image)}" alt="${escapeHtml(cal.title)}" loading="lazy" />
                 <span><strong>${escapeHtml(cal.title)}</strong> — ${escapeHtml(cal.caption)}</span>
               </button>`).join('')}
           </div>
         </div>`
      : '';

    const metricsHtml = cs.showOptionalMetrics && cs.optionalMetrics && cs.optionalMetrics.length
      ? `<div class="case-block full-span">
           <h3 class="case-block-title"><span>Verified Outcomes &amp; Evidence</span><span class="pill-tag verified">Verified</span></h3>
           <div class="concepts-grid">
             ${cs.optionalMetrics.map(m => `
               <div class="concept-card">
                 <h4>${escapeHtml(m.value)} — ${escapeHtml(m.label)}</h4>
                 <p>${escapeHtml(m.context || '')}</p>
               </div>`).join('')}
           </div>
         </div>`
      : '';

    return `
      <article class="case-dossier case-panel-enter" style="--case-brand:${escapeHtml(cs.brandColor || '#C99E3F')}">
        <div class="case-top-bar">
          <div class="case-header-left">
            <div class="case-logo-badge ${escapeHtml(cs.logoPlate || 'plate-light')}">
              <img src="${escapeHtml(cs.logo)}" alt="${escapeHtml(cs.title)} logo" />
            </div>
            <div>
              <div class="case-tag-row">
                <span class="pill-tag accent">${escapeHtml(cs.number)}</span>
                <span class="pill-tag">${escapeHtml(cs.industry)}</span>
              </div>
              <h3 class="case-title">${escapeHtml(cs.title)}</h3>
              <p class="case-role-line"><strong>${escapeHtml(cs.role)}</strong> — ${escapeHtml(cs.subtitle)}</p>
            </div>
          </div>

          <div class="case-meta-box">
            <div>
              <div class="case-meta-label">Market</div>
              <div>${escapeHtml(cs.market)}</div>
            </div>
            <div>
              <div class="case-meta-label">Setup</div>
              <div>${escapeHtml(cs.workSetup)}</div>
            </div>
            <div style="grid-column:1 / -1;">
              <div class="case-meta-label">Period</div>
              <div>${escapeHtml(cs.period)}</div>
            </div>
          </div>
        </div>

        <div class="case-columns">
          <div class="case-block">
            <h4 class="case-block-title">01 · Overview &amp; Market Context</h4>
            <div class="rich-text-content">${richHtml(cs.overview)}</div>
          </div>
          <div class="case-block">
            <h4 class="case-block-title">02 · Communication Challenge</h4>
            <div class="rich-text-content">${richHtml(cs.challenge)}</div>
          </div>

          <div class="case-block full-span">
            <h4 class="case-block-title"><span>03 · Role &amp; Team Attribution Clarity</span><span class="pill-tag">Verified Scope</span></h4>
            <div class="attribution-grid">
              ${attrBlock('What I Personally Created / Managed', attr.personal, '#2ea06c')}
              ${attrBlock('Proposed / Advisory Concepts', attr.proposed, '#d69c2f')}
              ${attrBlock('Team Collaborative Production', attr.team, '#4c8bf5')}
              ${attrBlock('Separate Specialist / Unverified Exclusions', attr.separate, '#9e978e')}
            </div>
          </div>

          <div class="case-block">
            <h4 class="case-block-title">04 · Strategy &amp; Creative Direction</h4>
            <ul class="case-list">
              ${(cs.strategyPoints || []).map(p => `<li>${escapeHtml(p)}</li>`).join('')}
            </ul>
          </div>

          <div class="case-block">
            <h4 class="case-block-title">05 · Campaigns &amp; Planned Initiatives</h4>
            <div class="concepts-grid">
              ${campaignsHtml}
            </div>
          </div>

          ${calendarsHtml}
          ${metricsHtml}
        </div>

        <div class="case-footer-links">
          <span class="evidence-notice">${escapeHtml(cs.metricsNote || '')}</span>
          <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
            ${cs.relatedFilterKey ? `<button type="button" class="btn btn-sm" data-jump-designs="${escapeHtml(cs.relatedFilterKey)}">View ${escapeHtml(cs.title)} Designs ↓</button>` : ''}
            ${cs.relatedDeckId ? `<button type="button" class="btn btn-sm btn-primary" data-jump-deck="${escapeHtml(cs.relatedDeckId)}">Open Strategy Deck ↓</button>` : ''}
          </div>
        </div>
      </article>`;
  }

  function renderSectionCaseStudies(data) {
    const cases = (data.caseStudies || []).filter(c => c.visible !== false);
    if (!cases.length) return '';
    if (!cases.some(c => c.id === uiState.activeCaseId)) {
      uiState.activeCaseId = cases[0].id;
    }
    const activeCase = cases.find(c => c.id === uiState.activeCaseId) || cases[0];
    const cfg = getSecCfg(data, 'case-studies', 'Section II · Primary Case Studies', 'Selected Brand & Leadership Dossiers', 'Deep dives distinguishing personal strategy, proposed concepts, collaborative execution, and preserved brand identities.');
    const visCls = getVisClasses(data, 'case-studies');

    return `
      <section id="case-studies" class="editorial-section ${visCls}">
        ${gfxLayer(data, 'case-studies')}
        <div class="container section-content-z">
          <div class="section-header">
            <div>
              <div class="section-kicker">${escapeHtml(cfg.kicker)}</div>
              <h2 class="section-title">${escapeHtml(cfg.title)}</h2>
              <div class="section-subtitle rich-text-content">${richHtml(cfg.subtitle)}</div>
            </div>
          </div>

          <div class="case-switcher" role="tablist" aria-label="Select primary case study">
            ${cases.map(cs => `
              <button type="button"
                role="tab"
                aria-selected="${cs.id === activeCase.id ? 'true' : 'false'}"
                class="case-tab-btn ${cs.id === activeCase.id ? 'active' : ''}"
                style="--tab-accent:${escapeHtml(cs.brandColor || '#C99E3F')}"
                data-select-case="${escapeHtml(cs.id)}">
                <span class="case-swatch"></span>
                <span>${escapeHtml(cs.number)}: ${escapeHtml(cs.title)}</span>
              </button>`).join('')}
          </div>

          <div id="active-case-panel">
            ${renderCaseDossier(activeCase)}
          </div>
          ${renderCustomMediaStrip(data, 'case-studies')}
        </div>
      </section>`;
  }

  function shouldRunMarquee(data) {
    const ms = data.motionSettings || {};
    const fx = ms.effects || {};
    return ms.enabled !== false && ms.reducedMotionMode !== 'force-minimal' && fx.horizontalMarquees !== false;
  }

  function renderMarqueeRow(itemsHtml, { dir = 'left', durationSec = 56, pauseOnHover = true, label = 'Horizontal showcase', extraClass = '' } = {}) {
    const cardsStr = itemsHtml.join('');
    return `
      <div class="marquee-shell ${dir === 'right' ? 'dir-right' : 'dir-left'} ${pauseOnHover ? 'pause-on-hover' : ''} ${extraClass}" style="--marquee-duration:${durationSec}s" role="region" aria-label="${escapeHtml(label)}">
        <div class="marquee-track">
          <div class="marquee-group">${cardsStr}</div>
          <div class="marquee-group" data-marquee-clone="true" aria-hidden="true">${cardsStr}</div>
        </div>
      </div>`;
  }

  function renderVideoCardHtml(v, idx, allowVideoEl) {
    const hasVerifiedUrl = !!(v.videoUrl && validateExternalUrl(v.videoUrl).valid);
    const isFeatured = hasVerifiedUrl || idx === 0 || idx === 4 || idx === 9;
    const cls = `video-card${isFeatured ? ' video-card-featured' : ''}`;
    const thumbHtml = (allowVideoEl && v.previewVideo)
      ? `<video class="video-preview-el" data-preview-video muted loop playsinline preload="metadata" poster="${escapeHtml(v.thumbnail || '')}">
           <source src="${escapeHtml(v.previewVideo)}" type="video/mp4" />
         </video>
         <span class="video-live-pill"><span class="video-live-dot"></span>Muted Clip</span>`
      : `<img src="${escapeHtml(v.thumbnail || '')}" alt="${escapeHtml(v.title)}" loading="eager" />`;

    const iconSvg = hasVerifiedUrl
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L5 20"/></svg>`;

    const bodyHtml = `
      <div class="video-thumb-box">
        ${thumbHtml}
        <span class="video-play-badge" aria-hidden="true">${iconSvg}</span>
      </div>
      <div class="video-card-body">
        <div class="case-tag-row">
          <span class="pill-tag accent">${escapeHtml(v.project)}</span>
          <span class="pill-tag ${hasVerifiedUrl ? 'verified' : ''}">${hasVerifiedUrl ? 'Verified Video' : 'Production Poster'}</span>
        </div>
        <h4>${escapeHtml(v.title)}</h4>
        <p>${escapeHtml(v.description || '')}</p>
        <span class="video-card-cta">${hasVerifiedUrl ? 'Watch External Video ↗' : 'Inspect Reel Poster ↗'}</span>
      </div>`;

    if (hasVerifiedUrl) {
      return `<a class="${cls}" href="${escapeHtml(v.videoUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Watch ${escapeHtml(v.title)} in new tab">${bodyHtml}</a>`;
    }
    return `<button type="button" class="${cls} video-card-btn" data-open-video-poster="${escapeHtml(v.id)}" aria-label="Preview poster for ${escapeHtml(v.title)}">${bodyHtml}</button>`;
  }

  function renderSectionArchive(data) {
    const showScripts = isModuleVisible(data, 'scripts');
    const showVideos = isModuleVisible(data, 'videos');
    const showDesigns = isModuleVisible(data, 'designs');
    if (!showScripts && !showVideos && !showDesigns) return '';

    const ms = data.motionSettings || {};
    const fx = ms.effects || {};
    const marqueeEnabled = shouldRunMarquee(data);
    const pauseHover = ms.pauseOnHover !== false;
    const allowVideoEl = ms.enabled !== false && fx.videoPreviews !== false;

    const scripts = (data.scripts || []).filter(s => s.published !== false);
    const scriptProjects = ['All', ...new Set(scripts.map(s => s.project))];
    const filteredScripts = uiState.scriptFilter === 'All'
      ? scripts
      : scripts.filter(s => s.project === uiState.scriptFilter);

    const allVideos = data.videos || [];
    const showcaseVideos = allVideos.filter(v => v.published === true && (validateExternalUrl(v.videoUrl).valid || !!v.thumbnail));
    const videoProjects = ['All', ...new Set(showcaseVideos.map(v => v.project))];
    const filteredVideos = uiState.videoFilter === 'All'
      ? showcaseVideos
      : showcaseVideos.filter(v => v.project === uiState.videoFilter);

    const designs = (data.designs || []).filter(d => d.published !== false);
    const designProjects = ['All', ...new Set(designs.map(d => d.project))];
    const filteredDesigns = uiState.designFilter === 'All'
      ? designs
      : designs.filter(d => d.project === uiState.designFilter);

    const scriptCards = filteredScripts.map(s => `
      <button type="button" class="script-card" data-open-script="${escapeHtml(s.id)}">
        <div>
          <div class="case-tag-row">
            <span class="pill-tag accent">${escapeHtml(s.project)}</span>
            <span class="pill-tag">${escapeHtml(s.language || 'AR')}</span>
            ${s.attachments && s.attachments.length ? `<span class="pill-tag">+${s.attachments.length} Scans</span>` : ''}
          </div>
          <h4 class="script-card-title ${s.dir === 'rtl' ? 'rtl-text' : ''}">${escapeHtml(s.title)}</h4>
          <p class="script-card-preview ${s.dir === 'rtl' ? 'rtl-text' : ''}">${escapeHtml(s.preview)}</p>
        </div>
        <div class="script-card-footer">
          <span>${escapeHtml(s.contentType)}</span>
          <span>Read Script ↗</span>
        </div>
      </button>`);

    let scriptsMarkup = '';
    if (marqueeEnabled && scriptCards.length >= 4) {
      const mid = Math.ceil(scriptCards.length / 2);
      scriptsMarkup = `
        <div class="marquee-stack" id="marquee-scripts">
          ${renderMarqueeRow(scriptCards.slice(0, mid), { dir: 'left', durationSec: 46, pauseOnHover: pauseHover, label: 'Scripts showcase row 1' })}
          ${renderMarqueeRow(scriptCards.slice(mid), { dir: 'right', durationSec: 54, pauseOnHover: pauseHover, label: 'Scripts showcase row 2' })}
        </div>`;
    } else {
      scriptsMarkup = `
        <div class="carousel-viewport">
          <div class="carousel-track" id="track-scripts" tabindex="0" aria-label="Scripts carousel">${scriptCards.join('')}</div>
        </div>`;
    }

    const videoCards = filteredVideos.map((v, idx) => renderVideoCardHtml(v, idx, allowVideoEl));
    let videosMarkup = '';
    if (marqueeEnabled && videoCards.length >= 6) {
      const midV = Math.ceil(videoCards.length / 2);
      videosMarkup = `
        <div class="marquee-stack" id="marquee-videos">
          ${renderMarqueeRow(videoCards.slice(0, midV), { dir: 'left', durationSec: 50, pauseOnHover: pauseHover, label: 'Video productions row 1' })}
          ${renderMarqueeRow(videoCards.slice(midV), { dir: 'right', durationSec: 58, pauseOnHover: pauseHover, label: 'Video productions row 2' })}
        </div>`;
    } else if (marqueeEnabled && videoCards.length >= 4) {
      videosMarkup = `
        <div class="marquee-stack" id="marquee-videos">
          ${renderMarqueeRow(videoCards, { dir: 'left', durationSec: 44, pauseOnHover: pauseHover, label: 'Video productions showcase' })}
        </div>`;
    } else {
      videosMarkup = `
        <div class="carousel-viewport">
          <div class="carousel-track" id="track-videos" tabindex="0" aria-label="Video archive carousel">${videoCards.join('')}</div>
        </div>`;
    }

    const designCards = filteredDesigns.map((d, idx) => `
      <button type="button" class="design-card" data-open-lightbox="${escapeHtml(d.id)}" data-design-index="${idx}">
        <div class="design-matte">
          <img src="${escapeHtml(d.image)}" alt="${escapeHtml(d.title)}" loading="${marqueeEnabled && filteredDesigns.length >= 4 ? 'eager' : 'lazy'}" />
        </div>
        <div>
          <div class="case-tag-row">
            <span class="pill-tag accent">${escapeHtml(d.project)}</span>
            <span class="pill-tag">${escapeHtml(d.category)}</span>
          </div>
          <h4 class="design-card-title">${escapeHtml(d.title)}</h4>
          <p class="design-card-sub">${escapeHtml(d.role || '')}</p>
        </div>
      </button>`);

    let designsMarkup = '';
    if (marqueeEnabled && designCards.length >= 6) {
      const midD = Math.ceil(designCards.length / 2);
      const row1Dur = Math.max(46, Math.round(midD * 2.4));
      const row2Dur = Math.max(54, Math.round((designCards.length - midD) * 2.75));
      designsMarkup = `
        <div class="marquee-stack" id="marquee-designs">
          ${renderMarqueeRow(designCards.slice(0, midD), { dir: 'left', durationSec: row1Dur, pauseOnHover: pauseHover, label: 'Visual designs showcase row 1' })}
          ${renderMarqueeRow(designCards.slice(midD), { dir: 'right', durationSec: row2Dur, pauseOnHover: pauseHover, label: 'Visual designs showcase row 2' })}
        </div>`;
    } else if (marqueeEnabled && designCards.length >= 4) {
      designsMarkup = `
        <div class="marquee-stack" id="marquee-designs">
          ${renderMarqueeRow(designCards, { dir: 'left', durationSec: 42, pauseOnHover: pauseHover, label: 'Visual designs showcase' })}
        </div>`;
    } else {
      designsMarkup = `
        <div class="carousel-viewport">
          <div class="carousel-track" id="track-designs" tabindex="0" aria-label="Designs carousel">${designCards.join('')}</div>
        </div>`;
    }

    const cfg = getSecCfg(data, 'content-archive', 'Section III · Content Archive', 'Scripts, Video Productions & Visual Work', 'Three continuous multi-row showcases featuring pause-on-hover, directional motion, lightbox inspection, and project filtering.');
    const visCls = getVisClasses(data, 'content-archive');

    return `
      <section id="content-archive" class="editorial-section ${visCls}">
        ${gfxLayer(data, 'content-archive')}
        <div class="container section-content-z">
          <div class="section-header">
            <div>
              <div class="section-kicker">${escapeHtml(cfg.kicker)}</div>
              <h2 class="section-title">${escapeHtml(cfg.title)}</h2>
              <div class="section-subtitle rich-text-content">${richHtml(cfg.subtitle)}</div>
            </div>
          </div>

          ${showScripts ? `
          <!-- 1. SCRIPTS ARCHIVE -->
          <div class="archive-subsection" id="archive-scripts">
            <div class="archive-bar">
              <div>
                <h3 class="archive-bar-title">01 · Scripts &amp; Copywriting Archive (${filteredScripts.length})</h3>
                <p class="archive-bar-sub">Bilingual RTL Arabic &amp; handwritten storyboard production scripts. Click any card to open the Reading View.</p>
              </div>
              <div class="archive-controls">
                ${marqueeEnabled && scriptCards.length >= 4
                  ? `<button type="button" class="btn btn-sm" data-marquee-toggle="marquee-scripts" aria-pressed="false">⏸ Pause</button>`
                  : `<button type="button" class="btn btn-icon" data-carousel-prev="track-scripts" aria-label="Previous scripts">←</button>
                     <button type="button" class="btn btn-icon" data-carousel-next="track-scripts" aria-label="Next scripts">→</button>`}
              </div>
            </div>

            <div class="filter-pills" role="group" aria-label="Filter scripts by project">
              ${scriptProjects.map(p => `
                <button type="button" class="filter-pill ${uiState.scriptFilter === p ? 'active' : ''}" data-filter-group="script" data-filter-val="${escapeHtml(p)}">${escapeHtml(p)}</button>`).join('')}
            </div>

            ${scriptsMarkup}
          </div>` : ''}

          ${showVideos ? `
          <!-- 2. VIDEO ARCHIVE -->
          <div class="archive-subsection" id="archive-videos">
            <div class="archive-bar">
              <div>
                <h3 class="archive-bar-title">02 · Video &amp; Reels Showcase (${filteredVideos.length})</h3>
                <p class="archive-bar-sub">Muted preview clips, verified Google Drive playback, and authentic campaign reel posters across Kanan, Divan, and AIBE.</p>
              </div>
              <div class="archive-controls">
                ${marqueeEnabled && videoCards.length >= 4
                  ? `<button type="button" class="btn btn-sm" data-marquee-toggle="marquee-videos" aria-pressed="false">⏸ Pause</button>`
                  : `<button type="button" class="btn btn-icon" data-carousel-prev="track-videos" aria-label="Previous videos">←</button>
                     <button type="button" class="btn btn-icon" data-carousel-next="track-videos" aria-label="Next videos">→</button>`}
              </div>
            </div>

            ${videoProjects.length > 1 ? `
              <div class="filter-pills" role="group" aria-label="Filter videos by project">
                ${videoProjects.map(p => `
                  <button type="button" class="filter-pill ${uiState.videoFilter === p ? 'active' : ''}" data-filter-group="video" data-filter-val="${escapeHtml(p)}">${escapeHtml(p)}</button>`).join('')}
              </div>` : ''}

            ${videosMarkup}
          </div>` : ''}

          ${showDesigns ? `
          <!-- 3. DESIGNS & PHOTOGRAPHY ARCHIVE -->
          <div class="archive-subsection" id="archive-designs">
            <div class="archive-bar">
              <div>
                <h3 class="archive-bar-title">03 · Designs, Campaigns &amp; Collaterals (${filteredDesigns.length})</h3>
                <p class="archive-bar-sub">Original client colorways and aspect ratios preserved uncropped. Click any piece to inspect it in the full-screen Lightbox.</p>
              </div>
              <div class="archive-controls">
                ${marqueeEnabled && designCards.length >= 4
                  ? `<button type="button" class="btn btn-sm" data-marquee-toggle="marquee-designs" aria-pressed="false">⏸ Pause</button>`
                  : `<button type="button" class="btn btn-icon" data-carousel-prev="track-designs" aria-label="Previous designs">←</button>
                     <button type="button" class="btn btn-icon" data-carousel-next="track-designs" aria-label="Next designs">→</button>`}
              </div>
            </div>

            <div class="filter-pills" role="group" aria-label="Filter designs by project">
              ${designProjects.map(p => `
                <button type="button" class="filter-pill ${uiState.designFilter === p ? 'active' : ''}" data-filter-group="design" data-filter-val="${escapeHtml(p)}">${escapeHtml(p)}</button>`).join('')}
            </div>

            ${designsMarkup}
          </div>` : ''}
        </div>
      </section>`;
  }

  function renderSectionResearchAndDecks(data) {
    const showResearch = isModuleVisible(data, 'researchStudies');
    const showDecks = isModuleVisible(data, 'presentations');
    if (!showResearch && !showDecks) return '';

    const res = data.research || { studies: [] };
    const marketStudy = res.studies[0];
    const engageStudy = res.studies[1];

    const decks = getActiveDecks(data);
    if (!decks.some(d => d.id === uiState.activeDeckId) && decks.length) {
      uiState.activeDeckId = decks[0].id;
      uiState.activeSlideIndex = 0;
    }
    const activeDeck = decks.find(d => d.id === uiState.activeDeckId) || decks[0];
    const slides = activeDeck ? activeDeck.visibleSlides : [];
    const safeIndex = Math.max(0, Math.min(uiState.activeSlideIndex, Math.max(0, slides.length - 1)));
    uiState.activeSlideIndex = safeIndex;
    const currentSlide = slides[safeIndex];

    const swot = marketStudy?.kananSwot;
    const cfg = getSecCfg(data, 'research-decks', 'Section IV · Strategy Deliverables', 'Market Research & Presentation Decks', 'Curated strategic findings and interactive multi-deck slide viewer. Internal audit/budget slides remain withheld by default.');
    const visCls = getVisClasses(data, 'research-decks');

    return `
      <section id="research-decks" class="editorial-section ${visCls}">
        ${gfxLayer(data, 'research-decks')}
        <div class="container section-content-z">
          <div class="section-header">
            <div>
              <div class="section-kicker">${escapeHtml(cfg.kicker)}</div>
              <h2 class="section-title">${escapeHtml(cfg.title)}</h2>
              <div class="section-subtitle rich-text-content">${richHtml(cfg.subtitle)}</div>
            </div>
          </div>

          ${showResearch ? `
          <div class="research-grid">
            ${marketStudy ? `
              <article class="research-panel">
                <div class="case-tag-row">
                  <span class="pill-tag accent">${escapeHtml(marketStudy.project)}</span>
                  <span class="pill-tag">June 2026 Snapshot</span>
                </div>
                <h3>${escapeHtml(marketStudy.title)}</h3>
                <p style="font-size:0.84rem; color:var(--ink-secondary);">${escapeHtml(marketStudy.methodologyNote)}</p>
                <ul class="case-list">
                  ${(marketStudy.findings || []).map(f => `<li>${escapeHtml(f)}</li>`).join('')}
                </ul>
                ${swot ? `
                  <div class="swot-grid">
                    <div class="swot-cell"><strong>Strengths</strong><p>${escapeHtml(swot.strengths)}</p></div>
                    <div class="swot-cell"><strong>Weaknesses</strong><p>${escapeHtml(swot.weaknesses)}</p></div>
                    <div class="swot-cell"><strong>Opportunities</strong><p>${escapeHtml(swot.opportunities)}</p></div>
                    <div class="swot-cell"><strong>Threats</strong><p>${escapeHtml(swot.threats)}</p></div>
                  </div>` : ''}
              </article>` : ''}

            ${engageStudy ? `
              <article class="research-panel">
                <div class="case-tag-row">
                  <span class="pill-tag accent">${escapeHtml(engageStudy.project)}</span>
                  <span class="pill-tag">Engagement Synthesis</span>
                </div>
                <h3>${escapeHtml(engageStudy.title)}</h3>
                <p style="font-size:0.84rem; color:var(--ink-secondary);">${escapeHtml(engageStudy.methodologyNote)}</p>
                <ul class="case-list">
                  ${(engageStudy.findings || []).map(f => `<li>${escapeHtml(f)}</li>`).join('')}
                </ul>
                ${marketStudy?.benchmarkSample ? `
                  <div class="research-table-wrap">
                    <table class="editorial-table">
                      <thead>
                        <tr><th>Benchmark</th><th>Market</th><th>Key Strength</th><th>Observed Gap</th></tr>
                      </thead>
                      <tbody>
                        ${marketStudy.benchmarkSample.map(r => `
                          <tr>
                            <td><strong>${escapeHtml(r.company)}</strong></td>
                            <td>${escapeHtml(r.market)}</td>
                            <td>${escapeHtml(r.strength)}</td>
                            <td>${escapeHtml(r.gap)}</td>
                          </tr>`).join('')}
                      </tbody>
                    </table>
                  </div>` : ''}
              </article>` : ''}
          </div>` : ''}

          <!-- PRESENTATION DECK VIEWER -->
          ${(showDecks && activeDeck) ? `
            <div class="deck-viewer-card" id="presentation-viewer">
              <div class="archive-bar">
                <div>
                  <span class="pill-tag accent">Interactive Slide Deck Library</span>
                  <h3 class="archive-bar-title" style="margin-top:0.4rem;">${escapeHtml(activeDeck.title)}</h3>
                  <p class="archive-bar-sub">${escapeHtml(activeDeck.authorNote)}</p>
                </div>
                <span class="pill-tag">Showing ${slides.length} of ${(activeDeck.slides || []).length} slides</span>
              </div>

              <div class="deck-tabs" role="tablist" aria-label="Select presentation deck">
                ${decks.map(d => `
                  <button type="button"
                    role="tab"
                    aria-selected="${d.id === activeDeck.id ? 'true' : 'false'}"
                    class="case-tab-btn ${d.id === activeDeck.id ? 'active' : ''}"
                    style="--tab-accent:${escapeHtml(d.accent || '#C99E3F')}"
                    data-select-deck="${escapeHtml(d.id)}">
                    <span class="case-swatch"></span>
                    <span>${escapeHtml(d.project)} (${d.visibleSlides.length})</span>
                  </button>`).join('')}
              </div>

              ${currentSlide ? `
                <div class="deck-stage">
                  <div>
                    <div class="deck-slide-frame is-animating">
                      <img src="${escapeHtml(currentSlide.image)}" alt="${escapeHtml(currentSlide.title)}" />
                    </div>
                    <div class="deck-controls-bar">
                      <div style="display:flex; gap:0.5rem;">
                        <button type="button" class="btn btn-sm" data-slide-prev aria-label="Previous slide">← Prev Slide</button>
                        <button type="button" class="btn btn-sm" data-slide-next aria-label="Next slide">Next Slide →</button>
                      </div>
                      <span style="font-family:var(--font-mono); font-size:0.78rem; color:var(--ink-secondary);">
                        Slide ${safeIndex + 1} / ${slides.length} — ${escapeHtml(currentSlide.title)}
                      </span>
                      <button type="button" class="btn btn-sm btn-primary" data-zoom-slide>Fullscreen ↗</button>
                    </div>
                  </div>

                  ${shouldRunMarquee(data) && slides.length >= 6
                    ? renderMarqueeRow(
                        slides.map((sl, idx) => `
                          <button type="button" class="deck-thumb-btn ${idx === safeIndex ? 'active' : ''}" data-select-slide="${idx}" title="${escapeHtml(sl.title)}">
                            <img src="${escapeHtml(sl.image)}" alt="Slide ${sl.num}" loading="eager" />
                          </button>`),
                        { dir: 'left', durationSec: Math.max(40, slides.length * 2.3), pauseOnHover: data.motionSettings?.pauseOnHover !== false, label: 'Slide thumbnails marquee', extraClass: 'deck-marquee-shell' }
                      )
                    : `<div class="deck-strip" aria-label="Slide thumbnails">
                        ${slides.map((sl, idx) => `
                          <button type="button" class="deck-thumb-btn ${idx === safeIndex ? 'active' : ''}" data-select-slide="${idx}" title="${escapeHtml(sl.title)}">
                            <img src="${escapeHtml(sl.image)}" alt="Slide ${sl.num}" loading="lazy" />
                          </button>`).join('')}
                      </div>`}
                </div>`
                : `<p style="color:var(--ink-secondary);">No slides are currently selected for public display in this deck.</p>`}
            </div>` : ''}
        </div>
      </section>`;
  }

  function renderSectionInitiatives(data) {
    const showSecondary = isModuleVisible(data, 'secondaryExperience');
    const showCredentials = isModuleVisible(data, 'credentials');
    if (!showSecondary && !showCredentials) return '';

    const secondary = (data.secondaryExperience || [])
      .map(item => `
        <article class="secondary-card">
          <div class="case-tag-row">
            <span class="pill-tag accent">${escapeHtml(item.type)}</span>
            <span class="pill-tag">${escapeHtml(item.period)}</span>
          </div>
          <h3>${escapeHtml(item.title)}</h3>
          <p style="font-weight:600; color:var(--ink-primary); font-size:0.82rem;">${escapeHtml(item.subtitle)}</p>
          <p>${escapeHtml(item.description)}</p>
          <div style="margin-top:auto; padding-top:0.5rem;">
            <span class="pill-tag">${escapeHtml(item.statusBadge)}</span>
          </div>
        </article>`)
      .join('');

    const cred = data.credentials || {};
    const edu = cred.education || {};
    const cfg = getSecCfg(data, 'initiatives', 'Section V · Freelance, Initiatives & Credentials', 'Supporting Initiatives & Reference Desk', 'Additional active and academic engagements presented transparently without unverified claims.');
    const visCls = getVisClasses(data, 'initiatives');

    return `
      <section id="initiatives" class="editorial-section ${visCls}">
        ${gfxLayer(data, 'initiatives')}
        <div class="container section-content-z">
          <div class="section-header">
            <div>
              <div class="section-kicker">${escapeHtml(cfg.kicker)}</div>
              <h2 class="section-title">${escapeHtml(cfg.title)}</h2>
              <div class="section-subtitle rich-text-content">${richHtml(cfg.subtitle)}</div>
            </div>
          </div>

          ${showSecondary ? `<div class="secondary-grid">${secondary}</div>` : ''}

          ${showCredentials ? `
          <div class="ref-desk-grid" style="${showSecondary ? 'margin-top:2rem;' : ''}">
            <div class="ref-column">
              <h3>Strategy, Creative &amp; Social Skills</h3>
              ${(cred.skillsGroups || []).map(grp => `
                <div style="margin-bottom:0.95rem;">
                  <div style="font-size:0.78rem; font-weight:700; color:var(--ink-secondary); margin-bottom:0.4rem;">${escapeHtml(grp.name)}</div>
                  <div class="tag-cloud">
                    ${grp.items.map(sk => `<span class="skill-chip">${escapeHtml(sk)}</span>`).join('')}
                  </div>
                </div>`).join('')}
            </div>

            <div class="ref-column">
              <h3>Confirmed Tools &amp; Workflows</h3>
              <div class="tag-cloud" style="margin-bottom:1.3rem;">
                ${(cred.toolsConfirmed || []).map(t => `<span class="skill-chip">${escapeHtml(t)}</span>`).join('')}
              </div>

              <h3>Languages</h3>
              <div class="tag-cloud">
                ${(cred.languages || []).map(l => `<span class="skill-chip">${escapeHtml(l)}</span>`).join('')}
              </div>
            </div>

            <div class="ref-column">
              <h3>Education &amp; Certifications</h3>
              <div style="padding-bottom:1rem; margin-bottom:1rem; border-bottom:1px solid var(--border-hairline);">
                <span class="pill-tag proposed" style="margin-bottom:0.45rem;">In Progress</span>
                <div style="font-weight:700;">${escapeHtml(edu.institution || '')}</div>
                <div style="font-size:0.86rem; color:var(--ink-secondary);">${escapeHtml(edu.degree || '')}</div>
                <div style="font-size:0.8rem; color:var(--accent); margin-top:0.2rem;">${escapeHtml(edu.expected || '')} · ${escapeHtml(edu.status || '')}</div>
              </div>

              <div style="display:flex; flex-direction:column; gap:0.55rem;">
                ${(cred.certifications || []).map(cert => `
                  <div style="font-size:0.82rem;">
                    <strong>${escapeHtml(cert.title)}</strong> · ${escapeHtml(cert.issuer)} (${escapeHtml(cert.year)})
                  </div>`).join('')}
              </div>
            </div>
          </div>` : ''}
          ${renderCustomMediaStrip(data, 'initiatives')}
        </div>
      </section>`;
  }

  function getApprovedCvPdf(data) {
    const cv = data.cv || {};
    const pdf = cv.publicPdf;
    if (pdf && pdf.approvedForPublic && (pdf.dataUrl || pdf.url)) {
      return {
        url: pdf.dataUrl || pdf.url,
        filename: pdf.filename || 'Magdi-Haitham-CV.pdf'
      };
    }
    return null;
  }

  function getCvDriveUrl(data) {
    const raw = (data.cv && data.cv.driveUrl || '').trim();
    if (raw && validateExternalUrl(raw).valid) return raw;
    return 'https://drive.google.com/drive/folders/1sE8wyU0JF4YzTlqEpL1VXbYp07hgoc-H?usp=sharing';
  }

  function getCvPreviewPages(data) {
    const pages = (data.cv && Array.isArray(data.cv.previewPages)) ? data.cv.previewPages.filter(p => p && p.image) : [];
    return pages;
  }

  function renderCompactCvBox(data) {
    const cv = data.cv || {};
    const driveUrl = getCvDriveUrl(data);
    const pages = getCvPreviewPages(data);
    const viewLabel = cv.viewButtonLabel || 'VIEW MY CV';
    const pdf = getApprovedCvPdf(data);
    return `
      <div class="cv-compact-box">
        <div style="display:flex; align-items:center; gap:0.9rem; flex-wrap:wrap;">
          ${pages.length ? `
            <div class="cv-mini-thumbs">
              ${pages.map((p, idx) => `
                <a class="cv-mini-thumb-link" href="${escapeHtml(driveUrl)}" target="_blank" rel="noopener noreferrer" title="Open ${escapeHtml(p.label || `CV Page ${idx + 1}`)} in Google Drive">
                  <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.alt || `CV Page ${idx + 1}`)}" loading="lazy" />
                </a>`).join('')}
            </div>` : ''}
          <div>
            <div class="case-meta-label">Curriculum Vitae</div>
            <strong>${escapeHtml(cv.title || 'My CV / Professional Resume')}</strong>
            <div style="font-size:0.82rem; color:var(--ink-secondary);">${escapeHtml(cv.shortNote || 'Visual Curriculum Vitae with direct Google Drive access.')}</div>
          </div>
        </div>
        <div style="display:flex; gap:0.55rem; flex-wrap:wrap;">
          <a class="btn btn-sm btn-primary" href="${escapeHtml(driveUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(viewLabel)} ↗</a>
          ${pdf ? `<a class="btn btn-sm" href="${escapeHtml(pdf.url)}" download="${escapeHtml(pdf.filename)}">${escapeHtml(cv.downloadLabel || 'Download PDF')}</a>` : ''}
        </div>
      </div>`;
  }

  function renderSectionCv(data) {
    const cv = data.cv || {};
    if (cv.showSection === false || cv.displayMode === 'compact-about') return '';
    const visCls = getVisClasses(data, 'cv');
    const cfg = getSecCfg(data, 'cv', cv.kicker || 'Section VI · Curriculum Vitae', cv.title || 'My CV / Professional Resume', cv.description || 'Preview the complete two-page Curriculum Vitae below. Click any page or select VIEW MY CV to open the official document folder directly in Google Drive.');
    const driveUrl = getCvDriveUrl(data);
    const viewLabel = cv.viewButtonLabel || 'VIEW MY CV';
    const clickHint = cv.clickHint || 'Click any CV page to open the full PDF folder in Google Drive ↗';
    const pages = getCvPreviewPages(data);
    const pdf = getApprovedCvPdf(data);

    if (cv.displayMode === 'minimal-card') {
      return `
        <section id="cv" class="editorial-section ${visCls}">
          ${gfxLayer(data, 'cv')}
          <div class="container section-content-z">
            <div class="cv-minimal-card">
              <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap; max-width:720px;">
                ${pages.length ? `
                  <div class="cv-mini-thumbs">
                    ${pages.map((p, idx) => `
                      <a class="cv-mini-thumb-link" href="${escapeHtml(driveUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open CV Page ${idx + 1} in Google Drive">
                        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.alt || `CV Page ${idx + 1}`)}" loading="lazy" />
                      </a>`).join('')}
                  </div>` : ''}
                <div style="flex:1; min-width:240px;">
                  <div class="section-kicker">${escapeHtml(cfg.kicker)}</div>
                  <h2 class="section-title" style="font-size:clamp(1.5rem,2.6vw,2.1rem); margin-bottom:0.35rem;">${escapeHtml(cfg.title)}</h2>
                  <div class="rich-text-content" style="color:var(--ink-secondary); font-size:0.9rem;">${richHtml(cfg.subtitle)}</div>
                </div>
              </div>
              <div class="cv-showcase-cta-group">
                <a class="btn btn-primary btn-cv-cta" href="${escapeHtml(driveUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(viewLabel)} ↗</a>
                ${pdf ? `
                  <button type="button" class="btn" data-open-cv-modal="${escapeHtml(pdf.url)}" data-cv-filename="${escapeHtml(pdf.filename)}">${escapeHtml(cv.previewLabel || 'Quick Preview')}</button>
                  <a class="btn" href="${escapeHtml(pdf.url)}" download="${escapeHtml(pdf.filename)}">${escapeHtml(cv.downloadLabel || 'Download PDF')}</a>
                ` : ''}
              </div>
            </div>
            ${renderCustomMediaStrip(data, 'cv')}
          </div>
        </section>`;
    }

    return `
      <section id="cv" class="editorial-section ${visCls}">
        ${gfxLayer(data, 'cv')}
        <div class="container section-content-z">
          <div class="section-header">
            <div>
              <div class="section-kicker">${escapeHtml(cfg.kicker)}</div>
              <h2 class="section-title">${escapeHtml(cfg.title)}</h2>
              <div class="section-subtitle rich-text-content">${richHtml(cfg.subtitle)}</div>
            </div>
          </div>

          <div class="cv-showcase-shell">
            <div class="cv-showcase-top">
              <div class="cv-showcase-intro">
                <div class="case-tag-row">
                  <span class="pill-tag accent">Official Google Drive CV</span>
                  <span class="pill-tag">${pages.length} ${pages.length === 1 ? 'Page' : 'Pages'} · Original Layout</span>
                  <span class="pill-tag">${escapeHtml(data.general?.contact?.location || 'Cairo, Egypt')}</span>
                </div>
                <div class="cv-click-note">
                  <span>${escapeHtml(clickHint)}</span>
                </div>
              </div>

              <div class="cv-showcase-cta-group">
                <a class="btn btn-primary btn-cv-cta" id="btn-view-my-cv" href="${escapeHtml(driveUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(viewLabel)} ↗</a>
                ${pdf ? `
                  <a class="btn" href="${escapeHtml(pdf.url)}" download="${escapeHtml(pdf.filename)}">${escapeHtml(cv.downloadLabel || 'Download PDF')}</a>
                  <button type="button" class="btn" data-open-cv-modal="${escapeHtml(pdf.url)}" data-cv-filename="${escapeHtml(pdf.filename)}">${escapeHtml(cv.previewLabel || 'Quick Preview')}</button>
                ` : ''}
              </div>
            </div>

            ${pages.length ? `
              <div class="cv-pages-grid ${pages.length === 1 ? 'single-page' : ''}" aria-label="Visual CV page previews">
                ${pages.map((page, idx) => `
                  <a class="cv-page-card" href="${escapeHtml(driveUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHtml(page.label || `CV Page ${idx + 1}`)} in Google Drive (opens in new tab)">
                    <div class="cv-page-frame">
                      <img src="${escapeHtml(page.image)}" alt="${escapeHtml(page.alt || `Magdi Haitham CV — Page ${idx + 1}`)}" loading="lazy" />
                      <div class="cv-page-hover-overlay">
                        <span>Click Page to Access Full CV</span>
                        <span>Open Google Drive ↗</span>
                      </div>
                    </div>
                    <div class="cv-page-footer">
                      <div>
                        <strong>Page ${idx + 1} of ${pages.length}</strong>
                        <div>${escapeHtml(page.label || 'Curriculum Vitae')}</div>
                      </div>
                      <span class="pill-tag accent">Open Drive ↗</span>
                    </div>
                  </a>`).join('')}
              </div>` : `
              <div class="cv-privacy-placeholder">
                <span class="pill-tag accent">Google Drive CV Access</span>
                <h4 style="margin:0.2rem 0 0; font-size:1.05rem;">Access Complete Professional Resume</h4>
                <p style="margin:0; font-size:0.86rem; color:var(--ink-secondary);">
                  No visual preview images are currently configured. Click <strong>${escapeHtml(viewLabel)}</strong> above to open the official Google Drive folder directly.
                </p>
              </div>`}
          </div>
          ${renderCustomMediaStrip(data, 'cv')}
        </div>
      </section>`;
  }

  function renderSectionContact(data) {
    const c = data.general.contact || {};
    const ct = data.contentText || {};
    const cfg = getSecCfg(data, 'contact', 'Classifieds & Direct Dispatch', ct.contactTitle || 'Let’s Build Purpose-Driven Content Together', ct.contactSubtitle || 'Available for social media strategy, B2B/B2C content creation, multilingual campaign scripting, and creative production coordination.');
    const visCls = getVisClasses(data, 'contact');
    const phoneRow = c.showPhonePublicly && c.phonePrivate
      ? `<div class="contact-row-card">
           <div>
             <div class="case-meta-label">Phone / WhatsApp</div>
             <strong>${escapeHtml(c.phonePrivate)}</strong>
           </div>
           <span class="pill-tag">Direct</span>
         </div>`
      : '';

    return `
      <section id="contact" class="editorial-section ${visCls}">
        ${gfxLayer(data, 'contact')}
        <div class="container section-content-z">
          <div class="contact-banner">
            <div>
              <div class="section-kicker">${escapeHtml(cfg.kicker)}</div>
              <h2 class="section-title" style="font-size:clamp(1.9rem, 3.6vw, 2.75rem);">${escapeHtml(cfg.title)}</h2>
              <div class="section-subtitle rich-text-content">${richHtml(cfg.subtitle)}</div>
              <div style="display:flex; flex-wrap:wrap; gap:0.75rem; margin-top:1.35rem;">
                ${c.email ? `<a class="btn btn-primary" href="mailto:${escapeHtml(c.email)}">${escapeHtml(ct.contactPrimaryBtn || 'Send Email ↗')}</a>` : ''}
                <button type="button" class="btn" id="btn-copy-email" data-copy-email="${escapeHtml(c.email || '')}">${escapeHtml(ct.contactCopyBtn || 'Copy Email Address')}</button>
              </div>
            </div>

            <div class="contact-links-list">
              ${c.email ? `
                <a class="contact-row-card" href="mailto:${escapeHtml(c.email)}">
                  <div>
                    <div class="case-meta-label">Portfolio Email</div>
                    <strong>${escapeHtml(c.email)}</strong>
                  </div>
                  <span class="pill-tag accent">Email ↗</span>
                </a>` : ''}
              ${c.linkedin ? `
                <a class="contact-row-card" href="${escapeHtml(c.linkedin)}" target="_blank" rel="noopener noreferrer">
                  <div>
                    <div class="case-meta-label">LinkedIn Profile</div>
                    <strong>linkedin.com/in/magdi-haitham</strong>
                  </div>
                  <span class="pill-tag accent">Connect ↗</span>
                </a>` : ''}
              ${c.behance ? `
                <a class="contact-row-card" href="${escapeHtml(c.behance)}" target="_blank" rel="noopener noreferrer">
                  <div>
                    <div class="case-meta-label">Behance Portfolio</div>
                    <strong>behance.net/magdihaitham2</strong>
                  </div>
                  <span class="pill-tag accent">View Work ↗</span>
                </a>` : ''}
              ${phoneRow}
            </div>
          </div>
        </div>
      </section>`;
  }

  function renderAll(data) {
    renderNavAndMasthead(data);
    const root = document.getElementById('public-main');
    if (!root) return;

    const map = {
      hero: renderSectionHero,
      brands: renderSectionBrands,
      approach: renderSectionApproach,
      'case-studies': renderSectionCaseStudies,
      'content-archive': renderSectionArchive,
      'research-decks': renderSectionResearchAndDecks,
      cv: renderSectionCv,
      initiatives: renderSectionInitiatives,
      contact: renderSectionContact
    };

    const html = (data.sections || [])
      .filter(s => s.visible !== false && map[s.id])
      .map(s => map[s.id](data))
      .join('');

    root.innerHTML = html;

    const ct = data.contentText || {};
    const footerEl = document.getElementById('site-footer');
    if (footerEl) {
      footerEl.classList.toggle('footer-centered', data.layout?.footerLayout === 'centered');
    }
    const footerName = document.getElementById('footer-owner');
    const footerRole = document.getElementById('footer-role-line');
    const footerTag = document.getElementById('footer-tagline');
    const footerDate = document.getElementById('footer-updated');
    if (footerName) footerName.textContent = data.general.fullName;
    if (footerRole) footerRole.textContent = data.general.primaryTitle;
    if (footerTag) footerTag.textContent = ct.footerTagline || 'Editorial Portfolio';
    if (footerDate) footerDate.textContent = data.meta?.lastUpdated || '2026';

    if (window.CarouselsAndModals) {
      window.CarouselsAndModals.bindDynamicUI(data, uiState, () => renderAll(data));
    }
    if (window.PortfolioMotion) {
      window.PortfolioMotion.refresh(root, data);
    }
  }

  return {
    uiState,
    getActiveDecks,
    renderAll
  };
})();
