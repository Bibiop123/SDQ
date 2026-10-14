# Idées de jeux

- **Plus ou moins** — en pause, retiré du site (brouillon dans `brouillons/plusmoins.html`, objets + champions fonctionnent). À venir : mode « 2 joueurs pro » (il faut une source de données fiable ; Liquipedia bloque les accès automatiques).
- **Mots cachés** — une grille avec 10 mots d'un thème du jour.
- **Qui suis-je ?** — les indices du mot arrivent un par un, du plus vague au plus précis. Moins on en demande, plus on gagne de points.
- **Mots fléchés LoL** — mis de côté (trop dur en 100 % LoL). Base de mots dans `fleches/`.

## Devine le personnage (en cours)
Données collectées : `donnees/champions.json` (173 champions : titre, date de sortie, région, espèce, genre, rôles, ressource, portée, sorts, relations, faits de lore, et 3 phases d'indices : 1 = très vague, 2 = moyen, 3 = précis). Sources : Data Dragon, site Univers, wiki LoL. Les champs `null` = non confirmé par les sources (espèce surtout). Relecture conseillée des indices.

## Cite-les-tous (fait : cite.html)
Défi du jour (catégorie du jour identique pour tous, 90 s, 100 pts/champion + 500 si tous trouvés, highscore) + mode infini `?libre`. Catégories : rôles, sans mana, énergie, portée ≥ 550, apostrophe, régions (13, listes du wiki LoL), initiale. Idées futures : catégories par espèce, objets.

Cite-les-tous : catégories ajoutées — noms composés, ressources (sans ressource, Fureur/Rage, originale), espèces (Yordles, Vastayas, Néant, morts-vivants), séries de skins (Star Guardian, Spirit Blossom, PROJECT, Battle Academia, Blood Moon, Pool Party, Cafe Cuties). Listes issues des pages « Universe » du wiki : peuvent être incomplètes (à corriger au fil des retours). Non ajoutées (page illisible ou incomplète) : Arcade, High Noon, Pulsefire, Dark Star, Soul Fighter.
