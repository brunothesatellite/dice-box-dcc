# Intégration dans l'appli HTML/CSS/JS/PHP

Aucun build, aucun npm, aucun backend requis : fichiers statiques uniquement.

## Fichiers à copier

```
index.html
css/style.css
js/*.js        (config, rng, total, solids, textures, dice3d, tray, thumbs, app)
vendor/        (three.module.min.js, three.core.js, THREE-LICENSE.txt)
```

Chemins tous relatifs : fonctionne à la racine web **ou dans un sous-dossier**
(`/jeux/des/`, …). Gardez l'arborescence telle quelle.

## Serveur

Servir en **http(s)** — pas en `file://` (les modules ES y sont bloqués) :

```sh
php -S localhost:8000          # dev, depuis le dossier
```

Apache/Nginx : servir le dossier tel quel. Optionnel : cache long sur
`vendor/` + `js/` (contenu versionné à la main si modifié).

## Intégrer à une page existante

Option simple : `<iframe src="/jeux/des/" …>` (CSS et viewport isolés,
100dvh géré). Pour une intégration directe, recopiez le markup
(`#pickerBar`, `#stage`, `#actionbar`, `#helpModal`) + `style.css`
(préfixez les ids si conflit) et chargez `js/app.js` en module.

## Prérequis navigateur

WebGL + ES modules + Web Crypto (tous navigateurs mobiles récents).
Sans WebGL : le bandeau d'aide s'affiche mais pas de miniature 3D —
prévoyez un message si votre public a de vieux terminaux.
