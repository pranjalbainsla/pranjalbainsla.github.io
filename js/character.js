import * as THREE from 'three';
import { C, mat, rbox, canvasTexture, damp, seeded } from './helpers.js';

const SKIN = '#d69c78';
const HAIR = '#3b2418';
const HOODIE = '#f6a8c3';
const HOODIE_RIB = '#e98aad';
const NAME = 'PRANJAL';

export class Character {
  constructor(scene) {
    this.root = new THREE.Group();
    this.body = new THREE.Group(); // bobs while walking
    this.root.add(this.body);
    scene.add(this.root);

    this.pos = new THREE.Vector2(0.6, 1.2); // x, z
    this.heading = Math.PI * 0.25; // facing the camera
    this.targetHeading = this.heading;
    this.speed = 2.6;
    this.radius = 0.3;
    this.walk = 0;
    this.moving = 0;

    this.build();
    this.root.position.set(this.pos.x, 0, this.pos.y);
  }

  build() {
    const b = this.body;
    // Fuzzy sherpa: soft light/dark specks over pink, fully matte
    const fluff = canvasTexture(64, 64, (ctx, w, h) => {
      ctx.fillStyle = HOODIE;
      ctx.fillRect(0, 0, w, h);
      const r = seeded(5);
      for (let i = 0; i < 900; i++) {
        const x = r() * w, y = r() * h;
        ctx.fillStyle = r() < 0.65 ? 'rgba(255,235,243,0.5)' : 'rgba(190,90,130,0.22)';
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + r() * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    const hoodieMat = new THREE.MeshStandardMaterial({ map: fluff, roughness: 1 });
    const ribMat = new THREE.MeshStandardMaterial({ color: HOODIE_RIB, roughness: 1 });

    // Mid-blue denim with a diagonal twill and a lighter seam line
    const denim = canvasTexture(64, 64, (ctx, w, h) => {
      ctx.fillStyle = '#6f9fd8';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(30,60,120,0.22)';
      ctx.lineWidth = 1;
      for (let i = -h; i < w; i += 3) {
        ctx.beginPath();
        ctx.moveTo(i, h);
        ctx.lineTo(i + h, 0);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(220,235,255,0.35)';
      ctx.fillRect(w / 2 - 1, 0, 2, h);
    });
    const jeansMat = new THREE.MeshStandardMaterial({ map: denim, roughness: 0.9 });

    // Name across the back of the hoodie: chunky caps, cut out with alphaTest
    const nameTex = canvasTexture(512, 128, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.font = '900 92px "Arial Black", "Helvetica Neue", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 12;
      ctx.strokeStyle = '#c4517c';
      ctx.strokeText(NAME, w / 2, h / 2 + 4, w - 24);
      ctx.fillStyle = '#fff7fa';
      ctx.fillText(NAME, w / 2, h / 2 + 4, w - 24);
    });
    const nameMat = new THREE.MeshStandardMaterial({ map: nameTex, alphaTest: 0.5, roughness: 0.9 });

    // Subtle leopard print for the glasses frames
    const leopard = canvasTexture(32, 32, (ctx) => {
      ctx.fillStyle = '#b98252';
      ctx.fillRect(0, 0, 32, 32);
      const spots = [[4, 5], [14, 3], [25, 8], [8, 16], [20, 18], [29, 22], [3, 27], [15, 27], [24, 30]];
      for (const [x, y] of spots) {
        ctx.fillStyle = '#4a2e1c';
        ctx.fillRect(x, y, 4, 3);
        ctx.fillStyle = '#d6a670';
        ctx.fillRect(x + 1, y + 1, 2, 1);
      }
    }, { nearest: true });
    const frameMat = new THREE.MeshStandardMaterial({ map: leopard, roughness: 0.5 });

    // Legs (pivot at hip): wide-leg jeans that flare a little at the hem
    this.legs = [-1, 1].map((s) => {
      const g = new THREE.Group();
      g.position.set(0.13 * s, 0.58, 0);
      g.add(rbox(0.24, 0.42, 0.26, null, { r: 0.05, y: -0.21, material: jeansMat }));
      g.add(rbox(0.28, 0.16, 0.3, null, { r: 0.05, y: -0.44, material: jeansMat }));
      g.add(rbox(0.2, 0.07, 0.3, '#f4efe6', { r: 0.03, y: -0.545, z: 0.05 })); // sneaker toes
      b.add(g);
      return g;
    });
    b.add(rbox(0.52, 0.08, 0.3, null, { r: 0.03, y: 0.6, material: jeansMat })); // waistband

    // Torso: oversized fluffy hoodie with ribbed hem, front pocket, hood and drawstrings
    b.add(rbox(0.62, 0.54, 0.38, null, { r: 0.12, y: 0.89, material: hoodieMat }));
    b.add(rbox(0.63, 0.08, 0.39, null, { r: 0.035, y: 0.64, material: ribMat }));
    b.add(rbox(0.36, 0.14, 0.03, null, { r: 0.03, y: 0.77, z: 0.19, material: hoodieMat })); // pocket
    b.add(rbox(0.46, 0.2, 0.18, null, { r: 0.08, y: 1.16, z: -0.15, material: hoodieMat })); // hood, bunched at the back
    b.add(rbox(0.34, 0.08, 0.3, null, { r: 0.035, y: 1.16, z: 0.02, material: ribMat })); // neckline
    [-1, 1].forEach((s) => b.add(rbox(0.025, 0.16, 0.025, '#fff7fa', { r: 0.01, x: 0.06 * s, y: 1.04, z: 0.2 })));
    const name = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.155), nameMat);
    name.position.set(0, 0.9, -0.192);
    name.rotation.y = Math.PI;
    b.add(name);

    // Arms (pivot at shoulder)
    this.arms = [-1, 1].map((s) => {
      const g = new THREE.Group();
      g.position.set(0.39 * s, 1.07, 0);
      g.add(rbox(0.18, 0.44, 0.2, null, { r: 0.07, y: -0.2, material: hoodieMat }));
      g.add(rbox(0.17, 0.07, 0.19, null, { r: 0.025, y: -0.42, material: ribMat }));
      g.add(rbox(0.12, 0.11, 0.13, SKIN, { r: 0.045, y: -0.5 }));
      b.add(g);
      return g;
    });

    // Head
    const head = new THREE.Group();
    head.position.y = 1.43;
    this.head = head;
    b.add(head);
    head.add(rbox(0.5, 0.46, 0.44, SKIN, { r: 0.12 }));
    // Shoulder-length bob: rounded crown, long back and sides, blunt bangs
    head.add(rbox(0.58, 0.18, 0.52, HAIR, { r: 0.09, y: 0.2, z: -0.01 }));
    head.add(rbox(0.6, 0.62, 0.16, HAIR, { r: 0.07, y: -0.06, z: -0.2 }));
    [-1, 1].forEach((s) => {
      head.add(rbox(0.1, 0.56, 0.4, HAIR, { r: 0.045, x: 0.285 * s, y: -0.04, z: -0.03 }));
      head.add(rbox(0.13, 0.12, 0.44, HAIR, { r: 0.05, x: 0.29 * s, y: -0.3, z: -0.05 })); // ends tuck outward
    });
    head.add(rbox(0.52, 0.12, 0.08, HAIR, { r: 0.04, y: 0.15, z: 0.215 }));
    // Face
    const eyeMat = mat(C.plum);
    [-1, 1].forEach((s) => {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.075, 0.02), eyeMat);
      eye.position.set(0.11 * s, -0.01, 0.221);
      head.add(eye);
      const blush = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.035, 0.01), mat('#f08aa6'));
      blush.position.set(0.17 * s, -0.09, 0.222);
      head.add(blush);
      // Glasses: four thin bars per lens
      const lens = new THREE.Group();
      lens.position.set(0.11 * s, -0.01, 0.235);
      const bar = (w, h, x, y) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.025), frameMat);
        m.position.set(x, y, 0);
        lens.add(m);
      };
      bar(0.17, 0.028, 0, 0.06);
      bar(0.17, 0.028, 0, -0.06);
      bar(0.028, 0.14, -0.072, 0);
      bar(0.028, 0.14, 0.072, 0);
      head.add(lens);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.24), frameMat);
      arm.position.set(0.255 * s, 0.03, 0.12);
      head.add(arm);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.022, 0.022), frameMat);
    bridge.position.set(0, 0.02, 0.236);
    head.add(bridge);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.01), mat('#9c4a4a'));
    mouth.position.set(0, -0.12, 0.222);
    head.add(mouth);

    this.root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });

    // Soft blob shadow helper under feet (reads well even in dim weather)
    const blob = new THREE.Mesh(
      new THREE.CircleGeometry(0.34, 16),
      new THREE.MeshBasicMaterial({ color: C.plum, transparent: true, opacity: 0.16, depthWrite: false }),
    );
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.055;
    this.root.add(blob);
  }

  /** move: Vector2 in world XZ (already camera-relative), length 0..1 */
  update(dt, move, colliders, bounds, time) {
    const len = Math.min(1, move.length());
    if (len > 0.05) {
      this.targetHeading = Math.atan2(move.x, move.y);
      const step = this.speed * len * dt;
      this.tryMove(move.x / len * step, move.y / len * step, colliders, bounds);
    }
    this.moving = damp(this.moving, len > 0.05 ? 1 : 0, 10, dt);

    // smooth turn along the shortest arc
    let diff = this.targetHeading - this.heading;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.heading += diff * (1 - Math.exp(-12 * dt));

    this.walk += dt * 10 * this.moving;
    const sw = Math.sin(this.walk) * this.moving;
    this.legs[0].rotation.x = sw * 0.6;
    this.legs[1].rotation.x = -sw * 0.6;
    this.arms[0].rotation.x = -sw * 0.55;
    this.arms[1].rotation.x = sw * 0.55;
    const idle = Math.sin(time * 2.2) * 0.012 * (1 - this.moving);
    this.body.position.y = Math.abs(Math.sin(this.walk)) * 0.06 * this.moving + idle;
    this.head.rotation.z = Math.sin(this.walk * 0.5) * 0.05 * this.moving;
    this.body.rotation.z = Math.sin(this.walk) * 0.03 * this.moving;

    this.root.position.set(this.pos.x, 0, this.pos.y);
    this.root.rotation.y = this.heading;
  }

  tryMove(dx, dz, colliders, bounds) {
    // Resolve each axis separately so the character slides along furniture.
    const r = this.radius;
    const blocked = (x, z) => {
      if (x < bounds[0] + r || x > bounds[1] - r || z < bounds[2] + r || z > bounds[3] - r) return true;
      for (const [x0, x1, z0, z1] of colliders) {
        const cx = Math.max(x0, Math.min(x, x1));
        const cz = Math.max(z0, Math.min(z, z1));
        if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true;
      }
      return false;
    };
    if (!blocked(this.pos.x + dx, this.pos.y)) this.pos.x += dx;
    if (!blocked(this.pos.x, this.pos.y + dz)) this.pos.y += dz;
  }

  faceToward(x, z) {
    this.targetHeading = Math.atan2(x - this.pos.x, z - this.pos.y);
  }
}
