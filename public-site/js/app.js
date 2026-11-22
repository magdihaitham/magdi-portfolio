/* =========================================================
   PUBLIC PORTFOLIO BOOTSTRAPPER (PURE STATIC PUBLIC ONLY)
   ========================================================= */

(function () {
  const { THEME_KEY, loadPublicData } = window.PortfolioState;
  const app = {
    data: loadPublicData(),

    applyTheme(forceFromData = false) {
      const savedMode = !forceFromData ? localStorage.getItem(THEME_KEY) : null;
      const mode = savedMode || this.data.theme?.mode || 'dark';
      document.documentElement.setAttribute('data-theme', mode);

      const scale = Number(this.data.theme?.fontScale || 1);
      document.documentElement.style.setProperty('--font-scale', String(scale));

      const accent = mode === 'light'
        ? (this.data.theme?.accentColorLight || '#9A721E')
        : (this.data.theme?.accentColorDark || '#C99E3F');
      document.documentElement.style.setProperty('--accent', accent);

      if (window.BuilderStyleEngine) {
        window.BuilderStyleEngine.applyStyles(this.data);
      }
      if (window.PortfolioMotion) {
        window.PortfolioMotion.applyConfig(this.data);
      }

      const btn = document.getElementById('theme-toggle-btn');
      if (btn) {
        btn.textContent = mode === 'light' ? 'Dark Mode' : 'Light Mode';
        btn.setAttribute('aria-pressed', mode === 'light' ? 'true' : 'false');
      }
    },

    renderPublic() {
      if (this.data.meta?.seo?.title) document.title = this.data.meta.seo.title;
      const descMeta = document.querySelector('meta[name="description"]');
      if (descMeta && this.data.meta?.seo?.description) {
        descMeta.setAttribute('content', this.data.meta.seo.description);
      }
      window.PublicRenderer.renderAll(this.data);
    }
  };

  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
    const curr = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = curr === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    if (app.data.theme) app.data.theme.mode = next;
    app.applyTheme(true);
  });

  const menuBtn = document.getElementById('mobile-menu-toggle');
  const navLinks = document.getElementById('public-nav-links');
  menuBtn?.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  navLinks?.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('open');
      menuBtn?.setAttribute('aria-expanded', 'false');
    }
  });

  app.applyTheme();
  app.renderPublic();
})();
