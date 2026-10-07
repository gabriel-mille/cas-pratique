# Cas pratique Qualineo – Plans d'actions

Test technique : implémenter la gestion des plans d'actions de Qualineo (logiciel qualité, secteur santé).
Énoncé complet : `Cas pratique Qualineo.pdf` (non versionné). Spécification traduite : `docs/specs/`.

Critère d'évaluation annoncé : **la réflexion et la conscience des problématiques comptent plus que l'implémentation**.
Toute décision sur un point ambigu de l'énoncé doit être tracée dans `docs/decisions.md` (contexte, choix, alternatives).

## Règle de travail n°1 : ne rien inventer

- Toute règle d'architecture, de convention ou d'API doit venir d'une source fiable (doc officielle, auteur de référence). Les sources retenues sont listées dans `docs/references.md`.
- Si une information n'est pas trouvée ou pas vérifiable : **le dire explicitement** et demander, plutôt que supposer.
- Distinguer dans les explications ce qui est « sourcé » de ce qui est « pratique courante / choix du projet ».
- Ne pas trancher seul une règle métier absente de l'énoncé : la proposer, puis la consigner dans `docs/decisions.md` une fois validée.

## Règle de travail n°2 : ne pas réinventer la roue

- Avant chaque tâche, chercher si une solution existante et fiable couvre déjà le besoin : module officiel du framework, bibliothèque maintenue et reconnue, générateur Nx, pattern documenté.
- Critères de fiabilité : source officielle ou très adoptée, maintenance active, licence compatible, version stable (pas de 0.0.x).
- Si rien ne convient, l'écrire et justifier le développement maison dans `docs/decisions.md`.
- Inventaire des briques retenues ou écartées : `docs/stack.md`.

## Règle de travail n°3 : identifier et suivre les normes

- Repérer les normes et référentiels applicables au domaine (logiciel qualité en santé) : sécurité, qualité, données personnelles, données de santé, accessibilité, etc.
- Les recenser dans `docs/compliance.md`, avec leur source, les exigences qui concernent le projet et leur statut : **appliqué**, **prévu** (noté, non implémenté dans ce test) ou **hors périmètre**.
- Ce qui n'est pas demandé par l'énoncé est au minimum noté et prévu dans la conception, même s'il n'est pas implémenté.
- Vérifier le respect des exigences marquées « appliqué » (tests ou relecture).

## Ordre de réalisation

1. Traduire les besoins fonctionnels en spécification (`docs/specs/`) : règles, rôles, transitions, cas limites.
2. Backend en TDD (`apps/backend`, voir `apps/backend/AGENTS.md`).
3. Frontend (`apps/frontend`, voir `apps/frontend/AGENTS.md`).
4. Livrables : dump SQL (schéma + données de démo) à la racine, README à jour, prompts/instructions IA.

## Stack imposée

- PostgreSQL 16 (Docker), NestJS 11 en DDD + TypeORM, React 19 + Vite en Feature-Sliced Design.
- Monorepo Nx 22 : `apps/backend`, `apps/frontend`, libs partagées éventuelles dans `packages/`.

## Commandes

- Base : `docker compose up -d` (conteneur `cas-pratique-db`, base `cas_pratique`, user/mdp `postgres`). `.env` à la racine (cf. README).
- Toujours passer par Nx : `npx nx serve backend` (http://localhost:3000/api), `npx nx serve frontend` (http://localhost:4200), `npx nx run-many -t build`, `npx nx run-many -t test`.
- Dump : `docker compose exec postgres pg_dump -U postgres cas_pratique > dump.sql`.

## Git

Sources : conventionalcommits.org v1.0.0, @commitlint/config-conventional, Git Book (Contributing to a Project), GitHub flow.

- Format **Conventional Commits** : `<type>(<scope>): <description>`.
  - Types : `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `build`, `ci`, `perf`, `style`, `revert`.
  - Scope = nom du projet Nx (`backend`, `frontend`) ou zone (`docs`, `db`).
  - Description à l'impératif, en minuscule, sans point final ; header ≤ 100 caractères.
  - Body (optionnel, après une ligne vide) : explique le *pourquoi*.
- Un commit = un changement isolé et complet. Ne pas mélanger plusieurs sujets ; découper avec `git add -p` si besoin.
- En TDD : committer quand les tests sont verts et le code propre (après le refactor). Ne jamais committer une suite rouge.
- Les hooks husky (commitlint, `nx affected -t lint test`, puis `build` au push) le vérifient automatiquement : ne jamais les contourner (`--no-verify` interdit). Pas de CI (D27).
- Workflow GitHub flow : une branche descriptive par sujet depuis `main` (`feat/action-status-transitions`), push régulier sur `origin` (fork), PR vers `main`, suppression de la branche après merge.
- Ne jamais pousser vers `upstream` (dépôt d'origine info-logi-sante).
- Ne pas versionner : `.env`, `Cas pratique Qualineo.pdf`.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.

<!-- nx configuration end-->
