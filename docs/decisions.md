# Décisions

Points ambigus de l'énoncé et choix d'architecture. Chaque décision suit le format : contexte → décision → raison ou source.
Les numéros `Qn` renvoient à `docs/specs/open-questions.md`. Les URLs des sources sont dans `docs/references.md`.

## D1 – Fichiers d'instructions IA
- Contexte : l'énoncé demande de fournir les prompts et les fichiers d'instructions IA.
- Décision : `AGENTS.md` (format ouvert) est la source unique, importée par `CLAUDE.md` via `@AGENTS.md`. Chaque app a son propre `AGENTS.md` (backend DDD, frontend FSD).
- Alternative écartée : un symlink `CLAUDE.md → AGENTS.md`, déconseillé sous Windows par la doc Claude Code.

## Règles métier

### D2 – Rôles hiérarchiques (Q1)
- L'Administrateur a tous les droits du Gestionnaire, y compris les transitions À faire → En cours → À valider.
- Raison : sinon, une organisation sans gestionnaire serait bloquée.
- Limite : l'énoncé ne le dit pas. C'est une hypothèse à confirmer avec le métier.

### D3 – Cycle de vie strict (Q2, Q4)
- Une action est toujours créée à l'état À faire.
- Elle ne passe à Terminé que depuis À valider.
- Les sauts d'état sont interdits.
- Raison : l'énoncé définit un cycle ; s'il avait voulu un autre point d'entrée, il l'aurait décrit.

### D4 – Refus de validation tracé (Q3)
- Un Administrateur peut refuser une action À valider : elle repasse à En cours.
- Un **motif est obligatoire**, et le refus est enregistré : qui, quand, motif.
- Une action Terminée ne peut pas être rouverte.
- Raison : « à valider » implique qu'une validation peut être refusée. Sans trace, le refus serait invisible.

### D5 – Historique des changements dès la v1 (Q16)
- Chaque transition d'état est enregistrée : action, état de départ, état d'arrivée, auteur, date, commentaire (obligatoire pour un refus).
- Les suppressions sont aussi enregistrées.
- Dans le domaine, chaque transition produit un événement nommé au passé (domain event, MS Learn).
- Hors v1 : l'écran d'historique et l'audit des modifications de titre et de description.
- Raison : la traçabilité est attendue en certification HAS (critère 3.7-03 : suivi des actions). Le modèle est pensé pour l'étendre.

### D6 – Plan d'actions (Q5, Q7, Q8)
- Un plan a un titre (obligatoire) et une description (facultative). Il n'a pas d'état.
- Le modèle doit pouvoir accepter d'autres attributs plus tard.
- L'Administrateur crée et modifie les plans et les actions (titre, description).
- Un plan peut être vide, et on peut lui ajouter des actions après sa création.
- Consultation : liste des plans, puis actions d'un plan, puis détail d'une action.
- La liste globale de toutes les actions n'est pas en v1, mais ne doit pas être bloquée par le modèle.

### D7 – Suppression logique (Q6)
- Une action supprimée reçoit `deletedAt` et `deletedBy`. Elle disparaît des listes mais reste en base, et la suppression est tracée (D5).
- La suppression de plan est hors périmètre (non demandée).
- Raisons :
  - traçabilité attendue par la HAS ;
  - maîtrise de la conservation (ISO 9001 §7.5.3, lu en sources secondaires) ;
  - MS Learn présente le soft delete comme moyen de préserver une piste d'audit.
- Limite RGPD (art. 5.1.e, CNIL) : la conservation ne peut pas être indéfinie. La politique de purge et d'archivage est hors périmètre, mais documentée.
- Piège connu : filtrer les éléments supprimés partout, de manière centralisée dans le repository.

### D8 – Ajout de membre et identifiants (Q9, Q11)
- Inscription : nom de l'organisation, nom, email, mot de passe.
- Ajout d'un membre par un admin :
  - l'admin saisit l'email, le nom et le rôle ;
  - le système génère un mot de passe temporaire aléatoire (générateur cryptographique), affiché **une seule fois** à l'admin, qui le transmet lui-même ;
  - le membre doit changer ce mot de passe à sa première connexion.
