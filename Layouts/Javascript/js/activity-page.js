(function () {
  'use strict';
  var list = document.getElementById('activityList');
  var empty = document.getElementById('activityEmpty');
  var count = document.getElementById('activityCount');
  var search = document.getElementById('activitySearch');
  var type = document.getElementById('activityType');
  var lastRows = [];

  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]; }); }
  function date(value) { try { return new Intl.DateTimeFormat(document.documentElement.lang || 'ar', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); } catch (e) { return value; } }
  function typeName(value) { return value === 'page_view' ? 'فتح صفحة' : value === 'setting' ? 'إعداد' : 'تفاعل'; }
  function render(rows) {
    lastRows = rows;
    count.textContent = rows.length;
    empty.hidden = !!rows.length;
    list.innerHTML = rows.map(function (row) {
      return '<article class="activity-row"><span class="activity-dot"></span><div><strong>' + esc(row.label || typeName(row.type)) + '</strong><small>' + esc(typeName(row.type)) + ' · ' + esc(date(row.timestamp)) + '</small></div><code>' + esc(row.path || '') + '</code></article>';
    }).join('');
  }
  function refresh() { QulifeActivity.list({ query: search.value, type: type.value }).then(render); }
  search.addEventListener('input', refresh);
  type.addEventListener('change', refresh);
  document.getElementById('clearBtn').addEventListener('click', function () {
    if (!confirm('حذف سجل النشاط المحلي بالكامل؟')) return;
    QulifeActivity.clear().then(refresh);
  });
  document.getElementById('exportBtn').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(lastRows, null, 2)], { type: 'application/json;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'qulife-activity-' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  refresh();
})();
