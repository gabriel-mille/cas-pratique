# Cas pratique Qualineo – Plans d'actions

Gestion de plans d'actions qualité pour un établissement de santé :
- plans et actions ;
- cycle de vie À faire → En cours → À valider → Terminé, avec validation ou refus motivé ;
- historique des changements d'état ;
- rôles Administrateur, Gestionnaire, Utilisateur ;
- plusieurs organisations isolées les unes des autres.

Monorepo Nx 22 :
- `apps/backend` : NestJS 11 en DDD, avec TypeORM et PostgreSQL 16 ;
- `apps/frontend` : React 19 et Vite, en Feature-Sliced Design.

## Pour l'évaluation

| Document | Contenu |
|---|---|
| [docs/specs/](docs/specs/) | Spécification tirée de l'énoncé : règles, droits, transitions, scénarios Gherkin exécutés comme tests, questions ouvertes. |
| [docs/decisions.md](docs/decisions.md) | Chaque point ambigu ou choix d'architecture (D1…D35) : contexte, choix, alternatives écartées. |
| [docs/compliance.md](docs/compliance.md) | Normes du domaine (RGPD, HDS, ASVS, WCAG…) et statut de chaque exigence : appliqué, prévu ou hors périmètre. |
| [docs/stack.md](docs/stack.md) | Briques retenues ou écartées, avec la raison. |
| [docs/references.md](docs/references.md) | Sources utilisées. |
| [docs/ai/prompts.md](docs/ai/prompts.md), `AGENTS.md`, `CLAUDE.md`, `apps/*/AGENTS.md` | Prompts et instructions données à l'IA. |
| [dump.sql](dump.sql) | Schéma et données de démonstration. |

## Prérequis

- Node.js et npm (testé avec Node 24.20) ;
- Docker et Docker Compose.

```sh
npm install
```

## Configuration

Créer un fichier `.env` à la racine. Il n'est pas versionné.

```sh
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=cas_pratique
# Obligatoire, au moins 32 caractères (clé HS256, RFC 7518 §3.2) : openssl rand -base64 48
JWT_SECRET=
# Le cookie de session est Secure par défaut ; false seulement en local, si le navigateur refuse un cookie Secure en http.
COOKIE_SECURE=false
```

Variables facultatives :

| Variable | Défaut | Rôle |
|---|---|---|
| `APP_ORIGIN` | `http://localhost:4200` | Seule origine autorisée à écrire (D25). |
| `AUTH_RATE_LIMIT_PER_IP` | `20` | Requêtes d'authentification par minute et par IP (D17). |
| `PORT` | `3000` | Port de l'API. |

Le backend refuse de démarrer si `JWT_SECRET` manque ou est trop court.

## Base de données

```sh
docker compose up -d        # PostgreSQL 16, conteneur cas-pratique-db
```

Deux façons d'obtenir une base utilisable.

**1. Restaurer le dump.** Il contient le schéma et les données de démonstration. Il faut une base `cas_pratique` vide, c'est-à-dire un volume Docker neuf :

```sh
docker compose exec -T postgres psql -U postgres cas_pratique < dump.sql
```

**2. Partir d'une base vide.** Le schéma vient uniquement des migrations TypeORM :

```sh
npx nx run backend:migration-run
```

Pour y ajouter les données de démonstration, lancer `node tools/seed-demo.mjs` une fois le backend démarré.

### Comptes de démonstration

Les trois comptes appartiennent à l'organisation « Clinique des Lilas » :

| Compte | Mot de passe | Rôle |
|---|---|---|
| `alice@lilas.test` | `demo alice mot de passe` | Administrateur |
| `bob@lilas.test` | `demo bob mot de passe` | Gestionnaire |
| `chloe@lilas.test` | `demo chloe mot de passe` | Utilisateur |

Contenu de la démo, sur trois plans :
- une action Terminé ;
- une action refusée une fois avec motif, puis de nouveau À valider ;
- des actions En cours et À faire ;
- une action supprimée logiquement : invisible à l'écran, conservée en base (D7).

Les données ont été créées par l'API (`tools/seed-demo.mjs`) et non par des INSERT : les mots de passe hachés, les versions et l'historique sont donc ceux qu'aurait produits l'application.

Pour régénérer le dump : peupler une base vierge, puis `docker compose exec -T postgres pg_dump -U postgres <base> > dump.sql`.

## Lancer l'application

```sh
npx nx serve backend    # http://localhost:3000/api, documentation OpenAPI sur /api/docs
npx nx serve frontend   # http://localhost:4200, avec /api relayé vers le backend
```

On peut aussi créer sa propre organisation depuis l'écran d'inscription : le premier compte en devient administrateur.

## Tests et qualité

```sh
npx nx run-many -t lint typecheck test   # tests unitaires et d'acceptation, back et front
npx nx run frontend:lint:fsd             # règles Feature-Sliced Design (Steiger)
npx nx run backend:test-integration      # repositories et API HTTP sur un vrai PostgreSQL (Testcontainers, Docker requis)
npx nx e2e frontend                      # parcours Playwright, navigateur, backend et base réels
```

Points à connaître :
- Les scénarios Gherkin de `docs/specs/features/` sont joués côté backend et côté frontend (D26). Un scénario sans test fait échouer la suite.
- La première exécution des e2e demande d'installer Chromium : `npx playwright install chromium`. Les e2e démarrent backend et frontend s'ils ne tournent pas déjà, et utilisent la base de `.env`.

Commandes utiles :
- `npx nx run backend:openapi` régénère le contrat `openapi.json` sans démarrer l'API ;
- `npx nx run frontend:generate-api` régénère ensuite les types TypeScript du front.

## Limites connues

- **UI/UX** : l'interface couvre tous les besoins et est accessible (WCAG 2.2 AA), mais son ergonomie n'a pas été optimisée pour l'expérience utilisateur. Ce n'était pas demandé : c'est noté comme amélioration prévue (D35).
- Les autres écarts (bundle non découpé, `trust proxy`, en-tête `Retry-After`) sont listés en D34 et D35.

## Hooks Git

Husky les installe à `npm install`. Ils tiennent lieu de CI (D27) : ne pas les contourner avec `--no-verify`.

- `commit-msg` : Conventional Commits (commitlint) ;
- `pre-commit` : lint, `lint:fsd`, typecheck et tests des projets touchés ;
- `pre-push` : la même chose, plus les tests d'intégration et le build.

Les e2e ne sont pas dans les hooks : ils demandent Docker et les deux serveurs.

## Structure

```
cas-pratique/
├── apps/
│   ├── backend/src/
│   │   ├── modules/identity/       # organisations, comptes, membres, authentification
│   │   ├── modules/action-plans/   # plans, actions, cycle de vie, historique
│   │   │   └── {domain,application,infrastructure,presentation}/
│   │   ├── shared/                 # rôle, erreurs métier, horloge, filtre RFC 9457
│   │   └── database/               # options TypeORM et migrations
│   └── frontend/
│       ├── src/{app,pages,widgets,entities,shared}/   # couches FSD
│       └── e2e/                    # parcours Playwright
├── docs/                           # spécification, décisions, conformité, prompts IA
├── tools/seed-demo.mjs             # données de démonstration via l'API
├── dump.sql                        # schéma et données de démonstration
└── docker-compose.yml              # PostgreSQL 16
```
