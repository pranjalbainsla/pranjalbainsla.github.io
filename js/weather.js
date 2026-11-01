import * as THREE from 'three';
import { C, seeded } from './helpers.js';
import { WIN } from './room.js';

/*
  Each preset is a bag of numbers and colours. The live state eases toward the
  active preset every frame, so switching weather fades sky, light and particles.
*/
const P = {
  sunny: {
    page: '#f6cfd8', skyTop: '#8ec9f2', skyBottom: '#ffe3b8', hillFar: '#b7e2b0', hillNear: '#8fcf8f', crown: '#8fcf8f',
    sun: '#fff0b0', sunPos: [0.6, 3.9], sunAmt: 1, moon: 0, stars: 0, clouds: 0.55, cloudCol: '#ffffff',
    sunLight: '#ffd9a0', sunInt: 2.6, sunDir: [-2.5, 7.5, -12],
    hemiSky: '#fff1e0', hemiGround: '#e8b8c8', hemiInt: 1.15, crt: 0.5, amb: 0.75, fill: 0.9, exposure: 1.0,
    shafts: 0.55, shaftCol: '#ffd9a0', dust: 1, rain: 0, snow: 0, leaves: 0, lamp: 1.2, frost: 0, sill: 0,
  },
  rain: {
    page: '#cdd2e3', skyTop: '#5f6f88', skyBottom: '#a3aec0', hillFar: '#7f9a95', hillNear: '#5f8273', crown: '#5f8f6f',
    sun: '#dfe6f0', sunPos: [0.6, 3.9], sunAmt: 0, moon: 0, stars: 0, clouds: 1, cloudCol: '#8792a6',
    sunLight: '#b8c8e0', sunInt: 0.55, sunDir: [-1.5, 9, -10],
    hemiSky: '#b9c6da', hemiGround: '#8c8fa8', hemiInt: 0.95, crt: 1.4, amb: 0.65, fill: 0.55, exposure: 0.95,
    shafts: 0, shaftCol: '#c8d8f0', dust: 0, rain: 1, snow: 0, leaves: 0, lamp: 3.2, frost: 0, sill: 0,
  },
  snow: {
    page: '#e4ecf6', skyTop: '#b9cce0', skyBottom: '#eef3f8', hillFar: '#f4f7fb', hillNear: '#e2eaf3', crown: '#e6eef6',
    sun: '#ffffff', sunPos: [-1.2, 3.6], sunAmt: 0.35, moon: 0, stars: 0, clouds: 0.8, cloudCol: '#f4f8fc',
    sunLight: '#e8f0ff', sunInt: 1.3, sunDir: [-2, 8, -11],
    hemiSky: '#f0f6ff', hemiGround: '#c8d4e8', hemiInt: 1.2, crt: 0.7, amb: 0.85, fill: 0.8, exposure: 1.0,
    shafts: 0.12, shaftCol: '#e8f0ff', dust: 0, rain: 0, snow: 1, leaves: 0, lamp: 2.2, frost: 1, sill: 1,
  },
  autumn: {
    page: '#f8d6c2', skyTop: '#f0a983', skyBottom: '#ffdcaa', hillFar: '#e7a65c', hillNear: '#c9652e', crown: '#e9853a',
    sun: '#ffcf7a', sunPos: [-2.6, 1.85], sunAmt: 1, moon: 0, stars: 0, clouds: 0.45, cloudCol: '#ffe2c8',
    sunLight: '#ffad5c', sunInt: 2.4, sunDir: [-5.5, 4.6, -12],
    hemiSky: '#ffd9b0', hemiGround: '#d49a8a', hemiInt: 0.95, crt: 0.7, amb: 0.6, fill: 0.7, exposure: 1.0,
    shafts: 0.6, shaftCol: '#ffa850', dust: 0.5, rain: 0, snow: 0, leaves: 1, lamp: 2.4, frost: 0, sill: 0,
  },
  night: {
    page: '#26214a', skyTop: '#0d0f2e', skyBottom: '#2e2a62', hillFar: '#26304f', hillNear: '#1a2340', crown: '#1f3a3a',
    sun: '#fff4d0', sunPos: [1.1, 3.8], sunAmt: 1, moon: 1, stars: 1, clouds: 0.15, cloudCol: '#3a3f72',
    sunLight: '#8fa0ff', sunInt: 0.35, sunDir: [2, 9, -10],
    hemiSky: '#4a4f9a', hemiGround: '#2a2140', hemiInt: 0.42, crt: 5.0, amb: 0.16, fill: 0.12, exposure: 1.0,
    shafts: 0, shaftCol: '#8fa0ff', dust: 0, rain: 0, snow: 0, leaves: 0, lamp: 5.5, frost: 0, sill: 0,
  },
};

