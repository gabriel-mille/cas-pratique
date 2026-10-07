# Briques réutilisées

Règle de travail n°2 (`AGENTS.md`) : avant de coder, chercher une solution existante, fiable et maintenue.

- Versions et dates : registre npm, relevé du 2026-10-07.
- Sources : doc officielle de chaque outil (URLs dans `docs/references.md`).
- **[D]** = choix du projet, sans source qui l'impose.

**Statuts** :
- ✅ adopté ;
- ❌ écarté ;
- 🛠 code maison justifié ;
- les choix S1 à S8 ont été tranchés le 2026-10-07 (bas de page, et `docs/decisions.md` D23 à D27).

## Contexte de versions
- **NestJS 12 est sorti le 2026-08-27.** Le projet fourni est en NestJS 11.1, avec Express 5.
  - docs.nestjs.com décrit maintenant la v12 ; la doc v11 est sous `docs.nestjs.com/v11/`.
  - Plusieurs paquets en `latest` exigent Nest 12 (`@nestjs/swagger@12`, `@nestjs/cqrs@12`, `@nestjs/authentication`) : on **fixe leurs versions 11** (S1 : on reste en NestJS 11).
- React 19.2.4, `react-router-dom` 6.30.3 (fixée par le générateur Nx), Vitest 4, Node 24.20.

## Backend

