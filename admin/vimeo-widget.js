// Vimeo Browser — Custom Decap CMS Widget
// Registered in admin/index.html as a custom widget for the "video" field

(function() {
  const h = window.h; // Preact's createElement, provided by Decap

  // ── STYLES ──────────────────────────────────────────────────────────────
  const css = `
    .vimeo-widget { font-family: sans-serif; }

    .vimeo-selected {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .vimeo-selected img {
      width: 120px;
      height: 68px;
      object-fit: cover;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .vimeo-selected-info { flex: 1; min-width: 0; }
    .vimeo-selected-title {
      font-size: 13px;
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .vimeo-selected-url {
      font-size: 11px;
      color: #888;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }
    .vimeo-selected-actions { display: flex; gap: 6px; flex-shrink: 0; }

    .vimeo-btn {
      padding: 6px 12px;
      border-radius: 3px;
      border: none;
      font-size: 12px;
      cursor: pointer;
      font-weight: 500;
    }
    .vimeo-btn-primary { background: #1ab7ea; color: #fff; }
    .vimeo-btn-primary:hover { background: #0fa0d0; }
    .vimeo-btn-secondary { background: #eee; color: #555; }
    .vimeo-btn-secondary:hover { background: #ddd; }
    .vimeo-btn-danger { background: #fff; color: #e53; border: 1px solid #e53; }
    .vimeo-btn-danger:hover { background: #fff0ee; }

    .vimeo-browser {
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 4px;
    }

    .vimeo-search-bar {
      display: flex;
      gap: 8px;
      padding: 10px;
      background: #f9f9f9;
      border-bottom: 1px solid #eee;
    }
    .vimeo-search-bar input {
      flex: 1;
      padding: 7px 10px;
      border: 1px solid #ddd;
      border-radius: 3px;
      font-size: 13px;
      outline: none;
    }
    .vimeo-search-bar input:focus { border-color: #1ab7ea; }

    .vimeo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      background: #eee;
      max-height: 420px;
      overflow-y: auto;
    }

    .vimeo-card {
      background: #fff;
      cursor: pointer;
      transition: background 0.15s;
    }
    .vimeo-card:hover { background: #f0f8ff; }
    .vimeo-card.selected { background: #e6f6ff; outline: 2px solid #1ab7ea; outline-offset: -2px; }

    .vimeo-thumb {
      position: relative;
      aspect-ratio: 16/9;
      background: #111;
      overflow: hidden;
    }
    .vimeo-thumb img {
      width: 100%; height: 100%;
      object-fit: cover;
      display: block;
    }
    .vimeo-duration {
      position: absolute;
      bottom: 4px; right: 6px;
      background: rgba(0,0,0,0.7);
      color: #fff;
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 2px;
    }

    .vimeo-card-info { padding: 6px 8px 8px; }
    .vimeo-card-title {
      font-size: 11px;
      font-weight: 600;
      color: #333;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .vimeo-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      background: #f9f9f9;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #888;
    }
    .vimeo-pagination { display: flex; gap: 4px; }

    .vimeo-empty {
      grid-column: 1 / -1;
      padding: 40px;
      text-align: center;
      color: #aaa;
      font-size: 13px;
    }
    .vimeo-loading {
      grid-column: 1 / -1;
      padding: 40px;
      text-align: center;
      color: #aaa;
      font-size: 13px;
    }
  `;

  // ── WIDGET CONTROL (editor UI) ───────────────────────────────────────────
  class VimeoControl extends window.React.Component {
    constructor(props) {
      super(props);
      this.state = {
        open:      false,
        query:     '',
        videos:    [],
        loading:   false,
        page:      1,
        pages:     1,
        total:     0,
        selectedId: null,
        selectedTitle: null,
        selectedThumb: null,
        searchTimeout: null
      };
    }

    componentDidMount() {
      // Inject styles once
      if (!document.getElementById('vimeo-widget-css')) {
        const el = document.createElement('style');
        el.id = 'vimeo-widget-css';
        el.textContent = css;
        document.head.appendChild(el);
      }
    }

    async fetchVideos(query, page) {
      this.setState({ loading: true });
      try {
        const qs = new URLSearchParams({ page });
        if (query) qs.set('query', query);
        const res  = await fetch(`/.netlify/functions/vimeo?${qs}`);
        const data = await res.json();
        this.setState({
          videos:  data.videos || [],
          total:   data.total  || 0,
          pages:   data.pages  || 1,
          page:    data.page   || 1,
          loading: false
        });
      } catch {
        this.setState({ loading: false });
      }
    }

    openBrowser() {
      this.setState({ open: true });
      this.fetchVideos(this.state.query, 1);
    }

    closeBrowser() {
      this.setState({ open: false });
    }

    onSearch(e) {
      const query = e.target.value;
      this.setState({ query, page: 1 });
      clearTimeout(this.state.searchTimeout);
      const t = setTimeout(() => this.fetchVideos(query, 1), 400);
      this.setState({ searchTimeout: t });
    }

    selectVideo(video) {
      this.props.onChange(video.embedUrl);
      this.setState({
        selectedId:    video.id,
        selectedTitle: video.title,
        selectedThumb: video.thumbnail,
        open:          false
      });
      // Also populate thumbnail field if present
      if (this.props.mediaPaths) {
        // future: auto-populate thumbnail
      }
    }

    clearVideo() {
      this.props.onChange('');
      this.setState({ selectedId: null, selectedTitle: null, selectedThumb: null });
    }

    render() {
      const { value } = this.props;
      const { open, query, videos, loading, page, pages, total,
              selectedTitle, selectedThumb } = this.state;

      const displayTitle = selectedTitle || (value ? 'Selected video' : null);
      const displayThumb = selectedThumb || null;

      return window.React.createElement('div', { className: 'vimeo-widget' },

        // ── CURRENT VALUE ──
        value
          ? window.React.createElement('div', { className: 'vimeo-selected' },
              displayThumb && window.React.createElement('img', { src: displayThumb, alt: '' }),
              window.React.createElement('div', { className: 'vimeo-selected-info' },
                window.React.createElement('div', { className: 'vimeo-selected-title' }, displayTitle || 'Video selected'),
                window.React.createElement('div', { className: 'vimeo-selected-url' }, value)
              ),
              window.React.createElement('div', { className: 'vimeo-selected-actions' },
                window.React.createElement('button', {
                  className: 'vimeo-btn vimeo-btn-secondary',
                  onClick: () => this.openBrowser()
                }, 'Change'),
                window.React.createElement('button', {
                  className: 'vimeo-btn vimeo-btn-danger',
                  onClick: () => this.clearVideo()
                }, 'Remove')
              )
            )
          : window.React.createElement('button', {
              className: 'vimeo-btn vimeo-btn-primary',
              onClick: () => this.openBrowser()
            }, '▶  Browse Vimeo library'),

        // ── BROWSER PANEL ──
        open && window.React.createElement('div', { className: 'vimeo-browser' },

          // Search bar
          window.React.createElement('div', { className: 'vimeo-search-bar' },
            window.React.createElement('input', {
              type: 'text',
              placeholder: 'Search your Vimeo library…',
              value: query,
              onInput: (e) => this.onSearch(e),
              autoFocus: true
            }),
            window.React.createElement('button', {
              className: 'vimeo-btn vimeo-btn-secondary',
              onClick: () => this.closeBrowser()
            }, 'Cancel')
          ),

          // Grid
          window.React.createElement('div', { className: 'vimeo-grid' },
            loading
              ? window.React.createElement('div', { className: 'vimeo-loading' }, 'Loading…')
              : videos.length === 0
                ? window.React.createElement('div', { className: 'vimeo-empty' }, 'No videos found')
                : videos.map(v =>
                    window.React.createElement('div', {
                      key: v.id,
                      className: `vimeo-card${this.state.selectedId === v.id ? ' selected' : ''}`,
                      onClick: () => this.selectVideo(v)
                    },
                      window.React.createElement('div', { className: 'vimeo-thumb' },
                        v.thumbnail && window.React.createElement('img', { src: v.thumbnail, alt: v.title }),
                        window.React.createElement('span', { className: 'vimeo-duration' }, v.duration)
                      ),
                      window.React.createElement('div', { className: 'vimeo-card-info' },
                        window.React.createElement('div', { className: 'vimeo-card-title' }, v.title)
                      )
                    )
                  )
          ),

          // Pagination footer
          window.React.createElement('div', { className: 'vimeo-footer' },
            window.React.createElement('span', null, `${total} video${total !== 1 ? 's' : ''}`),
            pages > 1 && window.React.createElement('div', { className: 'vimeo-pagination' },
              window.React.createElement('button', {
                className: 'vimeo-btn vimeo-btn-secondary',
                disabled: page <= 1,
                onClick: () => this.fetchVideos(query, page - 1)
              }, '←'),
              window.React.createElement('span', null, `${page} / ${pages}`),
              window.React.createElement('button', {
                className: 'vimeo-btn vimeo-btn-secondary',
                disabled: page >= pages,
                onClick: () => this.fetchVideos(query, page + 1)
              }, '→')
            )
          )
        )
      );
    }
  }

  // ── WIDGET PREVIEW (read-only view in preview pane) ──────────────────────
  const VimeoPreview = ({ value }) =>
    value
      ? window.React.createElement('div', { style: { aspectRatio: '16/9', background: '#000' } },
          window.React.createElement('iframe', {
            src: value,
            style: { width: '100%', height: '100%', border: 'none' },
            allow: 'autoplay; fullscreen'
          })
        )
      : window.React.createElement('p', { style: { color: '#aaa' } }, 'No video selected');

  // ── REGISTER ─────────────────────────────────────────────────────────────
  window.CMS.registerWidget('vimeo-browser', VimeoControl, VimeoPreview);

})();
