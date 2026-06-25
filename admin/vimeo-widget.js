// Vimeo Browser — Custom Decap CMS Widget (vanilla JS, no React dependency)

(function () {

  const css = `
    .vimeo-widget { font-family: sans-serif; }
    .vimeo-selected {
      display: flex; align-items: center; gap: 12px;
      padding: 10px; background: #f5f5f5;
      border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px;
    }
    .vimeo-selected img { width: 120px; height: 68px; object-fit: cover; border-radius: 2px; flex-shrink: 0; }
    .vimeo-selected-info { flex: 1; min-width: 0; }
    .vimeo-selected-title { font-size: 13px; font-weight: 600; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .vimeo-selected-url   { font-size: 11px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
    .vimeo-selected-actions { display: flex; gap: 6px; flex-shrink: 0; }
    .vimeo-btn { padding: 6px 12px; border-radius: 3px; border: none; font-size: 12px; cursor: pointer; font-weight: 500; }
    .vimeo-btn-primary   { background: #1ab7ea; color: #fff; }
    .vimeo-btn-primary:hover { background: #0fa0d0; }
    .vimeo-btn-secondary { background: #eee; color: #555; }
    .vimeo-btn-secondary:hover { background: #ddd; }
    .vimeo-btn-danger    { background: #fff; color: #e53; border: 1px solid #e53; }
    .vimeo-btn-danger:hover { background: #fff0ee; }
    .vimeo-browser { border: 1px solid #ddd; border-radius: 4px; overflow: hidden; margin-top: 4px; }
    .vimeo-search-bar { display: flex; gap: 8px; padding: 10px; background: #f9f9f9; border-bottom: 1px solid #eee; }
    .vimeo-search-bar input { flex: 1; padding: 7px 10px; border: 1px solid #ddd; border-radius: 3px; font-size: 13px; outline: none; }
    .vimeo-search-bar input:focus { border-color: #1ab7ea; }
    .vimeo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #eee; max-height: 420px; overflow-y: auto; }
    .vimeo-card { background: #fff; cursor: pointer; }
    .vimeo-card:hover { background: #f0f8ff; }
    .vimeo-card.selected { background: #e6f6ff; outline: 2px solid #1ab7ea; outline-offset: -2px; }
    .vimeo-thumb { position: relative; aspect-ratio: 16/9; background: #111; overflow: hidden; }
    .vimeo-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .vimeo-duration { position: absolute; bottom: 4px; right: 6px; background: rgba(0,0,0,0.7); color: #fff; font-size: 10px; padding: 1px 4px; border-radius: 2px; }
    .vimeo-card-info { padding: 6px 8px 8px; }
    .vimeo-card-title { font-size: 11px; font-weight: 600; color: #333; line-height: 1.3; }
    .vimeo-footer { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: #f9f9f9; border-top: 1px solid #eee; font-size: 12px; color: #888; }
    .vimeo-pagination { display: flex; gap: 4px; align-items: center; }
    .vimeo-empty, .vimeo-loading { grid-column: 1 / -1; padding: 40px; text-align: center; color: #aaa; font-size: 13px; }
  `;

  function injectStyles() {
    if (!document.getElementById('vimeo-widget-css')) {
      const el = document.createElement('style');
      el.id = 'vimeo-widget-css';
      el.textContent = css;
      document.head.appendChild(el);
    }
  }

  function formatDuration(s) {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }

  async function fetchVideos(query, page) {
    const qs = new URLSearchParams({ page: page || 1 });
    if (query) qs.set('query', query);
    const res  = await fetch(`/.netlify/functions/vimeo?${qs}`);
    return await res.json();
  }

  // ── WIDGET CONTROL ────────────────────────────────────────────────────────
  var VimeoControl = {
    // State
    _value: '',
    _onChange: null,
    _root: null,
    _open: false,
    _videos: [],
    _loading: false,
    _page: 1,
    _pages: 1,
    _total: 0,
    _query: '',
    _searchTimer: null,
    _selectedId: null,
    _selectedTitle: null,
    _selectedThumb: null,

    mount(el, { value, onChange }) {
      injectStyles();
      this._root     = el;
      this._value    = value || '';
      this._onChange = onChange;
      this.render();
    },

    update({ value }) {
      this._value = value || '';
      this.render();
    },

    openBrowser() {
      this._open = true;
      this.render();
      this.load(this._query, 1);
    },

    closeBrowser() {
      this._open = false;
      this.render();
    },

    async load(query, page) {
      this._loading = true;
      this.render();
      try {
        const data = await fetchVideos(query, page);
        this._videos = data.videos || [];
        this._total  = data.total  || 0;
        this._pages  = data.pages  || 1;
        this._page   = data.page   || 1;
      } catch (e) {
        this._videos = [];
      }
      this._loading = false;
      this.render();
    },

    selectVideo(video) {
      this._value        = video.embedUrl;
      this._selectedId   = video.id;
      this._selectedTitle = video.title;
      this._selectedThumb = video.thumbnail;
      this._open = false;
      this._onChange(video.embedUrl);
      this.render();
    },

    clearVideo() {
      this._value = '';
      this._selectedId = null;
      this._selectedTitle = null;
      this._selectedThumb = null;
      this._onChange('');
      this.render();
    },

    render() {
      const el = this._root;
      el.innerHTML = '';

      const wrap = document.createElement('div');
      wrap.className = 'vimeo-widget';

      // ── SELECTED STATE ──
      if (this._value) {
        const sel = document.createElement('div');
        sel.className = 'vimeo-selected';

        if (this._selectedThumb) {
          const img = document.createElement('img');
          img.src = this._selectedThumb;
          sel.appendChild(img);
        }

        const info = document.createElement('div');
        info.className = 'vimeo-selected-info';
        info.innerHTML = `
          <div class="vimeo-selected-title">${this._selectedTitle || 'Video selected'}</div>
          <div class="vimeo-selected-url">${this._value}</div>
        `;
        sel.appendChild(info);

        const actions = document.createElement('div');
        actions.className = 'vimeo-selected-actions';

        const changeBtn = document.createElement('button');
        changeBtn.className = 'vimeo-btn vimeo-btn-secondary';
        changeBtn.textContent = 'Change';
        changeBtn.onclick = () => this.openBrowser();
        actions.appendChild(changeBtn);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'vimeo-btn vimeo-btn-danger';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => this.clearVideo();
        actions.appendChild(removeBtn);

        sel.appendChild(actions);
        wrap.appendChild(sel);

      } else {
        const browseBtn = document.createElement('button');
        browseBtn.className = 'vimeo-btn vimeo-btn-primary';
        browseBtn.textContent = '▶  Browse Vimeo library';
        browseBtn.onclick = () => this.openBrowser();
        wrap.appendChild(browseBtn);
      }

      // ── BROWSER PANEL ──
      if (this._open) {
        const browser = document.createElement('div');
        browser.className = 'vimeo-browser';

        // Search bar
        const searchBar = document.createElement('div');
        searchBar.className = 'vimeo-search-bar';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search your Vimeo library…';
        input.value = this._query;
        input.oninput = (e) => {
          this._query = e.target.value;
          clearTimeout(this._searchTimer);
          this._searchTimer = setTimeout(() => this.load(this._query, 1), 400);
        };
        searchBar.appendChild(input);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'vimeo-btn vimeo-btn-secondary';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => this.closeBrowser();
        searchBar.appendChild(cancelBtn);
        browser.appendChild(searchBar);

        // Grid
        const grid = document.createElement('div');
        grid.className = 'vimeo-grid';

        if (this._loading) {
          const loading = document.createElement('div');
          loading.className = 'vimeo-loading';
          loading.textContent = 'Loading…';
          grid.appendChild(loading);
        } else if (!this._videos.length) {
          const empty = document.createElement('div');
          empty.className = 'vimeo-empty';
          empty.textContent = 'No videos found';
          grid.appendChild(empty);
        } else {
          this._videos.forEach(v => {
            const card = document.createElement('div');
            card.className = 'vimeo-card' + (this._selectedId === v.id ? ' selected' : '');
            card.onclick = () => this.selectVideo(v);

            const thumb = document.createElement('div');
            thumb.className = 'vimeo-thumb';
            if (v.thumbnail) {
              const img = document.createElement('img');
              img.src = v.thumbnail;
              img.alt = v.title;
              thumb.appendChild(img);
            }
            const dur = document.createElement('span');
            dur.className = 'vimeo-duration';
            dur.textContent = v.duration;
            thumb.appendChild(dur);

            const info = document.createElement('div');
            info.className = 'vimeo-card-info';
            const title = document.createElement('div');
            title.className = 'vimeo-card-title';
            title.textContent = v.title;
            info.appendChild(title);

            card.appendChild(thumb);
            card.appendChild(info);
            grid.appendChild(card);
          });
        }
        browser.appendChild(grid);

        // Footer / pagination
        const footer = document.createElement('div');
        footer.className = 'vimeo-footer';
        const count = document.createElement('span');
        count.textContent = `${this._total} video${this._total !== 1 ? 's' : ''}`;
        footer.appendChild(count);

        if (this._pages > 1) {
          const pag = document.createElement('div');
          pag.className = 'vimeo-pagination';

          const prev = document.createElement('button');
          prev.className = 'vimeo-btn vimeo-btn-secondary';
          prev.textContent = '←';
          prev.disabled = this._page <= 1;
          prev.onclick = () => this.load(this._query, this._page - 1);
          pag.appendChild(prev);

          const pageInfo = document.createElement('span');
          pageInfo.textContent = `${this._page} / ${this._pages}`;
          pag.appendChild(pageInfo);

          const next = document.createElement('button');
          next.className = 'vimeo-btn vimeo-btn-secondary';
          next.textContent = '→';
          next.disabled = this._page >= this._pages;
          next.onclick = () => this.load(this._query, this._page + 1);
          pag.appendChild(next);

          footer.appendChild(pag);
        }
        browser.appendChild(footer);
        wrap.appendChild(browser);

        // Focus search input after render
        setTimeout(() => input.focus(), 50);
      }

      el.appendChild(wrap);
    }
  };

  // ── REGISTER ──────────────────────────────────────────────────────────────
  window.CMS.registerWidget(
    'vimeo-browser',
    // Control: factory function returning the widget interface
    function(opts) {
      var instance = Object.create(VimeoControl);
      return {
        mount(el)   { instance.mount(el, opts); },
        update(opt) { instance.update(opt); }
      };
    },
    // Preview
    function(opts) {
      var el = document.createElement('div');
      el.style.cssText = 'aspect-ratio:16/9;background:#000;';
      if (opts.value) {
        var iframe = document.createElement('iframe');
        iframe.src = opts.value;
        iframe.style.cssText = 'width:100%;height:100%;border:none;';
        iframe.allow = 'autoplay; fullscreen';
        el.appendChild(iframe);
      }
      return el;
    }
  );

})();
