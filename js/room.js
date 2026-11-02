import * as THREE from 'three';
import { C, mat, woodUpright, rbox, canvasTexture, seeded } from './helpers.js';

/*
  Room layout (world units, y up). Floor spans x[-5,5], z[-4,4].
  Back wall (with the big window) faces +z at z = -4; left wall faces +x at x = -5.
  The camera looks in from the open front-right corner.
*/
export const WALL_H = 5.6;
export const WIN = { x0: -3.2, x1: 3.2, y0: 0.15, y1: 5.35, z: -4.15 };

export function buildRoom(scene) {
  const room = new THREE.Group();
  scene.add(room);
  const rand = seeded(11);

  const colliders = [];
  const interactables = [];
  const refs = {};

  // ---------- Base slab + floorboards ----------
  room.add(rbox(10.8, 0.7, 8.8, C.walnut, { r: 0.2, x: -0.05, y: -0.38, z: -0.05 }));
  const plankColors = ['#f3dccf', '#eed2c3', '#f6e2d6'];
  for (let i = 0; i < 8; i++) {
    room.add(rbox(10.2, 0.08, 1.0, plankColors[i % 3], { r: 0.035, x: -0.1, y: -0.04, z: -3.8 + i * 1.0 + 0.3 }));
  }

  // ---------- Walls ----------
  // Left wall (blue)
  room.add(rbox(0.3, WALL_H, 8.4, C.blue, { r: 0.08, x: -5.15, y: WALL_H / 2, z: -0.1 }));
  room.add(rbox(0.06, 0.28, 8.0, C.pinkDeep, { r: 0.02, x: -4.98, y: 0.14, z: 0.05 })); // baseboard
  room.add(rbox(0.44, 0.16, 8.5, C.walnut, { r: 0.06, x: -5.15, y: WALL_H + 0.06, z: -0.1 })); // top trim

  // Back wall (pink) built around the window opening
  const bz = -4.15;
  room.add(rbox(2.1, WALL_H, 0.3, C.pink, { r: 0.08, x: -4.25, y: WALL_H / 2, z: bz }));
  room.add(rbox(1.8, WALL_H, 0.3, C.pink, { r: 0.08, x: 4.1, y: WALL_H / 2, z: bz }));
  room.add(rbox(6.4, WALL_H - WIN.y1, 0.3, C.pink, { r: 0.04, x: 0, y: (WALL_H + WIN.y1) / 2, z: bz }));
  room.add(rbox(6.4, WIN.y0, 0.3, C.pink, { r: 0.03, x: 0, y: WIN.y0 / 2, z: bz }));
  room.add(rbox(10.3, 0.16, 0.44, C.walnut, { r: 0.06, x: -0.15, y: WALL_H + 0.06, z: bz }));
  room.add(rbox(1.6, 0.28, 0.06, C.blueDeep, { r: 0.02, x: -4.2, y: 0.14, z: -3.98 }));
  room.add(rbox(1.6, 0.28, 0.06, C.blueDeep, { r: 0.02, x: 4.1, y: 0.14, z: -3.98 }));

  // ---------- Window frame ----------
  const wy = (WIN.y0 + WIN.y1) / 2;
  const wh = WIN.y1 - WIN.y0;
  const frame = (w, h, x, y, d = 0.42) => room.add(rbox(w, h, d, null, { r: 0.04, x, y, z: bz, material: h > w ? woodUpright(C.walnut) : mat(C.walnut) }));
  frame(0.2, wh, WIN.x0 + 0.1, wy);
  frame(0.2, wh, WIN.x1 - 0.1, wy);
  frame(6.4, 0.2, 0, WIN.y1 - 0.1);
  frame(0.12, wh - 0.3, -1.07, wy, 0.3);
  frame(0.12, wh - 0.3, 1.07, wy, 0.3);
  frame(6.2, 0.12, 0, 3.95, 0.3);
  room.add(rbox(6.8, 0.14, 0.75, C.cream, { r: 0.05, x: 0, y: WIN.y0 + 0.07, z: -3.95 })); // inner sill
  room.add(rbox(6.8, 0.12, 0.5, C.cream, { r: 0.05, x: 0, y: WIN.y0 + 0.02, z: -4.5 })); // outer sill

  // Glass: very light tint so the outdoors reads clearly.
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#e6f4ff', roughness: 0.1, metalness: 0, transparent: true, opacity: 0.1, depthWrite: false,
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0, wh), glassMat);
  glass.position.set(0, wy, WIN.z);
  glass.renderOrder = 2;
  room.add(glass);
  refs.glassMat = glassMat;

  // Frost: drawn once on a canvas, faded in for snow.
  const frostTex = canvasTexture(512, 420, (ctx, w, h) => {
    const r = seeded(3);
    ctx.clearRect(0, 0, w, h);
    const edge = (x, y) => {
      const d = Math.min(x, y, w - x, h - y);
      return Math.max(0, 1 - d / 120);
    };
    for (let i = 0; i < 4200; i++) {
      const x = r() * w, y = r() * h;
      const e = edge(x, y);
      if (r() > e * e) continue;
      const len = 4 + r() * 16 * e;
      const a = r() * Math.PI * 2;
      ctx.strokeStyle = `rgba(255,255,255,${0.25 + 0.55 * e})`;
      ctx.lineWidth = 1 + r() * 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.26, w / 2, h / 2, Math.max(w, h) * 0.62);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(240,248,255,0.95)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const frostMat = new THREE.MeshBasicMaterial({ map: frostTex, transparent: true, opacity: 0, depthWrite: false });
  const frost = new THREE.Mesh(new THREE.PlaneGeometry(WIN.x1 - WIN.x0 - 0.2, wh - 0.2), frostMat);
  frost.position.set(0, wy, WIN.z + 0.06);
  frost.renderOrder = 3;
  room.add(frost);
  refs.frostMat = frostMat;

  // Snow that piles up on the outer sill
  const sillSnow = rbox(6.5, 0.22, 0.42, '#ffffff', { r: 0.1, x: 0, y: WIN.y0 + 0.1, z: -4.5 });
  sillSnow.castShadow = false;
  room.add(sillSnow);
  refs.sillSnow = sillSnow;

  // ---------- Outside: painted backdrop + two blocky trees ----------
  refs.backdrop = buildBackdrop(room);
  refs.treeCrowns = [];
  for (const [x, z, s] of [[-2.7, -4.85, 1.0], [1.9, -4.95, 0.85], [-0.3, -5.05, 0.6]]) {
    const t = new THREE.Group();
    t.add(rbox(0.22 * s, 2.0 * s, 0.22 * s, C.walnut, { r: 0.05, y: 1.0 * s - 0.6 }));
    const crownMat = new THREE.MeshStandardMaterial({ color: '#8fcf8f', roughness: 0.9 });
    const c1 = rbox(1.1 * s, 0.9 * s, 0.5, null, { r: 0.18, y: 1.75 * s - 0.4, material: crownMat });
    const c2 = rbox(0.75 * s, 0.7 * s, 0.42, null, { r: 0.16, y: 2.45 * s - 0.4, material: crownMat });
    [c1, c2].forEach((m) => (m.castShadow = false));
    t.add(c1, c2);
    t.position.set(x, 0, z);
    room.add(t);
    refs.treeCrowns.push(crownMat);
  }

  // ---------- Desk ----------
  const desk = new THREE.Group();
  const deskTop = 0.95;
  desk.add(rbox(4.3, 0.14, 1.36, C.walnut, { r: 0.06, x: 0.2, y: deskTop - 0.07, z: -3.3 }));
  desk.add(rbox(4.24, 0.05, 1.3, C.walnutLight, { r: 0.02, x: 0.2, y: deskTop - 0.005, z: -3.3, shadow: false }));
  // drawer pedestal
  desk.add(rbox(1.05, deskTop - 0.14, 1.25, C.walnutDark, { r: 0.05, x: -1.38, y: (deskTop - 0.14) / 2, z: -3.32 }));
  for (let i = 0; i < 3; i++) {
    const y = 0.17 + i * 0.25;
    desk.add(rbox(0.9, 0.2, 0.06, C.walnutLight, { r: 0.03, x: -1.38, y, z: -2.67 }));
    desk.add(rbox(0.16, 0.05, 0.06, i === 1 ? C.tomato : C.amber, { r: 0.02, x: -1.38, y, z: -2.62 }));
  }
  desk.add(rbox(0.14, deskTop - 0.14, 0.14, C.walnutDark, { r: 0.05, x: 2.22, y: (deskTop - 0.14) / 2, z: -3.85 }));
  desk.add(rbox(0.14, deskTop - 0.14, 0.14, C.walnutDark, { r: 0.05, x: 2.22, y: (deskTop - 0.14) / 2, z: -2.75 }));
  desk.add(rbox(0.1, 0.1, 1.0, C.walnutDark, { r: 0.03, x: 2.22, y: 0.2, z: -3.3 }));
  room.add(desk);
  colliders.push([-1.95, 2.35, -4.0, -2.6]);

  // ---------- CRT monitor ----------
  const mx = -0.6, mz = -3.5;
  const crt = new THREE.Group();
  crt.add(rbox(0.8, 0.07, 0.6, C.creamDark, { r: 0.03, x: mx, y: deskTop + 0.035, z: mz }));
  crt.add(rbox(0.3, 0.12, 0.25, C.creamDark, { r: 0.04, x: mx, y: deskTop + 0.12, z: mz }));
  crt.add(rbox(1.3, 1.08, 0.9, C.creamDark, { r: 0.12, x: mx, y: deskTop + 0.72, z: mz }));
  crt.add(rbox(0.95, 0.8, 0.5, '#e4d6bf', { r: 0.14, x: mx, y: deskTop + 0.7, z: mz - 0.5 }));
  crt.add(rbox(1.08, 0.84, 0.05, '#1b1430', { r: 0.02, x: mx, y: deskTop + 0.76, z: mz + 0.44, shadow: false }));
  // screen canvas
  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 320;
  screenCanvas.height = 240;
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.magFilter = THREE.NearestFilter;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.735), new THREE.MeshBasicMaterial({ map: screenTex }));
  screen.position.set(mx, deskTop + 0.76, mz + 0.475);
  crt.add(screen);
  crt.add(rbox(0.08, 0.05, 0.03, C.green, { r: 0.01, x: mx + 0.5, y: deskTop + 0.24, z: mz + 0.46, shadow: false, material: new THREE.MeshBasicMaterial({ color: C.green }) }));
  crt.add(rbox(0.12, 0.05, 0.03, C.amber, { r: 0.01, x: mx + 0.34, y: deskTop + 0.24, z: mz + 0.46, shadow: false }));
  room.add(crt);
  refs.screen = { canvas: screenCanvas, tex: screenTex };

  const crtLight = new THREE.PointLight(C.green, 0.6, 7, 1.4);
  crtLight.position.set(mx, deskTop + 0.8, mz + 1.2);
  room.add(crtLight);
  refs.crtLight = crtLight;

  // Sticky notes: two on the bezel, two on the glass behind
  const note = (color, x, y, z, rz, ry = 0) => {
    const n = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.012), mat(color));
    n.position.set(x, y, z);
    n.rotation.set(0, ry, rz);
    n.castShadow = true;
    room.add(n);
    // a scribble line so it reads as a note
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.025, 0.005), mat(C.plum));
    s.position.set(0, 0.03, 0.008);
    n.add(s);
    const s2 = s.clone();
    s2.scale.x = 0.6;
    s2.position.set(-0.03, -0.04, 0.008);
    n.add(s2);
  };
  note('#ffe36e', mx + 0.56, deskTop + 1.18, mz + 0.46, 0.18);
  note('#ff9ec0', mx - 0.58, deskTop + 0.4, mz + 0.46, -0.12);
  note('#a8f0b8', 0.55, 1.75, WIN.z + 0.03, 0.08);
  note('#ffe36e', 0.85, 2.05, WIN.z + 0.03, -0.14);
  note('#9cc3e6', 0.62, 2.32, WIN.z + 0.03, 0.05);

  // ---------- Keyboard ----------
  const kb = new THREE.Group();
  kb.add(rbox(1.2, 0.07, 0.38, '#b9a3e3', { r: 0.03, x: mx, y: deskTop + 0.035, z: -2.84 }));
  const keyGeo = new THREE.BoxGeometry(0.075, 0.05, 0.068);
  const cols = 13, rows = 4;
  const keys = new THREE.InstancedMesh(keyGeo, new THREE.MeshStandardMaterial({ roughness: 0.6 }), cols * rows);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  let k = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dummy.position.set(mx - 0.51 + c * 0.085, deskTop + 0.09, -2.97 + r * 0.085);
      dummy.updateMatrix();
      keys.setMatrixAt(k, dummy.matrix);
      let hex = C.cream;
      if (r === 0 && c === 0) hex = C.tomato;
      else if (r === 2 && c === 12) hex = C.amber;
      else if (r === 3 && c > 3 && c < 9) hex = '#efe3cf';
      else if ((r + c) % 7 === 3) hex = C.lilac;
      else if (r === 1 && c === 12) hex = C.green;
      keys.setColorAt(k, col.set(hex));
      k++;
    }
  }
  keys.castShadow = true;
  kb.add(keys);
  room.add(kb);

  // ---------- Coffee mug + steam ----------
  const mugX = 1.55, mugZ = -3.0;
  const mug = new THREE.Group();
  const mugBody = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.3, 14), mat('#f7f4ee', { roughness: 0.35 }));
  mugBody.castShadow = true;
  mugBody.position.y = 0.15;
  const coffee = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.02, 14), mat('#5a3420'));
  coffee.position.y = 0.28;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.025, 6, 12), mat('#f7f4ee', { roughness: 0.35 }));
  handle.position.set(0.16, 0.15, 0);
  handle.castShadow = true;
  mug.add(mugBody, coffee, handle);
  mug.add(rbox(0.12, 0.04, 0.01, C.pinkDeep, { r: 0.005, x: 0, y: 0.17, z: 0.15, shadow: false }));
  mug.position.set(mugX, deskTop, mugZ);
  mug.rotation.y = -0.5;
  room.add(mug);
  const steamMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false });
  const steam = [];
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), steamMat.clone());
    p.userData.phase = i / 6;
    room.add(p);
    steam.push(p);
  }
  refs.steam = { puffs: steam, x: mugX, y: deskTop + 0.32, z: mugZ };

  // Tiny desk plant
  room.add(rbox(0.26, 0.24, 0.26, C.cream, { r: 0.05, x: 2.0, y: deskTop + 0.12, z: -3.7 }));
  for (let i = 0; i < 4; i++) {
    const leaf = rbox(0.1, 0.32, 0.06, '#7fcf9a', { r: 0.03, x: 2.0, y: deskTop + 0.36, z: -3.7 });
    leaf.rotation.set(0.35 * Math.cos(i * 1.6), i * 1.6, 0.35 * Math.sin(i * 1.6));
    room.add(leaf);
  }

  // ---------- Cables ----------
  const cable = (pts, color, r = 0.028) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, r, 6), mat(color));
    m.castShadow = true;
    room.add(m);
  };
  cable([[mx, 1.4, -3.98], [mx - 0.1, 1.0, -4.0], [mx - 0.3, 0.3, -3.95], [mx - 0.8, 0.03, -3.75], [-2.4, 0.03, -3.85], [-3.6, 0.03, -3.9]], C.plum);
  cable([[mx + 0.55, deskTop + 0.04, -2.95], [mx + 0.85, deskTop + 0.03, -3.05], [mx + 0.85, deskTop + 0.03, -3.5], [mx + 0.62, deskTop + 0.25, -3.6]], C.amber, 0.02);
  cable([[2.25, 0.85, -3.9], [2.3, 0.4, -3.95], [2.6, 0.03, -3.6], [3.2, 0.03, -3.8]], '#3fbf6f', 0.024);
  room.add(rbox(0.36, 0.22, 0.06, C.cream, { r: 0.03, x: -3.6, y: 0.4, z: -3.97 })); // wall outlet

  // ---------- Bookshelf on the left wall ----------
  const shelf = new THREE.Group();
  const sx = -4.68, sz0 = -3.65, sz1 = -1.75, sh = 2.4;
  const szc = (sz0 + sz1) / 2, slen = sz1 - sz0;
  shelf.add(rbox(0.6, sh, 0.1, null, { r: 0.04, x: sx, y: sh / 2, z: sz0 + 0.05, material: woodUpright(C.walnutLight) }));
  shelf.add(rbox(0.6, sh, 0.1, null, { r: 0.04, x: sx, y: sh / 2, z: sz1 - 0.05, material: woodUpright(C.walnutLight) }));
  shelf.add(rbox(0.06, sh, slen, C.walnutDark, { r: 0.02, x: -4.95, y: sh / 2, z: szc }));
  const levels = [0.08, 0.85, 1.62, sh - 0.05];
  levels.forEach((y) => shelf.add(rbox(0.6, 0.09, slen, C.walnut, { r: 0.03, x: sx, y, z: szc })));
  // Spines: a few neutrals mixed with muted jewel tones
  const bookColors = ['#efe6d6', '#c2ab8c', '#d9534a', '#e8a33d', '#3f8f6b', '#3a6fb0', '#8b5fb5', '#e07a9a', '#2f9aa0', '#8c7b6b', '#f2c94c', '#c0522d'];
  [levels[0], levels[1]].forEach((ly, li) => {
    let z = sz0 + 0.14;
    const end = li === 1 ? sz1 - 0.65 : sz1 - 0.14;
    while (z < end - 0.12) {
      const bw = 0.09 + rand() * 0.08;
      const bh = 0.45 + rand() * 0.22;
      const b = rbox(0.42, bh, bw, bookColors[Math.floor(rand() * bookColors.length)], { r: 0.025, x: sx + 0.02, y: ly + 0.045 + bh / 2, z: z + bw / 2 });
      if (rand() < 0.12) b.rotation.x = 0.18;
      shelf.add(b);
      z += bw + 0.012;
    }
  });
  // top shelf: a lying stack and coiled cables
  for (let i = 0; i < 3; i++) shelf.add(rbox(0.46, 0.08, 0.36 - i * 0.03, bookColors[(i * 3 + 2) % bookColors.length], { r: 0.02, x: sx, y: levels[2] + 0.085 + i * 0.085, z: sz0 + 0.4 }));
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 6, 18), mat('#3fbf6f'));
  coil.rotation.x = Math.PI / 2;
  coil.position.set(sx, levels[2] + 0.08, sz1 - 0.45);
  coil.castShadow = true;
  shelf.add(coil);
  const coil2 = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 6, 18), mat(C.tomato));
  coil2.rotation.set(Math.PI / 2, 0, 0);
  coil2.position.set(sx, levels[2] + 0.14, sz1 - 0.42);
  shelf.add(coil2);
  // mini drive / router with blinking LED on middle shelf
  shelf.add(rbox(0.36, 0.2, 0.44, C.creamDark, { r: 0.04, x: sx, y: levels[1] + 0.145, z: sz1 - 0.38 }));
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: C.green }));
  led.position.set(sx + 0.185, levels[1] + 0.17, sz1 - 0.3);
  shelf.add(led);
  refs.led = led;
  // a cable dangling off the shelf edge
  const dangle = new THREE.CatmullRomCurve3([
    new THREE.Vector3(sx + 0.1, levels[2] + 0.06, sz1 - 0.5),
    new THREE.Vector3(sx + 0.36, levels[2] - 0.05, sz1 - 0.55),
    new THREE.Vector3(sx + 0.38, levels[2] - 0.5, sz1 - 0.6),
    new THREE.Vector3(sx + 0.3, levels[1] + 0.2, sz1 - 0.68),
  ]);
  const dm = new THREE.Mesh(new THREE.TubeGeometry(dangle, 20, 0.022, 5), mat('#3fbf6f'));
  dm.castShadow = true;
  shelf.add(dm);
  // an envelope leaning against the middle-shelf books: the hint that the shelf does something
  const env = new THREE.Group();
  env.add(rbox(0.025, 0.24, 0.36, C.kraft, { r: 0.008, y: 0.12 }));
  [-1, 1].forEach((s) => {
    const fold = rbox(0.006, 0.02, 0.222, C.kraftDark, { r: 0.003, x: 0.014, y: 0.175, z: s * 0.09, shadow: false });
    fold.rotation.x = -s * 0.625;
    env.add(fold);
  });
  env.add(rbox(0.02, 0.06, 0.06, C.wax, { r: 0.01, x: 0.016, y: 0.115, shadow: false }));
  env.position.set(sx + 0.27, levels[1] + 0.045, -2.85);
  env.rotation.z = 0.15;
  shelf.add(env);
  // potted plant on top
  shelf.add(rbox(0.3, 0.28, 0.3, C.tomato, { r: 0.05, x: sx, y: sh + 0.14, z: szc }));
  for (let i = 0; i < 5; i++) {
    const leaf = rbox(0.12, 0.42, 0.07, '#6cc28c', { r: 0.03, x: sx, y: sh + 0.45, z: szc });
    leaf.rotation.set(0.45 * Math.cos(i * 1.25), i * 1.25, 0.45 * Math.sin(i * 1.25));
    shelf.add(leaf);
  }
  room.add(shelf);
  colliders.push([-5, -4.3, sz0 - 0.05, sz1 + 0.05]);

  // Framed pixel heart on the left wall
  const heartTex = canvasTexture(10, 9, (ctx) => {
    const rows = ['..........', '.rr...rr..', 'rrrr.rrrr.', 'rrrrrrrrr.', 'rrrrrrrrr.', '.rrrrrrr..', '..rrrrr...', '...rrr....', '....r.....'];
    ctx.fillStyle = C.cream;
    ctx.fillRect(0, 0, 10, 9);
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'r') { ctx.fillStyle = C.tomato; ctx.fillRect(x + 0.5, y, 1, 1); } }));
  }, { nearest: true });
  room.add(rbox(0.08, 1.0, 1.1, C.purple, { r: 0.03, x: -4.97, y: 3.6, z: 0.4 }));
  const heart = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), new THREE.MeshStandardMaterial({ map: heartTex, roughness: 0.9 }));
  heart.rotation.y = Math.PI / 2;
  heart.position.set(-4.92, 3.6, 0.4);
  room.add(heart);
  // A second, smaller frame: tiny terminal prompt
  const promptTex = canvasTexture(12, 8, (ctx) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 12, 8);
    ctx.fillStyle = C.green;
    [[2, 2], [3, 3], [2, 4]].forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
    ctx.fillRect(5, 4, 3, 1);
  }, { nearest: true });
  room.add(rbox(0.08, 0.66, 0.9, C.amber, { r: 0.03, x: -4.97, y: 2.9, z: 1.75 }));
  const promptPic = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.5), new THREE.MeshBasicMaterial({ map: promptTex }));
  promptPic.rotation.y = Math.PI / 2;
  promptPic.position.set(-4.92, 2.9, 1.75);
  room.add(promptPic);

  // ---------- Chair ----------
  const chair = new THREE.Group();
  chair.add(rbox(0.8, 0.14, 0.78, C.pinkDeep, { r: 0.06, y: 0.62 }));
  chair.add(rbox(0.78, 0.8, 0.14, C.pinkDeep, { r: 0.06, y: 1.1, z: -0.34 }));
  chair.add(rbox(0.1, 0.5, 0.1, C.plum, { r: 0.03, y: 0.32 }));
  for (let i = 0; i < 5; i++) {
    const leg = rbox(0.42, 0.06, 0.08, C.plum, { r: 0.025, y: 0.07 });
    leg.rotation.y = (i / 5) * Math.PI * 2;
    leg.position.set(Math.cos(-(i / 5) * Math.PI * 2) * 0.2, 0.07, Math.sin(-(i / 5) * Math.PI * 2) * 0.2);
    chair.add(leg);
  }
  chair.position.set(3.05, 0, -2.05);
  chair.rotation.y = -0.65;
  room.add(chair);
  colliders.push([2.6, 3.5, -2.5, -1.6]);

  // ---------- Standing lamp (corner) ----------
  const lx = 4.2, lz = -3.5, shadeY = 2.45;
  const lamp = new THREE.Group();
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.07, 24), mat(C.walnutDark));
  lampBase.position.y = 0.035;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, shadeY - 0.1, 10), woodUpright(C.walnut));
  pole.position.y = (shadeY - 0.1) / 2 + 0.06;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12), mat('#d8b27a', { roughness: 0.4, metalness: 0.3 }));
  collar.position.y = shadeY - 0.12;
  // Linen drum shade, open at both ends; it glows from the inside.
  const shadeMat = new THREE.MeshStandardMaterial({
    color: '#fbf3e4', roughness: 0.95, side: THREE.DoubleSide, emissive: '#ffe2b0', emissiveIntensity: 0.4,
  });
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.46, 0.52, 28, 1, true), shadeMat);
  shade.position.y = shadeY;
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#fff4dc' });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), bulbMat);
  bulb.position.y = shadeY - 0.04;
  [lampBase, pole, collar, shade].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  lamp.add(lampBase, pole, collar, shade, bulb);
  lamp.position.set(lx, 0, lz);
  room.add(lamp);
  const lampLight = new THREE.PointLight('#ffd9a8', 2, 7, 1.3);
  lampLight.position.set(lx, shadeY - 0.1, lz);
  room.add(lampLight);
  refs.lamp = { light: lampLight, shade: shadeMat, bulb: bulbMat };
  colliders.push([3.85, 4.55, -3.85, -3.15]);

  // ---------- Patchwork rug ----------
  const rug = new THREE.Group();
  const patch = [C.pink, C.blue, C.lilac, C.cream, C.mint, C.peach, C.pinkDeep, C.blueDeep];
  rug.add(rbox(4.1, 0.03, 3.3, C.cream, { r: 0.01, y: 0.015, shadow: false }));
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 4; j++) {
      const c = patch[(i * 3 + j * 5 + (i * j) % 3) % patch.length];
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.03, 0.72), mat(c));
      p.position.set(-1.6 + i * 0.8, 0.035, -1.2 + j * 0.8);
      p.receiveShadow = true;
      rug.add(p);
    }
  }
  // stitched border dashes
  for (let i = 0; i < 18; i++) {
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.03), mat(C.tomato));
    d.position.set(-1.95 + i * 0.23, 0.036, 1.6);
    rug.add(d);
    const d2 = d.clone();
    d2.position.z = -1.6;
    rug.add(d2);
  }
  rug.position.set(0.5, 0, 0.9);
  room.add(rug);

  // ---------- Light shafts (sheets aligned to the sun direction) ----------
  const shaftTex = canvasTexture(64, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const s = ctx.createLinearGradient(0, 0, w, 0);
    s.addColorStop(0, 'rgba(0,0,0,1)');
    s.addColorStop(0.25, 'rgba(0,0,0,0)');
    s.addColorStop(0.75, 'rgba(0,0,0,0)');
    s.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = s;
    ctx.fillRect(0, 0, w, h);
  });
  const shafts = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.MeshBasicMaterial({
      map: shaftTex, color: '#ffd9a0', transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1), m);
    sheet.userData.paneX = -2.13 + i * 2.13;
    sheet.renderOrder = 4;
    room.add(sheet);
    shafts.push(sheet);
  }
  refs.shafts = shafts;

  // ---------- Interactables ----------
  interactables.push(
    { id: 'monitor', label: 'Open projects', points: [[mx, -2.2], [mx - 0.5, -2.2]], anchor: new THREE.Vector3(mx, 2.35, mz) },
    { id: 'mug', label: 'Coffee', points: [[1.6, -2.2]], anchor: new THREE.Vector3(mugX, 1.75, mugZ) },
    { id: 'window', label: 'Look outside', points: [[2.9, -3.45], [-3.0, -3.4], [-2.4, -3.4]], anchor: new THREE.Vector3(2.7, 3.2, -4.0) },
    { id: 'bookshelf', label: 'Bored? Pull a card', points: [[-3.95, -3.15], [-3.95, -2.7], [-3.95, -2.2]], anchor: new THREE.Vector3(sx + 0.3, levels[2], szc) },
  );

  return { room, colliders, interactables, refs };
}

