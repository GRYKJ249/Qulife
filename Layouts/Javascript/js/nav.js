// nav.js - يتحمل في كل الصفحات: زر الرجوع + حماية التخزين
// ===== حماية: لو التخزين ممنوع نستخدم ذاكرة مؤقتة بدل ما الكود يوقف =====
['localStorage','sessionStorage'].forEach(function(n){
  try { window[n].getItem('x'); } catch(e) {
    var m = {};
    Object.defineProperty(window, n, { configurable:true, value:{
      getItem:function(k){ return k in m ? m[k] : null; },
      setItem:function(k,v){ m[k] = String(v); },
      removeItem:function(k){ delete m[k]; },
      clear:function(){ m = {}; } } });
  }
});
// ===== الثيم المشترك: الحساب كله صار في theme-engine.js (لازم يتحمل بعد nav.js مباشرة) =====
// ===== زر الرجوع: لو الصفحة مفتوحة فوق الرئيسية نقفلها بس (الرئيسية ما بتتعاد) =====
(function(){
  var me = document.currentScript && document.currentScript.src;
  window.qulifeBack = function(){
    if (window.parent !== window) { parent.postMessage({ qulife:'close' }, '*'); return; }
    try {
      if(localStorage.getItem('qulife_user_name') || sessionStorage.getItem('qulife_user_name') || document.cookie.indexOf('qulife_onboarded=1')!==-1){
        location.href = me ? new URL('../../Pages/dashboard.html', me).href : 'dashboard.html';
        return;
      }
    } catch(e) {}
    location.href = me ? new URL('../../Pages/Index.html', me).href : 'Index.html';
  };
})();
