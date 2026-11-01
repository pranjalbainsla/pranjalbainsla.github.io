import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildRoom } from './room.js';
import { Character } from './character.js';
import { Weather, WEATHER_LINES } from './weather.js';
import { Sound } from './audio.js';
import { drawIcons, Dialogue, Terminals, setupTouch } from './ui.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(pointer: coarse)').matches;

// ---------- Renderer ----------
const canvas = document.getElementById('scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (err) {
  document.getElementById('loader').innerHTML = '<p>This room needs WebGL. Try another browser?</p>';
  throw err;
}
// Upper bound for the pixel ratio. The frame-time monitor in frame() steps it down on slow GPUs.
let maxDpr = isTouch ? 1.5 : 1.75;
const MIN_DPR = 1.25;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.22;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#f6cfd8');

// ---------- Camera: fixed angled orthographic "diorama" view ----------
const camTarget = new THREE.Vector3(-0.2, 1.7, -0.2);
const camDir = new THREE.Vector3(1, 0.8, 1).normalize();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
camera.position.copy(camTarget).addScaledVector(camDir, 40);
camera.lookAt(camTarget);
let pixelsPerUnit = 60;

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  const aspect = w / h;
  const viewH = Math.max(11.2, 15.6 / aspect);
  camera.top = viewH / 2;
  camera.bottom = -viewH / 2;
  camera.left = (-viewH * aspect) / 2;
  camera.right = (viewH * aspect) / 2;
  // On tall phones nudge the room down a little so the weather bar sits above it.
  const shift = aspect < 0.8 ? viewH * 0.06 : 0;
  camera.position.copy(camTarget).addScaledVector(camDir, 40);
  camera.lookAt(camTarget);
  camera.translateY(shift);
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
  renderer.setSize(w, h, false);
  if (composer) {
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
  }
  pixelsPerUnit = (h * renderer.getPixelRatio()) / viewH;
  layoutChrome();
}

// Pin the HUD to the room's on-screen edges (left wall corner, back-right wall end).
const _e = new THREE.Vector3();
function edgeToScreen(x, y, z) {
  _e.set(x, y, z).project(camera);
  return { x: (_e.x * 0.5 + 0.5) * window.innerWidth, y: (-_e.y * 0.5 + 0.5) * window.innerHeight };
}
function layoutChrome() {
  const left = edgeToScreen(-5.3, 3, 4.1);
  const right = edgeToScreen(5.0, 2.8, -4.3);
  const root = document.documentElement.style;
  root.setProperty('--room-left', `${Math.max(12, left.x)}px`);
  root.setProperty('--room-right', `${right.x}px`);
  root.setProperty('--room-mid-y', `${right.y}px`);
}

// ---------- Lights ----------
const hemi = new THREE.HemisphereLight('#fff1e0', '#e8b8c8', 1.1);
scene.add(hemi);
const amb = new THREE.AmbientLight('#fff4f0', 0.7);
const fill = new THREE.DirectionalLight('#fff0f4', 0.8); // soft front fill from the camera side, no shadows
fill.position.set(8, 9, 10);
scene.add(amb, fill);
const sun = new THREE.DirectionalLight('#ffd9a0', 2.5);
sun.target.position.set(0.3, 0, 0.3);
scene.add(sun, sun.target);
sun.castShadow = true;
sun.shadow.mapSize.set(isTouch ? 1024 : 2048, isTouch ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.5, far: 45 });
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.025;
sun.shadow.radius = 3;
// The shadow map is only re-rendered when the character or the sun moves (see frame()).
sun.shadow.autoUpdate = false;
sun.shadow.needsUpdate = true;

// ---------- Post-processing: contact shadows, bloom, grade ----------
// Rendered into an MSAA half-float target so the AO/bloom chain stays smooth and anti-aliased.
// At high pixel ratios 2 samples are visually the same as 4 and much cheaper to resolve.
let composer = null;
let gtao = null;
function setupPost() {
  const msaa = isTouch ? 0 : renderer.getPixelRatio() >= 1.5 ? 2 : 4;
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: msaa });
  composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  if (!isTouch) {
    gtao = new GTAOPass(scene, camera, window.innerWidth, window.innerHeight);
    gtao.updateGtaoMaterial({ radius: 0.7, distanceExponent: 1.4, thickness: 1.2, scale: 0.9, samples: 16, distanceFallOff: 1, screenSpaceRadius: false });
    // AO is smooth, so it runs at half resolution (same sample counts, a quarter of the pixels) and is
    // cached until something that can change it moves. The denoise radius is in AO-buffer pixels.
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 3, rings: 2, samples: 16 });
    gtao.resolutionScale = 0.5;
    gtao.cacheAO = true;
    gtao.blendIntensity = 1.0;
    composer.addPass(gtao);
  }
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.32, 0.7, 0.86));
  composer.addPass(new ShaderPass(GradeShader));
  composer.addPass(new OutputPass());
}