/* Sky, hills, sun/moon and stars in one cheap shader on a plane right behind the glass. */
function buildBackdrop(room) {
  const uniforms = {
    uTop: { value: new THREE.Color('#8ec9f2') },
    uBottom: { value: new THREE.Color('#ffe3b8') },
    uHillFar: { value: new THREE.Color('#b7e2b0') },
    uHillNear: { value: new THREE.Color('#8fcf8f') },
    uSun: { value: new THREE.Color('#fff2b0') },
    uSunPos: { value: new THREE.Vector2(0.8, 3.7) },
    uSunAmt: { value: 1 },
    uMoon: { value: 0 },
    uStars: { value: 0 },
    uFlash: { value: 0 },
    uClouds: { value: 0.3 },
    uCloudCol: { value: new THREE.Color('#ffffff') },
    uTime: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xy;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      varying vec2 vW;
      uniform vec3 uTop, uBottom, uHillFar, uHillNear, uSun, uCloudCol;
      uniform vec2 uSunPos;
      uniform float uSunAmt, uMoon, uStars, uFlash, uClouds, uTime;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float blob(vec2 p, vec2 c, vec2 r) { vec2 d = (p - c) / r; return smoothstep(1.0, 0.92, length(d)); }
      void main() {
        vec2 p = vW;
        float t = clamp((p.y + 0.5) / 5.5, 0.0, 1.0);
        vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, t));
        // stars: a coarse grid of twinkling pixels
        vec2 g = floor(p * 9.0);
        float h = hash(g);
        float star = step(0.985, h) * (0.6 + 0.4 * sin(uTime * (1.5 + h * 3.0) + h * 40.0));
        col += vec3(1.0, 0.97, 0.9) * star * uStars * smoothstep(0.9, 1.8, p.y);
        // sun / moon disc with a soft halo
        float d = length(p - uSunPos);
        float disc = smoothstep(0.52, 0.48, d);
        float halo = exp(-d * 1.6) * 0.45;
        col = mix(col, uSun, disc * uSunAmt);
        col += uSun * halo * uSunAmt * (1.0 - uMoon * 0.6);
        // moon crescent cut
        float cut = smoothstep(0.42, 0.38, length(p - uSunPos - vec2(0.22, 0.12)));
        col = mix(col, mix(uBottom, uTop, t), cut * uMoon * disc);
        // blocky clouds
        float cl = 0.0;
        for (int i = 0; i < 4; i++) {
          float fi = float(i);
          float x = mod(fi * 2.7 + uTime * (0.05 + fi * 0.015), 9.0) - 5.0;
          float y = 3.0 + mod(fi * 1.37, 1.6);
          cl = max(cl, blob(p, vec2(x, y), vec2(0.9, 0.32)));
          cl = max(cl, blob(p, vec2(x + 0.5, y + 0.22), vec2(0.55, 0.3)));
        }
        col = mix(col, uCloudCol, cl * uClouds);
        // hills
        float far = 1.05 + 0.45 * sin(p.x * 0.7 + 1.3) + 0.2 * sin(p.x * 1.9 + 0.4);
        float near = 0.35 + 0.3 * sin(p.x * 0.95 + 3.1) + 0.12 * sin(p.x * 2.6);
        col = mix(col, uHillFar, step(p.y, far));
        col = mix(col, uHillNear, step(p.y, near));
        col += vec3(0.85, 0.9, 1.0) * uFlash;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  // Sized so its edges always stay hidden behind the walls from the fixed camera.
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 6.2), material);
  plane.position.set(-0.8, 1.7, -5.3);
  room.add(plane);
  return uniforms;
}
