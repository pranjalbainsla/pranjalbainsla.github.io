/* DOM side: pixel icons, dialogue box, draggable terminal windows, touch pad. */

const ICONS = {
  sunny: ['....y....', '.y.....y.', '...ooo...', '..oyyyo..', 'y.oyyyo.y', '..oyyyo..', '...ooo...', '.y.....y.', '....y....'],
  rain: ['..ggg....', '.ggggg.g.', 'ggggggggg', 'ggggggggg', '.........', '.b..y..b.', '....yy...', '.b..y..b.', '...y.....'],
  snow: ['....b....', '.b..b..b.', '..b.b.b..', '...bbb...', 'bbbbbbbbb', '...bbb...', '..b.b.b..', '.b..b..b.', '....b....'],
  autumn: ['.....oo..', '...ooooo.', '..oorooo.', '.oooroo..', '.ooroooo.', '.oroooo..', '.rooo....', 'r........', 's........'],
  night: ['...mmm..w', '..mm.....', '.mm....w.', '.mm......', '.mm......', '.mmm...m.', '..mmmmmm.', '...mmmm..', 'w........'],
};
const ICON_COLORS = { y: '#ffd84a', o: '#ffb547', g: '#9aa6bd', b: '#5fa8e8', r: '#ff5a4a', s: '#7a4a2b', m: '#ffd84a', w: '#c9b8e8' };

export function drawIcons() {
  document.querySelectorAll('[data-icon]').forEach((el) => {
    const rows = ICONS[el.dataset.icon];
    let rects = '';
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ICON_COLORS[ch]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${ICON_COLORS[ch]}"/>`;
    }));
    el.innerHTML = `<svg viewBox="0 0 9 9" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
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
  // First touch anywhere reveals the pad, even on hybrid devices.
  window.addEventListener('touchstart', () => document.body.classList.add('touch'), { once: true, passive: true });
}

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
