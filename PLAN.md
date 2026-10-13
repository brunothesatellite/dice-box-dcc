# Dice Box DCC — Plan v1 (à valider)

> **Statut 13/10/2026 : maquette validée, implémentation terminée et testée**
> (headless Chrome : 14 dés, gestes tactiles, faces résultat à 0° de la caméra,
> total percentile, 0 erreur). Badge conservé. Correctifs intégrés :
> `camera.aspect` au resize, `PCFShadowMap` (r186), rotation résiduelle ±25°
> pour garder les chiffres lisibles.
> Passe visuel : des +35 %, chiffres +30 %, badges en blanc, physique plus vive,
> miniatures face-chiffre (correctif ancre antipodale du D7).
> Passe miroir : UV en repère local direct (miroir impossible), spin/rebonds
> renforcés avec intensité par geste, dés bousculés en glissade sans re-tirage.

Webapp mobile-first (portrait, réf. Pixel 7a 412×915) + responsive PC.
Zéro build : fichiers HTML/CSS/JS statiques, Three.js vendored. Copiable tel quel dans une appli PHP.

## 1. Périmètre v1

- 14 dés : D3, D4, D5, D6, D7, D8, D10, D%, D12, D14, D16, D20, D24, D30 (D6 = chiffres uniquement, **pas de pips** ; D% = dizaines 00–90, lecture percentile avec D10 : 00+0=100 ; D7 = tonneau à 7 faces).
-picker haut : 1 ligne, ordre croissant, modèle 3D + nom en dessous.
- Tapis : feutrine verte texturée + cadre bois.
- Gestes : tap picker = ajouter · tap dé = rouler · appui long (500 ms) = retirer · drag & drop = déplacer · lâcher avec élan = lancer manuel + tirage.
- Boutons : **Lancer** (tous les dés) + **Vider** (avec confirmation).
- Collisions basiques : les dés ne se traversent pas (disques 2D + murs).
- Couleurs : 1 couleur de base par type (§7) ; plusieurs exemplaires = même couleur, luminosité dégradée (plus clair / plus sombre).

Hors périmètre v1 (évolutions) : sons, historique, notation `2d6+3`, sauvegarde locale, PWA/offline, partage en ligne.

## 2. Technique

- Pas de npm/build : ES modules natifs (`<script type="module">`), `vendor/three.module.min.js` (v0.186.1, MIT ✅).
- Géométrie procédurale : maths portées de `dicebox` (SONDLecT, MIT ✅, crédit dans `NOTICE.md`).
- Textures : atlas canvas généré (chiffres uniquement), aucune image tierce.
- Structure : `index.html`, `css/style.css`, `js/{config,dice-data,solids,textures,dice,tray,gestures,app}.js`, `vendor/`, `maquette.html` (prototype, non livré).

## 3. Géométries 3D low-poly (une face = un résultat)

| Dé | Solide | Source maths |
|---|---|---|
| D3 | prisme triangulaire (3 faces numérotées) | `prismBarrel(3)` adapté |
| D4 | tétraèdre | `tetra` |
| D5 | prisme triangulaire biseauté (5 faces d'atterrissage) | `bevelSolid(regularPrism(3))` |
| D6 | cube, chiffres 1–6 | `cube` |
| D7 | tonneau heptagonal (7 faces rectangulaires numérotées) | `prismBarrel(7)` |
| D8 | octaèdre | `octa` |
| D10 / D% | trapézoèdre pentagonal (10 kites) | `trapezohedron(5)` |
| D12 | dodécaèdre | `dodeca` |
| D14 | trapézoèdre heptagonal aplati | `trapezohedron(7, flatten)` |
| D16 | bipyramide octogonale | `bipyramid(8)` |
| D20 | icosaèdre | `icosa` |
| D24 | icositétraèdre deltoïdal (vrai D24 commercial) | `deltoidalIcositetrahedron` porté |
| D30 | triacontaèdre rhombique (vrai D30) | `rhombicTriacontahedron` porté |

Rendu : flat shading, 1 mesh + 1 material par dé, texture atlas (1 case = 1 chiffre, UV par projection planaire sur l'axe dominant de chaque face).

## 4. Tirage (équitable, résultat d'abord — comme dicebox)

1. `crypto.getRandomValues` + *rejection sampling* (pas de biais modulo).
2. Le nombre est fixé **au moment du lancer** ; l'animation ne fait que le présenter : guidage progressif de la face vers la caméra pendant le ralentissement, settle conditionné à l'alignement (~20°), micro-ajustement final (~0,25 s).
3. Lancer manuel : impulsion + rebonds sur les murs + collisions disques entre dés, puis settle → valeur.

## 5. IHM (cf. maquette)

- Picker : 2 lignes sur mobile (7 dés par ligne, **sans scroll**), 1 ligne sur PC.
- Tapis : remplit l'espace restant (hauteur réduite) ; barre d'actions **sous le tapis, hors table** : **Vider** à gauche, chip **Total** au centre, **Lancer** à droite.
- Retours : badge valeur sur chaque dé (pop, visible même au bord, au-dessus du bois), chip **Total** dans la barre du bas (8 s, masqué au clic ou dès que le tapis change), toast d'infos, « Vider » sans confirmation, légende des gestes via `?`.
- Zones tactiles ≥ 44 px, `touch-action` ciblés, `100dvh` + safe-area, `prefers-reduced-motion` respecté.

## 6. Gestes (seuils repris dans la maquette)

| Geste | Seuil |
|---|---|
| Tap (ajouter / rouler) | déplacement < 10 px, relâché < 550 ms |
| Appui long (retirer) | 500 ms sans bouger |
| Drag (déplacer) | déplacement > 10 px |
| Fling (lancer manuel) | vitesse lâcher > 260 px/s |

## 7. Couleurs (1 base par type, cf. maquette)

D3 `#d94848` · D4 `#ef7d23` · D5 `#d9a416` · D6 `#12a0a8` · D7 `#2f6fed` · D8 `#6a4de0` · D10 `#c93b8f` · D% `#f272a8` · D12 `#9a6a2f` · D14 `#7ba428` · D16 `#64748b` · D20 `#23262b` · D24 `#9aa7b5` · D30 `#f2ead8`.
Exemplaires suivants : base puis écarts forcés alternés (base sombre → +34/−17/+17/−34, base claire → −34/+17/−17/+34), facettes ±46 et contours auto-contrastés (compteur par type, pas de re-mélange à la suppression). Encre chiffres : auto-contraste (blanc ou `#1d2126`). Glyphes ×0.8 sur D10/D%/D14/D16/D20 (anti-troncature).

## 8. Perf mobile

DPR ≤ 2, 1 lumière + ombre 1024 px, antialias on, plafond 10 dés, 60 fps visé sur Pixel 7a. Pas de moteur physique wasm.

## 9. Phases de dev (après validation)

1. Socle + solides §§3 (rendu statique des 14 dés).
2. Atlas chiffres + tirage §4 (tap = rouler).
3. Tapis + gestes + collisions §§5–6.
4. Polish IHM + responsive PC + reduced-motion.
5. Doc d'intégration PHP + test Pixel 7a + `NOTICE.md` licences.

## 10. Points à trancher (voir maquette)

Validés : boutons en bas du tapis ✅ · « Vider » sans confirmation ✅ · chip Total gardé ✅.

1. Total : 8 s, masqué au clic dessus ou dès que le tapis change — OK ?
2. D% : dizaines 00–90, placé après D10, lecture percentile (00+0=100) — OK ?
3. D7 tonneau : OK ?
4. Sons / vibration : à ajouter (v2) ou jamais ?
