// Lower-page motion system: split-text reveals, scramble labels, drawn grid lines, velocity marquee,
// pinned word-swap statement, counters, hover-preview service list, sticky process with SVG plan drawing,
// magnetic button, custom cursor, outline wordmark draw, scroll-progress marker.
const fine = matchMedia('(pointer: fine)').matches;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function splitWords(el) {
  const walk = node => { [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) { const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(t => { if (!t) return; if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span'); w.className = 'w'; const i = document.createElement('span'); i.className = 'wi'; i.textContent = t; w.appendChild(i); frag.appendChild(w); });
      n.replaceWith(frag); }
    else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n); }); };
  walk(el); return el.querySelectorAll('.wi');
}
function splitChars(el) { const words = splitWords(el); const out = [];
  words.forEach(w => { const t = w.textContent; w.textContent = ''; [...t].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; w.appendChild(s); out.push(s); }); });
  return out; }
const GLYPHS = '#/[]{}<>—=+*_01';
function scramble(el, dur = .9) { const final = el.dataset.final || (el.dataset.final = el.textContent); if (reduced) { el.textContent = final; return; } const st = performance.now();
  const step = now => { const p = Math.min(1, (now - st) / (dur * 1000)); const n = Math.floor(final.length * p);
    el.textContent = final.slice(0, n) + [...final.slice(n)].map(c => c === ' ' ? ' ' : GLYPHS[Math.random() * GLYPHS.length | 0]).join('');
    if (p < 1) requestAnimationFrame(step); else el.textContent = final; }; requestAnimationFrame(step); }

