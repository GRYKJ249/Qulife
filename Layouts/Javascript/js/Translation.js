// Translation.js - كود صفحة اللغات
const cards = Array.from(document.querySelectorAll('.lang-card'));
const input = document.getElementById('searchInput');
const empty = document.getElementById('emptyState');

let lastScrollY = window.scrollY;
let ticking = false;
let scrollDir = 'down';

// شريط البحث والنص الفوقو بس - ثابتين ما بتحركو زي واتساب - زر Apply Language ما اتلمس
const topEls = Array.from(new Set([
  ...document.querySelectorAll('.page-header, .page-title, h1, .subtitle, .page-subtitle, .header-text, .top-text, .search-wrap, .search-box'),
  input,
  input ? input.parentElement : null
].filter(Boolean)));

topEls.forEach((el) => {
  el.style.position = 'sticky';
  el.style.top = '0px';
  el.style.zIndex = '50';
  el.style.background = getComputedStyle(el).backgroundColor === 'rgba(0, 0, 0, 0)' ? '#fff' : getComputedStyle(el).backgroundColor;
});

if (input) {
  input.style.position = 'sticky';
  input.style.top = '0px';
  input.style.zIndex = '50';
}

function hideCard(c, dir) {
  c.classList.remove('show');
  c.style.transition = 'none';
  c.style.opacity = '0';
  c.style.transform = 'translateX(-32px)';
}

function showCard(c, delay) {
  c.style.transition = 'opacity 450ms ease, transform 450ms cubic-bezier(0.22, 1, 0.36, 1)';
  c.style.transitionDelay = delay + 'ms';
  requestAnimationFrame(() => {
    c.style.opacity = '1';
    c.style.transform = 'translateX(0)';
    c.classList.add('show');
  });
}

function updateOnScroll() {
  const vh = window.innerHeight;
  const y = window.scrollY;
  scrollDir = y >= lastScrollY ? 'down' : 'up';
  lastScrollY = y;

  cards.forEach((c) => {
    if (c.style.display === 'none') return;
    const r = c.getBoundingClientRect();
    const inView = r.top < vh - 20 && r.bottom > 20;

    if (inView && !c.classList.contains('show')) {
      const pending = cards.filter(x => x.style.display !== 'none' && !x.classList.contains('show'));
      const idx = pending.indexOf(c);
      const step = idx % 3;
      hideCard(c, scrollDir);
      void c.offsetWidth;
      showCard(c, step * 110);
    }

    if (!inView) {
      if (scrollDir === 'down' && r.top > vh) hideCard(c, 'down');
      if (scrollDir === 'up' && r.bottom < 0) hideCard(c, 'up');
    }
  });
}

function initCards() {
  scrollDir = 'down';
  cards.forEach((c) => {
    c.style.display = 'flex';
    hideCard(c, 'down');
  });
  requestAnimationFrame(() => {
    const vh = window.innerHeight;
    let visible = cards.filter((c) => {
      const r = c.getBoundingClientRect();
      return r.top < vh - 20 && r.bottom > 0;
    });
    visible.forEach((c, i) => {
      const step = i % 3;
      showCard(c, step * 110);
    });
  });
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateOnScroll();
    ticking = false;
  });
}

window.addEventListener('load', initCards);
setTimeout(initCards, 80);
// الحركة تعمل عند الدخول فقط حتى يبقى التمرير ثابتاً بلا غلتش.

function selectLang(el) {
  document.querySelectorAll('.lang-card').forEach((c) => {
    c.classList.remove('active');
    c.querySelector('.lang-check').textContent = '';
  });
  el.classList.add('active');
  el.querySelector('.lang-check').textContent = 'X';
  const name = el.querySelector('b').textContent;
  const code = (el.getAttribute('data-name') || '').split(' ')[0].toLowerCase();
  try { localStorage.setItem('qulife_language', name); localStorage.setItem('qulife_language_code', code); } catch (e) {}
  if (window.parent !== window) window.parent.postMessage({ qulife: 'language', name: name, code: code }, '*');
}

function showAll() {
  empty.classList.remove('show');
  cards.forEach((c) => { c.style.display = 'flex'; hideCard(c, 'down'); });
  requestAnimationFrame(() => {
    const vh = window.innerHeight;
    let visible = cards.filter((c) => {
      const r = c.getBoundingClientRect();
      return r.top < vh - 20 && r.bottom > 0;
    });
    visible.forEach((c, i) => showCard(c, (i % 3) * 110));
  });
}

function filterLang() {
  const q = input.value.toLowerCase().trim();
  if (q === '') { showAll(); return; }
  let visible = [];
  cards.forEach((c) => {
    const name = c.getAttribute('data-name').toLowerCase();
    const match = name.includes(q);
    c.style.display = match ? 'flex' : 'none';
    if (match) {
      visible.push(c);
      hideCard(c, 'down');
    }
  });
  if (visible.length === 0) {
    empty.classList.remove('show');
    void empty.offsetWidth;
    empty.classList.add('show');
  } else {
    empty.classList.remove('show');
    requestAnimationFrame(() => {
      visible.forEach((c, i) => showCard(c, (i % 3) * 110));
    });
  }
}

input.addEventListener('input', () => {
  if (input.value.trim() === '') showAll();
});
