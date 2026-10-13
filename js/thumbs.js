// Miniatures 3D du picker : chaque type rendu une fois, en data-URL.
import * as THREE from '../vendor/three.module.min.js';
import { buildDie, normalForValue } from './dice3d.js';
import { valuesFor } from './config.js';

// Présente la première face (1, ou 00) face caméra : un chiffre lisible.
function presentFace(g, cam) {
  const def = g.userData.def, built = g.userData.built;
  const camDir = cam.position.clone().normalize();
  const n = normalForValue(def, built, valuesFor(def)[0]);
  const target = camDir.clone();
  g.quaternion.setFromUnitVectors(n, target);
  g.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(target, 0.3));
}

export function renderThumbs(defs, size = 112) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(size, size, false);
  renderer.setPixelRatio(1);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223028, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(3, 5, 4);
  scene.add(key);
  const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  cam.position.set(1.9, 2.2, 3.0);
  cam.lookAt(0, 0, 0);
  const out = new Map();
  for (const def of defs) {
    const g = buildDie(def, def.color);
    presentFace(g, cam);
    scene.add(g);
    renderer.render(scene, cam);
    out.set(def.label, renderer.domElement.toDataURL());
    scene.remove(g);
  }
  renderer.dispose();
  renderer.domElement.remove();
  return out;
}
