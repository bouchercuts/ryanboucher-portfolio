// Vimeo Browser Widget — Decap CMS 3.x
// Uses window.h and window.createClass exposed by Decap CMS

(function () {

  var css = `
    .vb-widget{font-family:sans-serif}
    .vb-browse-btn{padding:8px 16px;background:#1ab7ea;color:#fff;border:none;border-radius:3px;font-size:12px;cursor:pointer;font-weight:500}
    .vb-browse-btn:hover{background:#0fa0d0}
    .vb-selected{display:flex;align-items:center;gap:10px;padding:10px;background:#f5f5f5;border:1px solid #ddd;border-radius:4px;margin-bottom:6px}
    .vb-selected img{width:112px;height:63px;object-fit:cover;border-radius:2px;flex-shrink:0}
    .vb-selected-info{flex:1;min-width:0}
    .vb-selected-title{font-size:13px;font-weight:600;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .vb-selected-url{font-size:11px;color:#999;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px}
    .vb-actions{display:flex;gap:6px;flex-shrink:0}
    .vb-btn{padding:5px 10px;border-radius:3px;font-size:11px;cursor:pointer;font-weight:500;border:1px solid #ccc;background:#fff;color:#555}
    .vb-btn:hover{background:#eee}
    .vb-btn-danger{color:#c33;border-color:#c33}
    .vb-btn-danger:hover{background:#fff0ee}
    .vb-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center}
    .vb-modal{background:#fff;border-radius:6px;width:760px;max-width:95vw;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3)}
    .vb-modal-header{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #eee}
    .vb-modal-header input{flex:1;padding:7px 10px;border:1px solid #ddd;border-radius:3px;font-size:13px;outline:none}
    .vb-modal-header input:focus{border-color:#1ab7ea}
    .vb-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#eee;overflow-y:auto;flex:1}
    .vb-card{background:#fff;cursor:pointer}
    .vb-card:hover{background:#f0f8ff}
    .vb-card.active{outline:2px solid #1ab7ea;outline-offset:-2px}
    .vb-thumb{position:relative;aspect-ratio:16/9;background:#111;overflow:hidden}
    .vb-thumb img{width:100%;height:100%;object-fit:cover;display:block}
    .vb-dur{position:absolute;bottom:4px;right:6px;background:rgba(0,0,0,.7);color:#fff;font-size:10px;padding:1px 4px;border-radius:2px}
    .vb-card-title{font-size:11px;font-weight:600;color:#333;padding:6px 8px 8px;line-height:1.3}
    .vb-footer{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-top:1px solid #eee;font-size:12px;color:#888;flex-shrink:0}
    .vb-pag{display:flex;align-items:center;gap:6px}
    .vb-msg{grid-column:1/-1;padding:48px;text-align:center;color:#aaa;font-size:13px}
  `;

  function injectCSS() {
    if (!document.getElementById('vb-css')) {
      var s = document.createElement('style');
      s.id = 'vb-css'; s.textContent = css;
      document.head.appendChild(s);
    }
  }

  async function apiFetch(query, page) {
    var qs = new URLSearchParams({ page: page || 1 });
    if (query) qs.set('query', query);
    var r = await fetch('/.netlify/functions/vimeo?' + qs);
    return r.json();
  }

  function register() {
    injectCSS();

    // Decap CMS 3.x exposes h (createElement) and createClass globally
    var h           = window.h;
    var createClass = window.createClass;

    if (!h || !createClass) {
      console.error('[vimeo-widget] window.h / window.createClass not found. Available globals:', Object.keys(window).filter(k => k.length < 20).join(', '));
      return;
    }

    console.log('[vimeo-widget] Found window.h and window.createClass — registering.');

    var VimeoWidget = createClass({
      getInitialState: function() {
        return {
          open: false, query: '', videos: [],
          loading: false, page: 1, pages: 1, total: 0,
          selId: null, selTitle: null, selThumb: null, timer: null
        };
      },

      load: async function(query, page) {
        this.setState({ loading: true });
        try {
          var d = await apiFetch(query, page);
          this.setState({
            videos: d.videos || [], total: d.total || 0,
            pages: d.pages || 1, page: d.page || 1, loading: false
          });
        } catch(e) { this.setState({ loading: false, videos: [] }); }
      },

      open: function()  { this.setState({ open: true });  this.load(this.state.query, 1); },
      close: function() { this.setState({ open: false }); },

      search: function(q) {
        this.setState({ query: q });
        clearTimeout(this.state.timer);
        var self = this;
        var t = setTimeout(function() { self.load(q, 1); }, 400);
        this.setState({ timer: t });
      },

      pick: function(v) {
        this.setState({ open: false, selId: v.id, selTitle: v.title, selThumb: v.thumbnail });
        this.props.onChange(v.embedUrl);
      },

      clear: function() {
        this.setState({ selId: null, selTitle: null, selThumb: null });
        this.props.onChange('');
      },

      render: function() {
        var self  = this;
        var val   = this.props.value;
        var state = this.state;

        return h('div', { className: 'vb-widget' },

          // ── TRIGGER ──
          val
            ? h('div', { className: 'vb-selected' },
                state.selThumb ? h('img', { src: state.selThumb, alt: '' }) : null,
                h('div', { className: 'vb-selected-info' },
                  h('div', { className: 'vb-selected-title' }, state.selTitle || 'Video selected'),
                  h('div', { className: 'vb-selected-url' }, val)
                ),
                h('div', { className: 'vb-actions' },
                  h('button', { className: 'vb-btn', onClick: function() { self.open(); } }, 'Change'),
                  h('button', { className: 'vb-btn vb-btn-danger', onClick: function() { self.clear(); } }, 'Remove')
                )
              )
            : h('button', { className: 'vb-browse-btn', onClick: function() { self.open(); } }, '▶  Browse Vimeo library'),

          // ── MODAL ──
          state.open ? h('div', {
            className: 'vb-overlay',
            onClick: function(ev) { if (ev.target === ev.currentTarget) self.close(); }
          },
            h('div', { className: 'vb-modal' },

              h('div', { className: 'vb-modal-header' },
                h('input', {
                  type: 'text',
                  placeholder: 'Search your Vimeo library…',
                  value: state.query,
                  autoFocus: true,
                  onChange: function(ev) { self.search(ev.target.value); }
                }),
                h('button', { className: 'vb-btn', onClick: function() { self.close(); } }, 'Cancel')
              ),

              h('div', { className: 'vb-grid' },
                state.loading
                  ? h('div', { className: 'vb-msg' }, 'Loading…')
                  : !state.videos.length
                    ? h('div', { className: 'vb-msg' }, 'No videos found')
                    : state.videos.map(function(v) {
                        return h('div', {
                          key: v.id,
                          className: 'vb-card' + (state.selId === v.id ? ' active' : ''),
                          onClick: function() { self.pick(v); }
                        },
                          h('div', { className: 'vb-thumb' },
                            v.thumbnail ? h('img', { src: v.thumbnail, alt: v.title }) : null,
                            h('span', { className: 'vb-dur' }, v.duration)
                          ),
                          h('div', { className: 'vb-card-title' }, v.title)
                        );
                      })
              ),

              h('div', { className: 'vb-footer' },
                h('span', null, state.total + ' video' + (state.total !== 1 ? 's' : '')),
                state.pages > 1 ? h('div', { className: 'vb-pag' },
                  h('button', { className: 'vb-btn', disabled: state.page <= 1, onClick: function() { self.load(state.query, state.page - 1); } }, '←'),
                  h('span', null, state.page + ' / ' + state.pages),
                  h('button', { className: 'vb-btn', disabled: state.page >= state.pages, onClick: function() { self.load(state.query, state.page + 1); } }, '→')
                ) : null
              )
            )
          ) : null
        );
      }
    });

    window.CMS.registerWidget('vimeo-browser', VimeoWidget);
    console.log('[vimeo-widget] Registered successfully.');
  }

  register();
})();
