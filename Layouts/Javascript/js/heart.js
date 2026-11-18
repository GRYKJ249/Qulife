// heart.js - كل حركات القلب هنا (اتفصلت من main.js)
// الاستخدام: QulifeHeart.drop() ينزل القلب | QulifeHeart.showNow() يظهره فورا بدون حركة
(function () {
  var heart = document.getElementById('main-heart');
  if (!heart) return;
  // ===== 19 حركة بالدور عند الضغط على القلب =====
  var moves = ['beat-two','tilt-right','tilt-left','spin','bounce','shake','flip','wiggle','jump','swing','zoom','fast-beat','float','fade','stretch','squeeze','rotate-360','flip-y','pop'];
  var index = 0;
  // بعد ما ينزل القلب نثبته
  heart.addEventListener('animationend', function (e) {
    if (e.animationName === 'dropDown') { heart.classList.remove('drop'); heart.classList.add('landed'); }
  });
  function doMove() {
    heart.classList.remove.apply(heart.classList, moves);
    void heart.offsetWidth;                       // اعادة تشغيل الحركة
    heart.classList.add(moves[index]);
    index = (index + 1) % moves.length;
  }
  heart.addEventListener('click', doMove);
  heart.addEventListener('touchstart', function (e) { e.preventDefault(); doMove(); }, { passive: false });
  window.QulifeHeart = {
    drop: function () { heart.classList.add('show-heart'); setTimeout(function () { heart.classList.add('drop'); }, 100); },
    showNow: function () { heart.classList.add('show-heart', 'landed'); }
  };
})();
