/* Aric Brämswig — Scroll-Choreografie nach dwart.krakow.pl.
   Die Referenz nutzt ScrollMagic+TweenMax in einem #wrapper; hier dieselben Szenen
   (Startpunkt, Dauer in Viewport-Höhen, Zielwerte) nativ über einen rAF-Loop. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Loader + Intro ---------- */
  const loader = $('.loader'), h1 = $('.welcome h1'), scrollinfo = $('.welcome .scrollinfo');
  const start = Date.now();
  const intro = () => {
    loader.classList.add('done');
    document.body.classList.remove('locked');
    $$('.name > span', h1).forEach((s, i) => (s.style.transitionDelay = (i * 45) + 'ms'));
    h1.classList.add('in');
    setTimeout(() => scrollinfo.classList.remove('start'), 700);
    setTimeout(typeLoop, 900);
  };
  if (!reduce) document.body.classList.add('locked');
  addEventListener('load', () => setTimeout(intro, Math.max(0, 700 - (Date.now() - start))));

  /* ---------- Typewriter mit blinkendem Prompt ---------- */
  const type = $('.typeit .type'), prompt = $('.typeit .prompt');
  const phrases = ['Ich baue Marken', 'Ich führe Teams', 'Ich coache Unternehmer'];
  setInterval(() => prompt.classList.toggle('off'), 500);
  let pi = 0;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function typeLoop() {
    if (reduce) return;
    for (;;) {
      await wait(2600);
      const cur = phrases[pi], next = phrases[(pi = (pi + 1) % phrases.length)];
      let common = 0; while (cur[common] === next[common]) common++;
      for (let n = cur.length; n > common; n--) { type.textContent = cur.slice(0, n - 1); await wait(45); }
      for (let n = common; n <= next.length; n++) { type.textContent = next.slice(0, n); await wait(85); }
    }
  }

  /* ---------- Menü ---------- */
  const burger = $('.hamburger'), nav = $('nav');
  const setMenu = open => {
    nav.classList.toggle('show', open); burger.classList.toggle('is-active', open);
    burger.setAttribute('aria-expanded', open); burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('show')));
  addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));
  $$('a', nav).forEach(a => {
    const pr = $('.prompt', a); let t;
    a.addEventListener('mouseenter', () => { pr.classList.remove('off'); t = setInterval(() => pr.classList.toggle('off'), 500); });
    a.addEventListener('mouseleave', () => { clearInterval(t); pr.classList.add('off'); });
    a.addEventListener('click', () => setMenu(false));
  });

  /* ---------- Cursor (Kreis, difference, folgt mit Verzögerung) ---------- */
  if (matchMedia('(hover:hover) and (pointer:fine)').matches && CSS.supports('mix-blend-mode', 'difference')) {
    document.body.classList.add('custom-cursor');
    const c = $('.cursor'); let x = -100, y = -100, tx = -100, ty = -100;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    const loop = () => { x += (tx - x) / 9; y += (ty - y) / 9; c.style.left = x + 'px'; c.style.top = y + 'px'; requestAnimationFrame(loop); };
    loop();
    document.addEventListener('mouseover', e => c.classList.toggle('active', !!e.target.closest('a,button')));
  }

  /* ---------- Live-Intros: starten von vorn, sobald sie ins Bild kommen ---------- */
  const lives = $$('video.live');
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) { if (v.paused) { v.preload = 'auto'; try { v.currentTime = 0; } catch (_) {} v.play().catch(() => {}); } }
      else v.pause();
    }), { threshold: 0.35 });
    lives.forEach(v => io.observe(v));
  }

  if (reduce) return;

  /* ---------- Messen ---------- */
  const sqC = $('.square_conteiner'), sq = $('.square'), sqImg = $('.square img'),
        exp = $('.experience'), typeit = $('.typeit'), tl = $('.portfolio .timeline'),
        dateEl = $('.timeline .date'), portfolio = $('.portfolio');
  const letters = $$('.name > span', h1);
  const textSpans = letters.filter(s => s.classList.contains('text')).map(s => ({ el: s, from: s.textContent, to: s.dataset.word }));
  const secs = $$('.portfolio section').map(s => ({ s, dot: $('.dot', s), ttl: $('.ttl', s), img: $('.img', s), txt: $('.txt', s), date: s.dataset.date }));
  const tails = $$('.haltung, .about, .contact').map(s => ({ s, h2: $('h2', s) }));
  let d, vw, tlW, expW, M = {};
  const docTop = el => el.getBoundingClientRect().top + scrollY;
  function measure() {
    d = innerHeight; vw = innerWidth; tlW = tl.offsetWidth; expW = exp.offsetWidth;
    secs.forEach(o => { o.top = docTop(o.s); o.h2Top = docTop(o.ttl); });
    tails.forEach(o => (o.top = docTop(o.s)));
    M.pTop = docTop(portfolio); M.pEnd = M.pTop + portfolio.offsetHeight;
  }

  /* ---------- Szenen ---------- */
  let lastDate = null;
  function render() {
    const y = scrollY;
    // Welcome: Quadrat wächst (0→d), Container schrumpft auf Timeline-Breite (0→2d), Bild zoomt (0→2d)
    const p1 = clamp(y / d), p2 = clamp(y / (2 * d));
    sqC.style.width = lerp(vw, tlW, p2) + 'px';
    sq.style.width = (p1 * 100) + '%';
    sq.style.height = lerp(65, 100, p1) + '%';
    sqImg.style.height = lerp(100, 150, p2) + '%';
    scrollinfo.classList.toggle('hidden', y > 0);
    // Buchstaben fliegen auseinander (0→.5d) und verschwinden im difference-Blend
    const pl = clamp(y / (0.5 * d));
    letters.forEach((s, i) => {
      if (s.classList.contains('text')) { s.style.top = (s.dataset.dir === 'up' ? -1.5 : 1.5) * pl + 'em'; return; }
      s.style.top = (i % 2 ? 1.5 : -1.5) * pl + 'em';
      const c = Math.round(255 * (1 - pl)); s.style.color = `rgb(${c},${c},${c})`;
    });
    // Zwei Buchstaben schreiben sich zu Wörtern um (d/2 → d/2+1.25d)
    const pt = clamp((y - d / 2) / (1.25 * d));
    textSpans.forEach(t => {
      const n = Math.round(pt * t.to.length);
      t.el.textContent = n === 0 ? t.from : t.to.slice(0, n);
      t.el.style.left = lerp(0, parseFloat(t.el.dataset.shift), pt) + 'em';
    });
    // Typewriter schrumpft weg (0→.1d)
    const pty = clamp(y / (0.1 * d));
    typeit.style.transform = `scale(${1 - pty})`; typeit.style.opacity = 1 - pty;
    // Riesen-Zeile läuft von rechts nach links durch (0→2.8d)
    exp.style.transform = `translate(${-(expW + vw / 2) * clamp(y / (2.8 * d))}px,-50%)`;

    // Werdegang
    const pr = portfolio.getBoundingClientRect();
    nav.classList.toggle('white_bg', pr.top <= 0 && pr.bottom > 0);
    let cur = secs[0].date;
    // Wie die Referenz: margin-top des Bildes zieht Bild + Text im Layout nach oben
    // (Inhalt läuft schneller als der Scroll, ohne Lücke). Positionen daher live lesen.
    secs.forEach(o => {
      const top = o.s.getBoundingClientRect().top + y;
      const h2Top = o.ttl.parentNode.getBoundingClientRect().top + y;
      if (y >= top - 1) cur = o.date;
      o.dot.style.transform = `translateY(${clamp(y - top, 0, 0.5 * d)}px)`;
      const ph = clamp((y - (top - d / 2)) / (0.25 * d));
      o.ttl.style.transform = `translateX(${(ph - 1) * 100}%)`;
      const pi = clamp((y - (h2Top - d / 4)) / (2 * d));
      o.img.style.marginTop = vw < 769 ? '0px' : (-0.6 * d * pi) + 'px';
    });
    if (cur !== lastDate) { dateEl.innerHTML = `<span>${cur}</span>`; lastDate = cur; }
    // Schlusskapitel: Überschrift schiebt sich herein
    tails.forEach(o => {
      const ph = clamp((d * 0.75 - o.s.getBoundingClientRect().top) / (0.35 * d));
      o.h2.style.transform = `translateX(${(ph - 1) * 100}%)`;
    });
  }

  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { render(); ticking = false; }); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); render(); });
  document.fonts.ready.then(() => { measure(); render(); });
  addEventListener('load', () => { measure(); render(); });
  measure(); render();
})();