const LOOK = { sun: 1.25, hemi: 0.85, amb: 0.5, fill: 0.7 };
const COLOR_KEYS = ['page', 'skyTop', 'skyBottom', 'hillFar', 'hillNear', 'crown', 'sun', 'cloudCol', 'sunLight', 'hemiSky', 'hemiGround', 'shaftCol'];
const NUM_KEYS = ['lamp', 'amb', 'fill', 'sunAmt', 'moon', 'stars', 'clouds', 'sunInt', 'hemiInt', 'crt', 'shafts', 'dust', 'rain', 'snow', 'leaves', 'frost', 'sill'];

// The space between the glass and the painted backdrop, where outdoor particles live.
const OUT = { x0: -4.6, x1: 3.1, y0: -0.4, y1: 5.0, z0: -5.15, z1: -4.32 };

export class Weather {
  constructor(scene, room, lights, reducedMotion) {
    this.scene = scene;
    this.refs = room.refs;
    this.lights = lights;
    this.reduced = reducedMotion;
    this.name = 'sunny';
    this.state = {};
    for (const k of COLOR_KEYS) this.state[k] = new THREE.Color(P.sunny[k]);
    for (const k of NUM_KEYS) this.state[k] = P.sunny[k];
    this.state.sunPos = new THREE.Vector2(...P.sunny.sunPos);
    this.state.sunDir = new THREE.Vector3(...P.sunny.sunDir);
    this.flash = 0;
    this.nextStrike = 3;
    this.onThunder = null; // set by main: (delaySeconds, strength) => void
    this.rand = seeded(42);
    this.buildParticles();
  }

  set(name) {
    if (!P[name]) return;
    this.name = name;
    if (name === 'rain') this.nextStrike = 2.2;
  }

