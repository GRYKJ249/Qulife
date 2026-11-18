// themes.js - كود صفحة الثيمات
const input = document.getElementById('searchInput');
  const empty = document.getElementById('emptyState');
  const sheet = document.getElementById('sheet');
  const overlay = document.getElementById('overlay');
  const transRange = document.getElementById('transRange');
  const darkRange = document.getElementById('darkRange');
  const colorArea = document.getElementById('colorArea');
  const colorPointer = document.getElementById('colorPointer');
  const hueSlider = document.getElementById('hueSlider');
  const hueThumb = document.getElementById('hueThumb');
  let lastScrollY = window.scrollY;
  let shown = new Set();
  let ticking = false;
  let customCount = 0;
  let hue = 335, sat = 1, val = 1;
  let currentHex = '#FF2E7E';
  function getCards(){ return Array.from(document.querySelectorAll('.theme-card')); }
  function themeColor(card){
    if(card && card.id === 'customBtn') return currentHex;
    const name = card ? (card.getAttribute('data-name') || '') : '';
    if(/qulife dark/i.test(name)) return '#111827';
    if(/^Qulife/i.test(name)) return '#FF2E7E';
    const match = name.match(/([0-9a-f]{6})\s*$/i);
    return match ? '#' + match[1] : '#FF2E7E';
  }
  function saveTheme(card){
    const name = card ? card.querySelector('b').textContent : 'Qulife';
    const color = themeColor(card);
    try { localStorage.setItem('qulife_theme', name); localStorage.setItem('qulife_theme_color', color); } catch(e) {}
    if(window.QulifeApplyTheme) window.QulifeApplyTheme(name, color);
    if(window.parent !== window) window.parent.postMessage({ qulife:'theme', name:name, color:color }, '*');
  }
  function stairIn(card, order){
    if(shown.has(card)) return;
    shown.add(card);
    const step = order % 3;
    card.classList.remove('stair-0','stair-1','stair-2');
    card.classList.add('stair-' + step);
    card.style.transitionDelay = (step * 150) + 'ms';
    requestAnimationFrame(()=>{ setTimeout(()=>{ card.classList.add('show'); }, step * 150); });
  }
  function onScrollDown(){
    const y = window.scrollY;
    const goingDown = y > lastScrollY;
    lastScrollY = y;
    if(!goingDown) return;
    const vh = window.innerHeight;
    let order = 0;
    getCards().forEach((c)=>{
      if(c.style.display === 'none') return;
      if(shown.has(c)) return;
      const r = c.getBoundingClientRect();
      if(r.top < vh && r.bottom > 0){ stairIn(c, order); order++; }
    });
  }
  function resetStairs(list){
    shown.clear();
    list.forEach((c)=>{
      c.classList.remove('show','stair-0','stair-1','stair-2');
      c.style.transitionDelay = '0ms';
    });
    requestAnimationFrame(()=>{
      list.forEach((c,i)=>{
        const step = i % 3;
        c.classList.add('stair-' + step);
        c.style.transitionDelay = (step * 150) + 'ms';
        setTimeout(()=>{ c.classList.add('show'); shown.add(c); }, 50 + step * 150);
      });
    });
  }
  window.addEventListener('load', ()=>{ resetStairs(getCards()); });
  setTimeout(()=>{ resetStairs(getCards()); }, 80);
  // الحركة تعمل مرة واحدة عند فتح الصفحة فقط؛ لا نعيد تحريك البطاقات أثناء التمرير.
  function selectTheme(el){
    if(el.id === 'customBtn') return;
    document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    saveTheme(el);
  }
  function applyTheme(){
    const active = document.querySelector('.theme-card.active');
    if(active) saveTheme(active);
    qulifeBack();
  }
  function showAll(){
    empty.classList.remove('show');
    document.getElementById('qulifeWrap').style.display = 'block';
    document.getElementById('userStylesWrap').style.display = 'block';
    document.getElementById('mainDivider').style.display = 'block';
    document.getElementById('defaultWrap').style.display = 'block';
    document.getElementById('customBtn').style.display = 'flex';
    getCards().forEach(c=>{ c.style.display = 'flex'; });
    resetStairs(getCards());
  }
  function filterTheme(){
    const q = input.value.toLowerCase().trim();
    if(q === ''){ showAll(); return; }
    let visible = [];
    getCards().forEach(c=>{
      const name = (c.getAttribute('data-name') || '').toLowerCase();
      const match = name.includes(q);
      c.style.display = match ? 'flex' : 'none';
      if(match) visible.push(c);
    });
    const anyQulife = visible.some(c => c.closest('#qulifeWrap'));
    const anyUser = visible.some(c => c.closest('#userStylesWrap'));
    const anyDefault = visible.some(c => c.closest('#defaultWrap'));
    document.getElementById('qulifeWrap').style.display = anyQulife ? 'block' : 'none';
    document.getElementById('userStylesWrap').style.display = anyUser ? 'block' : 'none';
    document.getElementById('mainDivider').style.display = (anyQulife || anyUser) && anyDefault ? 'block' : 'none';
    document.getElementById('defaultWrap').style.display = anyDefault ? 'block' : 'none';
    if(visible.length === 0){
      empty.classList.remove('show');
      void empty.offsetWidth;
      empty.classList.add('show');
    } else {
      empty.classList.remove('show');
      resetStairs(visible);
    }
  }
  input.addEventListener('input', ()=>{ if(input.value.trim() === '') showAll(); });
  function openSheet(){
    sheet.classList.add('open');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    setTimeout(syncPickerUI, 50);
  }
  function closeSheet(){
    sheet.classList.remove('open');
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }
  let startY = 0, dragging = false;
  const handle = document.getElementById('sheetHandle');
  handle.addEventListener('touchstart', e=>{ dragging = true; startY = e.touches[0].clientY; }, {passive:true});
  handle.addEventListener('touchmove', e=>{
    if(!dragging) return;
    const dy = e.touches[0].clientY - startY;
    if(dy > 0) sheet.style.transform = 'translateY(' + dy + 'px)';
  }, {passive:true});
  handle.addEventListener('touchend', e=>{
    if(!dragging) return;
    dragging = false;
    const dy = e.changedTouches[0].clientY - startY;
    sheet.style.transform = '';
    if(dy > 80) closeSheet();
  });
  handle.addEventListener('mousedown', e=>{ dragging = true; startY = e.clientY; });
  window.addEventListener('mousemove', e=>{
    if(!dragging) return;
    const dy = e.clientY - startY;
    if(dy > 0) sheet.style.transform = 'translateY(' + dy + 'px)';
  });
  window.addEventListener('mouseup', e=>{
    if(!dragging) return;
    dragging = false;
    const dy = e.clientY - startY;
    sheet.style.transform = '';
    if(dy > 80) closeSheet();
  });
  function hsvToHex(h,s,v){
    const c = v * s;
    const x = c * (1 - Math.abs(((h/60) % 2) - 1));
    const m = v - c;
    let r=0,g=0,b=0;
    if(h < 60){ r=c; g=x; b=0; }
    else if(h < 120){ r=x; g=c; b=0; }
    else if(h < 180){ r=0; g=c; b=x; }
    else if(h < 240){ r=0; g=x; b=c; }
    else if(h < 300){ r=x; g=0; b=c; }
    else { r=c; g=0; b=x; }
    const to = (n)=> Math.round((n+m)*255).toString(16).padStart(2,'0');
    return ('#' + to(r) + to(g) + to(b)).toUpperCase();
  }
  function hexToRgb(hex){
    const h = hex.replace('#','');
    return { r: parseInt(h.substring(0,2),16), g: parseInt(h.substring(2,4),16), b: parseInt(h.substring(4,6),16) };
  }
  function applyDark(hex, dark){
    const c = hexToRgb(hex);
    const f = 1 - dark / 100;
    const r = Math.round(c.r * f), g = Math.round(c.g * f), b = Math.round(c.b * f);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function syncPickerUI(){
    colorArea.style.background = 'hsl(' + hue + ',100%,50%)';
    colorPointer.style.left = (sat * 100) + '%';
    colorPointer.style.top = ((1 - val) * 100) + '%';
    colorPointer.style.background = currentHex;
    hueThumb.style.left = (hue / 360 * 100) + '%';
    document.getElementById('hueVal').textContent = Math.round(hue) + '°';
  }
  function updatePreview(){
    currentHex = hsvToHex(hue, sat, val);
    const trans = parseInt(transRange.value);
    const dark = parseInt(darkRange.value);
    document.getElementById('transVal').textContent = trans + '%';
    document.getElementById('darkVal').textContent = dark + '%';
    const c = hexToRgb(currentHex);
    const f = 1 - dark / 100;
    const r = Math.round(c.r * f), g = Math.round(c.g * f), b = Math.round(c.b * f);
    const final = 'rgba(' + r + ',' + g + ',' + b + ',' + (trans/100) + ')';
    document.getElementById('chipPreview').style.background = final;
    document.getElementById('chipHex').textContent = currentHex;
    syncPickerUI();
  }
  function pickFromArea(e){
    const rect = colorArea.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    sat = Math.max(0, Math.min(1, (cx - rect.left) / rect.width));
    val = 1 - Math.max(0, Math.min(1, (cy - rect.top) / rect.height));
    updatePreview();
  }
  let picking = false;
  colorArea.addEventListener('touchstart', e=>{ picking = true; pickFromArea(e); }, {passive:true});
  colorArea.addEventListener('touchmove', e=>{ if(picking) pickFromArea(e); }, {passive:true});
  colorArea.addEventListener('touchend', ()=>{ picking = false; });
  colorArea.addEventListener('mousedown', e=>{ picking = true; pickFromArea(e); });
  window.addEventListener('mousemove', e=>{ if(picking && e.target !== handle) { if(document.getElementById('sheet').classList.contains('open')) pickFromArea(e); } });
  window.addEventListener('mouseup', ()=>{ picking = false; });
  function pickHue(e){
    const rect = hueSlider.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    hue = Math.max(0, Math.min(360, (cx - rect.left) / rect.width * 360));
    updatePreview();
  }
  let huePicking = false;
  hueSlider.addEventListener('touchstart', e=>{ huePicking = true; pickHue(e); }, {passive:true});
  hueSlider.addEventListener('touchmove', e=>{ if(huePicking) pickHue(e); }, {passive:true});
  hueSlider.addEventListener('touchend', ()=>{ huePicking = false; });
  hueSlider.addEventListener('mousedown', e=>{ huePicking = true; pickHue(e); });
  window.addEventListener('mousemove', e=>{ if(huePicking) pickHue(e); });
  window.addEventListener('mouseup', ()=>{ huePicking = false; });
  updatePreview();
  try {
    const saved = localStorage.getItem('qulife_theme');
    const savedCard = getCards().find(c => c.querySelector('b') && c.querySelector('b').textContent === saved);
    if (savedCard) {
      getCards().forEach(c => c.classList.remove('active'));
      savedCard.classList.add('active');
    }
  } catch (e) {}
  function createCustomTheme(){
    customCount++;
    const trans = parseInt(transRange.value);
    const dark = parseInt(darkRange.value);
    const bg = applyDark(currentHex, dark);
    const name = 'Style ' + customCount;
    const wrap = document.getElementById('userStylesWrap');
    const div = document.createElement('div');
    div.className = 'theme-card show';
    div.setAttribute('data-name', name.toLowerCase() + ' style custom ' + currentHex.toLowerCase());
    div.setAttribute('onclick', 'selectTheme(this)');
    div.innerHTML = '<div class="theme-preview"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="26" fill="' + bg + '" opacity="' + (trans/100) + '"/><circle cx="18" cy="18" r="7" fill="#fff" opacity=".35"/></svg></div><div><b>' + name + '</b></div><div class="theme-check"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="' + bg + '"/><path d="M7 12.5 L10.5 16 L17 8.5" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
    wrap.appendChild(div);
    try{ localStorage.setItem('qulife_custom_' + customCount, JSON.stringify({color:currentHex, trans:trans, dark:dark})); }catch(e){}
    closeSheet();
    document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
    div.classList.add('active');
    saveTheme(div);
    div.scrollIntoView({behavior:'smooth', block:'center'});
  }
