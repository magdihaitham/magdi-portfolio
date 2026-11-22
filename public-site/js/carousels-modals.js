/* =========================================================
   PUBLIC INTERACTIVE CAROUSELS, LIGHTBOX & SCRIPT READER
   ========================================================= */

window.CarouselsAndModals = (function () {
  const { escapeHtml } = window.PortfolioState;

  let activeLightboxList = [];
  let activeLightboxIndex = 0;
  let activeScriptList = [];
  let activeScriptIndex = 0;
  let globalKeysBound = false;

  function showToast(msg) {
    const el = document.getElementById('toast-notice');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function setupCarouselTrack(track) {
    if (!track || track._bound) return;
    track._bound = true;

    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        track.scrollBy({ left: 340, behavior: 'smooth' });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        track.scrollBy({ left: -340, behavior: 'smooth' });
      }
    });

    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    let dragged = false;

    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      isDown = true;
      dragged = false;
      startX = e.clientX;
      scrollStart = track.scrollLeft;
    });

    track.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 8) dragged = true;
      if (dragged) track.scrollLeft = scrollStart - dx;
    });

    const endDrag = () => { isDown = false; };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointerleave', endDrag);
    track.addEventListener('click', (e) => {
      if (dragged) {
        e.preventDefault();
        e.stopPropagation();
        dragged = false;
      }
    }, true);
  }

  function openScriptModal(list, index) {
    activeScriptList = list;
    activeScriptIndex = Math.max(0, Math.min(index, list.length - 1));
    const script = activeScriptList[activeScriptIndex];
    if (!script) return;

    const modal = document.getElementById('script-modal');
    const titleEl = document.getElementById('script-modal-title');
    const metaEl = document.getElementById('script-modal-meta');
    const bodyEl = document.getElementById('script-modal-body');
    const attachEl = document.getElementById('script-modal-attachments');

    titleEl.textContent = script.title;
    titleEl.className = script.dir === 'rtl' ? 'rtl-text' : '';
    metaEl.innerHTML = `
      <span class="pill-tag accent">${escapeHtml(script.project)}</span>
      <span class="pill-tag">${escapeHtml(script.contentType)}</span>
      <span class="pill-tag">${escapeHtml(script.language || 'AR')} · ${escapeHtml(script.date || '')}</span>`;

    bodyEl.textContent = script.fullText || script.preview || '';
    bodyEl.setAttribute('dir', script.dir === 'rtl' ? 'rtl' : 'ltr');
    bodyEl.className = `script-reader-box ${script.dir === 'rtl' ? 'rtl-text' : ''}`;

    if (script.attachments && script.attachments.length) {
      attachEl.style.display = 'grid';
      attachEl.innerHTML = script.attachments.map((src, i) => `
        <button type="button" class="calendar-thumb-btn" data-script-scan="${i}">
          <img src="${escapeHtml(src)}" alt="Handwritten note page ${i + 1}" />
          <span>Original Notebook Scan ${i + 1} (Click to Zoom)</span>
        </button>`).join('');

      attachEl.querySelectorAll('[data-script-scan]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.getAttribute('data-script-scan'));
          openLightboxModal(
            script.attachments.map((img, n) => ({
              title: `${script.title} — Page ${n + 1}`,
              project: script.project,
              category: 'Handwritten Script Note',
              role: 'Original Notebook Storyboard',
              image: img,
              description: 'Original handwritten campaign production note.'
            })),
            i
          );
        });
      });
    } else {
      attachEl.style.display = 'none';
      attachEl.innerHTML = '';
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('script-modal-close')?.focus();
  }

  function closeScriptModal() {
    const modal = document.getElementById('script-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function renderLightboxItem() {
    const item = activeLightboxList[activeLightboxIndex];
    if (!item) return;

    document.getElementById('lightbox-title').textContent = item.title || '';
    document.getElementById('lightbox-meta').innerHTML = `
      <span class="pill-tag accent">${escapeHtml(item.project || '')}</span>
      <span class="pill-tag">${escapeHtml(item.category || '')}</span>
      <span class="pill-tag">${activeLightboxIndex + 1} / ${activeLightboxList.length}</span>`;
    const imgEl = document.getElementById('lightbox-img');
    imgEl.src = item.image;
    imgEl.alt = item.title || '';
    document.getElementById('lightbox-caption').textContent =
      [item.role ? `Role: ${item.role}` : '', item.description || ''].filter(Boolean).join(' · ');
  }

  function openLightboxModal(list, index) {
    activeLightboxList = list || [];
    activeLightboxIndex = Math.max(0, Math.min(index, activeLightboxList.length - 1));
    if (!activeLightboxList.length) return;
    renderLightboxItem();
    const modal = document.getElementById('lightbox-modal');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('lightbox-close')?.focus();
  }

  function closeLightboxModal() {
    const modal = document.getElementById('lightbox-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function closeCvModal() {
    const modal = document.getElementById('cv-modal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function openCvModal(cvUrl, filename) {
    const modal = document.getElementById('cv-modal');
    const body = document.getElementById('cv-modal-body');
    const title = document.getElementById('cv-modal-title');
    const newTab = document.getElementById('cv-modal-newtab');
    const dl = document.getElementById('cv-modal-download');
    if (!modal || !body || !cvUrl) return;
    if (title) title.textContent = filename || 'Curriculum Vitae (PDF)';
    if (newTab) newTab.href = cvUrl;
    if (dl) {
      dl.href = cvUrl;
      dl.setAttribute('download', filename || 'Magdi-Haitham-CV.pdf');
    }
    body.innerHTML = `<iframe src="${escapeHtml(cvUrl)}" class="cv-pdf-frame" style="height:68vh;" title="CV PDF Preview"></iframe>`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('cv-modal-close')?.focus();
  }

  function bindGlobalModals() {
    if (globalKeysBound) return;
    globalKeysBound = true;

    document.getElementById('script-modal-close')?.addEventListener('click', closeScriptModal);
    document.getElementById('script-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'script-modal') closeScriptModal();
    });
    document.getElementById('script-copy-btn')?.addEventListener('click', () => {
      const txt = document.getElementById('script-modal-body')?.textContent || '';
      if (navigator.clipboard && txt) {
        navigator.clipboard.writeText(txt).then(() => showToast('Script copied to clipboard'));
      }
    });
    document.getElementById('script-prev-btn')?.addEventListener('click', () => {
      if (!activeScriptList.length) return;
      openScriptModal(activeScriptList, (activeScriptIndex - 1 + activeScriptList.length) % activeScriptList.length);
    });
    document.getElementById('script-next-btn')?.addEventListener('click', () => {
      if (!activeScriptList.length) return;
      openScriptModal(activeScriptList, (activeScriptIndex + 1) % activeScriptList.length);
    });

    document.getElementById('lightbox-close')?.addEventListener('click', closeLightboxModal);
    document.getElementById('lightbox-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'lightbox-modal') closeLightboxModal();
    });
    document.getElementById('lightbox-prev')?.addEventListener('click', () => {
      if (!activeLightboxList.length) return;
      activeLightboxIndex = (activeLightboxIndex - 1 + activeLightboxList.length) % activeLightboxList.length;
      renderLightboxItem();
    });
    document.getElementById('lightbox-next')?.addEventListener('click', () => {
      if (!activeLightboxList.length) return;
      activeLightboxIndex = (activeLightboxIndex + 1) % activeLightboxList.length;
      renderLightboxItem();
    });

    document.getElementById('cv-modal-close')?.addEventListener('click', closeCvModal);
    document.getElementById('cv-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'cv-modal') closeCvModal();
    });

    document.addEventListener('keydown', (e) => {
      const lbOpen = document.getElementById('lightbox-modal')?.classList.contains('open');
      const scOpen = document.getElementById('script-modal')?.classList.contains('open');
      const cvOpen = document.getElementById('cv-modal')?.classList.contains('open');
      if (e.key === 'Escape') {
        if (lbOpen) closeLightboxModal();
        if (scOpen) closeScriptModal();
        if (cvOpen) closeCvModal();
      } else if (lbOpen) {
        if (e.key === 'ArrowRight') {
          activeLightboxIndex = (activeLightboxIndex + 1) % activeLightboxList.length;
          renderLightboxItem();
        } else if (e.key === 'ArrowLeft') {
          activeLightboxIndex = (activeLightboxIndex - 1 + activeLightboxList.length) % activeLightboxList.length;
          renderLightboxItem();
        }
      }
    });
  }

  function bindDynamicUI(data, uiState, rerender) {
    bindGlobalModals();

    ['track-scripts', 'track-videos', 'track-designs'].forEach(id => {
      setupCarouselTrack(document.getElementById(id));
    });

    document.querySelectorAll('[data-carousel-prev]').forEach(btn => {
      btn.addEventListener('click', () => {
        const track = document.getElementById(btn.getAttribute('data-carousel-prev'));
        track?.scrollBy({ left: -340, behavior: 'smooth' });
      });
    });
    document.querySelectorAll('[data-carousel-next]').forEach(btn => {
      btn.addEventListener('click', () => {
        const track = document.getElementById(btn.getAttribute('data-carousel-next'));
        track?.scrollBy({ left: 340, behavior: 'smooth' });
      });
    });

    document.querySelectorAll('[data-select-case]').forEach(btn => {
      btn.addEventListener('click', () => {
        uiState.activeCaseId = btn.getAttribute('data-select-case');
        rerender();
      });
    });

    document.querySelectorAll('[data-calendar-case]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cId = btn.getAttribute('data-calendar-case');
        const idx = Number(btn.getAttribute('data-calendar-index'));
        const cs = (data.caseStudies || []).find(c => c.id === cId);
        if (!cs || !cs.calendars) return;
        openLightboxModal(
          cs.calendars.map(cal => ({
            title: cal.title,
            project: cs.title,
            category: 'Content Calendar Sheet',
            role: 'Planning & Strategy',
            image: cal.image,
            description: cal.caption
          })),
          idx
        );
      });
    });

    document.querySelectorAll('[data-jump-designs]').forEach(btn => {
      btn.addEventListener('click', () => {
        uiState.designFilter = btn.getAttribute('data-jump-designs');
        rerender();
        document.getElementById('archive-designs')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
    document.querySelectorAll('[data-jump-deck]').forEach(btn => {
      btn.addEventListener('click', () => {
        uiState.activeDeckId = btn.getAttribute('data-jump-deck');
        uiState.activeSlideIndex = 0;
        rerender();
        document.getElementById('presentation-viewer')?.scrollIntoView({ behavior: 'smooth' });
      });
    });

    document.querySelectorAll('[data-filter-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        const grp = btn.getAttribute('data-filter-group');
        const val = btn.getAttribute('data-filter-val');
        if (grp === 'script') uiState.scriptFilter = val;
        if (grp === 'video') uiState.videoFilter = val;
        if (grp === 'design') uiState.designFilter = val;
        rerender();
      });
    });

    const visibleScripts = (data.scripts || []).filter(s => s.published !== false && (uiState.scriptFilter === 'All' || s.project === uiState.scriptFilter));
    document.querySelectorAll('[data-open-script]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open-script');
        const idx = visibleScripts.findIndex(s => s.id === id);
        if (idx >= 0) openScriptModal(visibleScripts, idx);
      });
    });

    const visibleDesigns = (data.designs || []).filter(d => d.published !== false && (uiState.designFilter === 'All' || d.project === uiState.designFilter));
    document.querySelectorAll('[data-open-lightbox]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open-lightbox');
        const byId = visibleDesigns.findIndex(d => d.id === id);
        const idx = byId >= 0 ? byId : Number(btn.getAttribute('data-design-index'));
        openLightboxModal(visibleDesigns, Math.max(0, idx));
      });
    });

    const visibleVideos = (data.videos || []).filter(v => v.published === true && (uiState.videoFilter === 'All' || v.project === uiState.videoFilter));
    document.querySelectorAll('[data-open-video-poster]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open-video-poster');
        const posterItems = visibleVideos.filter(v => v.thumbnail).map(v => ({
          id: v.id,
          title: v.title,
          project: v.project,
          category: v.role || 'Video Reel Production',
          role: v.videoUrl ? 'Verified Video + Poster' : 'Production Reel Poster Preview',
          image: v.thumbnail,
          description: `${v.description || ''}${v.videoUrl ? ' (External video link available)' : ' — Production storyboard / cover frame preserved from client archive.'}`
        }));
        const idx = Math.max(0, posterItems.findIndex(item => item.id === id));
        if (posterItems.length) openLightboxModal(posterItems, idx);
      });
    });

    document.querySelectorAll('[data-select-deck]').forEach(btn => {
      btn.addEventListener('click', () => {
        uiState.activeDeckId = btn.getAttribute('data-select-deck');
        uiState.activeSlideIndex = 0;
        rerender();
      });
    });
    const decks = window.PublicRenderer.getActiveDecks(data);
    const activeDeck = decks.find(d => d.id === uiState.activeDeckId);
    const slides = activeDeck ? activeDeck.visibleSlides : [];

    document.querySelectorAll('[data-select-slide]').forEach(btn => {
      btn.addEventListener('click', () => {
        uiState.activeSlideIndex = Number(btn.getAttribute('data-select-slide'));
        rerender();
      });
    });
    document.querySelector('[data-slide-prev]')?.addEventListener('click', () => {
      if (!slides.length) return;
      uiState.activeSlideIndex = (uiState.activeSlideIndex - 1 + slides.length) % slides.length;
      rerender();
    });
    document.querySelector('[data-slide-next]')?.addEventListener('click', () => {
      if (!slides.length) return;
      uiState.activeSlideIndex = (uiState.activeSlideIndex + 1) % slides.length;
      rerender();
    });
    document.querySelector('[data-zoom-slide]')?.addEventListener('click', () => {
      if (!slides.length) return;
      openLightboxModal(
        slides.map(sl => ({
          title: sl.title,
          project: activeDeck.project,
          category: activeDeck.title,
          role: 'Presentation Deck',
          image: sl.image,
          description: `Slide ${sl.num}`
        })),
        uiState.activeSlideIndex
      );
    });

    document.getElementById('btn-copy-email')?.addEventListener('click', (e) => {
      const em = e.currentTarget.getAttribute('data-copy-email');
      if (em && navigator.clipboard) {
        navigator.clipboard.writeText(em).then(() => showToast(`Copied ${em}`));
      }
    });

    document.querySelectorAll('[data-open-cv-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        openCvModal(btn.getAttribute('data-open-cv-modal'), btn.getAttribute('data-cv-filename'));
      });
    });

    document.querySelectorAll('[data-open-custom-media]').forEach(btn => {
      btn.addEventListener('click', () => {
        openLightboxModal([{
          title: btn.getAttribute('data-title') || 'Media Preview',
          project: btn.getAttribute('data-project') || 'Portfolio',
          category: 'Media',
          role: '',
          image: btn.getAttribute('data-open-custom-media'),
          description: btn.getAttribute('data-caption') || ''
        }], 0);
      });
    });
  }

  return {
    showToast,
    openLightboxModal,
    openScriptModal,
    bindDynamicUI
  };
})();
