// Fabrique de dés 3D : géométrie + texture de chiffres + orientation résultat.
import * as THREE from '../vendor/three.module.min.js';
import { solidFor, newellNormal } from './solids.js';
import { atlasFor, CELL } from './textures.js';
import { valuesFor } from './config.js';

const geoCache = new Map();
const matCache = new Map();

function v3norm(n) {
  const m = Math.hypot(n[0], n[1], n[2]) || 1;
  return new THREE.Vector3(n[0] / m, n[1] / m, n[2] / m);
}
function faceNormalV(verts, face) {
  return v3norm(newellNormal(face.map((i) => verts[i])));
}
// D6 authentique : faces opposées = 7.
function cubeLanding(solid) {
  const ns = solid.faces.map((f) => faceNormalV(solid.verts, f));
  const used = new Set(), pairs = [];
  ns.forEach((a, i) => {
    if (used.has(i)) return;
    const j = ns.findIndex((b, k) => !used.has(k) && k !== i && a.dot(b) < -0.999);
    used.add(i); used.add(j);
    pairs.push([i, j]);
  });
  const vals = [[1, 6], [2, 5], [3, 4]];
  const landing = new Array(6);
  pairs.forEach(([a, b], k) => { landing[vals[k][0] - 1] = a; landing[vals[k][1] - 1] = b; });
  return landing;
}
// Projection planaire d'une face sur l'axe dominant -> UV dans sa case d'atlas.
function faceUVs(verts, face, cell, cols, atlasW, atlasH) {
  const n = faceNormalV(verts, face);
  const hint = Math.abs(n.y) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
  const uA = new THREE.Vector3().crossVectors(hint, n).normalize();
  const vA = new THREE.Vector3().crossVectors(n, uA).normalize();
  const p0 = verts[face[0]];
  const dots = face.map((i) => {
    const dx = verts[i][0] - p0[0], dy = verts[i][1] - p0[1], dz = verts[i][2] - p0[2];
    return [dx * uA.x + dy * uA.y + dz * uA.z, dx * vA.x + dy * vA.y + dz * vA.z];
  });
  const us = dots.map((q) => q[0]), vs = dots.map((q) => q[1]);
  const minU = Math.min(...us), maxU = Math.max(...us);
  const minV = Math.min(...vs), maxV = Math.max(...vs);
  const m = 7; // marge intérieure de case (chiffres larges et lisibles)
  const cx = (cell % cols) * CELL, cy = Math.floor(cell / cols) * CELL;
  return dots.map(([du, dv]) => {
    const fu = (du - minU) / ((maxU - minU) || 1);
    const fv = (dv - minV) / ((maxV - minV) || 1);
    const u = (cx + m + fu * (CELL - 2 * m)) / atlasW;
    const v = 1 - (cy + CELL - m - fv * (CELL - 2 * m)) / atlasH;
    return [u, v];
  });
}
function buildGeometry(def) {
  if (geoCache.has(def.kind)) return geoCache.get(def.kind);
  const s = solidFor(def.kind);
  const blankCell = valuesFor(def).length;
  const atlas = atlasFor(def, '#ffffff');
  const AW = atlas.canvas.width, AH = atlas.canvas.height;
  const Acols = atlas.cols;
  const landing = s.cube ? cubeLanding(s) : [...s.landing];
  const blankSet = new Set(s.blank || []);
  const valueOfFace = new Array(s.faces.length).fill(blankCell);
  if (landing) landing.forEach((fi, vi) => { valueOfFace[fi] = vi; });
  const pos = [], nrm = [], uv = [];
  const faceNormals = s.faces.map((f) => faceNormalV(s.verts, f));
  s.faces.forEach((face, fi) => {
    const uvs = faceUVs(s.verts, face, valueOfFace[fi], Acols, AW, AH);
    for (let k = 1; k < face.length - 1; k++) {
      for (const vi of [face[0], face[k], face[k + 1]]) {
        const v = s.verts[vi];
        pos.push(v[0], v[1], v[2]);
        const n = faceNormals[fi];
        nrm.push(n.x, n.y, n.z);
        const t = uvs[face.indexOf(vi)];
        uv.push(t[0], t[1]);
      }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const out = { geometry: g, faceNormals, landing, blank: [...blankSet] };
  geoCache.set(def.kind, out);
  return out;
}
function bodyMaterial(def, bg) {
  const key = def.label + '|' + bg;
  if (matCache.has(key)) return matCache.get(key);
  const atlas = atlasFor(def, bg);
  const tex = new THREE.CanvasTexture(atlas.canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.08 });
  matCache.set(key, m);
  return m;
}
// Normale locale (unitaire) de la face portant ce résultat.
export function normalForValue(def, built, value) {
  const fi = def.pct ? built.landing[value / 10] : built.landing[value - 1];
  return built.faceNormals[fi].clone();
}
export function buildDie(def, bg) {
  const built = buildGeometry(def);
  const group = new THREE.Group();
  const body = new THREE.Mesh(built.geometry, bodyMaterial(def, bg));
  body.castShadow = true;
  group.add(body);
  group.userData = { def, built, body };
  return group;
}
