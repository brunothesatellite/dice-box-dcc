// PROTOTYPE (branche evol-physique) : un D20 en vraie physique cannon-es.
// Pas de tirage en amont : le résultat est la face du dessus à l'arrêt.
// Conditions initiales (position, vitesse, spin) tirées en crypto.
import * as THREE from '../vendor/three.module.min.js';
import * as CANNON from '../vendor/cannon-es.js';
import { buildDie } from './dice3d.js';
import { solidFor } from './solids.js';
import { DICE, pickShade, formatValue, TOTAL_MS } from './config.js';
import { randInt } from './rng.js';

const def = DICE.find((d) => d.label === 'D20');
const WORLD_W = 8, DIE_R = 0.72, ELEV = (56 * Math.PI) / 180;

const trayEl = document.getElementById('tray');
const toastEl = document.getElementById('toast');
const totalEl = document.getElementById('total');
const helpModal = document.getElementById('helpModal');
let toastT = null;
const toast = (m) => { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200); };

// --- rendu (même recette que le tapis scripté) ---
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;';
trayEl.appendChild(renderer.domElement);
const blayer = document.createElement('div');
blayer.id = 'blayer';
trayEl.appendChild(blayer);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
scene.add(new THREE.HemisphereLight(0xffffff, 0x1a2a20, 0.9));
const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(6, 10, 4);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
scene.add(key);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.28 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- physique ---
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -22, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
const feltM = new CANNON.Material('felt');
const dieM = new CANNON.Material('die');
world.addContactMaterial(new CANNON.ContactMaterial(feltM, dieM, { friction: 0.35, restitution: 0.35 }));
world.addContactMaterial(new CANNON.ContactMaterial(dieM, dieM, { friction: 0.3, restitution: 0.45 }));

const groundBody = new CANNON.Body({ mass: 0, material: feltM, shape: new CANNON.Plane() });
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(groundBody);

let bx = WORLD_W / 2, bz = 3;
const walls = [];
function buildWalls() {
  walls.forEach((w) => world.removeBody(w));
  walls.length = 0;
  const T = 1, H = 6;
  const defs = [
    { x: -(bx + T / 2), z: 0, sx: T, sz: 2 * bz + T },
    { x: bx + T / 2, z: 0, sx: T, sz: 2 * bz + T },
    { x: 0, z: -(bz + T / 2), sx: 2 * bx + T, sz: T },
    { x: 0, z: bz + T / 2, sx: 2 * bx + T, sz: T },
  ];
  for (const { x, z, sx, sz } of defs) {
    const w = new CANNON.Body({ mass: 0, material: feltM, shape: new CANNON.Box(new CANNON.Vec3(sx / 2, H / 2, sz / 2)) });
    w.position.set(x, H / 2 - 0.5, z);
    world.addBody(w);
    walls.push(w);
  }
}

// --- dé : mesh partagé + corps convexe exact (mêmes sommets unitaires) ---
const group = buildDie(def, pickShade(def.color, 0));
group.scale.setScalar(DIE_R);
group.rotation.set(0.4, 0.7, 0.2);
scene.add(group);
const built = group.userData.built;
const s20 = solidFor('d20');
const shape = new CANNON.ConvexPolyhedron({
  vertices: s20.verts.map((v) => new CANNON.Vec3(v[0] * DIE_R, v[1] * DIE_R, v[2] * DIE_R)),
  faces: s20.faces.map((f) => [...f]),
});
const body = new CANNON.Body({
  mass: 1, material: dieM, shape,
  allowSleep: true, sleepSpeedLimit: 0.5, sleepTimeLimit: 0.5,
  angularDamping: 0.25, linearDamping: 0.05,
});
body.position.set(0, 0.6, 0);
body.sleep();
world.addBody(body);

// --- état ---
let thrown = false, readDone = true, throwTime = 0, totalT = null, readId = 0;
let badge = null;
function hideBadge() { if (badge) { badge.remove(); badge = null; } }
function hideTotal() { totalEl.hidden = true; clearTimeout(totalT); }
function cryptoRange(n, mul, add) { return (randInt(n) / (n - 1)) * mul + add; } // uniforme crypto dans [add, add+mul]