// Soft vignette + a touch of warmth in the highlights, cool in the shadows.
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, uVig: { value: 0.16 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uVig; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(c.rgb * vec3(0.94, 0.97, 1.06), c.rgb * vec3(1.06, 1.0, 0.92), smoothstep(0.15, 0.9, l));
      c.rgb = mix(vec3(l), c.rgb, 1.08);
      vec2 d = vUv - 0.5;
      c.rgb *= 1.0 - uVig * smoothstep(0.35, 0.95, length(d * vec2(1.0, 1.15)) * 1.25);
      gl_FragColor = c;
    }`,
};
setupPost();

// ---------- World ----------
const room = buildRoom(scene);
const player = new Character(scene);
const weather = new Weather(scene, room, { hemi, sun, amb, fill }, reducedMotion);
const sound = new Sound();
weather.onThunder = (delay, strength) => sound.thunder(delay, strength);
const BOUNDS = [-4.95, 4.9, -3.95, 3.95];

// ---------- UI ----------
drawIcons();
const dialogue = new Dialogue(sound);
const terminals = new Terminals(sound);
const promptEl = document.getElementById('prompt');

let projects = [];
let projectsError = null;
fetch('./projects.json', { cache: 'no-cache' })
  .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
  .then((data) => { projects = Array.isArray(data) ? data : data.projects || []; })
  .catch((e) => { projectsError = e; console.warn('projects.json:', e); })
  .finally(drawScreen);

document.querySelectorAll('.weather').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    setWeather(btn.dataset.weather);
    if (e.detail > 0) btn.blur(); // mouse users: give Enter back to the room
  });
});

function setWeather(name) {
  weather.set(name);
  document.querySelectorAll('.weather').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.weather === name)));
  sound.blip(740, 0.05);
}

const soundBtn = document.getElementById('sound-toggle');
soundBtn.addEventListener('click', () => {
  const on = sound.toggle();
  soundBtn.setAttribute('aria-pressed', String(on));
});

// ---------- Input ----------
const input = { up: false, down: false, left: false, right: false };
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' };

window.addEventListener('keydown', (e) => {
  const dir = KEYMAP[e.code];
  if (dir) {
    if (e.code.startsWith('Arrow')) e.preventDefault();
    input[dir] = true;
    return;
  }
  if (e.key === 'Enter' || e.key === ' ') {
    const tag = document.activeElement?.tagName;
    if (tag === 'BUTTON' || tag === 'A') return; // let focused controls work normally
    e.preventDefault();
    if (!e.repeat) act();
  }
  if (e.key === 'Escape') {
    if (dialogue.open) dialogue.close();
    else terminals.closeAll();
  }
});
window.addEventListener('keyup', (e) => {
  const dir = KEYMAP[e.code];
  if (dir) input[dir] = false;
});
window.addEventListener('blur', () => Object.keys(input).forEach((k) => (input[k] = false)));
setupTouch(input, act);

// ---------- Interactions ----------
let nearby = null;
const mugLines = [
  'Still warm. Third cup today, but who is counting.',
  'Coffee: the original performance optimization.',
  'The mug says "it works on my machine". It is right.',
];
let mugIdx = 0;

function act() {
  if (dialogue.open) return dialogue.advance();
  if (!nearby) return;
  const [px, , pz] = nearby.anchor.toArray();
  player.faceToward(px, pz);
  switch (nearby.id) {
    case 'monitor':
      terminals.openProjects(projects, projectsError);
      break;
    case 'mug':
      dialogue.show('Coffee mug', mugLines[mugIdx++ % mugLines.length]);
      break;
    case 'window':
      dialogue.show('Window', WEATHER_LINES[weather.name]);
      break;
  }
}

function findNearby() {
  let best = null, bestD = 0.9;
  for (const it of room.interactables) {
    for (const [x, z] of it.points) {
      const d = Math.hypot(player.pos.x - x, player.pos.y - z);
      if (d < bestD) { bestD = d; best = it; }
    }
  }
  return best;
}

const _p = new THREE.Vector3();
function placePrompt() {
  if (!nearby || dialogue.open) {
    promptEl.hidden = true;
    return;
  }
  _p.copy(nearby.anchor).project(camera);
  const x = (_p.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-_p.y * 0.5 + 0.5) * window.innerHeight;
  const key = document.body.classList.contains('touch') ? 'A' : 'Enter';
  const text = `${key}: ${nearby.label}`;
  if (promptEl.textContent !== text) promptEl.textContent = text;
  promptEl.style.left = `${x}px`;
  promptEl.style.top = `${y}px`;
  promptEl.hidden = false;
}

// ---------- CRT screen ----------
let cursorOn = true;
function drawScreen() {
  const { canvas: c, tex } = room.refs.screen;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#02140a';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.font = '17px "VT323", monospace';
  ctx.textBaseline = 'top';
  const lines = [
    ['guest@desk:~$ whoami', '#1fa04c'],
    ['builder of small, fast things', '#39ff7a'],
    ['guest@desk:~$ ls projects/', '#1fa04c'],
  ];
  const names = projects.length ? projects.map((p) => `  ${String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`) : ['  (loading...)'];
  names.slice(0, 5).forEach((n) => lines.push([n, '#39ff7a']));
  lines.push(['[ press Enter here ]', '#ffb547']);
  let y = 12;
  for (const [t, col] of lines) {
    ctx.fillStyle = col;
    ctx.fillText(t, 14, y);
    y += 21;
  }
  ctx.fillStyle = '#1fa04c';
  ctx.fillText('guest@desk:~$ ', 14, y);
  if (cursorOn) {
    ctx.fillStyle = '#39ff7a';
    ctx.fillRect(14 + ctx.measureText('guest@desk:~$ ').width, y + 2, 9, 15);
  }
  // scanlines + vignette
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (let i = 0; i < c.height; i += 3) ctx.fillRect(0, i, c.width, 1);
  const g = ctx.createRadialGradient(c.width / 2, c.height / 2, c.height * 0.3, c.width / 2, c.height / 2, c.width * 0.65);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  tex.needsUpdate = true;
}
setInterval(() => { cursorOn = !cursorOn; drawScreen(); }, 530);
document.fonts?.ready.then(drawScreen);

// ---------- Loop ----------
const clock = new THREE.Clock();
const move = new THREE.Vector2();
const FWD = new THREE.Vector2(-Math.SQRT1_2, -Math.SQRT1_2); // screen-up, on the floor
const RIGHT = new THREE.Vector2(Math.SQRT1_2, -Math.SQRT1_2); // screen-right, on the floor
let started = false;
let lastBg = -1;

// ---------- Frame pacing ----------
// Active (moving / weather particles): cap at ~60 fps, which also halves the work on 120 Hz displays.
// Idle (nothing but steam, dust and the cursor): 30 fps is indistinguishable and keeps the GPU cool.
const ACTIVE_MS = 14.5;
const IDLE_MS = 31;
let idle = false;
let lastRender = 0;
let frameNo = 0;

// Change detection for the cached shadow map and AO.
const pose = new Float32Array(5);
const lastPose = new Float32Array(5);
const lastSun = new THREE.Vector3(NaN);
let lastSill = -1;
let aoStale = true;
function poseChanged() {
  pose[0] = player.pos.x; pose[1] = player.pos.y; pose[2] = player.heading; pose[3] = player.moving; pose[4] = player.walk;
  let changed = false;
  for (let i = 0; i < 5; i++) {
    if (Math.abs(pose[i] - lastPose[i]) > 1e-5) changed = true;
    lastPose[i] = pose[i];
  }
  return changed;
}

// Adaptive quality: if sustained active frames are slow, trade a little pixel ratio for smoothness.
let perfSum = 0, perfN = 0, lastTick = 0;
function trackPerf(now) {
  if (idle || now < 4000) { perfSum = perfN = lastTick = 0; return; } // skip startup / shader compile
  if (lastTick) {
    const d = now - lastTick;
    if (d < 100) { perfSum += d; perfN++; } else { perfSum = perfN = 0; } // tab switch or hitch
  }
  lastTick = now;
  if (perfN >= 90) {
    const avg = perfSum / perfN;
    perfSum = perfN = 0;
    if (avg > 24 && maxDpr > MIN_DPR) {
      maxDpr = Math.max(MIN_DPR, maxDpr - 0.25);
      console.info(`Frames averaging ${avg.toFixed(1)} ms; pixel ratio cap -> ${maxDpr}`);
      resize();
    }
  }
}

// Optional FPS readout: add ?fps to the URL.
let fpsEl = null, fpsFrames = 0, fpsSince = 0;
if (new URLSearchParams(location.search).has('fps')) {
  fpsEl = document.createElement('div');
  fpsEl.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99;font:12px/1.4 monospace;color:#fff;background:rgba(0,0,0,.6);padding:4px 8px;border-radius:6px;pointer-events:none';
  document.body.appendChild(fpsEl);
}

function frame(now = performance.now()) {
  requestAnimationFrame(frame);
  if (now - lastRender < (idle ? IDLE_MS : ACTIVE_MS)) return;
  lastRender = now;
  frameNo++;

  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  const iy = (input.up ? 1 : 0) - (input.down ? 1 : 0);
  const ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  move.set(0, 0);
  if (!dialogue.open) move.addScaledVector(FWD, iy).addScaledVector(RIGHT, ix);
  if (move.lengthSq() > 1) move.normalize();
  player.update(dt, move, room.colliders, BOUNDS, t);

  nearby = findNearby();
  weather.update(dt, t, pixelsPerUnit);
  sound.setRain(weather.state.rain);
  animateSteam(t);
  room.refs.led.visible = Math.sin(t * 6) > -0.3;

  // Re-render the shadow map / AO only when the character, the sun or (autumn) the leaves changed.
  const moved = poseChanged();
  const sillY = room.refs.sillSnow.scale.y;
  const sunMoved = !(lastSun.distanceToSquared(sun.position) < 1e-8); // also true while lastSun is NaN
  const sillMoved = Math.abs(sillY - lastSill) > 1e-4;
  lastSun.copy(sun.position);
  lastSill = sillY;
  if (moved || sunMoved) sun.shadow.needsUpdate = true;
  if (gtao) {
    if (moved || sillMoved) aoStale = true;
    if (aoStale && (frameNo & 1) === 0) { gtao.aoDirty = true; aoStale = false; } // AO at half the frame rate while moving
    if (weather.leaves.visible) gtao.aoDirty = true;
  }
  const ws = weather.state;
  idle = !moved && !sunMoved && !sillMoved && !(input.up || input.down || input.left || input.right) &&
    ws.rain < 0.01 && ws.snow < 0.01 && ws.leaves < 0.01 && weather.flash < 0.01;

  composer.render(dt);
  trackPerf(now);
  if (fpsEl) {
    fpsFrames++;
    if (now - fpsSince > 500) {
      fpsEl.textContent = `${Math.round((fpsFrames * 1000) / (now - fpsSince))} fps · dpr ${renderer.getPixelRatio()}${idle ? ' · idle' : ''}`;
      fpsFrames = 0;
      fpsSince = now;
    }
  }
  placePrompt();
  if (((t * 4) | 0) !== lastBg) { lastBg = (t * 4) | 0; document.body.style.background = `#${scene.background.getHexString()}`; document.body.classList.toggle('dark-bg', scene.background.r * 0.3 + scene.background.g * 0.6 + scene.background.b * 0.1 < 0.35); }

  if (!started) {
    started = true;
    document.getElementById('loader').classList.add('gone');
  }
}

function animateSteam(t) {
  const s = room.refs.steam;
  for (const p of s.puffs) {
    const k = (t * 0.35 + p.userData.phase) % 1;
    p.position.set(s.x + Math.sin(k * 6 + p.userData.phase * 9) * 0.06, s.y + k * 0.7, s.z + Math.cos(k * 5) * 0.03);
    p.scale.setScalar(0.6 + k * 1.6);
    p.material.opacity = Math.sin(k * Math.PI) * 0.45;
  }
}

window.addEventListener('resize', resize);
resize();
drawScreen();
requestAnimationFrame(frame);

// Handy for debugging from the console: room.setWeather('night')
window.room = { setWeather, player, weather, camera };
