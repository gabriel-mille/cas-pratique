# Briques réutilisées

Règle de travail n°2 (`AGENTS.md`) : avant de coder, chercher une solution existante, fiable et maintenue.

- Versions et dates : registre npm, relevé du 2026-10-07.
- Sources : doc officielle de chaque outil (URLs dans `docs/references.md`).
- **[D]** = choix du projet, sans source qui l'impose.

**Statuts** :
- ✅ adopté ;
- ❌ écarté ;
- 🛠 code maison justifié ;
- ❓ à décider (questions S1 à S8 en bas de page).

## Contexte de versions
- **NestJS 12 est sorti le 2026-08-27.** Le projet fourni est en NestJS 11.1, avec Express 5.
  - docs.nestjs.com décrit maintenant la v12 ; la doc v11 est sous `docs.nestjs.com/v11/`.
  - Plusieurs paquets en `latest` exigent Nest 12 (`@nestjs/swagger@12`, `@nestjs/cqrs@12`, `@nestjs/authentication`) : il faut **fixer leurs versions** → ❓ S1.
- React 19.2.4, `react-router-dom` 6.30.3 (fixée par le générateur Nx), Vitest 4, Node 24.20.

## Backend

| Besoin | Choix | Statut | Source / raison |
|---|---|---|---|
| Authentification | `@nestjs/jwt` 12.0.2 + `cookie-parser` 1.4.7 + guard maison qui lit le cookie | ✅ | Doc NestJS v11 *Authentication* (`@nestjs/jwt` + guard) et *Cookies* |
| | `@nestjs/passport` + `passport-jwt` | ❌ | Couche en plus ; `passport-jwt` n'a pas été publié depuis 2022-12 |
| | `@nestjs/authentication` (sessions, doc v12) | ❌ | Version 0.0.1, exige Nest 12 |
| Hachage | `node:crypto` scrypt, N=2^17, r=8, p=1, `timingSafeEqual` | ✅ | OWASP Password Storage (paramètres) ; doc NestJS v12. `maxmem` à régler (doc Node à vérifier) |
| Limitation de débit | `@nestjs/throttler` 6.7.1, `getTracker` surchargé (IP + email) | ✅ | Doc NestJS *Rate limiting* |
| En-têtes | `helmet` 8.3.0, appliqué en premier | ✅ | Doc NestJS *Helmet* |
| CORS | `app.enableCors({ origin: <front>, credentials: true })` | ✅ | Doc NestJS *CORS* |
| CSRF | SameSite + vérification `Origin`, ou `csrf-csrf` 4.0.3 | ❓ S2 | La doc v11 recommande `csrf-csrf`. La protection intégrée n'arrive qu'en v12.1 |
| Validation des entrées | `class-validator` 0.15 + `class-transformer` + `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`) | ✅ | Doc NestJS v11 *Validation* ; requis par `@nestjs/swagger` |
| | `nestjs-zod` | ❌ | Non officiel |
| Mots de passe interdits | Fichier SecLists (MIT), par exemple les 10 000 plus courants, chargé dans un `Set` | ✅ | ASVS 6.2.4 (au moins le top 3000). Licence de la liste NCSC d'origine non trouvée |
| Cycle de vie d'une action | Table de transitions dans l'entité de domaine | 🛠 [D] | 4 états ; le domaine reste sans dépendance (règle backend). Aucune source n'impose xstate ou une table → ❓ S3 |
| Événements de domaine | Interface maison dans le domaine ; `@nestjs/cqrs` **11.0.3** seulement si des handlers sont nécessaires | ✅ | La doc v11 *CQRS* permet de garder le domaine « completely framework-agnostic » |
| Suppression logique | `@DeleteDateColumn` (exclusion par défaut, `withDeleted`) | ✅ | typeorm.io *Entities*, *Find options* |
| Verrou optimiste | `@VersionColumn` + `update().where("id = :id AND version = :v")`, puis `affected === 0` → conflit | 🛠 | Aucune option TypeORM ne vérifie la version à l'écriture (code lu dans node_modules) |
| ETag / If-Match | Intercepteur maison : ETag = version, `If-Match` comparé, réponses 412/428 | 🛠 | Express 5 ne génère que des ETag faibles, sans gérer `If-Match` |
| Erreurs HTTP | Problem Details RFC 9457 : `nest-problem-details-filter` 1.10 ou filtre maison | ❓ S4 | Le paquet est peu connu (55 étoiles) et dépend de swagger |
| Contrat API | `@nestjs/swagger` **11.4.7** (OpenAPI) | ✅ | Doc NestJS v11 *OpenAPI*. Le plugin CLI n'est pas automatique avec `@nx/js:swc` → `@ApiProperty` explicites |
| Migrations | CLI TypeORM avec DataSource, cible Nx `run-commands` | ✅ | typeorm.io *Migrations* (« unsafe to use synchronize in production »). Pas de doc Nx officielle |
| Logs | `ConsoleLogger` NestJS avec `json: true` | ✅ | Doc NestJS v11 *Logger* |
| | `nestjs-pino` | ❌ | Inutile sans besoin de corrélation |
| Tests unitaires | Vitest via `@nx/vitest:configuration` + `unplugin-swc` | ✅ | Le générateur Nx `@nx/vite:vitest` est déprécié. Recette NestJS *SWC/Vitest*. esbuild ne gère pas `emitDecoratorMetadata` (doc esbuild) |
| Tests d'intégration | `@testcontainers/postgresql` 12.2 | ✅ | node.testcontainers.org ; base isolée par suite |
| Tests e2e HTTP | `supertest` 7.3 | ✅ | Doc NestJS v11 *Testing* |
| Générateurs `@nx/nest` | `module`, `controller`, `service` au cas par cas, avec `--path` vers la bonne couche | ✅ | `resource` produit un CRUD non DDD → ❌ |

