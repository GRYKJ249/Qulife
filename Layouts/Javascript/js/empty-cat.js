// empty-cat.js - صورة الحالة الفارغة المشتركة لصفحة اللغات والثيمات
(function () {
  var script = document.currentScript;
  var file = document.getElementById('searchInput') ? 'blue-pebble-no-way.webp' : 'funny-everyday-sigh-awkward-penguin.webp';
  var src = script ? new URL('../../../Pictures/' + file, script.src).href : '../../Pictures/' + file;
  var image = '<img class="qc-cat" src="' + src + '" alt="No results" draggable="false" aria-hidden="true">';
  [].forEach.call(document.querySelectorAll('[data-empty-cat]'), function (el) { el.innerHTML = image; });
})();
