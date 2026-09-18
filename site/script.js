(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '919384005322';

  $('#year').textContent = new Date().getFullYear();

  /* ---------- theme: light / system / dark ---------- */
  const themeSwitch = $('.theme-switch');
  const storedTheme = (() => { try { return localStorage.getItem('lj-theme'); } catch (e) { return null; } })();
  let themeChoice = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'system';

  function applyTheme(choice) {
    themeChoice = choice;
    if (choice === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', choice);
    try {
      if (choice === 'system') localStorage.removeItem('lj-theme');
      else localStorage.setItem('lj-theme', choice);
    } catch (e) {}
    themeSwitch.dataset.active = choice;
    $$('button', themeSwitch).forEach(b =>
      b.setAttribute('aria-checked', b.dataset.themeChoice === choice));
  }
  $$('button', themeSwitch).forEach(b =>
    b.addEventListener('click', () => applyTheme(b.dataset.themeChoice)));
  applyTheme(themeChoice);


  /* ---------- hero headline: word by word ----------
     gradient-filled words (em.gold-text) are animated whole: splitting them
     into inline-block spans would break background-clip:text and hide them */
  const h1 = $('.hero h1');
  if (h1 && !reduceMotion) {
    const parts = [];
    [...h1.childNodes].forEach(node => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(chunk => {
          if (!chunk.trim()) { parts.push(document.createTextNode(chunk)); return; }
          const sp = document.createElement('span');
          sp.className = 'w';
          sp.textContent = chunk;
          parts.push(sp);
        });
      } else if (node.nodeType === 1) {
        node.classList.add('w');
        parts.push(node);
      } else {
        parts.push(node);
      }
    });
    h1.replaceChildren(...parts);
    let delay = 0;
    $$('.w', h1).forEach(w => { w.style.animationDelay = (delay += 90) + 'ms'; });
  }

  /* ---------- nav ---------- */
  const nav = $('.nav');
  const bar = $('.scroll-bar');
  const toTop = $('.to-top');
  const mobileBar = $('.mobile-bar');
  const glows = $$('.hero-glow');
  const archSm = $('.arch-sm');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 30);
    // tuck the bar away going down, bring it back coming up
    nav.classList.toggle('tucked', y > 400 && y > lastY && !document.body.classList.contains('menu-open'));
    lastY = y;
    const max = document.body.scrollHeight - innerHeight;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (toTop) toTop.classList.toggle('show', y > innerHeight * 1.2);
    // the sticky booking bar appears once the visitor is past the hero,
    // and hides again over the form so it never covers the submit button
    if (mobileBar) {
      const book = $('#book');
      const inForm = book && book.getBoundingClientRect().top < innerHeight * 0.6 &&
                     book.getBoundingClientRect().bottom > 0;
      mobileBar.classList.toggle('show', y > innerHeight * 0.85 && !inForm);
    }
    if (!reduceMotion) {
      glows.forEach((g, i) => { if (y < innerHeight * 1.5) g.style.transform = `translateY(${y * (i ? .12 : -.08)}px)`; });
      if (archSm) {
        const r = archSm.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) archSm.style.transform = `translateY(${(r.top - innerHeight / 2) * -.04}px)`;
      }
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  const toggle = $('.menu-toggle');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open);
    $('.mobile-menu').setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- hero carousel ---------- */
  const cards = $$('.stage-card');
  const dots = $('.stage-dots');
  let current = 0, timer;
  cards.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Look ${i + 1}`);
    b.addEventListener('click', () => go(i));
    dots.appendChild(b);
  });

  function layout() {
    const n = cards.length;
    const narrow = innerWidth < 600;
    cards.forEach((card, i) => {
      let d = i - current;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      const a = Math.abs(d);
      card.style.transform =
        `translate(-50%, -50%) translateX(${d * (narrow ? 30 : 38)}%) translateZ(${-a * 160}px) rotateY(${-d * 14}deg)`;
      card.style.opacity = a > 2 ? 0 : a === 2 ? .35 : 1;
      card.style.filter = a ? `saturate(.75) brightness(${1 - a * .1})` : 'none';
      card.style.zIndex = 10 - a;
      card.style.pointerEvents = a > 1 ? 'none' : 'auto';
      card.classList.toggle('is-active', d === 0);
      card.setAttribute('aria-hidden', d !== 0);
    });
    $$('button', dots).forEach((b, i) => b.setAttribute('aria-selected', i === current));
  }
  function go(i) { current = (i + cards.length) % cards.length; layout(); restart(); }
  function restart() { clearInterval(timer); if (!reduceMotion) timer = setInterval(() => go(current + 1), 4200); }

  cards.forEach((card, i) => card.addEventListener('click', () => i !== current && go(i)));
  $$('.stage-ui .round-btn').forEach(b => b.addEventListener('click', () => go(current + +b.dataset.dir)));
  const stage = $('.hero-stage');
  stage.addEventListener('mouseenter', () => clearInterval(timer));
  stage.addEventListener('mouseleave', restart);
  let sx = null;
  stage.addEventListener('touchstart', e => (sx = e.touches[0].clientX), { passive: true });
  stage.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
    sx = null;
  });
  addEventListener('resize', layout);
  layout(); restart();

  /* ---------- counters ---------- */
  const countUp = el => {
    const target = +el.dataset.count, dec = +(el.dataset.decimals || 0);
    if (reduceMotion) return (el.textContent = target.toFixed(dec));
    const t0 = performance.now(), dur = 1600;
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(() => (el.textContent = target.toFixed(dec)), dur + 300);
  };

  /* ---------- portfolio ---------- */
  const RATIO = { 'bridal-14': '3 / 2', 'editorial-11': '1 / 1', 'glam-9': '4 / 5', 'glam-11': '1 / 1',
    'star-15': '3 / 2', 'star-16': '3 / 2', 'bridal-25': '2 / 3' };
  const range = (prefix, n, labels) =>
    Array.from({ length: n }, (_, i) => {
      const id = `${prefix}-${i + 1}`;
      return { src: `assets/img/${id}.jpg`, cat: prefix, label: labels[i] || '', ratio: RATIO[id] || '3 / 4' };
    });

  const works = [
    ...range('bridal', 25, ['Royal Rajasthani Bride', 'Heirloom Bridal', 'Kanjeevaram Glow', 'Pongal Bride', 'Silk & Temple Gold', 'Muhurtham Radiance', 'Muhurtham Close-up', 'Traditional Bride', 'Garland Moment', 'White Wedding', 'Nikah Elegance', 'Emerald Bride', 'Magenta Lehenga', 'Soft Bridal Eyes', 'Diya Light', 'Rose & Emerald Silk', 'Temple Gold Portrait', 'Kanjeevaram Seated', 'Henna & Teal Silk', 'Muhurtham Garland', 'Veil & Lace', 'White Wedding Tiara', 'Bouquet Close-up', 'Amethyst Bride', 'Reception Couple']),
    ...range('editorial', 20, ['Golden Fairy', 'Golden Fairy II', 'Golden Fairy III', 'Warrior Queen', 'Warrior Queen II', 'Princess Concept', 'Candlelight Noir', 'Polka Couture', 'Polka Couture II', 'Emerald Gown', 'Rose Portrait', 'Disco Glam', 'Sisterhood', 'Maroon Trio', 'Royal Couple', 'Golden Fairy IV', 'Little Star', 'Spotlight Portrait', 'Divine Character', 'Street Couture']),
    ...range('glam', 13, ['Soft Party Glam', 'Glam Close-up', 'Brand Shoot', 'Brand Shoot II', 'Black Dress Glam', 'Christmas Saree', 'Glass-skin Glow', 'Rose & Gold', 'Couple Shoot', "Groom's Look", 'On Set Touch-Up', 'Peach Organza', 'Midnight Lehenga']),
    ...range('star', 16, ['Backstage moment', 'On set', 'Green room', 'With the team', 'Behind the scenes', 'On set', 'Backstage moment', 'Green room', 'On set', 'Behind the scenes', 'With the crew', 'Backstage moment', 'On set', 'Green room', 'Artist at work', 'Finishing touches']),
    ...range('tv', 14, ['Super Singer 11', 'Super Singer 11', 'Super Singer 11', 'Sequin Stage Look', 'Retro Lilac', 'Stage Ready', 'Festive Red', 'Monochrome Chic', 'Black & Gold', 'Black & Gold II', 'Night Glam', 'Ribbon Retro', 'On the Set', 'Super Singer Stage']),
  ];
  const byCat = ['bridal', 'editorial', 'glam', 'tv', 'star'].map(c => works.filter(w => w.cat === c));
  const allOrder = [];
  for (let i = 0; allOrder.length < works.length; i++) byCat.forEach(list => list[i] && allOrder.push(list[i]));

  const gallery = $('#gallery');
  const moreBtn = $('#loadMore');
  const PAGE = 24;
  let filter = 'all', shown = 0, visible = [];

  const listFor = f => (f === 'all' ? allOrder : works.filter(w => w.cat === f));
  const tileHTML = (w, i) =>
    `<figure class="tile" data-label="${w.label}" data-index="${i}" style="animation-delay:${Math.min(i % PAGE, 12) * 45}ms">
       <img src="${w.src}" alt="${w.label} — makeup by Lincy" loading="lazy" style="aspect-ratio:${w.ratio}" />
     </figure>`;

  // appends the next page instead of re-rendering, so nothing flickers or jumps
  function showMore(reset) {
    const list = listFor(filter);
    if (reset) { gallery.innerHTML = ''; shown = 0; visible = []; }
    const next = list.slice(shown, shown + PAGE);
    gallery.insertAdjacentHTML('beforeend', next.map((w, i) => tileHTML(w, shown + i)).join(''));
    shown += next.length;
    visible = list.slice(0, shown);
    moreBtn.hidden = shown >= list.length;
    moreBtn.textContent = `Show more looks (${list.length - shown} left)`;
  }
  $$('.chip').forEach(chip => chip.addEventListener('click', () => {
    $$('.chip').forEach(c => c.classList.toggle('active', c === chip));
    filter = chip.dataset.filter;
    showMore(true);
  }));
  moreBtn.addEventListener('click', () => showMore(false));
  showMore(true);

  /* ---------- lightbox ---------- */
  const lb = $('.lightbox'), lbImg = $('img', lb), lbCount = $('.lb-count', lb);
  let lbIndex = 0, lastFocus;
  const showLb = i => {
    lbIndex = (i + visible.length) % visible.length;
    lbImg.src = visible[lbIndex].src;
    lbImg.alt = visible[lbIndex].label;
    lbImg.style.animation = 'none'; void lbImg.offsetHeight; lbImg.style.animation = '';
    lbCount.textContent = `${visible[lbIndex].label.toUpperCase()} · ${lbIndex + 1} / ${visible.length}`;
  };
  const openLb = i => { lastFocus = document.activeElement; lb.hidden = false; document.body.style.overflow = 'hidden'; showLb(i); $('.lb-close').focus(); };
  const closeLb = () => { lb.hidden = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); };
  gallery.addEventListener('click', e => { const t = e.target.closest('.tile'); if (t) openLb(+t.dataset.index); });
  $('.lb-close').addEventListener('click', closeLb);
  $('.lb-nav.prev').addEventListener('click', () => showLb(lbIndex - 1));
  $('.lb-nav.next').addEventListener('click', () => showLb(lbIndex + 1));
  lb.addEventListener('click', e => e.target === lb && closeLb());
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') showLb(lbIndex - 1);
    if (e.key === 'ArrowRight') showLb(lbIndex + 1);
  });
  let lx = null;
  lb.addEventListener('touchstart', e => (lx = e.touches[0].clientX), { passive: true });
  lb.addEventListener('touchend', e => {
    if (lx === null) return;
    const dx = e.changedTouches[0].clientX - lx;
    if (Math.abs(dx) > 50) showLb(lbIndex + (dx < 0 ? 1 : -1));
    lx = null;
  });

  /* ---------- backstage: photos drift past on a loop ---------- */
  const strip = $('.strip');
  const STAR_COUNT = 14;   // 15 and 16 are landscape, they live in the gallery
  const stars = Array.from({ length: STAR_COUNT }, (_, i) =>
    `<figure><img src="assets/img/star-${i + 1}.jpg" alt="Lincy backstage on set" loading="lazy" draggable="false" /></figure>`).join('');
  // the set is rendered twice so the loop can restart seamlessly at -50%
  strip.innerHTML = `<div class="strip-track">${stars}${stars}</div>`;
  const track = $('.strip-track', strip);
  // slower on narrow screens so it stays readable
  track.style.animationDuration = (innerWidth < 700 ? 42 : 60) + 's';

  /* ---------- reels ---------- */
  const vio = new IntersectionObserver(entries => entries.forEach(en => {
    const v = en.target;
    if (en.isIntersecting && !reduceMotion) v.play().catch(() => {}); else v.pause();
  }), { threshold: .35 });

  $$('.phone').forEach(phone => {
    const v = $('video', phone);
    const btn = $('.play-btn', phone);
    const sync = () => phone.classList.toggle('playing', !v.paused);
    const toggleVid = () => { v.paused ? v.play().catch(() => {}) : v.pause(); };
    vio.observe(v);
    v.addEventListener('click', toggleVid);
    btn.addEventListener('click', toggleVid);
    ['play', 'pause'].forEach(ev => v.addEventListener(ev, sync));
    sync();
  });

  /* ---------- featured service card: photo shuffle every 3s ---------- */
  const shuffle = $('#serviceShuffle');
  if (shuffle && !reduceMotion) {
    const shots = $$('img', shuffle);
    let si = 0;
    setInterval(() => {
      shots[si].classList.remove('on');
      si = (si + 1) % shots.length;
      shots[si].classList.add('on');
    }, 3000);
  }

  /* ---------- before / after: one slider, many brides ----------
     To add another transformation, drop two photos in assets/img
     (e.g. ba-2-before.jpg + ba-2-after.jpg, same crop and size for both)
     and add a line to this list. Everything else is automatic.          */
  const BA = [
    { before: 'assets/img/ba-before.jpg', after: 'assets/img/ba-after.jpg', label: 'Trial makeup · soft glam' },
    { before: 'assets/img/ba-2-before.jpg', after: 'assets/img/ba-2-after.jpg', label: "Groom's makeover" },
  ];

  const ba = $('#ba');
  if (ba) {
    const clip = $('.ba-clip', ba), handle = $('.ba-handle', ba), rangeEl = $('.ba-range', ba);
    const beforeImg = $('.ba-before-img', ba), afterImg = $('.ba-after-img', ba);
    const caption = $('.ba-caption');
    const dots = $('.ba-dots');
    const nav = $('.ba-nav');
    let baIndex = 0;

    const setBA = pct => {
      const p = Math.max(0, Math.min(100, pct));
      clip.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
      handle.style.left = p + '%';
      rangeEl.value = p;
    };

    const showBA = i => {
      baIndex = (i + BA.length) % BA.length;
      const item = BA[baIndex];
      ba.classList.add('swapping');
      setTimeout(() => {
        beforeImg.src = item.before;
        afterImg.src = item.after;
        beforeImg.alt = `${item.label} — before`;
        afterImg.alt = `${item.label} — after`;
        ba.classList.remove('swapping');
      }, 220);
      caption.textContent = item.label;
      $$('button', dots).forEach((b, n) => b.setAttribute('aria-selected', n === baIndex));
      setBA(50);
    };

    if (BA.length > 1) {
      BA.forEach((item, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', item.label);
        b.addEventListener('click', () => showBA(i));
        dots.appendChild(b);
      });
      $$('[data-ba]').forEach(b => b.addEventListener('click', () => showBA(baIndex + +b.dataset.ba)));
    } else if (nav) {
      nav.hidden = true;
    }

    rangeEl.addEventListener('input', () => setBA(+rangeEl.value));
    const fromPointer = e => setBA(((e.clientX - ba.getBoundingClientRect().left) / ba.offsetWidth) * 100);
    let dragging = false;
    ba.addEventListener('pointerdown', e => { dragging = true; fromPointer(e); });
    ba.addEventListener('pointermove', e => { if (dragging) fromPointer(e); });
    addEventListener('pointerup', () => (dragging = false));
    showBA(0);
  }

  /* ---------- pricing → WhatsApp ---------- */
  const waLink = text => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
  $$('.price-list li').forEach(li => {
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    const ask = () => window.open(
      waLink(`Hi Lincy! 💖 I'd like to know more about the ${li.dataset.pkg.replace(/&amp;/g, '&')} package.`),
      '_blank', 'noopener');
    li.addEventListener('click', ask);
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ask(); } });
  });

  /* ---------- reveal + counters ---------- */
  const revealEl = el => {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    const h = el.matches('h2') ? el : null;
    if (h) h.classList.add('in');
    $$('[data-count]', el).forEach(countUp);
  };
  // threshold 0 so tall blocks (which can never fill a large share of a short
  // viewport) still reveal, and a timed fallback so content is never stuck hidden
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    revealEl(en.target);
    io.unobserve(en.target);
  }), { threshold: 0, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  // belt and braces: some browsers throttle IntersectionObserver in background
  // tabs, so a cheap scroll check makes sure nothing is ever stuck invisible
  let pending = $$('.reveal');
  let ticking = false;
  const sweep = () => {
    ticking = false;
    pending = pending.filter(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.95 && r.bottom > 0) { revealEl(el); return false; }
      return true;
    });
    if (!pending.length) {
      removeEventListener('scroll', onSweep);
      removeEventListener('resize', onSweep);
    }
  };
  const onSweep = () => { if (!ticking) { ticking = true; requestAnimationFrame(sweep); } };
  addEventListener('scroll', onSweep, { passive: true });
  addEventListener('resize', onSweep);
  addEventListener('load', () => setTimeout(sweep, 400));
  sweep();

  /* ---------- booking form → WhatsApp ---------- */
  const form = $('#bookForm');
  const note = $('.form-note', form);
  $('#f-date').min = new Date().toISOString().split('T')[0];

  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach(f => {
      const bad = !f.value.trim();
      f.classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) { note.textContent = 'Please add your name, event date and occasion ✨'; return; }

    const d = new FormData(form);
    const addons = d.getAll('addon');
    const date = new Date(d.get('date') + 'T00:00')
      .toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const lines = [
      `Hi Lincy! 💖 I'd love to book a makeover.`,
      ``,
      `Name: ${d.get('name')}`,
      `Occasion: ${d.get('occasion')}`,
      `Date: ${date}`,
      d.get('package') ? `Package: ${d.get('package')}` : null,
      d.get('location') ? `Venue/City: ${d.get('location')}` : null,
      addons.length ? `Add-ons: ${addons.join(', ')}` : null,
      d.get('message') ? `Notes: ${d.get('message')}` : null,
    ].filter(l => l !== null);
    note.textContent = 'Opening WhatsApp…';
    window.open(waLink(lines.join('\n')), '_blank', 'noopener');
  });
  $$('[required]', form).forEach(f => f.addEventListener('input', () => f.classList.remove('invalid')));
})();
