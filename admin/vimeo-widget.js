// Vimeo Browser Widget — Decap CMS 3.x
// Retrieves React from Decap's own bundle via window.DecapCmsApp

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

    // Decap 3.x bundles React — retrieve it from the CMS object
    var React = window.CMS && window.CMS.getReactComponents
      ? window.CMS.getReactComponents().React
      : null;

    // Fallback: scan globals for React (it's exported under various names)
    if (!React) {
      for (var key in window) {
        try {
          var obj = window[key];
          if (obj && obj.createElement && obj.Component && obj.useState) {
            React = obj; break;
          }
        } catch(e) {}
      }
    }

    if (!React) {
      console.error('[vimeo-widget] React not found. Widget not registered.');
      return;
    }

    // ── COMPONENT ──────────────────────────────────────────────────────────
    class VimeoWidget extends React.Component {
      constructor(props) {
        super(props);
        this.state = {
          open: false, query: '', videos: [],
          loading: false, page: 1, pages: 1, total: 0,
          selId: null, selTitle: null, selThumb: null, timer: null
        };
      }

      async load(query, page) {
        this.setState({ loading: true });
        try {
          var d = await apiFetch(query, page);
          this.setState({
            videos: d.videos || [], total: d.total || 0,
            pages: d.pages || 1, page: d.page || 1, loading: false
          });
        } catch(e) { this.setState({ loading: false, videos: [] }); }
      }

      open() { this.setState({ open: true }); this.load(this.state.query, 1); }
      close() { this.setState({ open: false }); }

      search(q) {
        this.setState({ query: q });
        clearTimeout(this.state.timer);
        var t = setTimeout(() => this.load(q, 1), 400);
        this.setState({ timer: t });
      }

      pick(v) {
        this.setState({ open: false, selId: v.id, selTitle: v.title, selThumb: v.thumbnail });
        this.props.onChange(v.embedUrl);
      }

      clear() {
        this.setState({ selId: null, selTitle: null, selThumb: null });
        this.props.onChange('');
      }

      render() {
        var e = React.createElement;
        var val = this.props.value;
        var { open, query, videos, loading, page, pages, total, selTitle, selThumb } = this.state;

        return e('div', { className: 'vb-widget' },

          val
            ? e('div', { className: 'vb-selected' },
                selThumb ? e('img', { src: selThumb, alt: '' }) : null,
                e('div', { className: 'vb-selected-info' },
                  e('div', { className: 'vb-selected-title' }, selTitle || 'Video selected'),
                  e('div', { className: 'vb-selected-url' }, val)
                ),
                e('div', { className: 'vb-actions' },
                  e('button', { className: 'vb-btn', onClick: () => this.open() }, 'Change'),
                  e('button', { className: 'vb-btn vb-btn-danger', onClick: () => this.clear() }, 'Remove')
                )
              )
            : e('button', { className: 'vb-browse-btn', onClick: () => this.open() }, '▶  Browse Vimeo library'),

          open ? e('div', { className: 'vb-overlay', onClick: ev => { if (ev.target === ev.currentTarget) this.close(); } },
            e('div', { className: 'vb-modal' },
              e('div', { className: 'vb-modal-header' },
                e('input', {
                  type: 'text', placeholder: 'Search your Vimeo library…',
                  value: query, autoFocus: true,
                  onChange: ev => this.search(ev.target.value)
                }),
                e('button', { className: 'vb-btn', onClick: () => this.close() }, 'Cancel')
              ),
              e('div', { className: 'vb-grid' },
                loading
                  ? e('div', { className: 'vb-msg' }, 'Loading…')
                  : !videos.length
                    ? e('div', { className: 'vb-msg' }, 'No videos found')
                    : videos.map(v =>
                        e('div', {
                          key: v.id,
                          className: 'vb-card' + (this.state.selId === v.id ? ' active' : ''),
                          onClick: () => this.pick(v)
                        },
                          e('div', { className: 'vb-thumb' },
                            v.thumbnail ? e('img', { src: v.thumbnail, alt: v.title }) : null,
                            e('span', { className: 'vb-dur' }, v.duration)
                          ),
                          e('div', { className: 'vb-card-title' }, v.title)
                        )
                      )
              ),
              e('div', { className: 'vb-footer' },
                e('span', null, total + ' video' + (total !== 1 ? 's' : '')),
                pages > 1 ? e('div', { className: 'vb-pag' },
                  e('button', { className: 'vb-btn', disabled: page <= 1, onClick: () => this.load(query, page - 1) }, '←'),
                  e('span', null, page + ' / ' + pages),
                  e('button', { className: 'vb-btn', disabled: page >= pages, onClick: () => this.load(query, page + 1) }, '→')
                ) : null
              )
            )
          ) : null
        );
      }
    }

    window.CMS.registerWidget('vimeo-browser', VimeoWidget);
    console.log('[vimeo-widget] Registered successfully');
  }

  register();

})();
