// composer.js - مربع الكتابة في الداشبورد: نفس خصائص مربع الشات الداخلي ويرسل الرسالة للذكاء الاصطناعي
// الفكرة: نجهز محادثة جديدة في نفس مفاتيح chat.js ثم نفتح chat.html وهو يرسل الرسالة للخادم /api/ai/chat
(function () {
  'use strict';

  // ===== العناصر =====
  var input = document.getElementById('aiInput');
  var sendBtn = document.getElementById('sendMessage');
  var voiceBtn = document.getElementById('recordBtn');
  var attachBtn = document.getElementById('attachBtn');
  var sheet = document.getElementById('attachSheet');
  var filePicker = document.getElementById('filePicker');
  var imagePicker = document.getElementById('imagePicker');
  var tray = document.getElementById('captureTray');
  var status = document.getElementById('captureStatus');
  var card = document.querySelector('.simple-composer');
  if (!input || !sendBtn) return;

  // ===== الحدود (نفس حدود chat.js بالضبط) =====
  var MAX_FILES = 3;            // أقصى عدد مرفقات
  var MAX_FILE_BYTES = 512 * 1024; // أقصى حجم للملف
  var MAX_ATTACH_CHARS = 4800;  // أقصى نص من الملفات
  var MAX_MESSAGE = 5800;       // أقصى طول للرسالة
  var TEXT_FILE = /\.(txt|md|csv|json|log)$/i;

  var attachments = []; // [{id, name, content, isImage}]
  var statusTimer = null;

  // ===== رسالة صغيرة تحت المربع =====
  function note(text) {
    if (!status) return;
    status.textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () { status.textContent = ''; }, 2600);
  }

  // ===== حجم المربع: يكبر مع النص لحد 150px (الحجم الأساسي ما بتغير) =====
  function resize() {
    input.style.height = '66px';
    input.style.height = Math.min(Math.max(input.scrollHeight, 66), 150) + 'px';
  }

  // ===== زر الإرسال يتعطل لو ما في نص ولا مرفقات =====
  function updateState() {
    var empty = !input.value.trim() && !attachments.length;
    sendBtn.disabled = empty;
    sendBtn.classList.toggle('is-disabled', empty);
    if (input.value.length >= 4500) status.textContent = input.value.length + ' / ' + MAX_MESSAGE;
  }

  // ===== عرض المرفقات كشرائح صغيرة =====
  var FILE_ICON = '<svg viewBox="0 0 24 24" fill="none"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 3v5h5" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  function renderChips() {
    tray.replaceChildren();
    tray.hidden = !attachments.length;
    attachments.forEach(function (file) {
      var chip = document.createElement('div');
      chip.className = 'dash-chip';
      chip.insertAdjacentHTML('afterbegin', FILE_ICON);
      var name = document.createElement('span');
      name.textContent = file.name;
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', 'إزالة ' + file.name);
      remove.addEventListener('click', function () {
        attachments = attachments.filter(function (a) { return a.id !== file.id; });
        renderChips(); updateState();
      });
      chip.appendChild(name); chip.appendChild(remove); tray.appendChild(chip);
    });
  }

  // ===== قراءة الملفات المختارة (نفس قواعد الشات) =====
  async function readFiles(files, isImage) {
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (attachments.length >= MAX_FILES) { note('يمكن إرفاق 3 ملفات كحد أقصى'); break; }
      if (!isImage && !TEXT_FILE.test(file.name)) { note('الملفات المدعومة: TXT وMD وCSV وJSON وLOG'); continue; }
      if (file.size > MAX_FILE_BYTES) { note('حجم الملف أكبر من 512 كيلوبايت: ' + file.name); continue; }
      try {
        var content = isImage ? '[صورة مرفقة — ستُستخدم كمرجع بصري]' : await file.text();
        var used = attachments.reduce(function (sum, a) { return sum + a.content.length; }, 0);
        var remaining = Math.max(0, MAX_ATTACH_CHARS - used);
        if (!remaining) { note('وصلت المرفقات إلى حد النص المسموح'); break; }
        if (content.length > remaining) { content = content.slice(0, remaining); note('قُصّ محتوى ' + file.name + ' ليلائم الحد المسموح'); }
        attachments.push({ id: 'file-' + Date.now() + '-' + i, name: file.name, content: content });
      } catch (e) { note('تعذّرت قراءة الملف: ' + file.name); }
    }
    renderChips(); updateState();
  }

  // ===== تجهيز محادثة جديدة بنفس مفاتيح chat.js ثم فتح الشات =====
  function send() {
    var text = input.value.trim();
    if (!text && !attachments.length) return;

    var files = attachments.map(function (f) { return { name: f.name, content: f.content }; });
    var displayText = text || 'أرفقت ملفات: ' + files.map(function (f) { return f.name; }).join('، ');
    var promptText = text || 'حلّل محتوى الملفات المرفقة وقدّم خلاصة مفيدة.';
    var fileText = files.map(function (f) { return 'محتوى الملف ' + f.name + ':\n' + f.content; }).join('\n\n');
    var content = promptText + (fileText ? '\n\n' + fileText : '');
    if (content.length > MAX_MESSAGE) content = content.slice(0, MAX_MESSAGE);

    var id = 'chat-' + Date.now().toString(36);
    var title = displayText.replace(/\s+/g, ' ').slice(0, 38) || 'محادثة جديدة';
    try {
      // 1) فهرس المحادثات (يظهر في السايدبار)
      var metas = JSON.parse(localStorage.getItem('qulife_ai_chats') || '[]');
      if (!Array.isArray(metas)) metas = [];
      metas.unshift({ id: id, title: title, at: Date.now() });
      localStorage.setItem('qulife_ai_chats', JSON.stringify(metas.slice(0, 20)));
      localStorage.setItem('qulife_ai_chat_title_' + id, title);
      // 2) الرسالة نفسها: awaitingReply يخلي الشات يرسلها للذكاء مباشرة عند الفتح
      var item = {
        id: 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        kind: 'user', text: displayText, content: content, attachments: files,
        at: new Date().toISOString(), awaitingReply: true
      };
      localStorage.setItem('qulife_ai_chat_' + id, JSON.stringify([item]));
      // 3) نخلي المحادثة الجديدة هي الحالية
      localStorage.setItem('qulife_ai_current', id);
    } catch (e) { note('تعذّر حفظ الرسالة على هذا الجهاز'); return; }

    if (window.QulifeActivity) { try { QulifeActivity.add('interaction', 'إرسال رسالة إلى Qulife AI', { kind: files.length ? 'file' : 'text' }); } catch (e) {} }
    sendBtn.disabled = true;
    window.location.href = 'chat.html';
  }

  // ===== الأحداث =====
  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); }
  });
  input.addEventListener('input', function () { resize(); updateState(); });

  // نافذة الإضافة (ملف / صورة)
  function closeSheet() { sheet.hidden = true; }
  attachBtn.addEventListener('click', function () { sheet.hidden = false; });
  document.querySelectorAll('[data-close-sheet]').forEach(function (el) { el.addEventListener('click', closeSheet); });
  document.getElementById('chooseFile').addEventListener('click', function () { closeSheet(); filePicker.click(); });
  document.getElementById('chooseImage').addEventListener('click', function () { closeSheet(); imagePicker.click(); });
  filePicker.addEventListener('change', function () { readFiles(Array.from(this.files || []), false); this.value = ''; });
  imagePicker.addEventListener('change', function () { readFiles(Array.from(this.files || []), true); this.value = ''; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  // سحب وإفلات الملفات على المربع
  if (card) {
    ['dragenter', 'dragover'].forEach(function (n) { card.addEventListener(n, function (e) { e.preventDefault(); card.classList.add('drag-over'); }); });
    ['dragleave', 'drop'].forEach(function (n) { card.addEventListener(n, function (e) { e.preventDefault(); card.classList.remove('drag-over'); }); });
    card.addEventListener('drop', function (e) {
      var files = Array.from((e.dataTransfer && e.dataTransfer.files) || []);
      var images = files.filter(function (f) { return /^image\//.test(f.type); });
      var texts = files.filter(function (f) { return !/^image\//.test(f.type); });
      if (texts.length) readFiles(texts, false);
      if (images.length) readFiles(images, true);
    });
  }

  // الإملاء الصوتي (نفس زر المايك داخل الشات)
  if (voiceBtn) voiceBtn.addEventListener('click', function () {
    var Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) { note('الإملاء الصوتي غير مدعوم في هذا المتصفح'); return; }
    var rec = new Speech(); rec.lang = 'ar-SA'; rec.interimResults = false; rec.maxAlternatives = 1;
    voiceBtn.classList.add('active');
    rec.onresult = function (e) { input.value += (input.value ? ' ' : '') + e.results[0][0].transcript; input.dispatchEvent(new Event('input')); input.focus(); };
    rec.onerror = function () { note('لم يتم التقاط الصوت، حاول مرة أخرى'); };
    rec.onend = function () { voiceBtn.classList.remove('active'); };
    try { rec.start(); } catch (e) { voiceBtn.classList.remove('active'); note('تعذّر بدء الإملاء الصوتي'); }
  });

  renderChips(); resize(); updateState();
})();