## Frontend

| Besoin | Choix | Statut | Source / raison |
|---|---|---|---|
| Routage | React Router en mode *data* | ❓ S5 | Déjà présent ; utilisé par la doc FSD (*Page layout*). La v8 exige React ≥ 19.2.7. Pas de guide FSD sur le routage |
| | TanStack Router | ❌ | Valable, mais rien ne l'impose et il faudrait l'ajouter |
| Données serveur | TanStack Query 5.104 | ✅ | Guide officiel FSD *with React Query* (query factories dans `shared/api`) |
| Client HTTP | `fetch` natif dans `shared/api` + types générés par `openapi-typescript` 7.13 | ✅ | Guide FSD *Handling API requests* (cite openapi-typescript et orval) |
| | `openapi-fetch` | ❌ | Version pré-1.0 |
| Conflit 412 | Logique maison : renvoyer `If-Match`, sur 412 invalider la requête et prévenir l'utilisateur | 🛠 | Aucune bibliothèque ne le gère |
| Formulaires | `useActionState` (React 19) + zod 4 | ✅ | react.dev ; le guide FSD *Auth* utilise zod dans `model` |
| | react-hook-form | ❌ | Formulaires simples, on l'ajoutera si le besoin grandit |
| Composants accessibles | React Aria Components 1.21 (dialogues, menus, sélecteurs), dans `shared/ui` ; HTML natif ailleurs | ❓ S6 | Documentation de tests avec lecteurs d'écran la plus détaillée parmi celles consultées. Aucun classement neutre trouvé |
| Tests | `@testing-library/react` 16.3 + `user-event` 14.6 + MSW **v3** | ✅ | Doc officielle de chaque outil. Avec MSW v3, les cookies se lisent via l'argument `cookies` |
| Tests d'accessibilité | `axe-core` 4.14 appelé dans un helper de test | ✅ | `vitest-axe` ❌ (sans version stable depuis 2022) ; `jest-axe` ne documente pas Vitest |
| Lint | ESLint 9 flat config + `@nx/eslint-plugin` (`flat/react`) + `eslint-plugin-jsx-a11y` en `strict` | ✅ | `jsx-a11y` exige ESLint ≤ 9 |
| Lint FSD | `steiger` 0.7 + `@feature-sliced/steiger-plugin`, en script `lint:fsd`, exposé comme cible Nx | ✅ | README Steiger (encore en bêta). Nx expose les `scripts` comme cibles |
| Exemple de référence | `ruslan4432013/fsd-react-query-example` | – | Lié depuis la doc FSD, mais communautaire |

## Transverse

| Besoin | Choix | Statut | Source / raison |
|---|---|---|---|
| Lib partagée | `@nx/js:library` dans `packages/` (enums, types du contrat) | ✅ | `workspaces` du `package.json` racine ; générateur Nx |
| Couches DDD et FSD dans une même app | Nx `enforce-module-boundaries` ne contrôle que les dépendances entre projets → Steiger côté front, relecture côté back | ✅ [D] | nx.dev *Enforce module boundaries* |
| Messages de commit | commitlint + husky (hook `commit-msg`) | ❓ S7 | Doc commitlint *Local setup*. Husky remplace le `core.hooksPath` global (gitleaks, lychee) : il faut rappeler ces hooks |
| CI | GitHub Actions : lint, test, build | ❓ S8 | Aucun workflow existant |

## Questions

| # | Question | Proposition |
|---|---|---|
| S1 | NestJS 11 (fourni) ou passage en 12 ? | **Rester en 11** : c'est la version fournie par l'énoncé, et la migration n'apporte rien au périmètre. Versions fixées : `@nestjs/swagger@11`, `@nestjs/cqrs@11`. Montée de version notée comme amélioration |
| S2 | CSRF | SameSite=Strict + vérification de l'en-tête `Origin` sur les écritures + JSON uniquement (préflight CORS). C'est une pratique OWASP (*CSRF Prevention*, à citer précisément), sans dépendance de plus |
| S3 | Cycle de vie : xstate ou table maison ? | Table dans le domaine : 4 états, aucune dépendance |
| S4 | Format des erreurs | Filtre maison RFC 9457, environ 30 lignes, pour ne pas dépendre d'un paquet peu adopté |
| S5 | React Router 6 (installé), 7 ou 8 ? | **v8** (dernière), en montant React à la dernière 19.x |
| S6 | Composants UI | React Aria Components pour les composants interactifs complexes (modale de refus, confirmation de suppression, choix du rôle) |
| S7 | commitlint + husky | Oui, avec `.husky/pre-commit` qui rappelle le hook global |
| S8 | CI GitHub Actions | Oui, minimale : `nx run-many -t lint test build` |