- L'email est unique sur toute l'application.
- Pas d'envoi d'email en v1 (amélioration future).
- Limite : aucune source NIST ou OWASP n'impose explicitement le changement forcé à la première connexion. C'est une bonne pratique par analogie avec les jetons de réinitialisation (usage unique).

### D9 – Gestion des membres et des admins (Q10, Q19)
- L'Administrateur liste les membres, change leur rôle et retire un membre (retrait logique, tracé).
- Plusieurs admins sont possibles, puisque l'énoncé permet de donner n'importe quel rôle.
- Tous les admins sont égaux.
- **Un membre ne peut ni changer son propre rôle ni se retirer lui-même** (règle de GitHub et Atlassian).
- Conséquence : il reste toujours au moins un admin. Un admin ne peut être rétrogradé que par un autre admin, qui lui reste en place.
- Pas de super-admin en v1. Ce serait un rôle supplémentaire, comme le Primary Owner de Slack (amélioration future).
- Le risque qu'un admin en retire un autre est atténué par l'historique.

### D10 – Périmètre des gestionnaires et des organisations (Q13, Q14)
- Le Gestionnaire agit sur toutes les actions de son organisation. L'assignation est une amélioration future.
- Un compte appartient à une seule organisation en v1. Le modèle `Membership` (D12) permettra le multi-organisation plus tard.

### D11 – Champs obligatoires (Q18)
- Titre obligatoire et non vide, description facultative, pour les plans comme pour les actions.
- Longueurs maximales : **200 caractères pour un titre, 5000 pour une description**. Choix du projet, sans source normative : un titre se lit sur une ligne de liste, une description reste un texte court (pas un document). À revoir avec les utilisateurs.
- Les espaces en bord sont retirés ; une description vide devient « absente » (`null`).
- Les longueurs sont comptées en caractères (points de code), comme `varchar(n)` dans PostgreSQL, et non en unités UTF-16 comme `String.length`.

### D12 – Vocabulaire (Q17)
- Code :
  - `User` = le compte (la personne) ;
  - `Membership` = son appartenance à une organisation, qui porte le rôle ;
  - rôles `ADMIN`, `MANAGER`, `MEMBER`.
