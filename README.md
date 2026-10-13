# Dice Box DCC

Webapp mobile-first (portrait) de tirage de dés 3D low-poly texturés :
les 7 dés standards du jeu de rôle **plus la chaîne Dungeon Crawl Classics**
(D3, D5, D7, D14, D24, D30, et D% en dizaines).

Zéro build, zéro dépendance installée : HTML/CSS/JS statiques + Three.js vendored.
Copiable tel quel dans une appli PHP (voir `INTEGRATION.md`).

## Lancer

Servir en http(s) — pas en `file://` (modules ES) :

```sh
php -S localhost:8000
python3 -m http.server 8000
```

## Gestes

- Toucher un dé en haut : l'ajouter au tapis (max 10)
- Toucher un dé sur le tapis : le lancer
- Appui long (500 ms) : le retirer
- Glisser-déposer : déplacer · lâcher avec élan : lancer manuel
- 🎲 Lancer : tous les dés (+ total, D% en lecture percentile : 00+0=100)
- 🗑 Vider : tout retirer, sans confirmation

## Techniques

- Géométries procédurales exactes (une face = un résultat) : bipyramides,
  trapézoèdres, tonneaux prismatiques (D3, D7), vrai D24 deltoïdal et vrai D30
  rhombique, D6 à faces opposées = 7
- Chiffres sur les faces (atlas canvas, 6/9 soulignés), D6 sans pips
- Tirage `crypto.getRandomValues` + rejection sampling, résultat décidé
  **avant** l'animation ; chaque dé se pose face résultat vers la caméra

## Docs

- `PLAN.md` — plan, seuils, palette, phases
- `INTEGRATION.md` — intégration dans une appli PHP existante
- `NOTICE.md` — licences et crédits
- `maquette.html` — prototype IHM validé (DOM/SVG, non livré)

## Licences

Code applicatif : MIT (voir `LICENSE`). Three.js (vendored) : MIT.
Géométrie adaptée de [SONDLecT/dicebox](https://github.com/SONDLecT/dicebox) (MIT).
Détails : `NOTICE.md`.
