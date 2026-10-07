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

## Style et composants

- CSS Modules (`*.module.css`) + variables CSS. Tokens et reset dans `app/styles`, composants stylés dans `shared/ui`.
- Composants interactifs complexes : React Aria Components, encapsulés dans `shared/ui`. Toasts : `@radix-ui/react-toast`.
- Une erreur critique ne repose jamais uniquement sur un toast : elle s'affiche aussi dans la page (WCAG 4.1.3).
- Détail des choix et versions : `docs/stack.md`.

## Tests (D26)

Sources : Kent C. Dodds (*Testing Trophy*, *Testing implementation details*, *Common mistakes with RTL*, *When I follow TDD*), testing-library.com, doc MSW, TanStack Query *Testing*, React Router *Testing*, playwright.dev. URLs : `docs/references.md`.

- **Chaque scénario de `docs/specs/features/*.feature` est implémenté côté front** avec `@amiceli/vitest-cucumber` (`loadFeature(path, { language: 'fr' })`).
  - Exception : un scénario qui ne se prouve qu'avec le vrai serveur est tagué `@back-only`, avec la raison.
- Niveaux :
  - **logique pure** (`model`, `lib`) : tests unitaires écrits d'abord (TDD) ;
  - **intégration** (le cœur) : page ou feature rendue avec un vrai routeur en mémoire, un `QueryClient` neuf par test (`retry: false`), MSW pour le réseau (`onUnhandledRequest: 'error'`) ;
  - **accessibilité** : `axe-core` (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`) sur chaque page et chaque modale ;
  - **E2E** : 2 ou 3 parcours critiques avec Playwright + `@axe-core/playwright`, contre le vrai back.
- Écriture :
  - requêtes par rôle en priorité (`getByRole`, puis `getByLabelText`…), via `screen` ; `user-event` plutôt que `fireEvent` ;
  - `find*` plutôt que `waitFor` ; pas d'`act` inutile ;
  - asserter ce que l'utilisateur voit, pas les requêtes envoyées ni l'état interne.
- À ne pas faire : tester des détails d'implémentation (state, hooks, props, classes CSS), de gros snapshots, du code trivial pour gonfler la couverture, ou les bibliothèques elles-mêmes.
- La matrice des droits (`docs/specs/permissions.md`) est testée par rôle (`it.each`) : boutons visibles ou absents.
- Fichiers : `*.spec.ts(x)` à côté du code ; E2E dans un projet Nx séparé.

## Definition of Done (front)

- Les scénarios concernés passent (aucun scénario sans implémentation), et la sortie des tests est montrée.
- Couverture ≥ 80 % (seuils Vitest), aucune violation axe.
- Lint vert : ESLint (dont `testing-library` et `@vitest/eslint-plugin`) et Steiger.
- Les hooks Git le vérifient automatiquement ; ne jamais les contourner.