function throwDie() {
  hideBadge(); hideTotal();
  body.wakeUp();
  body.position.set(cryptoRange(2000, 3, -1.5), 2.5 + cryptoRange(1000, 1, 0), cryptoRange(2000, 3, -1.5));
  const a = cryptoRange(628, Math.PI * 2, 0);
  const sp = cryptoRange(300, 3, 2); // 2..5
  body.velocity.set(Math.cos(a) * sp, 0.5, Math.sin(a) * sp);
  body.angularVelocity.set(cryptoRange(4000, 40, -20), cryptoRange(4000, 40, -20), cryptoRange(4000, 40, -20));
  thrown = true; readDone = false; throwTime = performance.now();
}
function placeBadge() {
  if (!badge) return;
  const v = group.position.clone().project(camera);
  const r = trayEl.getBoundingClientRect();
  const rpx = DIE_R * (r.width / WORLD_W);
  badge.style.transform = `translate(${(v.x + 1) / 2 * r.width + rpx * 0.55}px,${(1 - v.y) / 2 * r.height - rpx * 1.15}px)`;
}
function readResult() {
  readDone = true;
  readId++;
  group.quaternion.copy(body.quaternion);
  let best = -2, bi = 0;
  built.faceNormals.forEach((n, i) => {
    const w = n.clone().applyQuaternion(group.quaternion);
    if (w.y > best) { best = w.y; bi = i; }
  });
  const value = built.landing.indexOf(bi) + 1; // face du dessus -> résultat
  const el = document.createElement('div');
  el.className = 'bdg';
  el.innerHTML = '<span>' + formatValue(def, value) + '</span>';
  el.style.borderColor = def.color;
  el.style.color = '#ffffff';
  blayer.appendChild(el);
  badge = el;
  placeBadge(); // positionné de suite, même pendant l'anim pop
  totalEl.textContent = `Total : ${value}`;
  totalEl.hidden = false;
  clearTimeout(totalT);
  totalT = setTimeout(hideTotal, TOTAL_MS);
}
body.addEventListener('sleep', () => { if (thrown && !readDone) readResult(); });

// --- boucle ---
function resize() {
  const r = trayEl.getBoundingClientRect();
  const pxW = Math.max(1, r.width), pxH = Math.max(1, r.height);
  bz = (WORLD_W * pxH) / pxW / 2;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(pxW, pxH, false);
  camera.aspect = pxW / pxH;
  camera.updateProjectionMatrix();
  const fov = (camera.fov * Math.PI) / 180;
  const worldH = bz * 2;
  const dist = Math.max(worldH / 2 / Math.tan(fov / 2), WORLD_W / 2 / (Math.tan(fov / 2) * camera.aspect)) * 1.07;
  camera.position.set(0, Math.sin(ELEV) * dist, Math.cos(ELEV) * dist);
  camera.lookAt(0, 0, 0);
  buildWalls();
}
new ResizeObserver(resize).observe(trayEl);
resize();

let last = -1;
renderer.setAnimationLoop(() => {
  const now = performance.now();
  if (last < 0) last = now;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  world.step(1 / 120, dt, 8);
  group.position.copy(body.position);
  group.quaternion.copy(body.quaternion);
  if (thrown && !readDone && now - throwTime > 8000) { body.sleep(); readResult(); } // sécurité
  if (badge) placeBadge();
  renderer.render(scene, camera);
});

// --- UI ---
document.getElementById('rollBtn').addEventListener('click', throwDie);
document.getElementById('clearBtn').addEventListener('click', () => {
  hideBadge(); hideTotal();
  thrown = false; readDone = true;
  body.velocity.setZero();
  body.angularVelocity.setZero();
  body.position.set(0, 0.6, 0);
  body.sleep();
});
totalEl.addEventListener('click', hideTotal);
document.getElementById('helpBtn').addEventListener('click', () => { helpModal.hidden = false; });
document.getElementById('hClose').addEventListener('click', () => { helpModal.hidden = true; });
helpModal.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.hidden = true; });

window.__proto = { body, built, group, throwDie, get readId() { return readId; } }; // hook de test
window.__booted = true;