| Besoin | Choix | Statut | Source / raison |
|---|---|---|---|
| Authentification | `@nestjs/jwt` 12.0.2 + `cookie-parser` 1.4.7 + guard maison qui lit le cookie | ✅ | Doc NestJS v11 *Authentication* (`@nestjs/jwt` + guard) et *Cookies* |
| | `@nestjs/passport` + `passport-jwt` | ❌ | Couche en plus ; `passport-jwt` n'a pas été publié depuis 2022-12 |
| | `@nestjs/authentication` (sessions, doc v12) | ❌ | Version 0.0.1, exige Nest 12 |
| Hachage | `node:crypto` scrypt, N=2^17, r=8, p=1, `timingSafeEqual` | ✅ | OWASP Password Storage (paramètres) ; doc NestJS v12. `maxmem` = 2·128·N·r : la limite par défaut de Node (32 Mio) refuse N=2^17 (doc Node vérifiée, D32) |
| Limitation de débit | `@nestjs/throttler` 6.7.1, `getTracker` surchargé (IP + email) | ✅ | Doc NestJS *Rate limiting* |
| En-têtes | `helmet` 8.3.0, appliqué en premier | ✅ | Doc NestJS *Helmet* |
| CORS | Aucun : proxy Vite en dev, même origine en production (D34) | ✅ | Pas d’API cross-origin à ouvrir |
| CSRF | Cookie `SameSite=Strict` + vérification de l'en-tête `Origin` sur les écritures + JSON uniquement | ✅ S2 | OWASP *CSRF Prevention*. `csrf-csrf` 4.0.3 (proposé par la doc v11) ❌ : une dépendance de plus sans gain ici |
| Validation des entrées | `class-validator` 0.15 + `class-transformer` + `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`) | ✅ | Doc NestJS v11 *Validation* ; requis par `@nestjs/swagger` |
| | `nestjs-zod` | ❌ | Non officiel |
| Mots de passe interdits | Fichier SecLists (MIT) `xato-net-10-million-passwords-1000000` filtré sur 15 à 128 caractères (10 898 entrées), chargé dans un `Set` | ✅ | ASVS 6.2.4 (au moins le top 3000 « which match the application's password policy »). La liste des 10 000 plus courants ne contient qu'une entrée de 15 caractères ou plus : écartée (D32). Provenance et licence dans `common-passwords.NOTICE.md` |
| Cycle de vie d'une action | Table de transitions dans l'entité de domaine | 🛠 [D] S3 | 4 états ; le domaine reste sans dépendance (règle backend). xstate ❌ : fiable, mais rien ne l'impose |
| Événements de domaine | Interface maison dans le domaine ; `@nestjs/cqrs` **11.0.3** seulement si des handlers sont nécessaires | ✅ | La doc v11 *CQRS* permet de garder le domaine « completely framework-agnostic » |
| Suppression logique | `@DeleteDateColumn` (exclusion par défaut, `withDeleted`) | ✅ | typeorm.io *Entities*, *Find options* |
| Verrou optimiste | `@VersionColumn` + `update().where("id = :id AND version = :v")`, puis `affected === 0` → conflit | 🛠 | Aucune option TypeORM ne vérifie la version à l'écriture (code lu dans node_modules) |
| ETag / If-Match | Décorateur de paramètre maison `@IfMatch()` (D34) : ETag = version, `If-Match` comparé, réponses 412/428 | 🛠 | Express 5 ne génère que des ETag faibles, sans gérer `If-Match` |
| Erreurs HTTP | Filtre d'exception maison au format Problem Details (RFC 9457) | 🛠 S4 | `nest-problem-details-filter` 1.10 ❌ : peu adopté (55 étoiles). Le filtre fait environ 30 lignes |
| Contrat API | `@nestjs/swagger` **11.4.7** (OpenAPI) | ✅ | Doc NestJS v11 *OpenAPI*. Le plugin CLI n'est pas automatique avec `@nx/js:swc` → `@ApiProperty` explicites |
| Transactions | `nestjs-cls` 7.0.1 + `@nestjs-cls/transactional` 4.0.1 + adaptateur TypeORM 2.0.1 (MIT) | ✅ | Doc NestJS *Async Local Storage* (cite `nestjs-cls`) ; doc du plugin *Transactional*. `typeorm-transactional` ❌ : monkey-patching de TypeORM (D33) |
| Migrations | CLI TypeORM avec DataSource, cible Nx `run-commands` | ✅ | typeorm.io *Migrations* (« unsafe to use synchronize in production »). Pas de doc Nx officielle |
| Logs | `ConsoleLogger` NestJS avec `json: true` | ✅ | Doc NestJS v11 *Logger* |
| | `nestjs-pino` | ❌ | Inutile sans besoin de corrélation |
| Tests unitaires et scénarios | Vitest via `@nx/vitest:configuration` + `unplugin-swc` ; les `.feature` sont exécutés avec `@amiceli/vitest-cucumber` 7.0.0 (D26) | ✅ | Le générateur Nx `@nx/vite:vitest` est déprécié. Recette NestJS *SWC/Vitest*. esbuild ne gère pas `emitDecoratorMetadata` (doc esbuild) |
| Tests d'intégration | `@testcontainers/postgresql` 12.2, `postgres:16-alpine`, migrations réelles ; cible `test-integration` au pre-push (Docker requis) | ✅ | node.testcontainers.org ; contrats de repository rejoués (D33) |
| Tests e2e HTTP | `supertest` 7.3 | ✅ | Doc NestJS v11 *Testing* |
| Générateurs `@nx/nest` | `module`, `controller`, `service` au cas par cas, avec `--path` vers la bonne couche | ✅ | `resource` produit un CRUD non DDD → ❌ |

## Frontend

| Besoin | Choix | Statut | Source / raison |
|---|---|---|---|
| Routage | React Router **v8** en mode *data*, React monté à la dernière 19.x | ✅ S5 | Utilisé par la doc FSD (*Page layout*). La v8 exige React ≥ 19.2.7. `createRoutesStub` (outil de test officiel) n'existe pas en v6. Pas de guide FSD sur le routage |
| | TanStack Router | ❌ | Valable, mais rien ne l'impose et il faudrait l'ajouter |
| Données serveur | TanStack Query 5.104 | ✅ | Guide officiel FSD *with React Query* (query factories dans `shared/api`) |
| Client HTTP | `fetch` natif dans `shared/api` + types générés par `openapi-typescript` 7.13 | ✅ | Guide FSD *Handling API requests* (cite openapi-typescript et orval) |
| | `openapi-fetch` | ❌ | Version pré-1.0 |
| Conflit 412 | Logique maison : renvoyer `If-Match`, sur 412 invalider la requête et prévenir l'utilisateur | 🛠 | Aucune bibliothèque ne le gère |
| Formulaires | `useActionState` (React 19) + zod 4 | ✅ | react.dev ; le guide FSD *Auth* utilise zod dans `model` |
| | react-hook-form | ❌ | Formulaires simples, on l'ajoutera si le besoin grandit |
| Composants accessibles | React Aria Components 1.21 (dialogues, menus, sélecteurs), dans `shared/ui` ; HTML natif ailleurs | ✅ S6 | Documentation de tests avec lecteurs d'écran la plus détaillée parmi celles consultées. Aucun classement neutre trouvé |
| Style | CSS Modules (natif Vite, défaut des générateurs Nx) + variables CSS ; tokens et reset dans `app/styles`, composants stylés dans `shared/ui` | ✅ | Doc Vite *CSS Modules* ; FSD *Layers* (`app/styles`, `shared/ui`). React Aria expose ses états en attributs `data-*`. Tailwind v4 ❌ : le générateur Nx 22 est obsolète (installe la v3) ; vanilla-extract ❌ |
| Notifications | `@radix-ui/react-toast` 1.2, encapsulé dans `shared/ui` ; une erreur critique s'affiche aussi dans la page | ✅ | Doc Radix (aria-live, F8, pause au survol). Toast React Aria ❌ : exporté en `UNSTABLE_` en 1.21.1. WCAG 4.1.3 |
| Tests | `@testing-library/react` 16.3 + `user-event` 14.6 + MSW **v3** + `@amiceli/vitest-cucumber` 7.0.0 | ✅ | Doc officielle de chaque outil. Stratégie : `apps/frontend/AGENTS.md`, D26 |
| Tests E2E | Playwright 1.63 via `@nx/playwright` + `@axe-core/playwright` 4.13 | ✅ | nx.dev *Playwright* ; playwright.dev *Accessibility testing*. Cypress ❌ |
| Lint des tests | `eslint-plugin-testing-library` 7.16 (`flat/react`) + `@vitest/eslint-plugin` 1.6 (`recommended`) | ✅ | READMEs officiels. `eslint-plugin-vitest` ❌ (abandonné) |
| Tests d'accessibilité | `axe-core` 4.14 appelé dans un helper de test | ✅ | `vitest-axe` ❌ (sans version stable depuis 2022) ; `jest-axe` ne documente pas Vitest |
| Lint | ESLint 9 flat config + `@nx/eslint-plugin` (`flat/react`) + `eslint-plugin-jsx-a11y` en `strict` | ✅ | `jsx-a11y` exige ESLint ≤ 9 ; `nx add @nx/eslint` installait ESLint 8.57, version 9 installée explicitement |
| Lint FSD | `steiger` 0.7 + `@feature-sliced/steiger-plugin`, en script `lint:fsd`, exposé comme cible Nx | ✅ | README Steiger (encore en bêta). Nx expose les `scripts` comme cibles |
| Exemple de référence | `ruslan4432013/fsd-react-query-example` | – | Lié depuis la doc FSD, mais communautaire |

## Transverse

| Besoin | Choix | Statut | Source / raison |
|---|---|---|---|
| Lib partagée | `@nx/js:library` dans `packages/` (enums, types du contrat) | ✅ | `workspaces` du `package.json` racine ; générateur Nx |
| Couches DDD et FSD dans une même app | Nx `enforce-module-boundaries` ne contrôle que les dépendances entre projets → Steiger côté front, relecture côté back | ✅ [D] | nx.dev *Enforce module boundaries* |
| Hooks Git | husky 9 + commitlint (`commit-msg`) ; `pre-commit` : hook global de l'utilisateur s'il existe, puis `nx affected -t lint typecheck test` ; `pre-push` : `nx affected -t lint typecheck test test-integration build` | ✅ S7 | Doc commitlint *Local setup* ; nx.dev *affected*. Husky remplace le `core.hooksPath` global : `.husky/pre-commit` le rappelle (D27) |
| CI | Aucune : tout est vérifié en local par les hooks | ❌ S8 | Choix du projet pour un test technique (D27) |

## Choix tranchés (2026-10-07)

| # | Sujet | Choix |
|---|---|---|
| S1 | Version de NestJS | On reste en **NestJS 11**, la version fournie. La v12 est notée comme évolution |
| S2 | CSRF | `SameSite=Strict` + vérification de `Origin` + JSON uniquement |
| S3 | Cycle de vie | Table de transitions dans le domaine |
| S4 | Format des erreurs | Filtre maison RFC 9457 |
| S5 | React Router | v8, React monté à la dernière 19.x |
| S6 | Composants UI | React Aria Components ; toasts Radix (stables) |
| S7 | Hooks Git | husky + commitlint, tests et lint lancés automatiquement |
| S8 | CI | Pas de CI : vérification locale par les hooks |
