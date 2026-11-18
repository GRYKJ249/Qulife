/* Qulife Activity Journal
 * يسجل أحداث Qulife داخل هذا الموقع فقط، ولا يقرأ حقول الإدخال أو كلمات المرور أو محتوى مواقع أخرى.
 */
(function (global) {
  'use strict';
  var DB_NAME = 'QulifeActivityDB';
  var DB_VERSION = 1;
  var STORE = 'events';
  var ready;

  function open() {
    if (ready) return ready;
    ready = new Promise(function (resolve, reject) {
      if (!global.indexedDB) return reject(new Error('IndexedDB غير متاح في هذا المتصفح'));
      var req = global.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          var store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('تعذر فتح قاعدة النشاط')); };
    });
    return ready;
  }

  function clean(value, max) {
    return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max || 160);
  }

  function add(type, label, meta) {
    var event = {
      type: clean(type, 40),
      label: clean(label, 160),
      source: 'Qulife',
      path: global.location.pathname,
      timestamp: new Date().toISOString()
    };
    if (meta && typeof meta === 'object') {
      event.meta = {};
      Object.keys(meta).slice(0, 8).forEach(function (key) {
        // لا نقبل نصوصًا من حقول النماذج إلى السجل
        if (!/password|token|secret|content|text|value|body/i.test(key)) event.meta[clean(key, 40)] = clean(meta[key], 120);
      });
    }
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).add(event);
        tx.oncomplete = resolve;
        tx.onerror = function () { reject(tx.error); };
      });
    }).catch(function () { /* السجل اختياري ولا يعطل التطبيق */ });
  }

  function list(filters) {
    filters = filters || {};
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
        req.onsuccess = function () {
          var rows = req.result || [];
          if (filters.type) rows = rows.filter(function (x) { return x.type === filters.type; });
          if (filters.query) {
            var q = String(filters.query).toLowerCase();
            rows = rows.filter(function (x) { return (x.label + ' ' + x.type + ' ' + x.path).toLowerCase().indexOf(q) >= 0; });
          }
          rows.sort(function (a, b) { return String(b.timestamp).localeCompare(String(a.timestamp)); });
          resolve(rows);
        };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function clear() {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).clear();
        tx.oncomplete = resolve;
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function install() {
    if (!global.document) return;
    add('page_view', document.title || global.location.pathname);
    document.addEventListener('click', function (e) {
      var target = e.target.closest && e.target.closest('a,button,[role="button"]');
      if (!target || target.closest('[data-activity-ignore]')) return;
      if (target.tagName === 'BUTTON' && /submit/i.test(target.type || '')) return;
      var label = target.getAttribute('aria-label') || target.getAttribute('data-activity-label') || target.textContent;
      if (label && label.trim()) add('interaction', label.trim());
    }, { passive: true });
  }

  global.QulifeActivity = { add: add, list: list, clear: clear, install: install };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})(window);