  // ---------- particles ----------
  buildParticles() {
    const r = this.rand;
    const s = this.scene;

    // Rain streaks outside
    this.rainN = 240;
    this.rain = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.014, 0.34, 0.014),
      new THREE.MeshBasicMaterial({ color: '#dfe8f5', transparent: true, opacity: 0, depthWrite: false }),
      this.rainN,
    );
    this.rainP = Array.from({ length: this.rainN }, () => ({
      x: OUT.x0 + r() * (OUT.x1 - OUT.x0), y: OUT.y0 + r() * (OUT.y1 - OUT.y0), z: OUT.z0 + r() * (OUT.z1 - OUT.z0), v: 9 + r() * 4,
    }));
    s.add(this.rain);

    // Droplets running down the outside of the glass
    this.dropN = 70;
    this.drops = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.03, 6, 5),
      new THREE.MeshStandardMaterial({ color: '#eef6ff', roughness: 0.05, transparent: true, opacity: 0, depthWrite: false }),
      this.dropN,
    );
    this.dropP = Array.from({ length: this.dropN }, () => this.newDrop(true));
    this.drops.renderOrder = 1;
    s.add(this.drops);

    // Snow
    this.snowN = 320;
    this.snow = makePoints(this.snowN, OUT, r, '#ffffff', 7);
    s.add(this.snow.points);

    // Autumn leaves
    this.leafN = 34;
    this.leaves = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.16, 0.02, 0.11),
      new THREE.MeshStandardMaterial({ roughness: 0.8 }),
      this.leafN,
    );
    const lc = ['#ff8a3d', C.amber, C.tomato, '#e9a23b', '#d9542f'];
    const col = new THREE.Color();
    this.leafP = Array.from({ length: this.leafN }, (_, i) => {
      this.leaves.setColorAt(i, col.set(lc[i % lc.length]));
      return {
        x: OUT.x0 + r() * (OUT.x1 - OUT.x0), y: OUT.y0 + r() * (OUT.y1 - OUT.y0), z: OUT.z0 + r() * (OUT.z1 - OUT.z0),
        v: 0.5 + r() * 0.5, sway: r() * 6.28, spin: r() * 6.28, sr: 1 + r() * 2,
      };
    });
    s.add(this.leaves);

    // Dust motes inside, in the sunlight
    this.dust = makePoints(70, { x0: -2.6, x1: 3.0, y0: 0.6, y1: 4.2, z0: -3.6, z1: 1.6 }, r, '#ffe9b0', 3.2, true);
    s.add(this.dust.points);

    this.dummy = new THREE.Object3D();
  }

  newDrop(anyHeight) {
    const r = this.rand;
    return {
      x: WIN.x0 + 0.25 + r() * (WIN.x1 - WIN.x0 - 0.5),
      y: anyHeight ? WIN.y0 + 0.3 + r() * (WIN.y1 - WIN.y0 - 0.5) : WIN.y1 - 0.2 - r() * 1.5,
      v: 0, wait: r() * 2, s: 0.6 + r() * 0.9,
    };
  }

  // ---------- frame update ----------
  update(dt, t, pixelsPerUnit) {
    this.t = t;
    const target = P[this.name];
    const k = 1 - Math.exp(-dt * 2.2);
    const st = this.state;
    for (const key of COLOR_KEYS) st[key].lerp(_c.set(target[key]), k);
    for (const key of NUM_KEYS) st[key] += (target[key] - st[key]) * k;
    st.sunPos.lerp(_v2.set(...target.sunPos), k);
    st.sunDir.lerp(_v3.set(...target.sunDir), k);

    // Lightning during rain
    if (this.name === 'rain' && st.rain > 0.6) {
      this.nextStrike -= dt;
      if (this.nextStrike <= 0) {
        this.strike();
        this.nextStrike = 5 + this.rand() * 7;
      }
    }
    this.flash = Math.max(0, this.flash - dt * 3.2);
    if (this.flicker && t > this.flicker.at) {
      this.flash = Math.max(this.flash, this.flicker.amt);
      this.flicker = null;
    }
    const flash = this.flash * (this.reduced ? 0.35 : 1);

    // ---- backdrop + outside ----
    const u = this.refs.backdrop;
    u.uTop.value.copy(st.skyTop);
    u.uBottom.value.copy(st.skyBottom);
    u.uHillFar.value.copy(st.hillFar);
    u.uHillNear.value.copy(st.hillNear);
    u.uSun.value.copy(st.sun);
    u.uSunPos.value.copy(st.sunPos);
    u.uSunAmt.value = st.sunAmt;
    u.uMoon.value = st.moon;
    u.uStars.value = st.stars;
    u.uClouds.value = st.clouds;
    u.uCloudCol.value.copy(st.cloudCol);
    u.uFlash.value = flash * 0.9;
    u.uTime.value = t;
    for (const m of this.refs.treeCrowns) m.color.copy(st.crown);
    this.refs.frostMat.opacity = st.frost * 0.9;
    this.refs.sillSnow.scale.set(1, Math.max(0.001, st.sill), 1);
    this.refs.sillSnow.visible = st.sill > 0.01;

    if (this.scene.background) this.scene.background.copy(st.page);

    // ---- lights ----
    const L = this.lights;
    L.sun.color.copy(st.sunLight);
    // LOOK: less flat ambient, stronger key light, so form and cast shadows read.
    L.sun.intensity = (st.sunInt + flash * 3.5) * LOOK.sun;
    L.sun.position.copy(st.sunDir).add(L.sun.target.position);
    L.hemi.color.copy(st.hemiSky);
    L.hemi.groundColor.copy(st.hemiGround);
    L.hemi.intensity = (st.hemiInt + flash * 1.6) * LOOK.hemi;
    L.amb.intensity = (st.amb + flash * 0.8) * LOOK.amb;
    L.fill.intensity = (st.fill + flash * 1.2) * LOOK.fill;
    const crtPulse = 1 + Math.sin(t * 13) * 0.03 + Math.sin(t * 3.1) * 0.03;
    this.refs.crtLight.intensity = st.crt * crtPulse;
    // Lamp glows harder the darker it is outside; HDR bulb colour feeds the bloom.
    const lamp = this.refs.lamp;
    lamp.light.intensity = st.lamp;
    lamp.shade.emissiveIntensity = 0.25 + st.lamp * 0.12;
    lamp.bulb.color.setRGB(1, 0.92, 0.78).multiplyScalar(1.2 + st.lamp * 0.25);

    // ---- light shafts follow the sun direction ----
    const d = _v3b.copy(st.sunDir).negate().normalize();
    for (const sheet of this.refs.shafts) {
      const startY = 3.4;
      const len = Math.min(9, startY / Math.max(0.2, -d.y)) * 1.05;
      const yAxis = _a.copy(d).negate();
      const xAxis = _b.set(1, 0, 0);
      const zAxis = _z.crossVectors(xAxis, yAxis).normalize();
      xAxis.crossVectors(yAxis, zAxis).normalize();
      _m.makeBasis(xAxis, yAxis, zAxis);
      sheet.quaternion.setFromRotationMatrix(_m);
      sheet.scale.set(1, len, 1);
      sheet.position.set(sheet.userData.paneX, startY, WIN.z + 0.05).addScaledVector(d, len / 2);
      sheet.material.opacity = st.shafts * 0.22;
      sheet.material.color.copy(st.shaftCol);
      sheet.visible = st.shafts > 0.01;
    }

    this.updateRain(dt, st.rain);
    this.updateDrops(dt, st.rain);
    this.updateLeaves(dt, t, st.leaves);
    stepPoints(this.snow, dt, t, st.snow, pixelsPerUnit, { fall: 0.7, sway: 0.25 });
    stepPoints(this.dust, dt, t, st.dust, pixelsPerUnit, { fall: -0.02, sway: 0.08, twinkle: true });
  }

  strike() {
    this.flash = 1;
    if (!this.reduced) this.flicker = { at: this.t + 0.12, amt: 0.7 };
    const delay = 0.7 + this.rand() * 1.6;
    if (this.onThunder) this.onThunder(delay, 0.6 + this.rand() * 0.4);
  }

  updateRain(dt, amt) {
    this.rain.visible = amt > 0.01;
    if (!this.rain.visible) return;
    this.rain.material.opacity = amt * 0.65;
    const dm = this.dummy;
    dm.rotation.set(0, 0, 0.18);
    for (let i = 0; i < this.rainN; i++) {
      const p = this.rainP[i];
      p.y -= p.v * dt;
      p.x -= p.v * dt * 0.18;
      if (p.y < OUT.y0) { p.y = OUT.y1; p.x = OUT.x0 + 0.9 + this.rand() * (OUT.x1 - OUT.x0 - 0.9); }
      dm.position.set(p.x, p.y, p.z);
      dm.updateMatrix();
      this.rain.setMatrixAt(i, dm.matrix);
    }
    this.rain.instanceMatrix.needsUpdate = true;
  }

  updateDrops(dt, amt) {
    this.drops.visible = amt > 0.01;
    if (!this.drops.visible) return;
    this.drops.material.opacity = amt * 0.75;
    const dm = this.dummy;
    dm.rotation.set(0, 0, 0);
    for (let i = 0; i < this.dropN; i++) {
      const p = this.dropP[i];
      if (p.wait > 0) p.wait -= dt;
      else {
        p.v = Math.min(1.6, p.v + dt * (0.6 + this.rand() * 2));
        if (this.rand() < dt * 1.5) p.v *= 0.2; // drops stick and release
        p.y -= p.v * dt;
      }
      if (p.y < WIN.y0 + 0.1) Object.assign(p, this.newDrop(false));
      dm.position.set(p.x, p.y, WIN.z - 0.04);
      dm.scale.set(p.s, p.s * (1 + p.v * 1.4), 0.4);
      dm.updateMatrix();
      this.drops.setMatrixAt(i, dm.matrix);
    }
    this.drops.instanceMatrix.needsUpdate = true;
  }

  updateLeaves(dt, t, amt) {
    this.leaves.visible = amt > 0.01;
    if (!this.leaves.visible) return;
    const dm = this.dummy;
    for (let i = 0; i < this.leafN; i++) {
      const p = this.leafP[i];
      p.y -= p.v * dt;
      p.x += (0.55 + Math.sin(t * 1.3 + p.sway) * 0.5) * dt;
      p.spin += dt * p.sr;
      if (p.y < OUT.y0 || p.x > OUT.x1) {
        p.y = OUT.y1;
        p.x = OUT.x0 + this.rand() * (OUT.x1 - OUT.x0 - 1);
      }
      dm.position.set(p.x, p.y, p.z);
      dm.rotation.set(Math.sin(p.spin) * 1.2, p.spin, Math.cos(p.spin * 0.7) * 0.8);
      dm.scale.setScalar(amt);
      dm.updateMatrix();
      this.leaves.setMatrixAt(i, dm.matrix);
    }
    this.leaves.instanceMatrix.needsUpdate = true;
  }
}

