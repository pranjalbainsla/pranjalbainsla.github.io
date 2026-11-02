/* DOM side: pixel icons, dialogue box, draggable terminal windows, bookshelf postcard, touch pad. */

const ICONS = {
  sunny: ['....y....', '.y.....y.', '...ooo...', '..oyyyo..', 'y.oyyyo.y', '..oyyyo..', '...ooo...', '.y.....y.', '....y....'],
  rain: ['..ggg....', '.ggggg.g.', 'ggggggggg', 'ggggggggg', '.........', '.b..y..b.', '....yy...', '.b..y..b.', '...y.....'],
  snow: ['....b....', '.b..b..b.', '..b.b.b..', '...bbb...', 'bbbbbbbbb', '...bbb...', '..b.b.b..', '.b..b..b.', '....b....'],
  autumn: ['.....oo..', '...ooooo.', '..oorooo.', '.oooroo..', '.ooroooo.', '.oroooo..', '.rooo....', 'r........', 's........'],
  night: ['...mmm..w', '..mm.....', '.mm....w.', '.mm......', '.mm......', '.mmm...m.', '..mmmmmm.', '...mmmm..', 'w........'],
  'sound-on': ['....c....', '...cc..c.', 'ccccc.c.c', 'ccccc..cc', 'ccccc.c.c', '...cc..c.', '....c....', '.........', '.........'],
  'sound-off': ['....c....', '...cc....', 'ccccc.c.c', 'ccccc..c.', 'ccccc.c.c', '...cc....', '....c....', '.........', '.........'],
  mail: ['.........', 'ccccccccc', 'cc.....cc', 'c.c...c.c', 'c..c.c..c', 'c...c...c', 'c.......c', 'ccccccccc', '.........'],
  github: ['.c.....c.', '.ccccccc.', 'ccccccccc', 'cc.ccc.cc', 'ccccccccc', '.ccccccc.', '..ccccc..', '.c.c.c.c.', '.........'],
  arrow: ['....c..', '.....c.', 'ccccccc', '.....c.', '....c..'],
  again: ['.cccc.c', 'c....cc', 'c...ccc', 'c......', 'c.....c', '.c...c.', '..ccc..'],
  close: ['c...c', '.c.c.', '..c..', '.c.c.', 'c...c'],
  // Postcard sprites (24x16 envelope frames; the flap sits in the top 6 rows)
  'envelope-closed': [
    '........................', '........................', '........................',
    '........................', '........................', '........................',
    'dddddddddddddddddddddddd',
    'dKKkkkkkkkkkkkkkkkkkkKKd',
    'dkkKKkkkkkkkkkkkkkkKKkkd',
    'dkkkkKKkkkkkkkkkkKKkkkkd',
    'dkkkkkkKKkkkkkkKKkkkkkkd',
    'dkkkkkkkkKxxxxKkkkkkkkkd',
    'dkkkkkkkkxxXXxxkkkkkkkkd',
    'dkkkkkkkkXxxxxXkkkkkkkkd',
    'dKKKKKKKKKXXXXKKKKKKKKKd',
    'dddddddddddddddddddddddd',
  ],
  'envelope-open': [ // back panel + raised flap; the card slides between this and the pocket
    '..........dddd..........',
    '........ddkxxkdd........',
    '......ddkkkkkkkkdd......',
    '....ddkkkkkkkkkkkkdd....',
    '..ddkkkkkkkkkkkkkkkkdd..',
    'ddkkkkkkkkkkkkkkkkkkkkdd',
    'dKKKKKKKKKKKKKKKKKKKKKKd',
    'dKKKKKKKKKKKKKKKKKKKKKKd',
    'dKKKKKKKKKKKKKKKKKKKKKKd',
    'dKKKKKKKKKKKKKKKKKKKKKKd',
    'dKKKKKKKKKKKKKKKKKKKKKKd',
    'dKKKKKKKKKKKKKKKKKKKKKKd',
    'dKKKKKKKKKKKKKKKKKKKKKKd',
    'dKKKKKKKKKKKKKKKKKKKKKKd',
    'dKKKKKKKKKKKKKKKKKKKKKKd',
    'dddddddddddddddddddddddd',
  ],
  'envelope-pocket': [
    '........................', '........................', '........................',
    '........................', '........................', '........................',
    'ddd..................ddd',
    'dkkdd..............ddkkd',
    'dkkkkdd..........ddkkkkd',
    'dkkkkkkdd......ddkkkkkkd',
    'dkkkkkkkkddddddkkkkkkkkd',
    'dkkkkkkkkkkkkkkkkkkkkkkd',
    'dkkkkkkkkkkkkkkkkkkkkkkd',
    'dkkkkkkkkkkkkkkkkkkkkkkd',
    'dKKKKKKKKKKKKKKKKKKKKKKd',
    'dddddddddddddddddddddddd',
  ],
  seal: [
    '.....xxxxxx.....',
    '...xxxxxxxxxx...',
    '..xeexxxxxxxxx..',
    '.xxxxXXXXXxxxxx.',
    'xxxxxXXxxXXxxxxx',
    'xxxxxXXxxXXxxxxx',
    'xxxxxXXxxXXxxxxx',
    'xxxxxXXXXXxxxxxx',
    'xxxxxXXxxxxxxxxX',
    'xxxxxXXxxxxxxxxX',
    'xxxxxXXxxxxxxxxX',
    '.xxxxXXxxxxxxxX.',
    '.xxxxxxxxxxxxxX.',
    '..xxxxxxxxxxxX..',
    '...xxxxxxxxxX...',
    '.....XXXXXX.....',
  ],
  'stamp-blue': stamp([
    'BBBBBBBBBBB',
    'BBBBBBByyBB',
    'BBBBBByyyyB',
    'BBBBBByyyyB',
    'BBBBBBByyBB',
    'BeeBBBBBBBB',
    'eeeeBBBBBBB',
    'BBBBBBBBBBB',
    'BBBBBdBBBBB',
    'BBBBdddBBBB',
    'BBBdddddBdB',
    'Bdddddddddd',
    'ddddddddddd',
  ]),
  'stamp-green': stamp([
    'GGGGGGGGGGG',
    'GGGGGeGGGGG',
    'GGGGeeeGGGG',
    'GGGeeeeeGGG',
    'GGeeeGeeeGG',
    'GGeeeGeeeGG',
    'GGeeeGeeeGG',
    'GGGeeGeeGGG',
    'GGGGeGeGGGG',
    'GGGGGkGGGGG',
    'GGGGGkGGGGG',
    'GGGGGGGGGGG',
    'GGGGGGGGGGG',
  ]),
  postmark: postmark(),
};
const ICON_COLORS = {
  c: 'currentColor', y: '#ffd84a', o: '#ffb547', g: '#9aa6bd', b: '#5fa8e8', r: '#ff5a4a', s: '#7a4a2b', m: '#ffd84a', w: '#c9b8e8',
  // postcard palette, shared with the :root tokens in style.css
  k: 'var(--kraft)', K: 'var(--kraft-dark)', x: 'var(--wax)', X: 'var(--wax-dark)', B: 'var(--stamp-blue)', G: 'var(--stamp-green)',
  p: 'var(--postmark)', e: 'var(--cream)', d: 'var(--plum)',
};

