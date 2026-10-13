# Licences et crédits

Code applicatif (`index.html`, `css/`, `js/`, `maquette.html`, `PLAN.md`) : MIT,
voir `LICENSE` (© 2026 Bruno).

## Dépendances vendored (dans `vendor/`)

| Fichier | Projet | Licence | Statut |
|---|---|---|---|
| `three.module.min.js` + `three.core.js` (v0.186.1) | [three.js](https://threejs.org) | MIT | ✅ Validé |
| `THREE-LICENSE.txt` | three.js — texte officiel de la licence | MIT | — |

Aucune autre dépendance d'exécution (natif : WebGL, ES modules, Web Crypto).

## Maths de géométrie (`js/solids.js`)

Adaptées de [SONDLecT/dicebox](https://github.com/SONDLecT/dicebox),
licence MIT © SOND LecT : tétraèdre/cube/octaèdre/dodécaèdre/icosaèdre,
bipyramides, trapézoèdres, prisme triangulaire biseauté (d5), tonneaux
prismatiques (d3, d7), duale polaire (d24, d30).
Merci à l'auteur — si vous redistribuez ce projet, conservez cette attribution.

## Textures

100 % générées à l'exécution (canvas : chiffres + pastilles D7).
Aucune image, police ou modèle tiers.

## Prototype physique (branche `evol-physique`)

- `vendor/cannon-es.js` (v0.20.0) : [cannon-es](https://github.com/pmndrs/cannon-es),
  MIT, voir `vendor/CANNON-LICENSE.txt` (licence vérifiée au vendoring).
