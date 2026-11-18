// theme-engine.js - محرك الثيمات المشترك (يتحمل في كل الصفحات قبل nav.js)
// المشكلة القديمة: لون الثيم كان يُستخدم كخلفية وكلون للنصوص والزر في نفس الوقت
// فلما يكون اللون غامق (Navy / Dark / Forest ...) النص والزر يختفوا في الخلفية.
// الحل: من لون واحد نحسب مجموعة ألوان "متوافقة" ونضمن التباين (WCAG) بين كل نص وخلفيته.
//
// المتغيرات اللي بنكتبها على :root
//   --accent        لون التعبئة (الأزرار، الإطارات)
//   --accent-2      لون ثاني للتدرج
//   --on-accent     لون النص فوق --accent (ابيض او غامق حسب التباين)
//   --accent-text   لون الـaccent للنصوص فوق الخلفية (معدّل ليكون مقروء)
//   --page-bg-1/2   تدرج الخلفية
//   --ink / --muted النص الاساسي والثانوي
//   --surface...    البطاقات
(function () {
  var DEFAULTS = { 'Qulife Dark': '#111827', Qulife: '#FF2E7E' };

  // ---------- ادوات الالوان ----------
  function parse(hex) {
    var h = String(hex || '').replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  function toHex(c) {
    function p(n) { n = Math.max(0, Math.min(255, Math.round(n))); return (n < 16 ? '0' : '') + n.toString(16); }
    return '#' + p(c.r) + p(c.g) + p(c.b);
  }
  function lin(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function lum(c) { return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b); }
  function contrast(a, b) { var l1 = lum(a), l2 = lum(b); if (l1 < l2) { var t = l1; l1 = l2; l2 = t; } return (l1 + 0.05) / (l2 + 0.05); }
  function mix(a, b, t) { return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t }; }
  function rgba(c, a) { return 'rgba(' + Math.round(c.r) + ',' + Math.round(c.g) + ',' + Math.round(c.b) + ',' + a + ')'; }
  function toHsl(c) {
    var r = c.r / 255, g = c.g / 255, b = c.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2;
    if (mx !== mn) {
      var d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0); else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: h, s: s, l: l };
  }
  function fromHsl(o) {
    var h = o.h / 360, s = o.s, l = o.l;
    function f(p, q, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }
    if (s === 0) { var v = l * 255; return { r: v, g: v, b: v }; }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return { r: f(p, q, h + 1 / 3) * 255, g: f(p, q, h) * 255, b: f(p, q, h - 1 / 3) * 255 };
  }
  var WHITE = { r: 255, g: 255, b: 255 }, BLACK = { r: 0, g: 0, b: 0 };

  // يحرّك لون الـaccent (فاتح/غامق) لين يوصل للتباين المطلوب مع الخلفية
  function ensureContrast(color, bg, min, towardLight) {
    var hsl = toHsl(color), out = color, i = 0;
    while (contrast(out, bg) < min && i < 40) {
      hsl.l = Math.max(0, Math.min(1, hsl.l + (towardLight ? 0.02 : -0.02)));
      out = fromHsl(hsl); i++;
    }
    return out;
  }
  // افضل لون نص (ابيض/غامق) فوق لون معين
  function bestOn(bg) { return contrast(WHITE, bg) >= contrast({ r: 17, g: 24, b: 39 }, bg) ? '#ffffff' : '#111827'; }

  function siteBackground(bg1, bg2, bg3, accent, dark) {
    if (dark) return 'linear-gradient(135deg,' + toHex(bg1) + ' 0%,' + toHex(bg2) + ' 58%,' + toHex(bg3) + ' 100%)';
    return 'radial-gradient(circle at 8% 8%,' + rgba(accent, 0.24) + ',transparent 34%),radial-gradient(circle at 92% 88%,' + rgba(mix(WHITE, accent, 0.22), 0.22) + ',transparent 36%),linear-gradient(135deg,' + toHex(bg1) + ' 0%,' + toHex(bg2) + ' 42%,' + toHex(mix(WHITE, accent, 0.02)) + ' 70%,' + toHex(bg3) + ' 100%)';
  }

  // ---------- الحساب الرئيسي ----------
  // يرجع كل المتغيرات لثيم معين (بدون ما يلمس الصفحة) => نستخدمه لمعاينة البطاقات كمان
  function compute(color) {
    var base = parse(color) || parse('#FF2E7E');
    var hsl = toHsl(base);
    // ثيم غامق = اللون نفسه غامق جدا => نبني واجهة داكنة بنفس درجة اللون
    var dark = lum(base) < 0.1;
    var v = {}, bg1, bg2, ink, accent, surface, surfaceStrong;

    if (dark) {
      var sat = Math.min(hsl.s, 0.55);
      bg1 = fromHsl({ h: hsl.h, s: sat * 0.8, l: 0.08 });
      bg2 = fromHsl({ h: hsl.h, s: sat * 0.7, l: 0.15 });
      ink = { r: 245, g: 247, b: 250 };
      surface = fromHsl({ h: hsl.h, s: sat * 0.6, l: 0.17 });
      surfaceStrong = fromHsl({ h: hsl.h, s: sat * 0.6, l: 0.11 });
      // accent لازم يظهر فوق الخلفية الداكنة: نفتحه لو لزم
      accent = ensureContrast(base, bg2, 4.5, true);
    } else {
      bg1 = mix(base, WHITE, 0.9);
      bg2 = WHITE;
      ink = { r: 31, g: 36, b: 48 };
      surface = { r: 255, g: 255, b: 255 };
      surfaceStrong = WHITE;
      accent = base;
    }
    var accentText = dark ? accent : ensureContrast(base, bg1, 4.5, false);       // للنصوص فوق الخلفية
    var on = bestOn(accent), onRGB = on === '#ffffff' ? WHITE : { r: 17, g: 24, b: 39 };
    // لو النص فوق الزر اقل من 4.5 تباين: نعدّل الزر نفسه شوية (اغمق لو النص ابيض / افتح لو النص غامق)
    if (contrast(onRGB, accent) < 4.5) accent = ensureContrast(accent, onRGB, 4.5, on !== '#ffffff');
    // نهاية التدرج: نفتحها بقدر ما يسمح التباين مع النص، عشان النص يقرأ على الطرفين
    var accent2 = accent;
    [0.32, 0.24, 0.16, 0.08].some(function (t) { var c = mix(accent, WHITE, t); if (contrast(onRGB, c) >= 4.5) { accent2 = c; return true; } return false; });
    if (accent2 === accent && contrast(onRGB, accent) < 4.5) accent2 = mix(accent, on === '#ffffff' ? BLACK : WHITE, 0.1);
    // تدرج ثالث متناسق: نحرّك درجة اللون قليلاً حتى يكون لكل ثيم ثلاث بصمات لونية واضحة.
    var accent3 = fromHsl({ h: (hsl.h + (dark ? 28 : 34)) % 360, s: Math.min(1, hsl.s * 0.92 + 0.08), l: Math.max(0.16, Math.min(0.72, hsl.l + (dark ? 0.02 : -0.03))) });
    accent3 = ensureContrast(accent3, onRGB, 4.5, on !== '#ffffff');
    var bg3 = mix(bg2, accent, dark ? 0.16 : 0.08);
    var muted = ensureContrast(dark ? { r: 160, g: 170, b: 185 } : { r: 110, g: 118, b: 135 }, dark ? bg2 : WHITE, 4.5, dark);

    v['--accent'] = toHex(accent);
    v['--accent-2'] = toHex(accent2);
    v['--accent-3'] = toHex(accent3);
    v['--on-accent'] = on;
    v['--accent-text'] = toHex(accentText);
    v['--accent-soft'] = rgba(accent, 0.16);
    v['--accent-shadow'] = rgba(accent, dark ? 0.35 : 0.4);
    v['--page-bg-1'] = toHex(bg1);
    v['--page-bg-2'] = toHex(bg2);
    v['--page-bg-3'] = toHex(bg3);
    v['--site-background'] = siteBackground(bg1, bg2, bg3, accent, dark);
    v['--ink'] = toHex(ink);
    v['--muted'] = toHex(muted);
    v['--surface'] = dark ? toHex(surface) : 'rgba(255,255,255,.92)';
    v['--surface-strong'] = toHex(surfaceStrong);
    v['--surface-soft'] = dark ? rgba(surface, 0.86) : 'rgba(255,255,255,.7)';
    v['--control-bg'] = dark ? toHex(surface) : 'rgba(255,255,255,.96)';
    v['--border'] = dark ? 'rgba(255,255,255,.14)' : 'rgba(148,163,184,.28)';
    v['--shadow'] = dark ? 'rgba(0,0,0,.45)' : 'rgba(15,23,42,.10)';
    return { vars: v, dark: dark };
  }

  function apply(name, color, target) {
    var c = color || DEFAULTS[name] || '#FF2E7E';
    var res = compute(c);
    var el = target || document.documentElement;
    for (var k in res.vars) el.style.setProperty(k, res.vars[k]);
    if (el === document.documentElement) syncPageBackground();
    if (el === document.documentElement) { el.setAttribute('data-theme-mode', res.dark ? 'dark' : 'light'); window.QulifeThemeEngine.current = { name: name, color: c }; }
    return res;
  }

  function syncPageBackground() {
    if (!document.body) return;
    var bg = getComputedStyle(document.documentElement).getPropertyValue('--site-background').trim();
    if (!bg) return;
    document.body.style.background = bg;
    [].forEach.call(document.querySelectorAll('.page'), function (el) { el.style.background = bg; });
  }

  window.QulifeThemeEngine = { compute: compute, apply: apply, contrast: contrast, parse: parse };
  window.QulifeApplyTheme = apply;   // نفس الاسم القديم عشان باقي الصفحات تشتغل

  // الصفحة الفرعية (iframe) تاخد الثيم الحالي من الرئيسية لو التخزين مقفول
  window.addEventListener('message', function (e) {
    if (e.data && e.data.qulife === 'init' && e.data.theme) { apply(e.data.theme.name, e.data.theme.color); try { window.dispatchEvent(new CustomEvent('qulife-theme-init', { detail: e.data.theme })); } catch (x) {} }
  });

  // طبّق الثيم المحفوظ فورا (قبل ما الصفحة ترسم) عشان ما يكون في وميض
  try { apply(localStorage.getItem('qulife_theme'), localStorage.getItem('qulife_theme_color')); }
  catch (e) { apply('Qulife', '#FF2E7E'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncPageBackground);
  else syncPageBackground();
})();
