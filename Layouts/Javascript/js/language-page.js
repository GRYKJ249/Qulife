// language-page.js - كود صفحة اللغات الجديدة
// - 5 لغات اساسية شغالة (ar / en / fr / tr / es) والترجمة في i18n.js
// - جميع اللغات في القائمة مفعّلة بحزم ترجمة يدوية.
(function () {
  var I = window.QulifeI18n, T = I.t;
  var $ = function (id) { return document.getElementById(id); };
  var FLAGS = '../Pictures/SVG/Flags/';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5L10 17.5L19 7" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var ALL = (window.QULIFE_LANGS || []).map(function (r) { return { code: r[0], flag: r[1], en: r[2], tags: r[3] }; });
  var BY = {}; ALL.forEach(function (l) { BY[l.code] = l; });
  var AVAIL = I.supported.map(function (c) { return BY[c]; }).filter(Boolean);       // ar en fr tr es
  var SOON = [];   // كل اللغات مدعومة الآن بحزم ترجمة يدوية

  var saved = I.lang, selected = I.lang, touched = false, query = '', observer = null;

  // اسم اللغة بلغتها هي (Intl) واسمها بلغة الواجهة الحالية
  function cap(s, code) { try { return s.charAt(0).toLocaleUpperCase(code) + s.slice(1); } catch (e) { return s; } }
  function native(l) { try { var n = new Intl.DisplayNames([l.code], { type: 'language' }).of(l.code); if (n && n !== l.code) return cap(n, l.code); } catch (e) {} return l.en; }
  function inUi(l) { try { var n = new Intl.DisplayNames([I.lang], { type: 'language' }).of(l.code); if (n && n !== l.code) return cap(n, I.lang); } catch (e) {} return l.en; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function match(l) {
    if (!query) return true;
    return (l.en + ' ' + l.tags + ' ' + l.code + ' ' + native(l) + ' ' + inUi(l)).toLowerCase().indexOf(query) >= 0;
  }

  // ===== العرض =====
  function render(instant) {
    var a = AVAIL.filter(match), s = SOON.filter(match), out = '';
    if (a.length) {
      out += '<div class="lp-label">' + esc(T('lg.avail')) + '</div><div class="lp-avail">' + a.map(function (l) {
        return '<button class="lp-row' + (instant ? ' in' : '') + (l.code === selected ? ' active' : '') + '" data-code="' + l.code + '">' +
          '<img class="lp-flag" src="' + FLAGS + l.flag + '" alt="">' +
          '<span class="lp-row-t"><b>' + esc(native(l)) + '</b><small>' + esc(inUi(l)) + '</small></span>' +
          '<span class="lp-check">' + CHECK + '</span></button>';
      }).join('') + '</div>';
    }
    if (s.length) {
      out += '<div class="lp-label">' + esc(T('lg.more')) + ' · ' + s.length + '</div><div class="lp-more">' + s.map(function (l) {
        return '<button class="lp-chip' + (instant ? ' in' : '') + '" data-soon="' + l.code + '">' +
          '<img class="lp-flag" src="' + FLAGS + l.flag + '" alt="" loading="lazy">' +
          '<span class="lp-chip-t"><b>' + esc(native(l)) + '</b><small>' + esc(inUi(l)) + '</small></span>' +
          '<span class="lp-soon">' + esc(T('lg.soon')) + '</span></button>';
      }).join('') + '</div>';
    }
    $('sections').innerHTML = out;
    $('emptyState').classList.toggle('show', !a.length && !s.length);
    if (!instant) watch();
  }

  // دخول البطاقات تدريجيا وقت النزول (مرة واحدة لكل بطاقة)
  function watch() {
    var els = [].slice.call($('sections').querySelectorAll('.lp-row,.lp-chip'));
    if (observer) observer.disconnect();
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    observer = new IntersectionObserver(function (entries) {
      var fresh = entries.filter(function (e) { return e.isIntersecting; }).sort(function (x, y) { return x.boundingClientRect.top - y.boundingClientRect.top || x.boundingClientRect.left - y.boundingClientRect.left; });
      fresh.forEach(function (e, i) { e.target.style.setProperty('--d', Math.min(i, 8) * 55 + 'ms'); e.target.classList.add('in'); observer.unobserve(e.target); });
    }, { threshold: 0.05, rootMargin: '0px 0px -4% 0px' });
    els.forEach(function (e) { observer.observe(e); });
  }

  // ===== العلم الكبير + شريط التطبيق =====
  function showCurrent(pop) {
    var l = BY[selected] || BY.en;
    $('heroFlag').src = FLAGS + l.flag;
    $('applyFlag').src = FLAGS + l.flag;
    $('heroName').textContent = native(l);
    $('heroSub').textContent = inUi(l);
    $('applyName').textContent = native(l);
    if (pop) { var f = $('heroFlag').parentNode; f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop'); }
  }

  // ===== اختيار لغة متاحة: معاينة فورية للصفحة كلها =====
  function choose(code) {
    touched = true; selected = code;
    I.set(code, false);          // يترجم الصفحة ويقلب الاتجاه (عربي = RTL)، ويطلق qulife-lang
    showCurrent(true);
  }

  // ===== توافق قديم: لا توجد لغات غير متاحة الآن =====
  var toastTimer = null;
  function shakeSite(chip) {
    var parts = [document.querySelector('.lp-bar'), $('lpPage'), document.querySelector('.lp-apply')];
    parts.forEach(function (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); });
    setTimeout(function () { parts.forEach(function (el) { el.classList.remove('shake'); }); }, 600);
    if (chip) { chip.classList.add('nope'); setTimeout(function () { chip.classList.remove('nope'); }, 700); }
    try { if (navigator.vibrate) navigator.vibrate([40, 30, 40]); } catch (e) {}
    var t = $('toast'); t.textContent = T('lg.toast'); t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2300);
  }

  $('sections').addEventListener('click', function (e) {
    var row = e.target.closest('.lp-row'); if (row) { choose(row.dataset.code); markRows(); return; }
    var chip = e.target.closest('.lp-chip'); if (chip) { var code = chip.dataset.soon; if (code && BY[code]) { choose(code); markRows(); } }
  });
  function markRows() { [].forEach.call($('sections').querySelectorAll('.lp-row'), function (r) { r.classList.toggle('active', r.dataset.code === selected); }); }

  $('searchInput').addEventListener('input', function (e) { query = e.target.value.toLowerCase().trim(); render(false); });

  // لما اللغة تتغير (اختيار او رسالة init من الرئيسية) نحدّث الاسماء بلغة الواجهة الجديدة
  window.addEventListener('qulife-lang', function () {
    if (!touched) { saved = I.lang; selected = I.lang; }
    render(true); showCurrent(false);
  });

  // ===== تطبيق / رجوع =====
  $('applyBtn').addEventListener('click', function () {
    var l = BY[selected];
    I.set(selected, true);
    if (window.QulifeActivity) QulifeActivity.add('setting', 'تغيير اللغة', { language: selected });
    if (window.parent !== window) window.parent.postMessage({ qulife: 'language', name: native(l), code: selected }, '*');
    saved = selected;
    qulifeBack();
  });
  $('backBtn').addEventListener('click', function () { I.set(saved, false); qulifeBack(); });   // رجوع بدون تطبيق = نلغي المعاينة

  // ===== تشغيل =====
  I.apply(document);
  render(false);
  showCurrent(false);
})();
