// themes-page.js - كود صفحة الثيمات الجديدة
// (الحساب والتباين في theme-engine.js | الفتح فوق الرئيسية في router.js)
(function () {
  var E = window.QulifeThemeEngine, I = window.QulifeI18n, T = I.t;
  var $ = function (id) { return document.getElementById(id); };

  // ===== قائمة الثيمات: [الاسم, العربي, اللون, كلمات بحث] =====
  var ORIGINALS = [
    ['Qulife', 'كيولايف', '#FF2E7E', 'qulife original'],
    ['Qulife Dark', 'كيولايف الداكن', '#111827', 'qulife dark black original']
  ];
  var COLORS = [
    ['Pink', 'الوردي', '#EC4899', 'rose'],
    ['Blue', 'الأزرق', '#2563EB', ''],
    ['Purple', 'البنفسجي', '#7C3AED', ''],
    ['Green', 'الأخضر', '#16A34A', ''],
    ['Orange', 'البرتقالي', '#F97316', ''],
    ['Red', 'الأحمر', '#EF4444', ''],
    ['Teal', 'الفيروزي', '#0D9488', ''],
    ['Cyan', 'السماوي', '#0891B2', ''],
    ['Yellow', 'الأصفر', '#EAB308', ''],
    ['Dark', 'الأسود الداكن', '#111827', 'black'],
    ['Rose', 'الوردي الداكن', '#E11D48', 'pink'],
    ['Indigo', 'النيلي', '#4F46E5', ''],
    ['Violet', 'البنفسجي الفاتح', '#8B5CF6', ''],
    ['Fuchsia', 'الفوشيا', '#C026D3', ''],
    ['Lime', 'الليموني', '#65A30D', ''],
    ['Emerald', 'الزمردي', '#059669', ''],
    ['Amber', 'الكهرماني', '#D97706', ''],
    ['Brown', 'البني', '#92400E', ''],
    ['Gray', 'الرمادي', '#4B5563', 'grey'],
    ['Sky', 'السماوي الفاتح', '#0284C7', ''],
    ['Navy', 'الكحلي', '#1E3A8A', ''],
    ['Mint', 'النعناعي', '#0F766E', ''],
    ['Peach', 'الخوخي', '#FB923C', ''],
    ['Lavender', 'اللافندر', '#9F7AEA', ''],
    ['Coral', 'المرجاني', '#F43F5E', ''],
    ['Olive', 'الزيتوني', '#4D7C0F', ''],
    ['Gold', 'الذهبي', '#B45309', ''],
    ['Silver', 'الفضي', '#64748B', ''],
    ['Midnight', 'منتصف الليل', '#0F172A', ''],
    ['Sunset', 'الغروب', '#FB5607', ''],
    ['Ocean', 'المحيط', '#0369A1', ''],
    ['Forest', 'الغابة', '#14532D', ''],
    ['Cherry', 'الكرزي', '#9F1239', ''],
    ['Grape', 'العنبي', '#6B21A8', '']
  ];
  // 100 additional curated presets: ten visual families, ten coordinated shades each.
  var NEW_THEMES = [
    ['Aurora Mist', 'أورورا ضباب', '#82E0B9', 'aurora mist palette'],
    ['Aurora Glow', 'أورورا وهج', '#4FD1A0', 'aurora glow palette'],
    ['Aurora Bloom', 'أورورا إزهار', '#38C796', 'aurora bloom palette'],
    ['Aurora Breeze', 'أورورا نسيم', '#53B899', 'aurora breeze palette'],
    ['Aurora Dream', 'أورورا حلم', '#5AAD97', 'aurora dream palette'],
    ['Aurora Dusk', 'أورورا شفق', '#339E85', 'aurora dusk palette'],
    ['Aurora Pulse', 'أورورا نبض', '#20B296', 'aurora pulse palette'],
    ['Aurora Velvet', 'أورورا مخمل', '#228F7E', 'aurora velvet palette'],
    ['Aurora Calm', 'أورورا هدوء', '#4F807A', 'aurora calm palette'],
    ['Aurora Deep', 'أورورا عميق', '#0F6B63', 'aurora deep palette'],
    ['Sakura Mist', 'ساكورا ضباب', '#E082B1', 'sakura mist palette'],
    ['Sakura Glow', 'ساكورا وهج', '#D14F8B', 'sakura glow palette'],
    ['Sakura Bloom', 'ساكورا إزهار', '#C73875', 'sakura bloom palette'],
    ['Sakura Breeze', 'ساكورا نسيم', '#B8537A', 'sakura breeze palette'],
    ['Sakura Dream', 'ساكورا حلم', '#AD5A77', 'sakura dream palette'],
    ['Sakura Dusk', 'ساكورا شفق', '#9E3354', 'sakura dusk palette'],
    ['Sakura Pulse', 'ساكورا نبض', '#B22049', 'sakura pulse palette'],
    ['Sakura Velvet', 'ساكورا مخمل', '#8F223C', 'sakura velvet palette'],
    ['Sakura Calm', 'ساكورا هدوء', '#804F59', 'sakura calm palette'],
    ['Sakura Deep', 'ساكورا عميق', '#6B0F1E', 'sakura deep palette'],
    ['Lagoon Mist', 'لاجون ضباب', '#82D8E0', 'lagoon mist palette'],
    ['Lagoon Glow', 'لاجون وهج', '#4FC1D1', 'lagoon glow palette'],
    ['Lagoon Bloom', 'لاجون إزهار', '#38B0C7', 'lagoon bloom palette'],
    ['Lagoon Breeze', 'لاجون نسيم', '#53A4B8', 'lagoon breeze palette'],
    ['Lagoon Dream', 'لاجون حلم', '#5A9AAD', 'lagoon dream palette'],
    ['Lagoon Dusk', 'لاجون شفق', '#33819E', 'lagoon dusk palette'],
    ['Lagoon Pulse', 'لاجون نبض', '#2086B2', 'lagoon pulse palette'],
    ['Lagoon Velvet', 'لاجون مخمل', '#226A8F', 'lagoon velvet palette'],
    ['Lagoon Calm', 'لاجون هدوء', '#4F6D80', 'lagoon calm palette'],
    ['Lagoon Deep', 'لاجون عميق', '#0F456B', 'lagoon deep palette'],
    ['Lavender Mist', 'لافندر ضباب', '#9A82E0', 'lavender mist palette'],
    ['Lavender Glow', 'لافندر وهج', '#754FD1', 'lavender glow palette'],
    ['Lavender Bloom', 'لافندر إزهار', '#6638C7', 'lavender bloom palette'],
    ['Lavender Breeze', 'لافندر نسيم', '#7753B8', 'lavender breeze palette'],
    ['Lavender Dream', 'لافندر حلم', '#7B5AAD', 'lavender dream palette'],
    ['Lavender Dusk', 'لافندر شفق', '#61339E', 'lavender dusk palette'],
    ['Lavender Pulse', 'لافندر نبض', '#6520B2', 'lavender pulse palette'],
    ['Lavender Velvet', 'لافندر مخمل', '#59228F', 'lavender velvet palette'],
    ['Lavender Calm', 'لافندر هدوء', '#694F80', 'lavender calm palette'],
    ['Lavender Deep', 'لافندر عميق', '#450F6B', 'lavender deep palette'],
    ['Citrus Mist', 'حمضيات ضباب', '#E0BE82', 'citrus mist palette'],
    ['Citrus Glow', 'حمضيات وهج', '#D1A74F', 'citrus glow palette'],
    ['Citrus Bloom', 'حمضيات إزهار', '#C79D38', 'citrus bloom palette'],
    ['Citrus Breeze', 'حمضيات نسيم', '#B89E53', 'citrus breeze palette'],
    ['Citrus Dream', 'حمضيات حلم', '#AD9B5A', 'citrus dream palette'],
    ['Citrus Dusk', 'حمضيات شفق', '#9E8B33', 'citrus dusk palette'],
    ['Citrus Pulse', 'حمضيات نبض', '#B29D20', 'citrus pulse palette'],
    ['Citrus Velvet', 'حمضيات مخمل', '#8F8322', 'citrus velvet palette'],
    ['Citrus Calm', 'حمضيات هدوء', '#807C4F', 'citrus calm palette'],
    ['Citrus Deep', 'حمضيات عميق', '#6B680F', 'citrus deep palette'],
    ['Forest Mist', 'غابة ضباب', '#82E09A', 'forest mist palette'],
    ['Forest Glow', 'غابة وهج', '#4FD175', 'forest glow palette'],
    ['Forest Bloom', 'غابة إزهار', '#38C766', 'forest bloom palette'],
    ['Forest Breeze', 'غابة نسيم', '#53B877', 'forest breeze palette'],
    ['Forest Dream', 'غابة حلم', '#5AAD7B', 'forest dream palette'],
    ['Forest Dusk', 'غابة شفق', '#339E61', 'forest dusk palette'],
    ['Forest Pulse', 'غابة نبض', '#20B265', 'forest pulse palette'],
    ['Forest Velvet', 'غابة مخمل', '#228F59', 'forest velvet palette'],
    ['Forest Calm', 'غابة هدوء', '#4F8069', 'forest calm palette'],
    ['Forest Deep', 'غابة عميق', '#0F6B45', 'forest deep palette'],
    ['Sunset Mist', 'غروب ضباب', '#E08F82', 'sunset mist palette'],
    ['Sunset Glow', 'غروب وهج', '#D1664F', 'sunset glow palette'],
    ['Sunset Bloom', 'غروب إزهار', '#C75638', 'sunset bloom palette'],
    ['Sunset Breeze', 'غروب نسيم', '#B86B53', 'sunset breeze palette'],
    ['Sunset Dream', 'غروب حلم', '#AD725A', 'sunset dream palette'],
    ['Sunset Dusk', 'غروب شفق', '#9E5533', 'sunset dusk palette'],
    ['Sunset Pulse', 'غروب نبض', '#B25420', 'sunset pulse palette'],
    ['Sunset Velvet', 'غروب مخمل', '#8F4D22', 'sunset velvet palette'],
    ['Sunset Calm', 'غروب هدوء', '#80644F', 'sunset calm palette'],
    ['Sunset Deep', 'غروب عميق', '#6B3A0F', 'sunset deep palette'],
    ['Berry Mist', 'توت ضباب', '#E082D8', 'berry mist palette'],
    ['Berry Glow', 'توت وهج', '#D14FC1', 'berry glow palette'],
    ['Berry Bloom', 'توت إزهار', '#C738B0', 'berry bloom palette'],
    ['Berry Breeze', 'توت نسيم', '#B853A4', 'berry breeze palette'],
    ['Berry Dream', 'توت حلم', '#AD5A9A', 'berry dream palette'],
    ['Berry Dusk', 'توت شفق', '#9E3381', 'berry dusk palette'],
    ['Berry Pulse', 'توت نبض', '#B22086', 'berry pulse palette'],
    ['Berry Velvet', 'توت مخمل', '#8F226A', 'berry velvet palette'],
    ['Berry Calm', 'توت هدوء', '#804F6D', 'berry calm palette'],
    ['Berry Deep', 'توت عميق', '#6B0F45', 'berry deep palette'],
    ['Sand Mist', 'رمل ضباب', '#E0A582', 'sand mist palette'],
    ['Sand Glow', 'رمل وهج', '#D1844F', 'sand glow palette'],
    ['Sand Bloom', 'رمل إزهار', '#C77738', 'sand bloom palette'],
    ['Sand Breeze', 'رمل نسيم', '#B88353', 'sand breeze palette'],
    ['Sand Dream', 'رمل حلم', '#AD855A', 'sand dream palette'],
    ['Sand Dusk', 'رمل شفق', '#9E6E33', 'sand dusk palette'],
    ['Sand Pulse', 'رمل نبض', '#B27620', 'sand pulse palette'],
    ['Sand Velvet', 'رمل مخمل', '#8F6622', 'sand velvet palette'],
    ['Sand Calm', 'رمل هدوء', '#806F4F', 'sand calm palette'],
    ['Sand Deep', 'رمل عميق', '#6B4F0F', 'sand deep palette'],
    ['Midnight Mist', 'ليل ضباب', '#82A9E0', 'midnight mist palette'],
    ['Midnight Glow', 'ليل وهج', '#4F81D1', 'midnight glow palette'],
    ['Midnight Bloom', 'ليل إزهار', '#3869C7', 'midnight bloom palette'],
    ['Midnight Breeze', 'ليل نسيم', '#5371B8', 'midnight breeze palette'],
    ['Midnight Dream', 'ليل حلم', '#5A71AD', 'midnight dream palette'],
    ['Midnight Dusk', 'ليل شفق', '#334B9E', 'midnight dusk palette'],
    ['Midnight Pulse', 'ليل نبض', '#203DB2', 'midnight pulse palette'],
    ['Midnight Velvet', 'ليل مخمل', '#22338F', 'midnight velvet palette'],
    ['Midnight Calm', 'ليل هدوء', '#4F5580', 'midnight calm palette'],
    ['Midnight Deep', 'ليل عميق', '#0F176B', 'midnight deep palette']
  ];
  COLORS = COLORS.concat(NEW_THEMES);
  var HEART = '<svg viewBox="0 0 200 170"><path d="M100 165 C 40 120 10 85 10 55 C 10 25 35 5 60 5 C 78 5 92 15 100 30 C 108 15 122 5 140 5 C 165 5 190 25 190 55 C 190 85 160 120 100 165 Z"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5L10 17.5L19 7" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ===== الحالة =====
  var customs = [];            // الثيمات اللي صنعها المستخدم
  var selected = { name: 'Qulife', color: '#FF2E7E' };   // المختار حاليا (معاينة)
  var saved = { name: 'Qulife', color: '#FF2E7E' };      // المحفوظ فعلا
  var filter = 'all', query = '';
  try {
    customs = (JSON.parse(localStorage.getItem('qulife_custom_themes') || '[]') || []).map(function (c) { c.mine = true; return c; });
    var n = localStorage.getItem('qulife_theme'), c = localStorage.getItem('qulife_theme_color');
    if (n && c) { saved = { name: n, color: c }; selected = { name: n, color: c }; }
  } catch (e) {}

  // ===== بناء الشبكة =====
  var sections = $('sections');
  var observer = null;
  var tiles = [];

  function styleAttr(color) {            // المتغيرات الخاصة بكل بطاقة (inline)
    var v = E.compute(color).vars, s = '';
    for (var k in v) s += k + ':' + v[k] + ';';
    return s;
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }

  function tileHTML(t, mine) {
    return '<button class="tp-tile" data-name="' + esc(t.name) + '" data-color="' + t.color + '">' +
      '<div class="tp-scr" style="' + styleAttr(t.color) + '">' + HEART +
      '<div class="tp-scr-t"><b>Qulife</b><span>' + T('scr.style') + '</span><i>' + T('scr.start') + '</i></div></div>' +
      '<div class="tp-meta"><b>' + esc(label(t)) + '</b><small>' + esc(sub(t)) + '</small></div>' +
      '<span class="tp-check">' + CHECK + '</span>' +
      (mine ? '<span class="tp-del" data-del="' + esc(t.name) + '" aria-label="Delete">×</span>' : '') +
      '</button>';
  }
  // الاسم المعروض: ترجمة اللون بلغة المستخدم؛ الثيمات المخصصة تبقى باسم المستخدم
  function label(t) { return t.mine ? t.name : (I.lang === 'ar' && t.ar ? t.ar : T('c.' + t.name, t.name)); }
  function sub(t) { return t.mine ? t.color.toUpperCase() : (I.lang === 'en' ? t.color.toUpperCase() : t.name + ' · ' + t.color.toUpperCase()); }
  function norm(a) { return a.map(function (r) { return { name: r[0], ar: r[1], color: r[2], tags: r[3] }; }); }

  function matches(t) {
    var isDark = E.compute(t.color).dark;
    if (filter === 'light' && isDark) return false;
    if (filter === 'dark' && !isDark) return false;
    if (query) {
      var hay = (t.name + ' ' + label(t) + ' ' + (t.ar || '') + ' ' + t.color + ' ' + (t.tags || '')).toLowerCase();
      if (hay.indexOf(query) < 0) return false;
    }
    return true;
  }

  function render() {
    var out = '', any = false;
    function sec(lbl, list, mine, withAdd) {
      var items = list.filter(matches);
      if (!items.length && !withAdd) return;
      any = any || items.length > 0;
      out += '<div class="tp-sec-label">' + lbl + '</div><div class="tp-grid">' + items.map(function (t) { return tileHTML(t, mine); }).join('');
      if (withAdd) out += '<button class="tp-tile tp-add" id="addBtn"><span class="ring"><i>+</i></span><b>' + T('custom') + '</b><small>' + T('custom.s') + '</small></button>';
      out += '</div>';
    }
    if (filter === 'all' || filter === 'light' || filter === 'dark') sec(T('sec.orig'), norm(ORIGINALS), false);
    if (customs.length) sec(T('sec.mine'), customs, true);
    if (filter !== 'mine') sec(T('sec.colors'), norm(COLORS), false, !query && filter === 'all');
    if (filter === 'mine' && !customs.length) out += '<div class="tp-sec-label">' + T('sec.none') + '</div><div class="tp-grid"><button class="tp-tile tp-add" id="addBtn"><span class="ring"><i>+</i></span><b>' + T('custom') + '</b><small>' + T('custom.s') + '</small></button></div>';
    sections.innerHTML = out;
    $('emptyState').classList.toggle('show', !any && filter !== 'mine');
    tiles = [].slice.call(sections.querySelectorAll('.tp-tile'));
    markActive();
    watch();
  }

  function markActive() {
    [].forEach.call(sections.querySelectorAll('.tp-tile[data-name]'), function (el) {
      el.classList.toggle('active', el.dataset.name === selected.name);
    });
  }

  // ===== حركة الدخول من الشمال عند النزول =====
  // كل بطاقة تدخل مرة واحدة لما تظهر في الشاشة؛ العمود الثاني يتأخر شوية فيبان كأن المستطيلين بجو واحد ورا واحد
  function watch() {
    if (observer) observer.disconnect();
    if (!('IntersectionObserver' in window)) { tiles.forEach(function (t) { t.classList.add('in'); }); return; }
    observer = new IntersectionObserver(function (entries) {
      var fresh = entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left; });
      fresh.forEach(function (e, i) {
        e.target.style.setProperty('--d', (Math.min(i, 5) * 90) + 'ms');
        e.target.classList.add('in');
        observer.unobserve(e.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    tiles.forEach(function (t) { observer.observe(t); });
  }

  // ===== المعاينة الحية + نسب التباين =====
  function ratio(a, b) { return E.contrast(E.parse(a), E.parse(b)); }
  function fmt(r) { return r.toFixed(1) + (r >= 4.5 ? ' ✓' : ''); }
  function labelByName(name) {
    var all = norm(ORIGINALS).concat(norm(COLORS)), f = all.filter(function (t) { return t.name === name; })[0];
    return f ? label(f) : name;
  }
  function preview(name, color) {
    var res = E.apply(name, color, $('live'));    // المعاينة فقط؛ لا نغير خلفية الصفحة أثناء البحث
    var v = res.vars;
    var shown = labelByName(name);
    $('liveName').textContent = shown;
    $('applyName').textContent = shown;
    $('liveMode').textContent = T(res.dark ? 'th.dark' : 'th.light');
    $('rText').textContent = fmt(ratio(v['--ink'], v['--page-bg-2']));
    $('rBtn').textContent = fmt(Math.min(ratio(v['--on-accent'], v['--accent']), ratio(v['--on-accent'], v['--accent-2'])));
    $('rAcc').textContent = fmt(ratio(v['--accent-text'], v['--page-bg-1']));
  }
  function select(name, color) {
    selected = { name: name, color: color };
    markActive();
    preview(name, color);
  }

  // ===== تفويض النقر على البطاقات =====
  sections.addEventListener('click', function (e) {
    var del = e.target.closest('[data-del]');
    if (del) {
      e.stopPropagation();
      customs = customs.filter(function (c) { return c.name !== del.dataset.del; });
      persistCustoms();
      if (selected.name === del.dataset.del) select(saved.name, saved.color);
      render();
      return;
    }
    if (e.target.closest('#addBtn')) { openSheet(); return; }
    var t = e.target.closest('.tp-tile[data-name]');
    if (t) select(t.dataset.name, t.dataset.color);
  });

  // ===== البحث والفلاتر =====
  $('searchInput').addEventListener('input', function (e) { query = e.target.value.toLowerCase().trim(); render(); });
  $('chips').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    filter = b.dataset.f;
    [].forEach.call($('chips').children, function (c) { c.classList.toggle('on', c === b); });
    render();
  });

  // ===== تطبيق / رجوع =====
  $('applyBtn').addEventListener('click', function () {
    E.apply(selected.name, selected.color);       // تطبيق فعلي بعد تأكيد المستخدم فقط
    try { localStorage.setItem('qulife_theme', selected.name); localStorage.setItem('qulife_theme_color', selected.color); } catch (e) {}
    if (window.parent !== window) window.parent.postMessage({ qulife: 'theme', name: selected.name, color: selected.color }, '*');
    if (window.QulifeActivity) QulifeActivity.add('setting', 'تغيير الثيم', { theme: selected.name });
    saved = { name: selected.name, color: selected.color };
    qulifeBack();
  });
  $('backBtn').addEventListener('click', function () {
    E.apply(saved.name, saved.color);       // رجوع بدون تطبيق = نلغي المعاينة
    qulifeBack();
  });

  // ===== نافذة اللون المخصص =====
  var sheet = $('sheet'), overlay = $('overlay'), area = $('cpArea'), hueEl = $('cpHue');
  var H = 335, S = 0.85, V = 1, cpHex = '#FF2E7E';
  function hsv2hex(h, s, v) {
    var c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c, r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return '#' + [r, g, b].map(function (n) { var k = Math.round((n + m) * 255).toString(16); return k.length < 2 ? '0' + k : k; }).join('').toUpperCase();
  }
  function syncSheet() {
    cpHex = hsv2hex(H, S, V);
    area.style.setProperty('--h', H);
    $('cpDot').style.left = (S * 100) + '%'; $('cpDot').style.top = ((1 - V) * 100) + '%';
    $('cpHueDot').style.left = (H / 360 * 100) + '%';
    $('cpHueDot').style.background = 'hsl(' + H + ',100%,50%)';
    $('cpDot').style.background = cpHex;
    $('cpHex').textContent = cpHex;
    var res = E.compute(cpHex), p = $('cpPreview');
    for (var k in res.vars) p.style.setProperty(k, res.vars[k]);
    $('cpNote').textContent = T(res.dark ? 'th.dark' : 'th.light') + ' · ' + T('sheet.auto');
  }
  function drag(el, fn) {
    el.addEventListener('pointerdown', function (e) { el.setPointerCapture(e.pointerId); fn(e); el._d = true; });
    el.addEventListener('pointermove', function (e) { if (el._d) fn(e); });
    el.addEventListener('pointerup', function () { el._d = false; });
    el.addEventListener('pointercancel', function () { el._d = false; });
  }
  drag(area, function (e) {
    var r = area.getBoundingClientRect();
    S = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    V = 1 - Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    syncSheet();
  });
  drag(hueEl, function (e) {
    var r = hueEl.getBoundingClientRect();
    H = Math.max(0, Math.min(359.9, (e.clientX - r.left) / r.width * 360));
    syncSheet();
  });
  function openSheet() { sheet.classList.add('open'); overlay.classList.add('show'); document.body.style.overflow = 'hidden'; syncSheet(); }
  function closeSheet() { sheet.style.transform = ''; sheet.classList.remove('open'); overlay.classList.remove('show'); document.body.style.overflow = ''; }
  overlay.addEventListener('click', closeSheet);
  // سحب المقبض لتحت يقفل النافذة
  (function () {
    var h = $('sheetHandle'), y0 = 0, on = false;
    h.addEventListener('pointerdown', function (e) { on = true; y0 = e.clientY; h.setPointerCapture(e.pointerId); sheet.style.transition = 'none'; });
    h.addEventListener('pointermove', function (e) { if (on) { var d = Math.max(0, e.clientY - y0); sheet.style.transform = 'translate(-50%,' + d + 'px)'; } });
    h.addEventListener('pointerup', function (e) { if (!on) return; on = false; sheet.style.transition = ''; if (e.clientY - y0 > 90) closeSheet(); else sheet.style.transform = ''; });
  })();
  function persistCustoms() { try { localStorage.setItem('qulife_custom_themes', JSON.stringify(customs)); } catch (e) {} }
  $('cpDone').addEventListener('click', function () {
    var name = ($('cpName').value || '').trim() || ('Style ' + (customs.length + 1));
    while (customs.some(function (c) { return c.name === name; })) name += ' •';
    customs.push({ name: name, mine: true, color: cpHex, tags: 'custom style mine' });
    persistCustoms();
    $('cpName').value = '';
    closeSheet();
    filter = 'all'; query = ''; $('searchInput').value = '';
    [].forEach.call($('chips').children, function (c) { c.classList.toggle('on', c.dataset.f === 'all'); });
    render();
    select(name, cpHex);
    var el = sections.querySelector('[data-name="' + name.replace(/"/g, '\\"') + '"]');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // ===== اللغة والثيم من الرئيسية =====
  window.addEventListener('qulife-lang', function () { I.apply(document); render(); preview(selected.name, selected.color); });
  window.addEventListener('qulife-theme-init', function (e) { saved = { name: e.detail.name, color: e.detail.color }; selected = { name: saved.name, color: saved.color }; markActive(); preview(selected.name, selected.color); });

  // ===== تشغيل =====
  render();
  preview(selected.name, selected.color);
  // لو المحفوظ ثيم مخصص، افتح على بطاقته
  var cur = sections.querySelector('.tp-tile.active');
  if (cur && !cur.closest('.tp-grid').previousElementSibling.textContent.match(/originals|collection/i)) cur.scrollIntoView({ block: 'center' });
})();
