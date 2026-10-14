# Idées de jeux

- **Plus ou moins** — en pause, retiré du site (brouillon dans `brouillons/plusmoins.html`, objets + champions fonctionnent). À venir : mode « 2 joueurs pro » (il faut une source de données fiable ; Liquipedia bloque les accès automatiques).
- **Mots cachés** — une grille avec 10 mots d'un thème du jour.
- **Qui suis-je ?** — les indices du mot arrivent un par un, du plus vague au plus précis. Moins on en demande, plus on gagne de points.
- **Mots fléchés LoL** — mis de côté (trop dur en 100 % LoL). Base de mots dans `fleches/`.

## Devine le personnage (en cours)
Données collectées : `donnees/champions.json` (173 champions : titre, date de sortie, région, espèce, genre, rôles, ressource, portée, sorts, relations, faits de lore, et 3 phases d'indices : 1 = très vague, 2 = moyen, 3 = précis). Sources : Data Dragon, site Univers, wiki LoL. Les champs `null` = non confirmé par les sources (espèce surtout). Relecture conseillée des indices.

## Cite-les-tous (fait : cite.html)
Défi du jour (catégorie du jour identique pour tous, 90 s, 100 pts/champion + 500 si tous trouvés, highscore) + mode infini `?libre`. Catégories : rôles, sans mana, énergie, portée ≥ 550, apostrophe, année de sortie 2010–2013, initiale. Calculées d'après Data Dragon. Idées futures : catégories par région/espèce (données à fiabiliser), objets.
