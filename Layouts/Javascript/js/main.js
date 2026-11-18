// main.js - تسلسل شاشة البداية + مشاهد الانيميشن + زر Get started
// (حركات القلب في heart.js | فتح الصفحات في router.js)
(function () {
  var KEY = 'qulife_intro_done';            // علامة دائمة: شاشة البداية تظهر مرة واحدة فقط
  var $ = function (id) { return document.getElementById(id); };
  var seen = false;
  try { seen = localStorage.getItem(KEY) === '1'; } catch (e) {}

  // ===== ربط الثيمات بالصفحة الرئيسية (الحساب في theme-engine.js) =====
  function applyTheme(name, color) { window.QulifeApplyTheme(name, color); }
  var savedTheme = null;
  var savedColor = null;
  var savedLanguageCode = null;
  try {
    savedTheme = localStorage.getItem('qulife_theme');
    savedColor = localStorage.getItem('qulife_theme_color');
    savedLanguageCode = localStorage.getItem('qulife_language_code');
  } catch (e) {}
  window.QulifeTheme = { apply: applyTheme };
  window.addEventListener('message', function (e) {
    if (e.data && e.data.qulife === 'theme') applyTheme(e.data.name, e.data.color);
    if (e.data && e.data.qulife === 'language') {
      window.QulifeI18n.set(e.data.code, true);   // الترجمة تتطبق على الرئيسية فورا
      try { localStorage.setItem('qulife_language', e.data.name || 'English'); } catch (err) {}
    }
  });

  if (seen) {
    // ===== الحركة اتشافت قبل كده: نعرض الصفحة الرئيسية فورا بدون اعادة البداية =====
    $('splash').classList.add('hide');
    $('main').classList.add('show');
    $('pre-heart').classList.add('done');
    QulifeHeart.showNow();
  } else {
    // ===== 1 - شاشة البداية ثم 20 أيقونة يومية ثم القلب =====
    setTimeout(function () {
      $('splash').classList.add('hide');
      setTimeout(function () {
        $('main').classList.add('show');
        try { localStorage.setItem(KEY, '1'); } catch (e) {}
        var scenes = [].slice.call(document.querySelectorAll('.scene'));
        var s = 0;
        function showScene(i) { scenes.forEach(function (el, k) { el.classList.toggle('active', k === i); }); }
        showScene(0);
        // مؤقت واحد خفيف؛ الحركة نفسها تعمل عبر CSS على الـGPU.
        var timer = setInterval(function () {
          s++;
          if (s < scenes.length) { showScene(s); }
          else { clearInterval(timer); $('pre-heart').classList.add('done'); QulifeHeart.drop(); }
        }, 1100);
      }, 600);
    }, 3000);
  }

  // ===== 2 - زر Get started =====
  // يفتح صفحة التسجيل (sginup) فوق الرئيسية بدون اعادة تحميل (المحتوى مدموج داخل Index.html)
  $('startBtn').onclick = function (e) { e.currentTarget.blur(); window.QulifeRouter.open('signup', 'sginup.html'); };
})();
