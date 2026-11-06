/* プログラミング用語集：言語タブ・カテゴリ・検索・並び替え・コピー
 * データ: static/data/glossary.json（Python / SQL / HTML・CSS ほか）＋ 言語ごとの gl-*.json（タブを開いたときに読み込む）
 */
(function () {
  'use strict';
  var DATA_URL = 'static/data/glossary.json';
  var PAGE_SIZE = 30;

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    tabs: $('gl-tabs'), search: $('searchInput'), clear: $('gl-clear'), sort: $('sortOrder'),
    onlyCode: $('onlyCode'), meta: $('gl-count'), cats: $('gl-cats'), list: $('gl-list'), more: $('gl-more'),
  };
  if (!el.list) return;

  var state = { data: null, lang: 'python', cat: 'all', q: '', sort: 'term-asc', onlyCode: false, shown: PAGE_SIZE };
  var filtered = [];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function mark(text, q) {
    var safe = esc(text);
    if (!q) return safe;
    try {
      return safe.replace(new RegExp('(' + escRe(esc(q)) + ')', 'gi'), '<mark>$1</mark>');
    } catch (e) { return safe; }
  }

  // 言語ごとに別ファイルになっているデータ（languages[].files）を、タブを開いたときにだけ読み込む
  var loaded = {};
  function ensureLang(id) {
    var l = state.data.languages.filter(function (x) { return x.id === id; })[0];
    if (!l || !l.files || loaded[id]) return Promise.resolve();
    loaded[id] = true;
    return Promise.all(l.files.map(function (f) {
      return fetch(f).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(function (d) {
        d.entries.forEach(function (x) { state.data.entries.push(x); });
      });
    })).catch(function (err) {
      loaded[id] = false;
      el.list.innerHTML = '<p class="gl-error">この言語の用語データを読み込めませんでした（' + esc(err.message) + '）。もう一度タブを押してください。</p>';
      throw err;
    });
  }
  function showLang() {
    el.list.innerHTML = '<p class="gl-empty">読み込み中…</p>';
    ensureLang(state.lang).then(function () { apply(true); }, function () { /* 表示ずみ */ });
  }

  function readHash() {
    var p = new URLSearchParams(location.hash.slice(1));
    if (p.get('lang')) state.lang = p.get('lang');
    if (p.get('cat')) state.cat = p.get('cat');
    if (p.get('q')) state.q = p.get('q');
  }
  function writeHash() {
    var p = new URLSearchParams();
    if (state.lang !== 'python') p.set('lang', state.lang);
    if (state.cat !== 'all') p.set('cat', state.cat);
    if (state.q) p.set('q', state.q);
    var h = p.toString();
    history.replaceState(null, '', h ? '#' + h : location.pathname + location.search);
  }

  function renderTabs() {
    el.tabs.innerHTML = state.data.languages.map(function (l) {
      return '<button type="button" role="tab" class="gl-tab" data-lang="' + esc(l.id) + '" aria-selected="' + (l.id === state.lang) + '">' +
        esc(l.label) + '<span class="gl-count">' + l.count + '</span></button>';
    }).join('');
  }

  function renderCats(langEntries) {
    var counts = {};
    langEntries.forEach(function (e) { counts[e.category] = (counts[e.category] || 0) + 1; });
    var names = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b, 'ja'); });
    var html = '<button type="button" class="gl-chip" data-cat="all" aria-pressed="' + (state.cat === 'all') + '">すべて<small>' + langEntries.length + '</small></button>';
    names.forEach(function (n) {
      html += '<button type="button" class="gl-chip" data-cat="' + esc(n) + '" aria-pressed="' + (state.cat === n) + '">' + esc(n) + '<small>' + counts[n] + '</small></button>';
    });
    el.cats.innerHTML = html;
  }

  function matches(e, q) {
    if (e.term.toLowerCase().indexOf(q) >= 0 || e.summary.toLowerCase().indexOf(q) >= 0) return true;
    if (e.category.toLowerCase().indexOf(q) >= 0) return true;
    if (e.pages && e.pages.join(' ').toLowerCase().indexOf(q) >= 0) return true;
    return (e.examples || []).some(function (x) { return x.code.toLowerCase().indexOf(q) >= 0 || x.note.toLowerCase().indexOf(q) >= 0; });
  }

  function apply(resetShown) {
    var langEntries = state.data.entries.filter(function (e) { return e.lang === state.lang; });
    if (state.cat !== 'all' && !langEntries.some(function (e) { return e.category === state.cat; })) state.cat = 'all';
    renderCats(langEntries);

    var q = state.q.trim().toLowerCase();
    filtered = langEntries.filter(function (e) {
      if (state.cat !== 'all' && e.category !== state.cat) return false;
      if (state.onlyCode && !(e.examples || []).some(function (x) { return x.code; })) return false;
      return !q || matches(e, q);
    });
    filtered.sort(function (a, b) {
      switch (state.sort) {
        case 'term-desc': return b.term.localeCompare(a.term, 'ja');
        case 'len-asc': return a.summary.length - b.summary.length;
        case 'len-desc': return b.summary.length - a.summary.length;
        default: return a.term.localeCompare(b.term, 'ja');
      }
    });
    if (resetShown) state.shown = PAGE_SIZE;
    render();
    writeHash();
  }

  function cardHtml(e, q) {
    var badges = '<span class="gl-badge">' + esc(e.category) + '</span>';
    (e.pages || []).slice(0, 3).forEach(function (p) { badges += '<span class="gl-badge page">' + esc(p) + '</span>'; });
    if ((e.pages || []).length > 3) badges += '<span class="gl-badge page">+' + (e.pages.length - 3) + '</span>';
    var ex = (e.examples || []).map(function (x) {
      return '<div class="gl-example">' + (x.note ? '<p class="gl-note">' + mark(x.note, q) + '</p>' : '') +
        (x.code ? '<div class="gl-code"><button type="button" class="gl-copy" aria-label="コードをコピー">コピー</button><pre><code>' + mark(x.code, q) + '</code></pre></div>' : '') + '</div>';
    }).join('');
    return '<article class="gl-card"><div class="gl-card-head"><h2 class="gl-term">' + mark(e.term, q) + '</h2><div class="gl-badges">' + badges +
      '</div></div><p class="gl-summary">' + mark(e.summary, q) + '</p>' + ex + '</article>';
  }

  function render() {
    var q = state.q.trim();
    el.meta.textContent = filtered.length + ' 件' + (q ? '（「' + q + '」で検索）' : '');
    if (!filtered.length) {
      el.list.innerHTML = '<p class="gl-empty">該当する用語は見つかりませんでした。キーワードやカテゴリを変えてみてください。</p>';
      el.more.hidden = true;
      return;
    }
    var slice = filtered.slice(0, state.shown);
    el.list.innerHTML = slice.map(function (e) { return cardHtml(e, q); }).join('');
    var rest = filtered.length - slice.length;
    el.more.hidden = rest <= 0;
    el.more.textContent = 'さらに表示（残り ' + rest + ' 件）';
  }

  function bind() {
    el.tabs.addEventListener('click', function (ev) {
      var b = ev.target.closest('.gl-tab'); if (!b) return;
      state.lang = b.dataset.lang; state.cat = 'all'; renderTabs(); showLang();
    });
    el.cats.addEventListener('click', function (ev) {
      var b = ev.target.closest('.gl-chip'); if (!b) return;
      state.cat = b.dataset.cat; apply(true);
    });
    el.search.addEventListener('input', function () { state.q = el.search.value; el.clear.hidden = !state.q; apply(true); });
    el.clear.addEventListener('click', function () { el.search.value = ''; state.q = ''; el.clear.hidden = true; apply(true); el.search.focus(); });
    el.sort.addEventListener('change', function () { state.sort = el.sort.value; apply(true); });
    el.onlyCode.addEventListener('change', function () { state.onlyCode = el.onlyCode.checked; apply(true); });
    el.more.addEventListener('click', function () { state.shown += PAGE_SIZE; render(); });
    el.list.addEventListener('click', function (ev) {
      var b = ev.target.closest('.gl-copy'); if (!b) return;
      var code = b.parentElement.querySelector('code').textContent;
      var done = function () { b.textContent = 'コピー済み'; setTimeout(function () { b.textContent = 'コピー'; }, 1200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, function () { b.textContent = '失敗'; });
      else b.textContent = '未対応';
    });
    window.addEventListener('hashchange', function () { readHash(); syncInputs(); renderTabs(); showLang(); });
  }

  function syncInputs() { el.search.value = state.q; el.clear.hidden = !state.q; }

  el.list.innerHTML = '<p class="gl-empty">読み込み中…</p>';
  fetch(DATA_URL).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (data) {
    state.data = data;
    readHash();
    if (!data.languages.some(function (l) { return l.id === state.lang; })) state.lang = data.languages[0].id;
    syncInputs();
    renderTabs(); bind(); showLang();
  }).catch(function (err) {
    el.list.innerHTML = '<p class="gl-error">用語データを読み込めませんでした（' + esc(err.message) + '）。<br>ファイルを直接開かず、GitHub Pages か <code>python3 -m http.server</code> 経由で開いてください。</p>';
  });
})();
