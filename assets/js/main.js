(function () {
  'use strict';

  var html = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var titles = { fa: 'علی بافنده | رزومه', en: 'Ali Bafandeh | Resume' };
  var intro = null;

  /* ---------- Language ---------- */
  var langButtons = document.querySelectorAll('[data-set-lang]');
  function syncLangButtons() {
    langButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-set-lang') === html.lang ? 'true' : 'false');
    });
  }
  function setLang(lang) {
    if (lang === html.lang) return;
    if (intro) intro.progress(1);
    html.lang = lang;
    html.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.title = titles[lang];
    try { localStorage.setItem('resume-lang', lang); } catch (e) {}
    syncLangButtons();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  langButtons.forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-set-lang')); });
  });
  syncLangButtons();

  /* ---------- Print / PDF ---------- */
  document.querySelectorAll('[data-print]').forEach(function (b) {
    b.addEventListener('click', function () { window.print(); });
  });
  window.addEventListener('beforeprint', function () { if (intro) intro.progress(1); });

  /* ---------- Sticky bar hairline ---------- */
  var topbar = document.querySelector('.topbar');
  function onScroll() { topbar.classList.toggle('is-stuck', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Image viewer ---------- */
  var viewer = document.getElementById('viewer');
  var viewerImg = viewer.querySelector('img');
  var lastTrigger = null;
  document.querySelectorAll('[data-zoom]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      lastTrigger = btn;
      viewerImg.src = btn.getAttribute('data-zoom');
      viewerImg.width = +btn.getAttribute('data-w');
      viewerImg.height = +btn.getAttribute('data-h');
      if (typeof viewer.showModal === 'function') viewer.showModal(); else viewer.setAttribute('open', '');
      if (window.gsap && !reduceMotion) {
        gsap.fromTo(viewerImg, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'power3.out' });
      }
    });
  });
  function closeViewer() {
    if (viewer.open) viewer.close();
  }
  viewer.querySelector('[data-close]').addEventListener('click', closeViewer);
  viewer.addEventListener('click', function (e) { if (e.target === viewer) closeViewer(); });
  viewer.addEventListener('close', function () { if (lastTrigger) lastTrigger.focus(); });

  /* ---------- Motion ---------- */
  function start() {
    if (reduceMotion || !window.gsap) return;
    var gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
    html.classList.add('motion');

    var isFa = function () { return html.lang === 'fa'; };

    /* Hero: one orchestrated entrance */
    var links = gsap.utils.toArray('.net .lk');
    links.forEach(function (l) {
      var len = Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value, l.y2.baseVal.value - l.y1.baseVal.value);
      l.style.strokeDasharray = len;
      l.style.strokeDashoffset = len;
    });
    var portraitImgs = gsap.utils.toArray('.p-layer img');
    gsap.set(portraitImgs, { xPercent: -50, x: 0, yPercent: 42 });

    var typeTargets = gsap.utils.toArray('[data-type]');
    var typeFull = typeTargets.map(function (el) { return el.textContent; });
    var activeType = typeTargets.filter(function (el) { return el.getAttribute('lang') === html.lang; })[0];
    var activeFull = activeType ? activeType.textContent : '';
    var role = document.querySelector('.role');
    var typer = { n: 0 };

    var name = document.querySelector('.name');
    var reveal = [document.querySelector('.now'), document.querySelector('.contact'), document.querySelector('.hero-actions')];

    intro = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: finishIntro
    });
    intro
      .from('.disc', { scale: 0.55, opacity: 0, duration: 0.9, ease: 'back.out(1.4)' }, 0)
      .from('.orbit', { opacity: 0, scale: 0.85, duration: 1, transformOrigin: '340px 370px' }, 0.2)
      .to(links, { strokeDashoffset: 0, duration: 0.8, stagger: 0.05, ease: 'power1.inOut' }, 0.35)
      .from('.net .nd', { scale: 0, transformOrigin: '50% 50%', duration: 0.45, stagger: 0.05, ease: 'back.out(2.5)' }, 0.6)
      .from('.net .tags text', { opacity: 0, y: 6, duration: 0.5, stagger: 0.08 }, 1.2)
      .to(portraitImgs, { yPercent: 0, duration: 1.1, ease: 'power4.out' }, 0.45)
      .fromTo(name,
        { clipPath: isFa() ? 'inset(-20% 0 -20% 100%)' : 'inset(-20% 100% -20% 0)' },
        { clipPath: 'inset(-20% 0% -20% 0%)', duration: 0.9, ease: 'power2.inOut', clearProps: 'clipPath' }, 0.7)
      .add(function () { role.classList.add('typing'); }, 1.45)
      .fromTo(typer, { n: 0 }, {
        n: activeFull.length, duration: Math.min(1.4, activeFull.length * 0.045), ease: 'none',
        onUpdate: function () { if (activeType) activeType.textContent = activeFull.slice(0, Math.round(typer.n)); }
      }, 1.45)
      .from(reveal, { opacity: 0, y: 14, duration: 0.6, stagger: 0.12 }, 2.0);

    if (activeType) activeType.textContent = '';

    function finishIntro() {
      typeTargets.forEach(function (el, i) { el.textContent = typeFull[i]; });
      setTimeout(function () { role.classList.remove('typing'); }, 1600);
      ambient();
    }

    /* Slow ambient motion around the portrait: the orbit turns, packets travel along links */
    var ambientStarted = false;
    function ambient() {
      if (ambientStarted) return;
      ambientStarted = true;
      gsap.to('.orbit', { rotation: 360, svgOrigin: '340 370', duration: 90, ease: 'none', repeat: -1 });
      gsap.utils.toArray('.net .pk').forEach(function (pk, i) {
        var a = pk.getAttribute('data-from').split(',').map(Number);
        var b = pk.getAttribute('data-to').split(',').map(Number);
        gsap.set(pk, { attr: { cx: a[0], cy: a[1] } });
        gsap.timeline({ repeat: -1, repeatDelay: 2.5 + i * 0.9, delay: i * 1.1 })
          .to(pk, { opacity: 1, duration: 0.2 })
          .to(pk, { attr: { cx: b[0], cy: b[1] }, duration: 1.6, ease: 'power1.inOut' }, 0)
          .to(pk, { opacity: 0, duration: 0.25 }, 1.4);
      });
    }

    if (!window.ScrollTrigger) return;

    /* Experience: the line fills as you read down; each role lights up when reached */
    gsap.fromTo('.tl-progress', { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 70%', scrub: 0.4 }
    });
    gsap.utils.toArray('.job').forEach(function (job) {
      ScrollTrigger.create({
        trigger: job, start: 'top 72%',
        onEnter: function () { job.classList.add('is-lit'); },
        onLeaveBack: function () { job.classList.remove('is-lit'); }
      });
    });

    /* Award: medal turns in, the certificate slides out from behind the trophy photo */
    var awardTl = gsap.timeline({
      scrollTrigger: { trigger: '.award', start: 'top 62%', once: true }
    });
    awardTl
      .from('.medal', { scale: 0.4, rotation: -120, opacity: 0, duration: 0.8, ease: 'back.out(1.6)' })
      .to('.medal .shine', { xPercent: 240, duration: 0.9, ease: 'power2.inOut' }, 0.5)
      .from('.shot-photo', { y: 60, opacity: 0, duration: 0.8, ease: 'power3.out' }, 0.1)
      .from('.shot-cert', {
        xPercent: function () { return isFa() ? 35 : -35; },
        yPercent: -30, rotation: 0, opacity: 0, duration: 1, ease: 'power3.out'
      }, 0.45);

    /* About: the standing photo drifts slightly slower than the page */
    gsap.fromTo('.about-figure img', { y: 36 }, {
      y: -24, ease: 'none',
      scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