- Interface : Administrateur, Gestionnaire, **Utilisateur** (terme de l'énoncé).
- Sources :
  - NIST RBAC (« user » = la personne) ;
  - GitHub, Slack et Auth0 (« member » = rôle de base, rôle porté par l'appartenance) ;
  - Fowler (lever les ambiguïtés du langage ubiquitaire).

## Choix techniques

### D13 – Authentification (Q12)
- `@nestjs/jwt`, avec le jeton dans un cookie `HttpOnly; Secure; SameSite`. Jamais dans `localStorage` (OWASP Session Management et HTML5).
- Hachage avec scrypt de `node:crypto` (défaut de la doc NestJS, conforme à l'ordre de préférence OWASP).
- Mots de passe (NIST SP 800-63B rev 4) :
  - 15 caractères minimum ;
  - au moins 64 acceptés ;
  - aucune règle de composition ;
  - pas d'expiration périodique.
- Refus des mots de passe courants dès la v1 : voir D18.
- Échec de connexion : message générique, sans révéler si l'email existe (OWASP Authentication).
- Alternative écartée : le nouveau paquet officiel `@nestjs/authentication`, encore en version 0.0.1 (registre npm, 2026-10).

### D14 – Concurrence : verrou optimiste (Q15)
- Les actions portent une `version`.
- La mise à jour est conditionnelle : `UPDATE … WHERE id = ? AND version = ?`, et 0 ligne modifiée signifie un conflit.
- Côté HTTP :
  - `ETag` renvoyé sur le GET ;
  - `If-Match` exigé sur les modifications ;
  - réponse **412** si la version ne correspond pas, **428** si l'en-tête manque.
- Sources :
  - Fowler PoEAA (verrou optimiste quand les conflits sont rares) ;
  - Vernon (version des agrégats) ;
  - RFC 9110 (« lost update ») et RFC 6585 (428) ;
  - doc PostgreSQL (réévaluation du WHERE en Read Committed).
- Piège vérifié dans TypeORM 0.3.28 (code installé) : `@VersionColumn` incrémente la version, mais `save()` ne la vérifie pas. D'où l'update conditionnel écrit à la main.

## Normes (`docs/compliance.md`, questions Q20 à Q27)

### D15 – Niveau de sécurité : OWASP ASVS 5.0 niveau L2 (Q20)
- L'ASVS recommande ce niveau pour la plupart des applications (« most applications should be striving to achieve this level »). Le niveau L1 serait insuffisant pour des données d'établissements de santé.
- Écart assumé : la MFA (ASVS 6.3.3) n'est pas implémentée dans ce test. Elle est prévue.
- Mesures compensatoires, conformément à l'exigence de l'ASVS d'un « plan on how the risks around authentication will be mitigated » :
  - mots de passe d'au moins 15 caractères ;
  - liste de mots de passe interdits (D18) ;
  - limitation des tentatives de connexion (D17) ;
  - sessions courtes et révocables (D16).

### D16 – Révocation des sessions JWT (Q21)
- Jeton à courte durée de vie.
- À chaque requête, le serveur relit en base l'appartenance (active ou non, rôle) et une date `sessionsValidAfter`. Les jetons émis avant cette date sont refusés.
- La déconnexion, le retrait d'un membre et le changement de rôle mettent cette date à jour.
- Sources :
  - ASVS 7.4.1 (L1), qui cite « disallowing tokens produced before a per-user date and time » ;
  - ASVS 7.4.2 (L1) ;
  - ASVS 8.3.2 (L3).
- Coût : une lecture en base par requête.

### D17 – Limitation des tentatives de connexion (Q22)
- `@nestjs/throttler` (module officiel NestJS), par IP et par email.
- Pas de blocage du compte, pour éviter qu'un tiers bloque un compte volontairement (ASVS 6.3.1).
- Sources : ASVS 6.1.1 et 6.3.1 (L1), ANSSI R10, CNIL 2022-100 §43.

### D18 – Refus des mots de passe courants (Q23)
- Appliqué dès la v1, avec une liste publique reconnue. La source de la liste sera vérifiée avant de la choisir (règle n°2).
- Sources : ASVS 6.2.4 (L1), CNIL §37, NIST 800-63B.

### D19 – Pas d'expiration périodique des mots de passe (Q24)
- Y compris pour les admins.
- Sources : NIST 800-63B et ASVS 6.2.10.
- Divergence notée : l'ANSSI (R25) et la CNIL (§54) permettent l'expiration pour les comptes à privilèges. À revoir si un client l'exige.

### D20 – Champs HAS d'une action : prévus, non implémentés (Q25)
- Champs concernés : pilote, échéance, indicateur et cible, évaluation de l'efficacité, origine de l'action.
- Ils sont attendus par la HAS (fiche pédagogique 2025, critères 2.4-06 et 2.4-07) et par l'ISO 9001 (§6.2.2, §10.2, sources secondaires). L'énoncé ne les demande pas.
- Le modèle `Action` doit pouvoir les accueillir sans refonte.

### D21 – Données patients dans les textes libres (Q26)
- Le formulaire d'action affiche un avertissement : ne pas saisir de données patients.
- Raison : la note DSSIS de 2019 dit que le régime HDS s'applique dès qu'une fonctionnalité porte sur des données de santé, « même pour une partie seulement ».
- La règle sera aussi à inscrire dans les conditions d'utilisation (hors test).

### D22 – Journalisation de sécurité (Q27)
- Journaliser les connexions (réussies et échouées) et les refus d'accès : qui, quoi, quand.
- Ne jamais journaliser de mot de passe ni d'identifiant non reconnu.
- Sources : ASVS 16.3.1 et 16.3.2, CNIL 2021-122, CNIL 2022-100 §64.
- Le stockage séparé et non modifiable des logs relève de l'infrastructure, hors périmètre.

## Choix techniques (règle n°2, détail dans `docs/stack.md`)

### D23 – Rester en NestJS 11 (S1)
- Contexte : NestJS 12 est sorti le 2026-08-27, mais le projet fourni est en 11.1.
- Choix : rester en 11, la stack fournie par l'énoncé. Les paquets dont la dernière version exige Nest 12 sont fixés en 11 (`@nestjs/swagger@11`, `@nestjs/cqrs@11`).
- Alternative écartée : migrer en 12 (sessions côté serveur via `@nestjs/authentication`). Cela n'apporte rien au périmètre ; c'est noté comme évolution.

### D24 – Code maison justifié (S3, S4, verrou optimiste)
- **Verrou optimiste** : TypeORM ne vérifie la version qu'à la lecture (`OptimisticLockVersionMismatchError` n'existe que dans `SelectQueryBuilder`, vérifié dans `node_modules`). On écrit `UPDATE … WHERE id = :id AND version = :v` et on contrôle `affected`.
- **If-Match / 412 / 428** : ni Express ni NestJS ne gèrent `If-Match`. Le seul paquet npm trouvé, `precond`, date de 2014. On écrit un intercepteur.
- **Cycle de vie** : une table de transitions dans le domaine plutôt que xstate. C'est un choix, pas un manque d'outil : 4 états, et le domaine reste sans dépendance.
- **Erreurs HTTP** : un filtre maison au format RFC 9457 plutôt que `nest-problem-details-filter`, peu adopté.
- **Front, conflit 412** : TanStack Query gère le cache ; il reste à écrire la réaction (recharger, prévenir l'utilisateur).

### D25 – CSRF (S2)
- Choix : cookie `SameSite=Strict`, vérification de l'en-tête `Origin` sur les requêtes d'écriture, API en JSON uniquement.
- Source : OWASP *Cross-Site Request Forgery Prevention Cheat Sheet*.
- Alternative écartée : `csrf-csrf` (proposé par la doc NestJS v11), une dépendance de plus sans gain dans notre configuration (front et API sur des origines connues).

### D26 – Chaque scénario de la spec est un test automatique, côté back et côté front
- Choix : les fichiers `docs/specs/features/*.feature` sont exécutés tels quels avec `@amiceli/vitest-cucumber` 7.0.0 (compatible Vitest 4).
  - Vérifié le 2026-10-07 : la lecture de `action-lifecycle.feature` en français reconnaît `Contexte`, les 6 `Règle`, `Exemple` et `Plan du Scénario`.
  - Constaté le 2026-10-07 : un scénario non implémenté fait échouer la suite (`ScenarioNotCalledError`).
- Back : TDD piloté par les scénarios (domaine, puis cas d'usage, puis e2e).
- Front : tests d'intégration (Testing Library + MSW + axe-core) qui implémentent les mêmes scénarios.
  - Les scénarios qui ne se prouvent pas avec une API simulée (persistance, verrou réel) sont tagués `@back-only` et couverts par le back et les E2E.
  - Constaté le 2026-10-07 : `describeFeature(feature, cb, { excludeTags: ['back-only'] })` ignore ces scénarios, et la même suite sans filtre échoue.
- E2E : 2 ou 3 parcours critiques avec Playwright (`@nx/playwright`) contre le vrai back.
- Sources : Kent C. Dodds (*Testing Trophy*, *How to know what to test*, *When I follow TDD*), Testing Library *Guiding principles*, doc MSW et TanStack Query *Testing*.
- Alternatives écartées : une matrice de traçabilité tenue à la main (rien n'est vérifié automatiquement) ; `playwright-bdd` pour tout (lent, doublon avec le back).

### D27 – Vérification automatique en local, sans CI (S7, S8)
- Choix : hooks Git avec husky 9.
  - `commit-msg` : commitlint (Conventional Commits).
  - `pre-commit` : le hook global de l'utilisateur s'il existe (gitleaks, lychee), puis `nx affected -t lint typecheck test`.
  - `pre-push` : `nx affected -t lint typecheck test build`.
- Les hooks ne sont jamais contournés (`--no-verify` interdit).
- `typecheck` (cible `tsc --build` inférée par `@nx/js/typescript`) est nécessaire : Vitest transpile avec SWC sans vérifier les types, donc une erreur de type dans un test passait inaperçue. Le `tsconfig.spec.json` du backend a été aligné sur celui généré pour le frontend (`module: esnext`, `moduleResolution: bundler`, référence vers `tsconfig.app.json`).
- Seuils de couverture Vitest à 80 %. La doc Vitest ne recommande aucune valeur ; Dodds et Fowler rappellent que la couverture est un outil, pas un objectif.
- Alternative écartée : une CI GitHub Actions, jugée inutile pour un test technique.

## Architecture du backend

### D28 – `Action` est un agrégat distinct de `ActionPlan`
- L'action référence son plan par id. Son historique (`ActionStatusChange`) fait partie de l'agrégat `Action`, en ajout seul, et il est sauvé dans la même transaction.
- Raison : la version est portée par l'action (D14). Deux changements sur deux actions du même plan ne doivent pas entrer en conflit.
- Sources : Vernon, *Effective Aggregate Design* (petits agrégats, référence par identité) ; Evans, *DDD Reference* (une transaction = un agrégat).
- Alternative écartée : `ActionPlan` racine contenant ses actions. Toute modification d'une action verrouillerait le plan entier.

### D29 – Niveau d'exécution des scénarios côté backend
- Les `.feature` sont joués au niveau **application** : vrais cas d'usage, repositories en mémoire. Aucun scénario n'est exclu côté back.
- En dessous : tests unitaires du domaine, un par règle.
- Au-dessus : quelques e2e (Supertest + Testcontainers) pour ce qui n'existe qu'en HTTP ou en base : cookie et guard, changement de mot de passe forcé, filtrage multi-tenant en SQL, 412/428, update conditionnel réel, format RFC 9457.
- Source : Dodds, *Testing Trophy* (l'essentiel au niveau intégration, peu d'e2e). Le placement exact est un choix du projet.

### D30 – Deux bounded contexts : `identity` et `action-plans`
- `identity` : organisations, comptes, appartenances, authentification. `action-plans` : plans, actions, historique.
- `action-plans` ne dépend pas d'`identity`. Il reçoit un `Actor { userId, organizationId, role }` construit par le guard HTTP. `Role` est partagé (`shared/domain`).
- Source : Evans et Fowler (*BoundedContext*). Le découpage en deux contextes est un choix du projet.
- Pratiques du projet, non imposées par une source : ids `crypto.randomUUID()`, port `Clock` pour des dates testables, erreurs métier typées traduites en HTTP par un seul filtre (D24).

### D31 – Plans d'actions : version, contrôle des rôles, lectures
- **Le plan porte aussi une `version`** : R3b.3 rejette une modification sur version périmée, pour un plan comme pour une action. Même mécanisme que D14.
- **Où vérifier les rôles** :
  - les règles qui dépendent de l'état (qui fait quelle transition, D2) restent dans le domaine, dans la table de transitions ;
  - les opérations réservées à l'Administrateur sans condition d'état (créer, modifier, supprimer) sont vérifiées dans le cas d'usage, **avant tout chargement** : un refus ne dit donc rien de l'existence de la ressource.
  - Choix du projet. Les sources DDD admettent les deux emplacements.
- **Suppression** : une action supprimée est exclue de toutes les lectures dans le repository (`findById`, `findByPlan`), un seul endroit par implémentation (piège noté en D7). Un contrat de test commun vérifie ce filtrage sur toutes les implémentations.
- **Modifier une action Terminée** reste permis : la spec interdit seulement d'en changer l'état (D4), et rien n'interdit d'en corriger le titre. À confirmer si besoin.
