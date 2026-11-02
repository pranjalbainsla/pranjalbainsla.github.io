import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Palette shared by the 3D scene. Pastel room, rich walnut, terminal accents.
export const C = {
  pink: '#f6cfd8',
  pinkDeep: '#f2a7c0',
  blue: '#bfd9f0',
  blueDeep: '#9cc3e6',
  lilac: '#c9b8e8',
  purple: '#a98bd6',
  plum: '#2a1f45',
  cream: '#fff6e6',
  creamDark: '#efe3cf',
  mint: '#beebd6',
  peach: '#ffd1b0',
  walnut: '#7a4a2b',
  walnutLight: '#9c6236',
  walnutDark: '#5c3820',
  green: '#39ff7a',
  amber: '#ffb547',
  tomato: '#ff5a4a',
  yellow: '#ffd84a',
  kraft: '#d8a663', // same as --kraft / --kraft-dark / --wax in style.css
  kraftDark: '#a8743a',
  wax: '#a3222a',
};

// Wood colours get a painted grain instead of a flat fill. value = [grain contrast, plank seam]
const WOOD = {
  '#f3dccf': [0.05, true], '#eed2c3': [0.05, true], '#f6e2d6': [0.05, true],
  '#7a4a2b': [0.16, false], '#9c6236': [0.14, false], '#5c3820': [0.14, false],
};

function woodTexture(base, contrast, seam, seed) {
  return canvasTexture(512, 128, (ctx, w, h) => {
    const r = seeded(seed);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    // long wavy grain lines
    for (let i = 0; i < 46; i++) {
      const y0 = r() * h;
      const dark = r() > 0.35;
      ctx.strokeStyle = dark ? `rgba(40,18,6,${contrast * (0.4 + r() * 0.9)})` : `rgba(255,236,210,${contrast * (0.3 + r() * 0.7)})`;
      ctx.lineWidth = 0.6 + r() * 1.8;
      ctx.beginPath();
      const amp = 1 + r() * 3, f = 0.008 + r() * 0.02, ph = r() * 6.28;
      for (let x = 0; x <= w; x += 8) {
        const y = y0 + Math.sin(x * f + ph) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // a couple of knots
    for (let k = 0; k < 2; k++) {
      const kx = r() * w, ky = 20 + r() * (h - 40);
      for (let ring = 3; ring > 0; ring--) {
        ctx.strokeStyle = `rgba(40,18,6,${contrast * 0.9 / ring})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(kx, ky, ring * 7, ring * 2.6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    if (seam) {
      ctx.fillStyle = 'rgba(70,30,20,0.28)';
      ctx.fillRect(0, 0, w, 2);
      ctx.fillRect(0, h - 2, w, 2);
      ctx.fillStyle = 'rgba(70,30,20,0.22)';
      const sx = r() * w;
      ctx.fillRect(sx, 0, 2, h);
    }
  });
}

let woodSeed = 100;
const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) {
    const wood = WOOD[color];
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0, ...opts });
    if (wood) {
      m.map = woodTexture(color, wood[0], wood[1], woodSeed++);
      m.map.anisotropy = 4;
      m.color.set('#ffffff'); // the texture already carries the base colour
      m.roughness = 0.7;
    }
    matCache.set(key, m);
  }
  return matCache.get(key);
}

/** Same wood, grain turned to run vertically: for posts, legs and other uprights. */
export function woodUpright(color) {
  const key = color + '|upright';
  if (!matCache.has(key)) {
    const m = mat(color).clone();
    m.map = m.map.clone();
    m.map.center.set(0.5, 0.5);
    m.map.rotation = Math.PI / 2;
    matCache.set(key, m);
  }
  return matCache.get(key);
}

const geoCache = new Map();
function roundedGeo(w, h, d, r) {
  const rr = Math.min(r, Math.min(w, h, d) / 2 - 0.001);
  const key = [w, h, d, rr].map((v) => v.toFixed(3)).join('|');
  if (!geoCache.has(key)) {
    geoCache.set(key, rr > 0.004 ? new RoundedBoxGeometry(w, h, d, 2, rr) : new THREE.BoxGeometry(w, h, d));
  }
  return geoCache.get(key);
}

/** Chunky toy block. Position is the box centre. */
export function rbox(w, h, d, color, { r = 0.06, x = 0, y = 0, z = 0, shadow = true, material } = {}) {
  const m = new THREE.Mesh(roundedGeo(w, h, d, r), material || (typeof color === 'string' ? mat(color) : color));
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

export function canvasTexture(w, h, draw, { nearest = false } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (nearest) {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
  }
  return t;
}

// Deterministic random so the room looks the same on every visit.
export function seeded(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