const _c = new THREE.Color();
const _v2 = new THREE.Vector2();
const _v3 = new THREE.Vector3();
const _v3b = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _z = new THREE.Vector3();
const _m = new THREE.Matrix4();

/* Round, soft points sized in world units (works with the orthographic camera). */
function makePoints(n, box, r, color, sizePx, additive = false) {
  const pos = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = box.x0 + r() * (box.x1 - box.x0);
    pos[i * 3 + 1] = box.y0 + r() * (box.y1 - box.y0);
    pos[i * 3 + 2] = box.z0 + r() * (box.z1 - box.z0);
    seed[i] = r();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0 },
      uSize: { value: sizePx },
      uTime: { value: 0 },
      uTwinkle: { value: additive ? 1 : 0 },
    },
    vertexShader: /* glsl */ `
      attribute float seed;
      uniform float uSize, uTime, uTwinkle;
      varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.6 + seed * 0.8);
        vA = mix(1.0, 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (1.0 + seed * 2.0) + seed * 30.0)), uTwinkle);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.15, d) * uOpacity * vA;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor, a);
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(g, material);
  points.frustumCulled = false;
  return { points, box, seed, base: sizePx };
}

function stepPoints(p, dt, t, amt, ppu, { fall, sway, twinkle }) {
  p.points.visible = amt > 0.01;
  if (!p.points.visible) return;
  const m = p.points.material;
  m.uniforms.uOpacity.value = amt * (twinkle ? 0.55 : 0.95);
  m.uniforms.uTime.value = t;
  m.uniforms.uSize.value = p.base * ppu * 0.012;
  const a = p.points.geometry.attributes.position;
  const arr = a.array;
  const b = p.box;
  for (let i = 0; i < arr.length / 3; i++) {
    const s = p.seed[i];
    arr[i * 3 + 1] -= fall * (0.6 + s * 0.8) * dt;
    arr[i * 3] += Math.sin(t * (0.6 + s) + s * 40) * sway * dt;
    arr[i * 3 + 2] += Math.cos(t * (0.5 + s) + s * 20) * sway * 0.3 * dt;
    if (arr[i * 3 + 1] < b.y0) arr[i * 3 + 1] = b.y1;
    if (arr[i * 3 + 1] > b.y1) arr[i * 3 + 1] = b.y0;
    if (arr[i * 3] < b.x0) arr[i * 3] = b.x1;
    if (arr[i * 3] > b.x1) arr[i * 3] = b.x0;
    arr[i * 3 + 2] = Math.min(b.z1, Math.max(b.z0, arr[i * 3 + 2]));
  }
  a.needsUpdate = true;
}

export const WEATHER_LINES = {
  sunny: ['Golden light all afternoon. The dust motes are doing their slow little dance again.'],
  rain: ['Rain on the glass and thunder somewhere over the hills. Perfect weather to debug something.'],
  snow: ['The frost is creeping in from the corners. I am not leaving this room until spring.'],
  autumn: ['Orange leaves keep drifting past the window. Very cinematic for someone reading CUDA docs.'],
  night: ['Just the stars and the hum of the CRT. Peak focus hours.'],
};
