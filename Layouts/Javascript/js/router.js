// router.js - فتح الصفحات (الثيمات / اللغات) فوق الصفحة الرئيسية بدون ما الموقع يتعاد من الاول
// الصفحة الرئيسية تفضل شغالة تحت => حركة البداية والقلب ما بتتكرر
(function () {
  var frame = null;
  function open(key, url) {
    if (frame) return;
    frame = document.createElement('iframe');
    frame.className = 'page-frame';
    // صفحة التسجيل تستخدم ملفها الحالي حتى تصل كل تحديثات CSS والثيمات فورًا؛
    // النسخة المضمنة القديمة كانت تمنع وصول إصلاحات الهاتف والتنسيقات الجديدة.
    var inline = key === 'signup' ? null : (window.QULIFE_INLINE && window.QULIFE_INLINE[key]);
    if (inline) frame.srcdoc = inline;
    else frame.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'v=20261118-layout2';
    // بعد التحميل نبعت اللغة والثيم الحاليين (لو التخزين داخل الـiframe مقفول)
    frame.addEventListener('load', function () {
      try {
        var th = window.QulifeThemeEngine && window.QulifeThemeEngine.current;
        frame.contentWindow.postMessage({ qulife: 'init', lang: window.QulifeI18n && window.QulifeI18n.lang, theme: th }, '*');
      } catch (e) {}
    });
    document.body.appendChild(frame);
    requestAnimationFrame(function () { requestAnimationFrame(function () { frame.classList.add('open'); }); });
  }
  function close() {
    if (!frame) return;
    var f = frame; frame = null;
    f.classList.remove('open');
    setTimeout(function () { f.remove(); }, 300);
  }
  // الصفحة المفتوحة بترسل رسالة 'close' لما المستخدم يضغط رجوع (من nav.js)
  window.addEventListener('message', function (e) { if (e.data && e.data.qulife === 'close') close(); });
  // نكشف open/close عشان main.js (زر Get started) يفتح صفحة التسجيل بنفس الطريقة
  window.QulifeRouter = { open: open, close: close };
  [].forEach.call(document.querySelectorAll('[data-page]'), function (el) {
    el.addEventListener('click', function () { open(el.dataset.page, el.dataset.url); });
  });
})();