// Wraps a stamp's picture in a cream margin with checkered perforations. Use odd sizes so the teeth are symmetric.
function stamp(field) {
  const w = field[0].length + 4;
  const teeth = Array.from({ length: w }, (_, i) => (i % 2 ? '.' : 'e')).join('');
  const margin = 'e'.repeat(w - 2);
  const rows = [margin, ...field.map((f) => `e${f}e`), margin];
  return [teeth, ...rows.map((r, i) => { const t = i % 2 ? 'e' : '.'; return t + r + t; }), teeth];
}

// A round cancellation ring with three wavy lines trailing off to the right.
function postmark() {
  const ring = [
    '.....pppp.....', '...pp....pp...', '..p........p..', '.p..........p.', '.p..........p.',
    'p............p', 'p............p', 'p............p', 'p............p',
    '.p..........p.', '.p..........p.', '..p........p..', '...pp....pp...', '.....pppp.....',
  ];
  const a = '.pp..pp..pp.', b = 'p..pp..pp..p';
  const waves = { 3: a, 4: b, 6: a, 7: b, 9: a, 10: b };
  return ring.map((r, i) => r + (waves[i] || '.'.repeat(12)));
}

export function drawIcons() {
  document.querySelectorAll('[data-icon]').forEach((el) => {
    const rows = ICONS[el.dataset.icon];
    const w = Math.max(...rows.map((r) => r.length));
    let rects = '';
    rows.forEach((row, y) => {
      // one rect per run of same-coloured pixels
      for (let x = 0, n; x < row.length; x += n) {
        for (n = 1; row[x + n] === row[x]; n++);
        const fill = ICON_COLORS[row[x]];
        if (fill) rects += `<rect x="${x}" y="${y}" width="${n}" height="1" style="fill:${fill}"/>`;
      }
    });
    // grid size for CSS that sizes sprites in whole pixels (see the postcard section)
    el.style.setProperty('--w', w);
    el.style.setProperty('--h', rows.length);
    el.innerHTML = `<svg viewBox="0 0 ${w} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  });
}

// ---------------- Dialogue ----------------
export class Dialogue {
  constructor(sound) {
    this.el = document.getElementById('dialogue');
    this.nameEl = document.getElementById('dialogue-name');
    this.textEl = document.getElementById('dialogue-text');
    this.sound = sound;
    this.open = false;
    this.el.addEventListener('click', () => this.advance());
  }

  show(name, pages) {
    this.pages = Array.isArray(pages) ? [...pages] : [pages];
    this.nameEl.textContent = name;
    this.el.hidden = false;
    this.open = true;
    this.next();
  }

  next() {
    const text = this.pages.shift();
    clearInterval(this.timer);
    this.full = text;
    this.i = 0;
    this.textEl.textContent = '';
    this.typing = true;
    this.timer = setInterval(() => {
      this.i += 1;
      this.textEl.textContent = this.full.slice(0, this.i);
      if (this.i % 3 === 0) this.sound.blip(520 + Math.random() * 120, 0.03);
      if (this.i >= this.full.length) this.finishTyping();
    }, 24);
  }

  finishTyping() {
    clearInterval(this.timer);
    this.textEl.textContent = this.full;
    this.typing = false;
  }

  advance() {
    if (!this.open) return;
    if (this.typing) return this.finishTyping();
    if (this.pages.length) return this.next();
    this.close();
  }

  close() {
    clearInterval(this.timer);
    this.el.hidden = true;
    this.open = false;
  }
}

// ---------------- Terminal windows ----------------
export class Terminals {
  constructor(sound) {
    this.layer = document.getElementById('terminals');
    this.sound = sound;
    this.z = 10;
    this.count = 0;
  }

  get openCount() {
    return this.layer.children.length;
  }

  openProjects(projects, error) {
    if (this.openCount) {
      // Already open: bring them all forward instead of stacking duplicates.
      [...this.layer.children].forEach((w) => this.focus(w));
      return;
    }
    if (error || !projects.length) {
      this.open('readme.txt', [
        { t: 'guest@desk:~$ ', c: 'dim' }, { t: 'cat readme.txt\n' },
        { t: error ? "Couldn't load projects.json.\n" : 'No projects listed yet.\n', c: 'amber' },
        { t: error ? 'Serve this folder over http (GitHub Pages does this for you) and check the JSON is valid.\n' : 'Add entries to projects.json and refresh.\n' },
      ], 0);
      return;
    }
    projects.forEach((p, i) => {
      const segs = [
        { t: 'guest@desk:~$ ', c: 'dim' }, { t: `open ${slug(p.name)}\n\n` },
        { t: `${p.name}\n`, c: 'amber' },
        { t: `${p.description || ''}\n` },
      ];
      if (p.tags?.length) segs.push({ t: `\n[${p.tags.join('] [')}]\n`, c: 'dim' });
      if (p.link && /^https?:\/\//i.test(p.link)) segs.push({ t: '\nlink: ', c: 'dim' }, { t: p.link, link: p.link }, { t: '\n' });
      this.open(p.name, segs, i);
    });
  }

  open(title, segments, index) {
    const w = document.createElement('section');
    w.className = 'term';
    w.setAttribute('role', 'dialog');
    w.setAttribute('aria-label', title);
    w.innerHTML = `
      <div class="term-bar"><span class="term-title"></span><button class="term-close" type="button" aria-label="Close ${escapeHtml(title)}">x</button></div>
      <div class="term-body"></div>`;
    w.querySelector('.term-title').textContent = `${slug(title)}.sh`;
    this.layer.appendChild(w);

    // Cascade from the left so the room stays visible on the right.
    const vw = window.innerWidth, vh = window.innerHeight;
    const width = w.offsetWidth;
    const small = vw < 760;
    const x = small ? (vw - width) / 2 + index * 8 : Math.min(vw - width - 16, 32 + index * 70);
    const y = small ? 170 + index * 40 : Math.min(vh - 320, 140 + index * 64);
    w.style.left = `${Math.max(8, x)}px`;
    w.style.top = `${Math.max(8, y)}px`;

    this.focus(w);
    this.makeDraggable(w);
    w.addEventListener('pointerdown', () => this.focus(w));
    w.querySelector('.term-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.blip(330, 0.06);
      w.remove();
    });
    this.type(w.querySelector('.term-body'), segments, index * 240);
    this.sound.blip(880, 0.05);
  }

  focus(w) {
    this.z += 1;
    w.style.zIndex = this.z;
  }

  type(body, segments, delay) {
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    cursor.textContent = '█';
    body.appendChild(cursor);
    let si = 0, ci = 0, node = null;
    const step = () => {
      if (!body.isConnected) return;
      for (let n = 0; n < 2; n++) {
        const seg = segments[si];
        if (!seg) {
          // final prompt line
          const end = document.createElement('span');
          end.className = 'dim';
          end.textContent = '\nguest@desk:~$ ';
          body.insertBefore(end, cursor);
          return;
        }
        if (!node) {
          node = document.createElement(seg.link ? 'a' : 'span');
          if (seg.c) node.className = seg.c;
          if (seg.link) {
            node.href = seg.link;
            node.target = '_blank';
            node.rel = 'noopener noreferrer';
          }
          body.insertBefore(node, cursor);
        }
        node.textContent += seg.t[ci++];
        if (ci >= seg.t.length) { si++; ci = 0; node = null; }
      }
      setTimeout(step, 14);
    };
    setTimeout(step, delay);
  }

  makeDraggable(w) {
    const bar = w.querySelector('.term-bar');
    let sx, sy, ox, oy, id = null;
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.term-close')) return;
      id = e.pointerId;
      bar.setPointerCapture(id);
      sx = e.clientX; sy = e.clientY;
      ox = w.offsetLeft; oy = w.offsetTop;
    });
    bar.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      const nx = Math.min(window.innerWidth - 60, Math.max(-w.offsetWidth + 80, ox + e.clientX - sx));
      const ny = Math.min(window.innerHeight - 40, Math.max(0, oy + e.clientY - sy));
      w.style.left = `${nx}px`;
      w.style.top = `${ny}px`;
    });
    const end = (e) => { if (e.pointerId === id) id = null; };
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
  }

  closeAll() {
    this.layer.innerHTML = '';
  }
}

// ---------------- Postcard (bookshelf recommendations) ----------------
// Frame-stepped keyframes. The card's clip inset always equals its offset, so whatever is below
// the envelope's bottom edge stays hidden and the card looks like it rises out of the pocket.
const DROP_IN = [
  { transform: 'translateY(-70vh)' },
  { transform: 'translateY(0)', offset: 0.7 },
  { transform: 'translateY(-12px)', offset: 0.85 }, // one-frame bounce on landing
  { transform: 'translateY(0)' },
];
const DROP_AWAY = [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(25%)', opacity: 0 }];
const SLIDE_OUT = [
  { transform: 'translateY(100%)', clipPath: 'inset(0 0 100% 0)' },
  { transform: 'translateY(0)', clipPath: 'inset(0 0 0 0)' },
];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export class Postcard {
  constructor(sound) {
    this.el = document.getElementById('postcard');
    this.card = this.el.querySelector('.postcard');
    this.slide = this.el.querySelector('.pc-slide');
    this.envs = [...this.el.querySelectorAll('.pc-env')];
    this.noteEl = document.getElementById('pc-note');
    this.titleEl = document.getElementById('pc-title');
    this.fromEl = document.getElementById('pc-from');
    this.dateEl = document.getElementById('pc-date');
    this.countEl = document.getElementById('pc-count');
    this.link = document.getElementById('pc-visit');
    this.againBtn = document.getElementById('pc-again');
    this.closeBtn = document.getElementById('pc-close');
    this.sound = sound;
    this.open = false;
    this.busy = false;
    this.anims = [];
    this.run = 0;
    this.list = null;
    this.deck = [];
    this.dealt = 0;
    this.el.addEventListener('click', (e) => { if (!this.card.contains(e.target)) this.close(); });
    this.againBtn.addEventListener('click', () => this.another());
    this.closeBtn.addEventListener('click', () => this.close());
  }

  // Deal like a deck: every card once per shuffle, and a new shuffle never starts with the card just shown.
  draw(list) {
    if (list !== this.list) { this.list = list; this.deck = []; this.dealt = 0; }
    if (this.dealt >= this.deck.length) {
      const last = this.deck[this.deck.length - 1];
      this.deck = shuffle([...list]);
      this.dealt = 0;
      if (this.deck.length > 1 && this.deck[0] === last) [this.deck[0], this.deck[1]] = [this.deck[1], this.deck[0]];
    }
    return this.deck[this.dealt++];
  }

  show(list) {
    if (this.open) return;
    this.returnFocus = document.activeElement;
    this.fill(this.draw(list));
    this.el.hidden = false;
    this.open = true;
    document.body.classList.add('postcard-open');
    this.link.focus({ preventScroll: true });
    this.chime();
    this.sequence(async (go) => {
      this.setEnvelope('sealed');
      this.slide.classList.add('is-tucked');
      await go(this.playEnvelope(DROP_IN, 300, 7));
      await this.pullOut(go, 400);
    });
  }

  another() {
    if (!this.open || this.busy) return;
    const rec = this.draw(this.list);
    this.sequence(async (go) => {
      // the opening frames in reverse: envelope back up, card down into it, flap shut
      this.setEnvelope('open');
      await go(this.playEnvelope([...DROP_AWAY].reverse(), 120, 3));
      await go(this.play(this.slide, [...SLIDE_OUT].reverse(), 280, 8));
      this.slide.classList.add('is-tucked');
      this.setEnvelope('sealed');
      await go(wait(90));
      this.fill(rec);
      this.chime();
      await this.pullOut(go, 320);
    }, () => { this.fill(rec); this.chime(); });
  }

  // Flap open, card up out of the pocket, envelope drops away.
  async pullOut(go, ms) {
    this.setEnvelope('open');
    await go(wait(60));
    this.slide.classList.remove('is-tucked');
    await go(this.play(this.slide, SLIDE_OUT, ms, 8));
    await go(this.playEnvelope(DROP_AWAY, 120, 3));
  }

  // Runs one animation sequence; a newer sequence or close() makes the older one bail out.
  // With reduced motion the frames are skipped and only `instant` runs.
  async sequence(frames, instant) {
    const run = ++this.run;
    this.stop();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      instant?.();
      return this.rest();
    }
    this.busy = true;
    const go = async (p) => { await p; if (run !== this.run) throw new Error('stale'); };
    try {
      await frames(go);
    } catch { /* interrupted */ }
    if (run === this.run) this.rest();
  }

  rest() {
    this.stop();
    this.setEnvelope(null);
    this.slide.classList.remove('is-tucked');
    this.busy = false;
  }

  play(el, keyframes, ms, steps) {
    const a = el.animate(keyframes, { duration: ms, easing: `steps(${steps}, end)`, fill: 'forwards' });
    this.anims.push(a);
    return a.finished;
  }

  playEnvelope(keyframes, ms, steps) {
    return Promise.all(this.envs.map((el) => this.play(el, keyframes, ms, steps)));
  }

  stop() {
    this.anims.forEach((a) => a.cancel());
    this.anims = [];
  }

  setEnvelope(state) {
    this.el.classList.toggle('is-sealed', state === 'sealed');
    this.el.classList.toggle('is-open', state === 'open');
  }

  fill(rec) {
    this.noteEl.textContent = rec.note || 'No note on this one. Just trust me.';
    this.titleEl.textContent = rec.title;
    this.fromEl.textContent = rec.from;
    this.link.href = rec.url;
    this.link.setAttribute('aria-label', `Visit ${rec.title} (opens in a new tab)`);
    const d = new Date();
    this.dateEl.dateTime = d.toISOString().slice(0, 10);
    this.dateEl.innerHTML = `${String(d.getDate()).padStart(2, '0')}<br>${MONTHS[d.getMonth()]}`;
    this.countEl.textContent = `from the junk drawer · card ${this.dealt} of ${this.deck.length}`;
  }

  chime() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.sound.blip(f, 0.06), i * 55));
  }

  visit() {
    this.link.click();
  }

  key(e) {
    if (e.key === 'Escape') return this.close();
    if (e.key === 'Tab') {
      // keep focus inside the card
      const f = [this.link, this.againBtn, this.closeBtn];
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus();
      return;
    }
    if (e.repeat) return e.preventDefault(); // a held Enter from opening the card shouldn't open the site
    if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey && !e.altKey) return this.another();
    if (e.key === 'Enter' || e.key === ' ') {
      const tag = document.activeElement?.tagName;
      if (tag === 'BUTTON' || (tag === 'A' && e.key === 'Enter')) return; // let focused controls work normally
      e.preventDefault();
      this.visit();
    }
  }

  close() {
    if (!this.open) return;
    this.run++;
    this.rest();
    this.el.hidden = true;
    this.open = false;
    document.body.classList.remove('postcard-open');
    this.sound.blip(330, 0.06);
    const f = this.returnFocus;
    if (f && f !== document.body && f.isConnected) f.focus({ preventScroll: true });
    else document.activeElement?.blur();
  }
}

// ---------------- Touch controls ----------------
export function setupTouch(input, onAction) {
  const coarse = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (coarse) document.body.classList.add('touch');
  const root = document.getElementById('touch-controls');
  root.querySelectorAll('.pad').forEach((btn) => {
    const dir = btn.dataset.dir;
    const on = (e) => { e.preventDefault(); input[dir] = true; btn.classList.add('held'); btn.setPointerCapture?.(e.pointerId); };
    const off = () => { input[dir] = false; btn.classList.remove('held'); };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointercancel', off);
    btn.addEventListener('lostpointercapture', off);
  });
  const a = document.getElementById('action-btn');
  a.addEventListener('pointerdown', (e) => { e.preventDefault(); a.classList.add('held'); onAction(); });
  a.addEventListener('pointerup', () => a.classList.remove('held'));
  a.addEventListener('pointercancel', () => a.classList.remove('held'));
  window.addEventListener('pointerup', () => a.classList.remove('held')); // A can open an overlay that hides it mid-press
  // First touch anywhere reveals the pad, even on hybrid devices.
  window.addEventListener('touchstart', () => document.body.classList.add('touch'), { once: true, passive: true });
}

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function shuffle(a) { // Fisher-Yates, in place
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
