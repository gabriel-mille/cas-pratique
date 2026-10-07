# Frontend – React 19 + Vite en Feature-Sliced Design (v2.1)

Source : documentation officielle https://feature-sliced.design (layers, slices-segments, public-api, cross-imports, excessive-entities, api-requests, auth, migration from-v2-0). Linter : https://github.com/feature-sliced/steiger. URLs : `docs/references.md`.

Non couvert par la doc officielle : React + Vite (le tutoriel utilise Remix), React Router, Nx. Les choix faits sur ces points sont des décisions du projet, à tracer dans `docs/decisions.md`.

## Couches (dans `apps/frontend/src/`, de haut en bas)

- `app` : providers globaux, configuration du router (`app/routes`), styles globaux, point d'entrée.
- `pages` : un écran ou une route ; UI propre à la page, chargement, data fetching.
- `widgets` : gros bloc d'UI autonome, réutilisé ou formant une section majeure.
- `features` : interaction utilisateur réutilisée sur plusieurs pages. « Not everything needs to be a feature ».
- `entities` : concept métier (action, action-plan…).
- `shared` : fondations sans logique métier : `ui`, `api`, `lib`, `config`, `routes`.
- `processes` est **déprécié** : ne pas l'utiliser.
- Les couches sont facultatives. Approche v2.1 : **commencer par `pages`** et n'extraire vers features/entities que lorsque la réutilisation le justifie.

## Règle d'import

- Un module ne peut importer que des slices de couches **strictement inférieures**.
- Pas d'import entre deux slices d'une même couche.
- Exception : dans `app` et `shared`, les segments s'importent librement.
- Le cross-import est un « code smell ». Solutions, dans cet ordre :
  1. fusionner les slices ;
  2. descendre la logique ;
  3. composer depuis la couche supérieure.
- La notation `entities/A/@x/B` est réservée aux entities, en dernier recours.

## Slices et segments

- Slices (pages, widgets, features, entities) nommées selon le métier, en kebab-case (`action-plan`, `change-action-status`).
- Segments standards :
  - `ui` : affichage ;
  - `api` : requêtes, types, mappers ;
  - `model` : schémas, stores, logique ;
  - `lib` : utilitaires internes ;
  - `config` : configuration.
- Nommer un segment selon son **but** : jamais `components`, `hooks`, `types`.

## Public API

- Chaque slice expose un `index.ts` de re-exports explicites. Pas de `export *`.
- Depuis l'extérieur, importer uniquement via l'`index.ts` d'une slice.
- À l'intérieur d'une slice, imports relatifs complets ; ne jamais importer son propre `index`.
- `shared/ui` et `shared/lib` : un `index.ts` par composant ou module.

## Placement

- Client HTTP : `shared/api/client.ts`. Requêtes CRUD de base : `shared/api/` (endpoints).
- Une requête utilisée par une seule slice va dans son segment `api`.
- Ne pas déplacer trop tôt les types de réponse backend dans `entities`.
- Auth : token et session dans `shared/auth` (ou à côté de `shared/api`). Jamais d'état global dans pages ou widgets.
- Pages de connexion et d'inscription : `pages/login`, schéma de formulaire dans `pages/login/model`.
- Router : `app/routes` ; constantes de chemins : `shared/routes`.
- Providers (router, query client…) : `app/providers`.
- Alias d'import : `@/*` → `src/*` (seul alias montré par la doc).

## Vérification

- Linter FSD officiel (en beta) : `steiger` + `@feature-sliced/steiger-plugin`, config `steiger.config.ts` avec `fsd.configs.recommended`. Pas encore installé.
- Le front n'applique pas les droits : il masque les actions non autorisées par confort, mais le backend reste la seule autorité.