export function setupLower(lenis) {
  const ST = { start: 'top 88%' };
  /* split headings: masked word rise */
  document.querySelectorAll('[data-split]').forEach(el => { const ws = splitWords(el);
    gsap.from(ws, { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: .035, scrollTrigger: { trigger: el, ...ST } }); });
  document.querySelectorAll('[data-split-chars]').forEach(el => { const cs = splitChars(el);
    gsap.from(cs, { yPercent: 110, rotate: 6, duration: 1, ease: 'power4.out', stagger: .02, scrollTrigger: { trigger: el, start: 'top 85%' } }); });
  /* scramble labels */
  document.querySelectorAll('[data-scramble]').forEach(el => ScrollTrigger.create({ trigger: el, start: 'top 92%', onEnter: () => scramble(el), onEnterBack: () => scramble(el, .5) }));
  /* drawn grid lines */
  gsap.utils.toArray('.gline').forEach(l => gsap.fromTo(l, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: l, start: 'top 95%' } }));

  /* gallery: clip reveal + parallax + index tag */
  gsap.utils.toArray('.proj').forEach((p, i) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 85%' } });
    tl.to(p.querySelector('.ph'), { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.out' })
      .from(p.querySelector('.meta'), { y: 20, autoAlpha: 0, duration: .8 }, '-=1')
      .add(() => scramble(p.querySelector('.tag'), .6), '-=1');
    if (!reduced) gsap.fromTo(p.querySelector('img'), { yPercent: -12, scale: 1.15 }, { yPercent: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* marquee driven by scroll velocity */
  const rows = [...document.querySelectorAll('.mq-row')].map(r => { const t = r.querySelector('.mq-track'); t.innerHTML += t.innerHTML; return { t, dir: +r.dataset.dir, x: 0 }; });
  let boost = 0;
  gsap.ticker.add((time, dt) => { const v = Math.abs(lenis.velocity || 0); boost += (Math.min(v, 60) - boost) * .1;
    const sd = Math.sign(lenis.direction || 1) || 1;
    rows.forEach(r => { const half = r.t.scrollWidth / 2; if (!half) return; r.x += r.dir * sd * (reduced ? 0 : (.6 + boost * .25)) * dt / 16;
      r.x = ((r.x % half) + half) % half; gsap.set(r.t, { x: -r.x }); }); });
  gsap.from('.mq-row', { xPercent: i => i ? 8 : -8, autoAlpha: 0, duration: 1.2, stagger: .1, scrollTrigger: { trigger: '.marquee', start: 'top 90%' } });

  /* statement: pinned word swap */
  const words = gsap.utils.toArray('.st-w'); const stIdx = document.getElementById('stIdx');
  const ticks = document.querySelector('.st-ticks'); for (let i = 0; i < 160; i++) { const t = document.createElement('i'); if (i % 10 === 0) t.className = 'big'; ticks.appendChild(t); }
  gsap.set(words, { yPercent: 105 }); gsap.set(words[0], { yPercent: 0 });
  const stl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: { trigger: '.statement', pin: '.st-pin', start: 'top top', end: '+=' + innerHeight * 2.4, scrub: .6,
    onUpdate: s => { stIdx.textContent = '0' + Math.min(4, 1 + Math.floor(s.progress * 3.999)) + ' / 04'; } } });
  for (let i = 1; i < words.length; i++) stl.to(words[i - 1], { yPercent: -105, duration: 1 }, i).to(words[i], { yPercent: 0, duration: 1 }, i);
  stl.to('.st-ticks', { xPercent: -40, ease: 'none', duration: words.length }, 0);
  stl.fromTo('.st-fixed', { opacity: .62 }, { opacity: 1, duration: 1 }, 0);

  /* counters */
  document.querySelectorAll('[data-count]').forEach(el => { const o = { v: 0 }, end = +el.dataset.count, suf = el.dataset.suffix || '';
    gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: () => el.textContent = Math.round(o.v).toLocaleString('en-US') + suf }); });
  gsap.from('.stat', { y: 40, autoAlpha: 0, duration: 1, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 85%' } });

  /* services: hover preview + accordion */
  const prev = document.getElementById('svcPreview'), pimg = prev.querySelector('img');
  const imgs = [...document.querySelectorAll('.proj')].map(a => a.dataset.preview);
  let px = 0, py = 0, tx = 0, ty = 0, pv = false;
  document.querySelectorAll('.svc-row').forEach(r => {
    r.addEventListener('mouseenter', () => { if (!fine) return; pimg.src = imgs[+r.dataset.img % imgs.length] || ''; pv = true; gsap.to(prev, { scale: 1, autoAlpha: 1, duration: .5, ease: 'expo.out' }); });
    r.addEventListener('mouseleave', () => { pv = false; gsap.to(prev, { scale: .6, autoAlpha: 0, duration: .4 }); });
    r.addEventListener('click', () => { const open = !r.classList.contains('open');
      document.querySelectorAll('.svc-row.open').forEach(o => { o.classList.remove('open'); o.querySelector('.svc-btn').setAttribute('aria-expanded', 'false'); const m = o.querySelector('.svc-more');
        gsap.to(m, { height: 0, duration: .6, ease: 'expo.inOut', onComplete: () => { m.hidden = true; ScrollTrigger.refresh(); } }); });
      if (open) { r.classList.add('open'); r.querySelector('.svc-btn').setAttribute('aria-expanded', 'true'); const m = r.querySelector('.svc-more'); m.hidden = false;
        gsap.fromTo(m, { height: 0 }, { height: 'auto', duration: .7, ease: 'expo.inOut', onComplete: () => ScrollTrigger.refresh() }); } });
  });
  gsap.from('.svc-row > h3, .svc-row > .desc, .svc-row > .num', { y: 30, autoAlpha: 0, duration: .9, stagger: .05, ease: 'power3.out', scrollTrigger: { trigger: '.svc-list', start: 'top 85%' } });


  /* contact */
  const form = document.getElementById('cform');
  gsap.from('.cform label, .magnet-wrap', { y: 30, autoAlpha: 0, duration: .9, stagger: .08, scrollTrigger: { trigger: form, start: 'top 90%' } });
  form.addEventListener('submit', e => { e.preventDefault(); form.classList.add('done');
    gsap.fromTo('.cform .ok path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: .8, ease: 'power2.out' }); gsap.from('.cform .ok p', { autoAlpha: 0, x: -10, duration: .6, delay: .3 }); });
  document.querySelectorAll('.magnet').forEach(b => { if (!fine) return; const inner = b.querySelector('.btn-in');
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      gsap.to(b, { x: x * .35, y: y * .45, duration: .5, ease: 'power3.out' }); gsap.to(inner, { x: x * .15, y: y * .15, duration: .5 }); });
    b.addEventListener('mouseleave', () => { gsap.to([b, inner], { x: 0, y: 0, duration: .8, ease: 'elastic.out(1,.4)' }); }); });

  /* footer: wordmark draw + column stagger + live clock */
  const wm = document.querySelector('.wordmark text');
  gsap.fromTo(wm, { strokeDashoffset: 1600 }, { strokeDashoffset: 0, duration: 3, ease: 'power2.inOut', scrollTrigger: { trigger: '.wordmark', start: 'top 95%' } });
  gsap.fromTo(wm, { fillOpacity: 0 }, { fillOpacity: .9, duration: 1.2, delay: 2.2, scrollTrigger: { trigger: '.wordmark', start: 'top 95%' } });
  gsap.from('.foot-col', { y: 40, autoAlpha: 0, duration: 1, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: '.foot', start: 'top 85%' } });
  gsap.from('.foot-bar > *', { y: 14, autoAlpha: 0, duration: .8, stagger: .06, scrollTrigger: { trigger: '.foot-bar', start: 'top 98%' } });
  const fc = document.getElementById('footClock');
  const tick = () => { fc.textContent = 'Bergen ' + new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit', second: '2-digit' }); }; tick(); setInterval(tick, 1000);

  /* custom cursor */
  const cur = document.getElementById('cursor'), lab = cur.querySelector('span');
  let cx = innerWidth / 2, cy = innerHeight / 2, mx = cx, my = cy;
  if (fine) { document.body.classList.add('has-cursor');
    // keyboard use hides the custom cursor so it can never sit over a focus ring; the mouse brings it back
    addEventListener('keydown', e => { if (e.key === 'Tab' || e.key.startsWith('Arrow') || e.key === 'Enter' || e.key === ' ') document.body.classList.add('kbd'); });
    addEventListener('pointermove', e => { document.body.classList.remove('kbd'); mx = e.clientX; my = e.clientY; tx = mx; ty = my; });
    document.addEventListener('pointerover', e => { const t = e.target.closest('[data-cursor]'); cur.classList.toggle('big', !!t); lab.textContent = t ? t.dataset.cursor : '';
      cur.classList.toggle('link', !t && !!e.target.closest('a,button,input,textarea')); }); }
  gsap.ticker.add(() => { const kc = reduced ? 1 : .2; if (Math.abs(mx - cx) + Math.abs(my - cy) > .1) { cx += (mx - cx) * kc; cy += (my - cy) * kc; cur.style.transform = `translate(${cx}px,${cy}px)`; }
    if (pv) { px += (tx - px) * .12; py += (ty - py) * .12; prev.style.transform = `translate(${px}px,${py}px)`; } });

  /* scroll progress marker */
  const sp = document.getElementById('sprog'), spn = sp.querySelector('span'), spi = sp.querySelector('i');
  // shown from the gallery down, hidden again once the footer comes into view (it would sit on the footer bar)
  const stWork = ScrollTrigger.create({ trigger: '#work', start: 'top 60%' }), stFoot = ScrollTrigger.create({ trigger: '.foot', start: 'top 85%' });
  const spVis = y => sp.classList.toggle('on', y >= stWork.start && y < stFoot.start);
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => { spn.textContent = String(Math.round(s.progress * 100)).padStart(3, '0'); spi.style.transform = `scaleX(${s.progress})`; spVis(s.scroll()); },
    onRefresh: s => spVis(s.scroll()) });

  // in-page links: smooth scroll, then move keyboard focus to the target (skip link, nav, back to top)
  document.querySelectorAll('a[href^="#"]:not([data-case])').forEach(a => a.addEventListener('click', e => { const t = document.querySelector(a.getAttribute('href')); if (!t) return; e.preventDefault();
    const focus = () => { if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); };
    if (reduced) { lenis.scrollTo(t, { immediate: true }); focus(); } else lenis.scrollTo(t, { duration: 1.6, onComplete: focus }); }));
}
