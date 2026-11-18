(function () {
  'use strict';

  var CHAT_INDEX_KEY = 'qulife_ai_chats';
  var currentChatId = 'main';
  try { currentChatId = localStorage.getItem('qulife_ai_current') || 'main'; } catch (e) {}
  var STORAGE_KEY = 'qulife_ai_chat_' + currentChatId;
  var form = document.getElementById('chatForm');
  var input = document.getElementById('chatInput');
  var list = document.getElementById('userMessages');
  var thread = document.getElementById('chatThread');
  var send = document.getElementById('chatSend');
  var stop = document.getElementById('chatStop');
  var toast = document.getElementById('chatToast');
  var menu = document.getElementById('chatMenu');
  var searchPanel = document.getElementById('chatSearchPanel');
  var searchInput = document.getElementById('chatSearchInput');
  var searchCount = document.getElementById('chatSearchCount');
  var fileInput = document.getElementById('chatFiles');
  var attachmentList = document.getElementById('pendingAttachments');
  var imageInput = document.getElementById('chatImages');
  var addSheet = document.getElementById('addSheet');
  var chatHistory = document.getElementById('chatHistory');
  var pendingAttachments = [];
  var TITLE_KEY = 'qulife_ai_chat_title_' + currentChatId;
  var savedOnly = false;
  var timer, busy = false, controller = null;
  var searchMatches = [], searchIndex = -1;
  var scrollDown = document.getElementById('scrollDown');
  var charCount = document.getElementById('charCount');
  var footer = document.querySelector('.chat-footer');
  var typingJob = null, stick = true;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tx(key, fallback) { return window.QulifeChatI18n ? window.QulifeChatI18n.t(key, fallback) : (fallback || key); }

  var WELCOME_LINES = [
    'اكتب اللي في بالك… وأنا أرتّبه معك.',
    'فكرتك تبدأ بكلمة. خلّينا نكبرها سوا.',
    'أنا هنا عشان أخفّف عليك الطريق، خطوة خطوة.'
  ];
  var STICKERS = [
    ['blue-pebble-heart-warm.webp', 'فكرة دافئة'], ['funny-everyday-greetings-awkward-penguin-hi.webp', 'هلا بالفكرة'],
    ['blue-pebble-flipper-claps.webp', 'أحسنت'], ['funny-awkward-penguin-compliment.webp', 'كلام جميل'],
    ['blue-pebble-tiny-shiver.webp', 'خذها بهدوء'], ['funny-everyday-chat-awkward-penguin-brb-sign.webp', 'لحظة وأرجع']
  ];

  function chatMeta() {
    try { var rows = JSON.parse(localStorage.getItem(CHAT_INDEX_KEY) || '[]'); return Array.isArray(rows) ? rows : []; } catch (e) { return []; }
  }
  function saveChatMeta(rows) { try { localStorage.setItem(CHAT_INDEX_KEY, JSON.stringify(rows)); } catch (e) {} }
  function ensureChatMeta() {
    var rows = chatMeta();
    if (!rows.some(function (item) { return item.id === currentChatId; })) rows.unshift({ id: currentChatId, title: currentChatId === 'main' ? 'محادثتك الأولى' : 'محادثة جديدة', at: Date.now() });
    saveChatMeta(rows); return rows;
  }
  // ===== سجل المحادثات في السايدبار: بحث + تجميع حسب التاريخ + حذف =====
  var historyQuery = '';
  var TRASH_ICON = '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/></svg>';
  var CHAT_ICON = '<svg viewBox="0 0 24 24"><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-3-.5L4 20l1.5-3.5A7.5 7.5 0 1 1 20 11.5Z"/></svg>';
  function dayGroup(at) {
    var d = new Date(at), now = new Date();
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (d.getTime() >= start) return tx('today', 'اليوم');
    if (d.getTime() >= start - 86400000) return tx('yesterday', 'أمس');
    if (d.getTime() >= start - 6 * 86400000) return tx('week', 'آخر 7 أيام');
    return tx('older', 'أقدم');
  }
  function relTime(at) {
    var d = new Date(at); if (isNaN(d.getTime())) return '';
    var same = dayGroup(at) === 'اليوم';
    return new Intl.DateTimeFormat('ar', same ? { hour: 'numeric', minute: '2-digit' } : { day: 'numeric', month: 'short' }).format(d);
  }
  function renderChatHistory() {
    if (!chatHistory) return;
    chatHistory.replaceChildren();
    var q = historyQuery.trim().toLocaleLowerCase();
    var rows = ensureChatMeta().sort(function (a, b) { return b.at - a.at; }).filter(function (item) {
      return !q || String(item.title || '').toLocaleLowerCase().indexOf(q) !== -1;
    });
    if (!rows.length) {
      var empty = document.createElement('div'); empty.className = 'qs-empty';
      empty.textContent = q ? tx('emptySearch', 'لا توجد محادثة بهذا الاسم') : tx('empty', 'لا توجد محادثات بعد');
      chatHistory.appendChild(empty); return;
    }
    var lastGroup = '';
    rows.forEach(function (item, index) {
      var group = dayGroup(item.at);
      if (group !== lastGroup) { var label = document.createElement('div'); label.className = 'qs-group'; label.textContent = group; chatHistory.appendChild(label); lastGroup = group; }
      var row = document.createElement('div'); row.className = 'qs-row' + (item.id === currentChatId ? ' active' : ''); row.style.setProperty('--i', Math.min(index, 10));
      var button = document.createElement('button'); button.type = 'button'; button.className = 'qs-item';
      button.innerHTML = '<span class="qs-item-icon">' + CHAT_ICON + '</span><span class="qs-item-text"><span class="qs-item-title"></span><span class="qs-item-time"></span></span>';
      button.querySelector('.qs-item-title').textContent = item.title || tx('newChat', 'محادثة جديدة');
      button.querySelector('.qs-item-time').textContent = relTime(item.at);
      button.addEventListener('click', function () { switchChat(item.id); });
      var del = document.createElement('button'); del.type = 'button'; del.className = 'qs-del'; del.innerHTML = TRASH_ICON;
      del.setAttribute('aria-label', tx('deleteChat', 'حذف المحادثة')); del.title = tx('deleteChat', 'حذف المحادثة');
      del.addEventListener('click', function (event) { event.stopPropagation(); deleteChat(item.id); });
      row.appendChild(button); row.appendChild(del); chatHistory.appendChild(row);
    });
  }
  // حذف محادثة كاملة من الجهاز (ولو كانت الحالية نفتح غيرها أو نبدأ جديدة)
  function deleteChat(id) {
    if (!window.confirm('هل تريد حذف هذه المحادثة نهائيًا من هذا الجهاز؟')) return;
    try { localStorage.removeItem('qulife_ai_chat_' + id); localStorage.removeItem('qulife_ai_chat_title_' + id); } catch (e) {}
    var rows = chatMeta().filter(function (item) { return item.id !== id; }); saveChatMeta(rows);
    if (id === currentChatId) { if (rows.length) switchChat(rows.sort(function (a, b) { return b.at - a.at; })[0].id); else createChat(); }
    else renderChatHistory();
    notify(tx('deleted', 'تم حذف المحادثة'));
  }
  // عنوان تلقائي من أول رسالة + رفع المحادثة لأعلى القائمة عند كل رسالة
  function touchChat(firstText) {
    var rows = chatMeta().map(function (item) {
      if (item.id !== currentChatId) return item;
      var isDefault = !item.title || item.title === 'محادثة جديدة' || item.title === 'محادثتك الأولى';
      var title = isDefault && firstText ? firstText.replace(/\s+/g, ' ').slice(0, 38) : item.title;
      if (isDefault && firstText) { try { localStorage.setItem(TITLE_KEY, title); } catch (e) {} }
      return Object.assign({}, item, { title: title, at: Date.now() });
    });
    saveChatMeta(rows); applyChatTitle(); renderChatHistory();
  }
  // بطاقة المستخدم في أسفل السايدبار (الاسم والصورة من التخزين المشترك)
  function loadSidebarUser() {
    var nameEl = document.getElementById('sidebarUserName'), avatar = document.getElementById('sidebarAvatar');
    if (!nameEl || !avatar) return;
    // نقرأ كل تخزين لوحده (لو واحد تالف نجرب الثاني) مثل dashboard.js
    var u = null;
    [localStorage, sessionStorage].forEach(function (store) {
      if (u && u.firstName) return;
      try { var v = JSON.parse(store.getItem('qulife_user_name') || 'null'); if (v) u = v; } catch (e) {}
    });
    var first = u && u.firstName ? String(u.firstName) : 'user name';
    var full = u && u.lastName ? first + ' ' + u.lastName : first;
    nameEl.textContent = full; avatar.textContent = first.charAt(0).toUpperCase();
    try {
      var img = localStorage.getItem('qulife_profile_image');
      if (img) { avatar.textContent = ''; var im = document.createElement('img'); im.alt = ''; im.src = img; avatar.appendChild(im); }
    } catch (e) {}
  }
  function switchChat(id) {
    currentChatId = id; STORAGE_KEY = 'qulife_ai_chat_' + id; TITLE_KEY = 'qulife_ai_chat_title_' + id;
    try { localStorage.setItem('qulife_ai_current', id); } catch (e) {}
    savedOnly = false; applyChatTitle(); render(); renderChatHistory(); closeSidebar(); notify(tx('opened', 'تم فتح المحادثة'));
  }
  function createChat() {
    var id = 'chat-' + Date.now().toString(36); currentChatId = id; STORAGE_KEY = 'qulife_ai_chat_' + id; TITLE_KEY = 'qulife_ai_chat_title_' + id;
    try { localStorage.setItem('qulife_ai_current', id); localStorage.removeItem(TITLE_KEY); } catch (e) {}
    var rows = chatMeta(); rows.unshift({ id: id, title: 'محادثة جديدة', at: Date.now() }); saveChatMeta(rows.slice(0, 20));
    savedOnly = false; pendingAttachments = []; renderPendingAttachments(); applyChatTitle(); render(); renderWelcome(); renderChatHistory(); closeSidebar(); input.value = ''; resizeInput(); updateSendState(); input.focus();
  }
  function renderWelcome() {
    var copy = document.getElementById('welcomeCopy'), stickers = document.getElementById('welcomeStickers'), hero = document.getElementById('stickerHero');
    var stickerStart = Math.abs(currentChatId.split('').reduce(function (n, c) { return n + c.charCodeAt(0); }, 0)) % STICKERS.length;
    if (hero) { hero.innerHTML = '<img src="../../Pictures/Stickers/' + STICKERS[stickerStart][0] + '" alt="' + STICKERS[stickerStart][1] + '" /><span>' + STICKERS[stickerStart][1] + '</span>'; }
    if (copy) copy.innerHTML = WELCOME_LINES[Math.floor(Math.random() * WELCOME_LINES.length)] + '<br><span>شنو نبدأ به اليوم؟</span>';
    if (stickers) stickers.replaceChildren();
  }

  var ICONS = {
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    speak: '<path d="M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    like: '<path d="M7 14v-11M15 18.1 14 14H8.6a2 2 0 0 1-1.9-2.6l2-6A2 2 0 0 1 10.6 4H17v11l-2 6h-5a2 2 0 0 1-1.9-2.6L9 14"/>',
    dislike: '<path d="M7 10v11M15 5.9 14 10h5.4a2 2 0 0 1 1.9 2.6l-2 6A2 2 0 0 1 17.4 20H7V9l2-6h5a2 2 0 0 1 1.9 2.6L15 10"/>',
    regen: '<path d="M20 11a8 8 0 0 0-14.5-4.4L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.5 4.4l1.5-1.9M20 20v-4.5h-4.5"/>',
    save: '<path d="M6 4h12v17l-6-4-6 4z"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>'
  };
  function icon(name) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>'; }

  function esc(text) { return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function inlineMd(text) {
    return text.split(/(`[^`\n]+`)/).map(function (part) {
      if (part.length > 2 && part.charAt(0) === '`' && part.charAt(part.length - 1) === '`') return '<code>' + part.slice(1, -1) + '</code>';
      return part
        .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
        .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');
    }).join('');
  }

  function renderMarkdown(source) {
    var lines = String(source).replace(/\r\n?/g, '\n').split('\n'), out = [], i = 0, m;
    function codeBlock(lang, code) {
      return '<div class="code-block"><div class="code-head"><span>' + esc(lang || 'code') + '</span><button type="button" class="code-copy">' + icon('copy') + '<span>نسخ</span></button></div><pre><code>' + esc(code) + '</code></pre></div>';
    }
    while (i < lines.length) {
      var line = lines[i];
      if ((m = line.match(/^\s*```\s*([\w+#.-]*)\s*$/))) {
        var buf = []; i++;
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++; out.push(codeBlock(m[1], buf.join('\n'))); continue;
      }
      if (!line.trim()) { i++; continue; }
      if ((m = line.match(/^(#{1,6})\s+(.+)$/))) { out.push('<h' + (m[1].length <= 2 ? 3 : 4) + '>' + inlineMd(esc(m[2])) + '</h' + (m[1].length <= 2 ? 3 : 4) + '>'); i++; continue; }
      if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
      if (/^\s*>\s?/.test(line)) {
        var quote = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        out.push('<blockquote>' + inlineMd(esc(quote.join('\n'))).replace(/\n/g, '<br>') + '</blockquote>'); continue;
      }
      var bullet = /^\s*[-*\u2022]\s+/, numbered = /^\s*\d+[.)]\s+/;
      if (bullet.test(line) || numbered.test(line)) {
        var ordered = numbered.test(line), items = [], rx = ordered ? numbered : bullet;
        while (i < lines.length && rx.test(lines[i])) { items.push('<li>' + inlineMd(esc(lines[i].replace(rx, ''))) + '</li>'); i++; }
        out.push((ordered ? '<ol>' : '<ul>') + items.join('') + (ordered ? '</ol>' : '</ul>')); continue;
      }
      var para = [];
      while (i < lines.length && lines[i].trim() && !/^\s*(```|#{1,6}\s|>|[-*\u2022]\s|\d+[.)]\s)/.test(lines[i])) { para.push(lines[i]); i++; }
      if (!para.length) { para.push(lines[i]); i++; }
      out.push('<p>' + inlineMd(esc(para.join('\n'))).replace(/\n/g, '<br>') + '</p>');
    }
    return out.join('');
  }

  function nearBottom() { return thread.scrollHeight - thread.scrollTop - thread.clientHeight < 140; }
  function syncScrollButton() { if (scrollDown) scrollDown.hidden = nearBottom(); }
  function syncState() { document.body.classList.toggle('has-messages', readMessages().length > 0); }

  function readMessages() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(data)) return [];
      return data.filter(function (item) {
        return item && (item.kind === 'user' || item.kind === 'assistant') && typeof item.text === 'string';
      }).map(function (item, index) {
        if (!item.id) item.id = 'legacy-' + index;
        return item;
      });
    } catch (error) { return []; }
  }

  function writeMessages(rows) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(-40))); return true; }
    catch (error) { notify(tx('saveError', 'تعذّر حفظ المحادثة على هذا الجهاز.')); return false; }
  }

  function notify(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }

  function applyChatTitle() {
    var title = localStorage.getItem(TITLE_KEY);
    document.title = title ? title + ' - Qulife' : tx('newChat', 'محادثة جديدة') + ' - Qulife';
  }

  function scrollToLatest() {
    stick = true;
    requestAnimationFrame(function () { thread.scrollTop = thread.scrollHeight; syncScrollButton(); });
  }

  function resizeInput() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 200) + 'px';
  }

  function updateSendState() {
    send.disabled = busy || (!input.value.trim() && !pendingAttachments.length);
    if (charCount) {
      var len = input.value.length;
      charCount.hidden = len < 4500;
      charCount.textContent = len + ' / 5800';
    }
  }

  function renderPendingAttachments() {
    attachmentList.replaceChildren();
    attachmentList.hidden = !pendingAttachments.length;
    pendingAttachments.forEach(function (file) {
      var chip = document.createElement('div'); chip.className = 'attachment-chip';
      chip.insertAdjacentHTML('afterbegin', icon('file'));
      var name = document.createElement('span'); name.textContent = file.name;
      var remove = makeIconButton('close', 'إزالة ' + file.name, 'attachment-remove', function () {
        pendingAttachments = pendingAttachments.filter(function (item) { return item.id !== file.id; });
        renderPendingAttachments(); updateSendState();
      });
      chip.appendChild(name); chip.appendChild(remove); attachmentList.appendChild(chip);
    });
  }

  async function readSelectedFiles(files) {
    var allowed = /\.(txt|md|csv|json|log)$/i;
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (pendingAttachments.length >= 3) { notify(tx('maxFiles', 'يمكن إرفاق 3 ملفات كحد أقصى')); break; }
      if (!file.isImage && !allowed.test(file.name)) { notify(tx('supportedFiles', 'الملفات المدعومة: TXT وMD وCSV وJSON وLOG')); continue; }
      if (file.size > 512 * 1024) { notify(tx('fileTooLarge', 'حجم الملف أكبر من 512 كيلوبايت: ') + file.name); continue; }
      try {
        var content = file.isImage ? '[صورة مرفقة — ستُستخدم كمرجع بصري]' : await file.text();
        var used = pendingAttachments.reduce(function (sum, item) { return sum + item.content.length; }, 0);
        var remaining = Math.max(0, 4800 - used);
        if (!remaining) { notify(tx('attachmentLimit', 'وصلت المرفقات إلى حد النص المسموح')); break; }
        if (content.length > remaining) { content = content.slice(0, remaining); notify(tx('fileTrimmed', 'قُصّ محتوى ') + file.name + tx('toFit', ' ليلائم الحد المسموح')); }
        pendingAttachments.push({ id: 'file-' + Date.now() + '-' + i, name: file.name, content: content });
      } catch (error) { notify(tx('fileReadError', 'تعذّرت قراءة الملف: ') + file.name); }
    }
    renderPendingAttachments(); updateSendState(); fileInput.value = '';
  }

  function formatTime(item) {
    var date = item.at ? new Date(item.at) : new Date();
    return isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('ar', { hour: 'numeric', minute: '2-digit' }).format(date);
  }

  function copyText(text) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      notify(tx('copyUnavailable', 'النسخ غير متاح في هذا المتصفح'));
      return Promise.resolve(false);
    }
    return navigator.clipboard.writeText(text).then(function () { notify(tx('copied', 'تم النسخ')); return true; })
      .catch(function () { notify(tx('copyError', 'تعذّر النسخ')); return false; });
  }

  function speakText(text) {
    if (!('speechSynthesis' in window)) { notify(tx('speechUnavailable', 'القراءة الصوتية غير متاحة')); return; }
    window.speechSynthesis.cancel();
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar';
    window.speechSynthesis.speak(utterance);
  }

  function makeButton(label, className, action) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', action);
    return button;
  }

  function makeIconButton(name, label, className, action) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = icon(name);
    button.addEventListener('click', action);
    return button;
  }

  function setFeedback(id, value, button) {
    var rows = readMessages().map(function (item) {
      return item.id === id ? Object.assign({}, item, { feedback: item.feedback === value ? '' : value }) : item;
    });
    writeMessages(rows);
    var selected = rows.find(function (item) { return item.id === id; });
    button.setAttribute('aria-pressed', String(selected && selected.feedback === value));
    notify(selected && selected.feedback ? 'شكرًا على تقييمك' : 'تم إلغاء التقييم');
  }

  function toggleSaved(id, button) {
    var rows = readMessages().map(function (item) {
      return item.id === id ? Object.assign({}, item, { saved: !item.saved }) : item;
    });
    writeMessages(rows);
    var selected = rows.find(function (item) { return item.id === id; });
    var isSaved = !!(selected && selected.saved);
    button.setAttribute('aria-pressed', String(isSaved));
    button.title = isSaved ? 'إزالة الحفظ' : 'حفظ الرد';
    button.setAttribute('aria-label', button.title);
    notify(selected && selected.saved ? 'تم حفظ الرد' : 'أُزيل الرد من المحفوظات');
  }

  function editMessage(id) {
    var rows = readMessages();
    var index = rows.findIndex(function (item) { return item.id === id; });
    if (index < 0) return;
    input.value = rows[index].text;
    pendingAttachments = Array.isArray(rows[index].attachments) ? rows[index].attachments.map(function (file) {
      return { id: 'edit-' + file.name + '-' + Date.now(), name: file.name, content: file.content || '' };
    }) : [];
    writeMessages(rows.slice(0, index));
    render();
    renderPendingAttachments();
    resizeInput();
    updateSendState();
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    notify(tx('editAgain', 'عدّل رسالتك ثم أرسلها من جديد'));
  }

  function regenerateReply(id) {
    if (busy) return;
    var rows = readMessages();
    var index = rows.findIndex(function (item) { return item.id === id; });
    if (index < 0) return;
    rows = rows.slice(0, index);
    var pending = rows.slice().reverse().find(function (item) { return item.kind === 'user'; });
    if (!pending) { notify(tx('noReply', 'لا توجد رسالة لإعادة الرد عليها')); return; }
    pending.awaitingReply = true;
    writeMessages(rows);
    render();
    requestReply(rows, pending);
  }

  function appendMessage(item, opts) {
    var article, body, label, text, stamp;
    if (item.kind === 'assistant') {
      article = document.createElement('article');
      article.className = 'assistant-reply chat-message-item';
      article.dataset.messageId = item.id;
      body = document.createElement('div'); body.className = 'reply-body';
      text = document.createElement('div'); text.className = 'reply-text'; text.dir = 'auto';
      if (!(opts && opts.typing)) text.innerHTML = renderMarkdown(item.text);
      body.appendChild(text);
      if (item.at) { stamp = document.createElement('time'); stamp.className = 'reply-time'; stamp.textContent = formatTime(item); body.appendChild(stamp); }
      var actions = document.createElement('div'); actions.className = 'reply-actions';
      actions.appendChild(makeIconButton('copy', 'نسخ الرد', 'reply-icon', function () { copyText(item.text); }));
      actions.appendChild(makeIconButton('speak', 'قراءة بصوت', 'reply-icon', function () { speakText(item.text); }));
      var up = makeIconButton('like', 'أعجبني', 'reply-icon', function () { setFeedback(item.id, 'like', up); });
      var down = makeIconButton('dislike', 'لم يعجبني', 'reply-icon', function () { setFeedback(item.id, 'dislike', down); });
      up.setAttribute('aria-pressed', String(item.feedback === 'like'));
      down.setAttribute('aria-pressed', String(item.feedback === 'dislike'));
      actions.appendChild(up); actions.appendChild(down);
      actions.appendChild(makeIconButton('regen', 'إعادة الرد', 'reply-icon', function () { regenerateReply(item.id); }));
      var keep = makeIconButton('save', item.saved ? 'إزالة الحفظ' : 'حفظ الرد', 'reply-icon', function () { toggleSaved(item.id, keep); });
      keep.setAttribute('aria-pressed', String(!!item.saved));
      actions.appendChild(keep);
      body.appendChild(actions); article.appendChild(body);
    } else {
      article = document.createElement('article');
      article.className = 'user-message chat-message-item';
      article.dataset.messageId = item.id;
      article.dir = 'auto';
      var messageText = document.createElement('span'); messageText.className = 'user-message-text'; messageText.textContent = item.text;
      article.appendChild(messageText);
      if (Array.isArray(item.attachments) && item.attachments.length) {
        var sentFiles = document.createElement('div'); sentFiles.className = 'sent-attachments';
        item.attachments.forEach(function (file) { var chip = document.createElement('span'); chip.className = 'sent-attachment'; chip.insertAdjacentHTML('beforeend', icon('file')); chip.appendChild(document.createTextNode(file.name)); sentFiles.appendChild(chip); });
        article.appendChild(sentFiles);
      }
      stamp = document.createElement('time'); stamp.textContent = formatTime(item); article.appendChild(stamp);
      article.appendChild(makeIconButton('edit', 'تعديل الرسالة', 'user-edit', function () { editMessage(item.id); }));
    }
    list.appendChild(article);
    return article;
  }

  function appendThinking() {
    var row = document.createElement('article');
    row.className = 'assistant-reply assistant-thinking chat-message-item';
    row.id = 'assistantThinking';
    var body = document.createElement('div'); body.className = 'reply-body';
    var dots = document.createElement('div'); dots.className = 'thinking-dots'; dots.setAttribute('aria-label', tx('typing', 'يكتب الرد'));
    for (var i = 0; i < 5; i++) { var heart = document.createElement('i'); heart.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 20S4 15.3 4 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.3 12 20 12 20Z"/></svg>'; dots.appendChild(heart); }
    body.appendChild(dots); row.appendChild(body); list.appendChild(row);
    return row;
  }

  function appendError(messageId) {
    var row = document.createElement('article'); row.className = 'assistant-reply is-error chat-message-item';
    var body = document.createElement('div'); body.className = 'reply-body';
    var text = document.createElement('div'); text.className = 'reply-text'; text.textContent = tx('retryHint', 'تحقق من اتصال الإنترنت ثم أعد المحاولة.');
    var retry = makeButton('إعادة المحاولة', 'retry-reply', function () {
      var rows = readMessages(); var pending = rows.find(function (item) { return item.id === messageId; });
      if (pending) requestReply(rows, pending);
    });
    body.appendChild(text); body.appendChild(retry);
    row.appendChild(body); list.appendChild(row);
  }

  function render() {
    list.replaceChildren();
    var rows = readMessages();
    if (savedOnly) rows = rows.filter(function (item) { return item.kind === 'assistant' && item.saved; });
    rows.forEach(function (row) { appendMessage(row); });
    syncState();
    scrollToLatest();
    if (searchInput && searchInput.value.trim()) runSearch();
  }

  async function requestReply(rows, pendingItem) {
    if (busy) return;
    busy = true; updateSendState(); send.hidden = true; stop.hidden = false;
    var thinking = appendThinking(); scrollToLatest();
    controller = new AbortController();
    try {
      var source = rows.filter(function (item) { return item.kind === 'user' || item.kind === 'assistant'; }).slice(-20);
      var history = [], totalChars = 0;
      for (var i = source.length - 1; i >= 0; i--) {
        var content = String(source[i].content || source[i].text);
        var remaining = 17500 - totalChars;
        if (remaining <= 0) break;
        if (content.length > remaining) content = content.slice(content.length - remaining);
        history.unshift({ role: source[i].kind === 'assistant' ? 'assistant' : 'user', content: content });
        totalChars += content.length;
      }
      var response = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }), signal: controller.signal
      });
      var result = await response.json().catch(function () { return {}; });
      if (!response.ok || !result.reply) throw new Error(result.error || 'AI request failed');
      var latest = readMessages().map(function (item) {
        return item.id === pendingItem.id ? Object.assign({}, item, { awaitingReply: false }) : item;
      });
      var assistant = { id: 'assistant-' + Date.now(), kind: 'assistant', text: String(result.reply).trim(), at: new Date().toISOString() };
      latest.push(assistant); writeMessages(latest); thinking.remove();
      var row = appendMessage(assistant, { typing: true }); scrollToLatest();
      await typeReply(row, assistant.text);
    } catch (error) {
      thinking.remove();
      if (error && error.name === 'AbortError') {
        writeMessages(readMessages().map(function (item) {
          return item.id === pendingItem.id ? Object.assign({}, item, { awaitingReply: false }) : item;
        }));
        notify(tx('stopped', 'تم إيقاف الرد'));
      } else appendError(pendingItem.id);
      scrollToLatest();
    } finally {
      controller = null; busy = false; stop.hidden = true;
      send.hidden = false; updateSendState(); input.focus();
    }
  }


  function typeReply(article, full) {
    var el = article.querySelector('.reply-text');
    if (reduceMotion || !full) { el.innerHTML = renderMarkdown(full); return Promise.resolve(); }
    return new Promise(function (resolve) {
      var pos = 0, step = Math.max(2, Math.ceil(full.length / 170)), frame = 0;
      article.classList.add('is-typing'); el.classList.add('typing');
      function finish() {
        cancelAnimationFrame(frame);
        el.innerHTML = renderMarkdown(full);
        el.classList.remove('typing'); article.classList.remove('is-typing');
        typingJob = null;
        if (stick) thread.scrollTop = thread.scrollHeight;
        syncScrollButton(); resolve();
      }
      function tick() {
        if (!el.isConnected) { typingJob = null; resolve(); return; }
        pos = Math.min(full.length, pos + step);
        el.innerHTML = renderMarkdown(full.slice(0, pos));
        if (stick) thread.scrollTop = thread.scrollHeight;
        if (pos >= full.length) finish(); else frame = requestAnimationFrame(tick);
      }
      typingJob = { finish: finish };
      frame = requestAnimationFrame(tick);
    });
  }

  function submitMessage(event) {
    if (event) event.preventDefault();
    if (busy) return;
    var text = input.value.trim();
    if (!text && !pendingAttachments.length) return;
    var attachments = pendingAttachments.map(function (file) { return { name: file.name, content: file.content }; });
    var displayText = text || 'أرفقت ملفات: ' + attachments.map(function (file) { return file.name; }).join('، ');
    var promptText = text || 'حلّل محتوى الملفات المرفقة وقدّم خلاصة مفيدة.';
    var fileText = attachments.map(function (file) { return 'محتوى الملف ' + file.name + ':\n' + file.content; }).join('\n\n');
    var content = promptText + (fileText ? '\n\n' + fileText : '');
    if (content.length > 5800) { content = content.slice(0, 5800); notify(tx('messageTrimmed', 'اختُصر محتوى الرسالة ليلائم الحد المسموح')); }
    var rows = readMessages();
    var item = { id: 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7), kind: 'user', text: displayText, content: content, attachments: attachments, at: new Date().toISOString(), awaitingReply: true };
    var isFirst = !rows.length; rows.push(item); rows = rows.slice(-40); writeMessages(rows); appendMessage(item); syncState(); touchChat(isFirst ? displayText : '');
    input.value = ''; pendingAttachments = []; renderPendingAttachments(); resizeInput(); updateSendState(); scrollToLatest();
    if (window.QulifeActivity) try { window.QulifeActivity.add('interaction', 'إرسال رسالة إلى Qulife AI', { kind: 'text' }); } catch (error) {}
    requestReply(rows, item);
  }

  function openSearch() {
    menu.hidden = true; searchPanel.hidden = false; searchInput.focus(); searchInput.select(); runSearch();
  }

  function runSearch() {
    var query = searchInput.value.trim().toLocaleLowerCase();
    Array.from(list.querySelectorAll('.chat-message-item')).forEach(function (el) { el.classList.remove('search-match', 'search-current'); });
    searchMatches = query ? Array.from(list.querySelectorAll('.chat-message-item')).filter(function (el) {
      return el.textContent.toLocaleLowerCase().includes(query);
    }) : [];
    searchIndex = searchMatches.length ? 0 : -1;
    searchCount.textContent = searchMatches.length ? '1 / ' + searchMatches.length : '0';
    searchMatches.forEach(function (el) { el.classList.add('search-match'); });
    if (searchMatches.length) { searchMatches[0].classList.add('search-current'); searchMatches[0].scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }

  function moveSearch(delta) {
    if (!searchMatches.length) return;
    if (searchMatches[searchIndex]) searchMatches[searchIndex].classList.remove('search-current');
    searchIndex = (searchIndex + delta + searchMatches.length) % searchMatches.length;
    searchMatches[searchIndex].classList.add('search-match', 'search-current');
    searchCount.textContent = (searchIndex + 1) + ' / ' + searchMatches.length;
    searchMatches[searchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function exportConversation() {
    var rows = readMessages();
    if (!rows.length) { notify(tx('noExport', 'لا توجد رسائل لتصديرها')); return; }
    var contents = rows.map(function (item) {
      return (item.kind === 'assistant' ? 'Qulife AI' : 'أنت') + ' — ' + formatTime(item) + '\n' + (item.content || item.text);
    }).join('\n\n');
    var blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob); var link = document.createElement('a');
    link.href = url; link.download = 'qulife-chat-' + new Date().toISOString().slice(0, 10) + '.txt';
    link.click(); URL.revokeObjectURL(url); notify(tx('exported', 'تم تصدير المحادثة'));
  }

  function copyConversation() {
    var rows = readMessages();
    var text = rows.map(function (item) { return (item.kind === 'assistant' ? 'Qulife AI' : 'أنت') + ': ' + (item.content || item.text); }).join('\n\n');
    if (!text) { notify(tx('noCopy', 'لا توجد رسائل لنسخها')); return; }
    copyText(text);
  }

  function exportJson() {
    var rows = readMessages();
    if (!rows.length) { notify(tx('noExport', 'لا توجد رسائل لتصديرها')); return; }
    var data = { app: 'Qulife AI', exportedAt: new Date().toISOString(), title: localStorage.getItem(TITLE_KEY) || '', messages: rows };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob); var link = document.createElement('a');
    link.href = url; link.download = 'qulife-chat-' + new Date().toISOString().slice(0, 10) + '.json';
    link.click(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000); notify(tx('jsonDownloaded', 'تم تنزيل نسخة JSON'));
  }

  function shareConversation() {
    var rows = readMessages();
    if (!rows.length) { notify(tx('noShare', 'لا توجد رسائل للمشاركة')); return; }
    var text = rows.map(function (item) { return (item.kind === 'assistant' ? 'Qulife AI' : 'أنت') + ': ' + item.text; }).join('\n\n');
    if (navigator.share) navigator.share({ title: localStorage.getItem(TITLE_KEY) || 'محادثة Qulife', text: text }).catch(function () {});
    else copyText(text);
  }

  function renameConversation() {
    var current = localStorage.getItem(TITLE_KEY) || '';
    var value = window.prompt('اكتب اسمًا للمحادثة (حتى 60 حرفًا):', current);
    if (value === null) return;
    value = value.trim().slice(0, 60);
    if (value) localStorage.setItem(TITLE_KEY, value); else localStorage.removeItem(TITLE_KEY);
    var metas = chatMeta().map(function (item) { return item.id === currentChatId ? Object.assign({}, item, { title: value || 'محادثة جديدة', at: Date.now() }) : item; }); saveChatMeta(metas);
    applyChatTitle(); renderChatHistory(); notify(value ? 'تم حفظ اسم المحادثة' : 'تمت إزالة اسم المحادثة');
  }

  function toggleSavedView() {
    var saved = readMessages().filter(function (item) { return item.kind === 'assistant' && item.saved; });
    if (!saved.length && !savedOnly) { notify(tx('noSaved', 'لم تحفظ أي رد بعد')); return; }
    savedOnly = !savedOnly; render(); menu.hidden = true;
    notify(savedOnly ? 'تعرض الردود المحفوظة فقط' : 'تعرض المحادثة كاملة');
  }

  function showStats() {
    var rows = readMessages();
    var users = rows.filter(function (item) { return item.kind === 'user'; }).length;
    var replies = rows.filter(function (item) { return item.kind === 'assistant'; }).length;
    var chars = rows.reduce(function (sum, item) { return sum + (item.content || item.text).length; }, 0);
    window.alert('إحصائيات المحادثة\nرسائلك: ' + users + '\nردود Qulife: ' + replies + '\nعدد الأحرف المحفوظة: ' + chars);
  }

  function clearConversation() {
    if (!readMessages().length) { notify(tx('alreadyEmpty', 'المحادثة فارغة بالفعل')); return; }
    if (!window.confirm('هل تريد مسح جميع رسائل هذه المحادثة من هذا الجهاز؟')) return;
    localStorage.removeItem(STORAGE_KEY); savedOnly = false; render(); menu.hidden = true; notify(tx('cleared', 'تم مسح المحادثة'));
  }

  function runTool(name) {
    menu.hidden = true;
    if (name === 'search') openSearch();
    else if (name === 'copy') copyConversation();
    else if (name === 'export') exportConversation();
    else if (name === 'json') exportJson();
    else if (name === 'share') shareConversation();
    else if (name === 'rename') renameConversation();
    else if (name === 'saved') toggleSavedView();
    else if (name === 'stats') showStats();
    else if (name === 'clear') clearConversation();
  }

  function closeSidebar() {
    if (!menu) return;
    menu.hidden = true;
    document.getElementById('sidebarBackdrop').hidden = true;
    document.getElementById('menuButton').setAttribute('aria-expanded', 'false');
  }
  function closeAddSheet() { if (addSheet) addSheet.hidden = true; }

  form.addEventListener('submit', submitMessage);
  input.addEventListener('input', function () { resizeInput(); updateSendState(); });
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); submitMessage(); }
  });
  document.getElementById('attachButton').addEventListener('click', function () {
    if (busy) { notify(tx('waitReply', 'انتظر اكتمال الرد قبل إرفاق ملفات أخرى')); return; }
    addSheet.hidden = false;
  });
  fileInput.addEventListener('change', function () { readSelectedFiles(Array.from(this.files || [])); });
  imageInput.addEventListener('change', function () { readSelectedFiles(Array.from(this.files || []).map(function (file) { file.isImage = true; return file; })); });
  document.getElementById('addFileOption').addEventListener('click', function () { closeAddSheet(); fileInput.click(); });
  document.getElementById('addImageOption').addEventListener('click', function () { closeAddSheet(); imageInput.click(); });
  document.getElementById('addFeatureOption').addEventListener('click', function () { closeAddSheet(); notify(tx('linkedFeatures', 'الميزات المرتبطة: الصوت، النشاط، الثيمات والمحادثات المتعددة')); });
  document.getElementById('addSheetClose').addEventListener('click', closeAddSheet);
  stop.addEventListener('click', function () { if (typingJob) typingJob.finish(); else if (controller) controller.abort(); });
  document.getElementById('menuButton').addEventListener('click', function () { if (menu.hidden) { loadSidebarUser(); historyQuery = ''; var hs = document.getElementById('sidebarSearch'); if (hs) hs.value = ''; renderChatHistory(); } menu.hidden = !menu.hidden; document.getElementById('sidebarBackdrop').hidden = menu.hidden; this.setAttribute('aria-expanded', String(!menu.hidden)); });
  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
  document.getElementById('sidebarBackdrop').addEventListener('click', closeSidebar);
  document.getElementById('sidebarNewChat').addEventListener('click', createChat);
  var sidebarSearch = document.getElementById('sidebarSearch');
  if (sidebarSearch) sidebarSearch.addEventListener('input', function () { historyQuery = this.value; renderChatHistory(); });
  document.querySelectorAll('[data-chat-tool]').forEach(function (button) { button.addEventListener('click', function () { runTool(this.dataset.chatTool); }); });
  document.getElementById('chatSearchClose').addEventListener('click', function () { searchPanel.hidden = true; searchInput.value = ''; runSearch(); });
  searchInput.addEventListener('input', runSearch);
  searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') { event.preventDefault(); moveSearch(event.shiftKey ? -1 : 1); }
  });
  document.getElementById('chatSearchPrev').addEventListener('click', function () { moveSearch(-1); });
  document.getElementById('chatSearchNext').addEventListener('click', function () { moveSearch(1); });
  document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') { event.preventDefault(); createChat(); return; }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); }
    if (event.key === 'Escape') {
      if (!searchPanel.hidden) { searchPanel.hidden = true; searchInput.value = ''; runSearch(); }
      else if (typingJob) typingJob.finish();
      else if (busy && controller) controller.abort();
      closeSidebar(); closeAddSheet();
    }
  });
  document.addEventListener('click', function (event) {
    if (!event.target.closest('#chatMenu') && !event.target.closest('#menuButton')) {
      closeSidebar();
    }
  });
  document.querySelectorAll('[data-action]').forEach(function (button) {
    button.addEventListener('click', function () {
      var action = this.dataset.action;
      var greeting = 'هلاا برو! نورت. كيفك؟ شنو الأخبار؟';
      if (action === 'copy') copyText(greeting);
      else if (action === 'speak') speakText(greeting);
      else if (action === 'share') {
        if (navigator.share) navigator.share({ title: 'Qulife AI', text: greeting }).catch(function () {});
        else copyText(greeting);
      } else if (action === 'like' || action === 'dislike') {
        var group = this.parentElement;
        group.querySelectorAll('[data-action="like"],[data-action="dislike"]').forEach(function (other) { other.setAttribute('aria-pressed', 'false'); });
        this.setAttribute('aria-pressed', 'true'); notify(tx('thanks', 'شكرًا على رأيك'));
      } else if (action === 'more') notify(tx('assistant', 'مساعد Qulife الذكي'));
    });
  });

  thread.addEventListener('scroll', function () { stick = nearBottom(); syncScrollButton(); }, { passive: true });
  if (scrollDown) scrollDown.addEventListener('click', function () { stick = true; thread.scrollTo({ top: thread.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' }); });
  list.addEventListener('click', function (event) {
    var btn = event.target.closest('.code-copy');
    if (!btn) return;
    var code = btn.closest('.code-block').querySelector('code').textContent;
    copyText(code).then(function (ok) {
      if (!ok) return;
      var label = btn.querySelector('span'); btn.querySelector('svg').outerHTML = icon('check'); label.textContent = tx('copied', 'تم النسخ');
      setTimeout(function () { if (!btn.isConnected) return; btn.querySelector('svg').outerHTML = icon('copy'); label.textContent = tx('copy', 'نسخ'); }, 1600);
    });
  });
  document.querySelectorAll('.suggestion').forEach(function (chip) {
    chip.addEventListener('click', function () {
      if (busy) return;
      input.value = this.dataset.prompt; resizeInput(); updateSendState(); submitMessage();
    });
  });
  ['dragenter', 'dragover'].forEach(function (name) { form.addEventListener(name, function (event) { event.preventDefault(); form.classList.add('drag-over'); }); });
  ['dragleave', 'drop'].forEach(function (name) { form.addEventListener(name, function (event) { event.preventDefault(); form.classList.remove('drag-over'); }); });
  form.addEventListener('drop', function (event) {
    if (busy) { notify(tx('waitReply', 'انتظر اكتمال الرد قبل إرفاق ملفات أخرى')); return; }
    var files = Array.from((event.dataTransfer && event.dataTransfer.files) || []);
    if (files.length) readSelectedFiles(files);
  });
  if (window.ResizeObserver && footer) new ResizeObserver(function () { document.body.style.setProperty('--footer-h', footer.offsetHeight + 'px'); syncScrollButton(); }).observe(footer);

  var voiceButton = document.getElementById('voiceButton');
  voiceButton.addEventListener('click', function () {
    var Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) { notify(tx('dictationUnavailable', 'الإملاء الصوتي غير مدعوم في هذا المتصفح')); return; }
    var recognition = new Speech(); recognition.lang = 'ar-SA'; recognition.interimResults = false; recognition.maxAlternatives = 1;
    document.body.classList.add('voice-listening');
    recognition.onresult = function (event) { input.value += (input.value ? ' ' : '') + event.results[0][0].transcript; input.dispatchEvent(new Event('input')); input.focus(); };
    recognition.onerror = function () { notify(tx('noVoice', 'لم يتم التقاط الصوت، حاول مرة أخرى')); };
    recognition.onend = function () { document.body.classList.remove('voice-listening'); };
    try { recognition.start(); } catch (error) { document.body.classList.remove('voice-listening'); notify(tx('voiceStartError', 'تعذّر بدء الإملاء الصوتي')); }
  });

  ensureChatMeta(); loadSidebarUser(); renderWelcome(); applyChatTitle(); render(); renderChatHistory(); renderPendingAttachments(); resizeInput(); updateSendState(); stop.hidden = true;
  var existing = readMessages();
  var pending = existing.slice().reverse().find(function (item) { return item.kind === 'user' && item.awaitingReply; });
  if (pending) requestReply(existing, pending);
})();
