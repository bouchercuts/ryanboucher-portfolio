// Vimeo Browser Widget for Decap CMS 3.x
// Uses Decap's internal React via window.CMS internals

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
      s.id = 'vb-css';
      s.textContent = css;
      document.head.appendChild(s);
    }
  }

  function fmt(sec) {
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }

  async function apiFetch(query, page) {
    var qs = new URLSearchParams({ page: page || 1 });
    if (query) qs.set('query', query);
    var r = await fetch('/.netlify/functions/vimeo?' + qs);
    return r.json();
  }

  // ── STATE per instance ────────────────────────────────────────────────────
  function createState() {
    return {
      open: false, query: '', videos: [],
      loading: false, page: 1, pages: 1, total: 0,
      selId: null, selTitle: null, selThumb: null,
      timer: null, value: '', onChange: null, root: null
    };
  }

  // ── RENDER (pure DOM) ─────────────────────────────────────────────────────
  function render(s) {
    var root = s.root;
    root.innerHTML = '';
    injectCSS();

    var wrap = document.createElement('div');
    wrap.className = 'vb-widget';

    // Trigger button or selected display
    if (s.value) {
      var sel = document.createElement('div');
      sel.className = 'vb-selected';

      if (s.selThumb) {
        var img = document.createElement('img');
        img.src = s.selThumb;
        sel.appendChild(img);
      }

      var info = document.createElement('div');
      info.className = 'vb-selected-info';
      var t = document.createElement('div');
      t.className = 'vb-selected-title';
      t.textContent = s.selTitle || 'Video selected';
      var u = document.createElement('div');
      u.className = 'vb-selected-url';
      u.textContent = s.value;
      info.appendChild(t);
      info.appendChild(u);
      sel.appendChild(info);

      var acts = document.createElement('div');
      acts.className = 'vb-actions';

      var chg = document.createElement('button');
      chg.className = 'vb-btn';
      chg.textContent = 'Change';
      chg.onclick = function(e) { e.preventDefault(); openBrowser(s); };

      var rem = document.createElement('button');
      rem.className = 'vb-btn vb-btn-danger';
      rem.textContent = 'Remove';
      rem.onclick = function(e) { e.preventDefault(); s.value=''; s.selId=null; s.selTitle=null; s.selThumb=null; s.onChange(''); render(s); };

      acts.appendChild(chg);
      acts.appendChild(rem);
      sel.appendChild(acts);
      wrap.appendChild(sel);
    } else {
      var btn = document.createElement('button');
      btn.className = 'vb-browse-btn';
      btn.textContent = '▶  Browse Vimeo library';
      btn.onclick = function(e) { e.preventDefault(); openBrowser(s); };
      wrap.appendChild(btn);
    }

    // Modal overlay
    if (s.open) {
      var overlay = document.createElement('div');
      overlay.className = 'vb-overlay';
      overlay.onclick = function(e) { if (e.target === overlay) { s.open = false; render(s); } };

      var modal = document.createElement('div');
      modal.className = 'vb-modal';

      // Header / search
      var hdr = document.createElement('div');
      hdr.className = 'vb-modal-header';

      var inp = document.createElement('input');
      inp.type = 'text';
      inp.placeholder = 'Search your Vimeo library…';
      inp.value = s.query;
      inp.oninput = function(e) {
        s.query = e.target.value;
        clearTimeout(s.timer);
        s.timer = setTimeout(function() { loadVideos(s, s.query, 1); }, 400);
      };

      var cancel = document.createElement('button');
      cancel.className = 'vb-btn';
      cancel.textContent = 'Cancel';
      cancel.onclick = function(e) { e.preventDefault(); s.open = false; render(s); };

      hdr.appendChild(inp);
      hdr.appendChild(cancel);
      modal.appendChild(hdr);

      // Grid
      var grid = document.createElement('div');
      grid.className = 'vb-grid';

      if (s.loading) {
        var msg = document.createElement('div');
        msg.className = 'vb-msg';
        msg.textContent = 'Loading…';
        grid.appendChild(msg);
      } else if (!s.videos.length) {
        var msg2 = document.createElement('div');
        msg2.className = 'vb-msg';
        msg2.textContent = 'No videos found';
        grid.appendChild(msg2);
      } else {
        s.videos.forEach(function(v) {
          var card = document.createElement('div');
          card.className = 'vb-card' + (s.selId === v.id ? ' active' : '');
          card.onclick = function() { pickVideo(s, v); };

          var thumb = document.createElement('div');
          thumb.className = 'vb-thumb';
          if (v.thumbnail) {
            var ti = document.createElement('img');
            ti.src = v.thumbnail;
            ti.alt = v.title;
            thumb.appendChild(ti);
          }
          var dur = document.createElement('span');
          dur.className = 'vb-dur';
          dur.textContent = v.duration;
          thumb.appendChild(dur);

          var ctitle = document.createElement('div');
          ctitle.className = 'vb-card-title';
          ctitle.textContent = v.title;

          card.appendChild(thumb);
          card.appendChild(ctitle);
          grid.appendChild(card);
        });
      }
      modal.appendChild(grid);

      // Footer
      var footer = document.createElement('div');
      footer.className = 'vb-footer';
      var count = document.createElement('span');
      count.textContent = s.total + ' video' + (s.total !== 1 ? 's' : '');
      footer.appendChild(count);

      if (s.pages > 1) {
        var pag = document.createElement('div');
        pag.className = 'vb-pag';

        var prev = document.createElement('button');
        prev.className = 'vb-btn';
        prev.textContent = '←';
        prev.disabled = s.page <= 1;
        prev.onclick = function(e) { e.preventDefault(); loadVideos(s, s.query, s.page - 1); };

        var pi = document.createElement('span');
        pi.textContent = s.page + ' / ' + s.pages;

        var next = document.createElement('button');
        next.className = 'vb-btn';
        next.textContent = '→';
        next.disabled = s.page >= s.pages;
        next.onclick = function(e) { e.preventDefault(); loadVideos(s, s.query, s.page + 1); };

        pag.appendChild(prev);
        pag.appendChild(pi);
        pag.appendChild(next);
        footer.appendChild(pag);
      }

      modal.appendChild(footer);
      overlay.appendChild(modal);
      wrap.appendChild(overlay);

      // Focus input after paint
      setTimeout(function() { inp.focus(); }, 50);
    }

    root.appendChild(wrap);
  }

  function openBrowser(s) {
    s.open = true;
    render(s);
    loadVideos(s, s.query, 1);
  }

  async function loadVideos(s, query, page) {
    s.loading = true;
    render(s);
    try {
      var d = await apiFetch(query, page);
      s.videos = d.videos || [];
      s.total  = d.total  || 0;
      s.pages  = d.pages  || 1;
      s.page   = d.page   || 1;
    } catch(e) {
      s.videos = [];
    }
    s.loading = false;
    render(s);
  }

  function pickVideo(s, v) {
    s.value    = v.embedUrl;
    s.selId    = v.id;
    s.selTitle = v.title;
    s.selThumb = v.thumbnail;
    s.open     = false;
    s.onChange(v.embedUrl);
    render(s);
  }

  // ── REGISTER WITH DECAP ───────────────────────────────────────────────────
  // Use the EditorComponent API which doesn't require React class components
  window.CMS.registerEditorComponent({
    id:    'vimeo-browser',
    label: 'Vimeo Video',
    fields: [
      { name: 'url', label: 'Video URL', widget: 'string' }
    ],
    pattern: /^(https:\/\/player\.vimeo\.com\/video\/\d+.*)$/,
    fromBlock: function(match) { return { url: match ? match[0] : '' }; },
    toBlock:   function(data)  { return data.url || ''; },
    toPreview: function(data)  {
      if (!data.url) return '<p>No video selected</p>';
      return '<iframe src="'+data.url+'" style="width:100%;aspect-ratio:16/9;border:none;" allow="autoplay;fullscreen"></iframe>';
    }
  });

  // Also register as a proper widget using the mount/unmount API
  window.CMS.registerWidget(
    'vimeo-browser',
    {
      control: {
        isEditorComponent: false,
        getDefaultValue: function() { return ''; },
        // Mount-based API for Decap 3.x
        mount: function(el, props) {
          var s = createState();
          s.root     = el;
          s.value    = props.value || '';
          s.onChange = props.onChange;
          el._vimeoState = s;
          render(s);
        },
        update: function(el, props) {
          var s = el._vimeoState;
          if (s) { s.value = props.value || ''; render(s); }
        }
      }
    }
  );

})();
