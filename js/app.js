// Câblage UI : picker, boutons, toasts, total, aide, démo de démarrage.
import { DICE } from './config.js';
import { Tray } from './tray.js';
import { renderThumbs } from './thumbs.js';
import { SoundBank } from './sound.js';

const picker = document.getElementById('picker');
const trayEl = document.getElementById('tray');
const toastEl = document.getElementById('toast');
const totalEl = document.getElementById('total');
const helpModal = document.getElementById('helpModal');

let toastT = null;
function toast(msg, ms = 2200) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove('show'), ms);
}

const sound = new SoundBank();
// Déblocage autoplay (mobile) : premier geste → contexte actif.
window.addEventListener('pointerdown', () => sound.unlock(), { passive: true });
window.addEventListener('pointerup', () => sound.unlock(), { passive: true });
window.addEventListener('keydown', () => sound.unlock());

const tray = new Tray(trayEl, {
  onTotal: (t) => {
    if (t == null) totalEl.hidden = true;
    else { totalEl.textContent = t; totalEl.hidden = false; }
  },
  toast,
  sound,
});

DICE.forEach((def) => {
  const b = document.createElement('button');
  b.className = 'pick';
  b.setAttribute('aria-label', `Ajouter un ${def.label}`);
  const img = document.createElement('img');
  img.alt = '';
  img.style.background = def.color;
  b.append(img, Object.assign(document.createElement('span'), { textContent: def.label }));
  b.addEventListener('click', () => tray.addDie(def));
  picker.appendChild(b);
});
// Remplace les aplats par les rendus 3D.
try {
  const thumbs = renderThumbs(DICE);
  [...picker.children].forEach((b, i) => {
    const img = b.querySelector('img');
    img.style.background = 'none';
    img.src = thumbs.get(DICE[i].label);
  });
} catch (err) {
  console.warn('miniatures 3D indisponibles', err);
}

document.getElementById('rollBtn').addEventListener('click', () => tray.rollAll());
document.getElementById('clearBtn').addEventListener('click', () => {
  if (!tray.dice.length) { toast('Le tapis est déjà vide'); return; }
  tray.clear();
  toast('Tapis vidé');
});
totalEl.addEventListener('click', () => tray.hideTotal());
const soundBtn = document.getElementById('soundBtn');
function paintSound() {
  soundBtn.textContent = sound.enabled ? '🔊' : '🔇';
  soundBtn.setAttribute('aria-label', sound.enabled ? 'Couper le son' : 'Activer le son');
}
soundBtn.addEventListener('click', () => {
  sound.unlock();
  sound.setEnabled(!sound.enabled);
  paintSound();
  const st = sound.state();
  const detail = st === 'running' ? 'moteur actif'
    : st === 'suspended' ? 'moteur en pause — retouchez' : st;
  toast(sound.enabled ? `🔊 Son activé (${detail})` : '🔇 Son coupé');
  if (sound.enabled) sound.settle(); // bip de confirmation
});
paintSound();
document.getElementById('helpBtn').addEventListener('click', () => { helpModal.hidden = false; });
document.getElementById('hClose').addEventListener('click', () => { helpModal.hidden = true; });
helpModal.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.hidden = true; });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') helpModal.hidden = true;
});

// Démo de démarrage.
tray.addDie(DICE[11]);
tray.addDie(DICE[3]);
tray.addDie(DICE[5]);

window.__booted = true;
window.__tray = tray; // hook de test automatisé
