# Sources de référence

Seules sources utilisées pour les règles d'architecture et de convention du projet (consultées le 2026-10-07).

## Instructions pour agents IA
- Claude Code – mémoire / CLAUDE.md : https://code.claude.com/docs/en/memory
- Claude Code – best practices : https://code.claude.com/docs/en/best-practices
- Claude Code – grands dépôts / monorepos : https://code.claude.com/docs/en/large-codebases
- Format AGENTS.md : https://agents.md

## DDD
- Eric Evans, *DDD Reference* (2015) : https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf
- Microsoft Learn – DDD-oriented microservice : https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice
- Microsoft Learn – domain model : https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model
- Microsoft Learn – seedwork : https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/seedwork-domain-model-base-classes-interfaces
- Microsoft Learn – value objects : https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/implement-value-objects
- Microsoft Learn – validations : https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations
- Microsoft Learn – persistance : https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design
- Microsoft Learn – domain events : https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation
- Martin Fowler : https://martinfowler.com/bliki/DDD_Aggregate.html · https://martinfowler.com/bliki/ValueObject.html · https://martinfowler.com/bliki/AnemicDomainModel.html · https://martinfowler.com/bliki/BoundedContext.html · https://martinfowler.com/bliki/UbiquitousLanguage.html

## NestJS
- Modules : https://docs.nestjs.com/modules
- Custom providers (tokens) : https://docs.nestjs.com/fundamentals/custom-providers
- Guards (RBAC) : https://docs.nestjs.com/guards
- Testing : https://docs.nestjs.com/fundamentals/testing
- TypeORM : https://docs.nestjs.com/data/typeorm
- CQRS : https://docs.nestjs.com/recipes/cqrs

## TDD
- Martin Fowler – TDD : https://martinfowler.com/bliki/TestDrivenDevelopment.html
- Kent Beck – Canon TDD : https://newsletter.kentbeck.com/p/canon-tdd
- Commit en TDD (blogs, non normatif) : https://ardalis.com/rgrc-is-the-new-red-green-refactor-for-test-first-development/ · https://xp123.com/tdd-tcr-commits/

## Feature-Sliced Design
- Overview : https://feature-sliced.design/docs/get-started/overview
- Layers : https://feature-sliced.design/docs/reference/layers
- Slices & segments : https://feature-sliced.design/docs/reference/slices-segments
- Public API : https://feature-sliced.design/docs/reference/public-api
- Cross-imports : https://feature-sliced.design/docs/guides/issues/cross-imports
- Excessive entities : https://feature-sliced.design/docs/guides/issues/excessive-entities
- API requests : https://feature-sliced.design/docs/guides/examples/api-requests
- Auth : https://feature-sliced.design/docs/guides/examples/auth
- Migration v2.0 → v2.1 : https://feature-sliced.design/docs/guides/migration/from-v2-0
- Steiger (linter) : https://github.com/feature-sliced/steiger

## Git
- Conventional Commits 1.0.0 : https://www.conventionalcommits.org/en/v1.0.0/
- commitlint config-conventional : https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional
- Git Book – Contributing to a Project : https://git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project
- Chris Beams – How to Write a Git Commit Message : https://cbea.ms/git-commit/
- GitHub flow : https://docs.github.com/en/get-started/using-github/github-flow

## Non trouvé dans les sources officielles
- Guide FSD officiel pour React + Vite, React Router ou Nx.
- Recommandation NestJS officielle de séparer entités ORM et entités de domaine (déduite de l'isolation du domaine chez Evans / MS Learn).

## Spécification fonctionnelle
- User story (Connextra) – Mike Cohn : https://www.mountaingoatsoftware.com/blog/why-the-three-part-user-story-template-works-so-well
- INVEST – Bill Wake : https://xp123.com/articles/invest-in-good-stories-and-smart-tasks/
- Gherkin reference : https://cucumber.io/docs/gherkin/reference/
- Example Mapping – Matt Wynne : https://cucumber.io/blog/bdd/example-mapping-introduction/
- Introducing BDD – Dan North : https://dannorth.net/blog/introducing-bdd/
- ISTQB CTFL v4.0.1 (§4.2.3 tables de décision, §4.2.4 transitions d'états) : https://istqb.org/wp-content/uploads/2024/11/ISTQB_CTFL_Syllabus_v4.0.1.pdf
- NIST RBAC : https://csrc.nist.gov/projects/role-based-access-control

## Décisions (D2 à D14)
### Authentification et mots de passe
- OWASP Password Storage Cheat Sheet : https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP Authentication Cheat Sheet : https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Session Management Cheat Sheet : https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- OWASP HTML5 Security Cheat Sheet (localStorage) : https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- OWASP JSON Web Token Cheat Sheet : https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html
- OWASP Forgot Password Cheat Sheet : https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- NIST SP 800-63B rev 4 : https://pages.nist.gov/800-63-4/sp800-63b.html
- NestJS – Authentication : https://docs.nestjs.com/security/authentication
- NestJS – Encryption and hashing : https://docs.nestjs.com/security/encryption-and-hashing

### Concurrence
- Fowler – Optimistic Offline Lock : https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html
- Fowler – Pessimistic Offline Lock : https://martinfowler.com/eaaCatalog/pessimisticOfflineLock.html
- Vaughn Vernon – Effective Aggregate Design : https://dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_1.pdf
- RFC 9110 (ETag, If-Match, 412) : https://www.rfc-editor.org/rfc/rfc9110.html
- RFC 6585 (428 Precondition Required) : https://www.rfc-editor.org/rfc/rfc6585.html
- PostgreSQL – Transaction Isolation : https://www.postgresql.org/docs/current/transaction-iso.html
- PostgreSQL – Explicit Locking : https://www.postgresql.org/docs/current/explicit-locking.html
- TypeORM – UpdateQueryBuilder / SubjectExecutor (vérification de `save()`) : https://github.com/typeorm/typeorm/blob/master/packages/typeorm/src/persistence/SubjectExecutor.ts

### Traçabilité et suppression
- HAS – Manuel de certification 2024 (critère 3.7-03) : https://has-sante.fr/upload/docs/application/pdf/2023-09/manuel_2024.pdf
- ISO 9001 §7.5.3 (sources secondaires, norme payante non consultée) : https://www.thecoresolution.com/clause-7-5-3-iso-90012015-explained · https://blog.auditortrainingonline.com/blog/explaining-iso-9001-clause-7.5.3-control-of-documented-information
- RGPD art. 5 (CNIL) : https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre2#Article5
- RGPD art. 17 (CNIL) : https://www.cnil.fr/fr/reglement-europeen-protection-donnees/chapitre3#Article17
- CNIL – Durées de conservation : https://www.cnil.fr/fr/les-durees-de-conservation-des-donnees
- MS Learn – EF Core Global Query Filters (soft delete) : https://learn.microsoft.com/en-us/ef/core/querying/filters
- MS Learn – Domain events : https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation

### Rôles et membres
- GitHub – Roles in an organization : https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/roles-in-an-organization
- GitHub – Maintaining ownership continuity : https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/maintaining-ownership-continuity-for-your-organization
- Slack – Types of roles : https://slack.com/help/articles/360018112273-Types-of-roles-in-Slack
- Slack – Owners and Administrators : https://slack.com/help/articles/201912948-Owners-and-Administrators
- Atlassian – Give users admin permissions : https://support.atlassian.com/user-management/docs/give-users-admin-permissions/
- Atlassian – Remove a site/org admin : https://confluence.atlassian.com/cloudkb/remove-an-atlassian-cloud-site-admin-or-organization-admin-975031716.html
- Auth0 – Organization member roles : https://auth0.com/docs/manage-users/organizations/configure-organizations/add-member-roles
- Fowler – Ubiquitous Language : https://martinfowler.com/bliki/UbiquitousLanguage.html

### Non trouvé
- Aucune source NIST/OWASP n'impose le changement forcé du mot de passe temporaire à la première connexion (D8 : pratique déduite).
- Texte de la norme ISO 9001 (payante) : seules des sources secondaires ont été lues.

## Normes et référentiels (`docs/compliance.md`)
### Sécurité
- OWASP ASVS 5.0.0 : https://owasp.org/www-project-application-security-verification-standard/ · https://github.com/OWASP/ASVS/tree/master/5.0/en
- OWASP Top 10 2025 : https://top10.owasp.org/ · https://github.com/OWASP/Top10/tree/master/2025/docs/en
- ANSSI – Authentification multifacteur et mots de passe (2021) : https://messervices.cyber.gouv.fr/documents-guides/anssi-guide-authentification_multifacteur_et_mots_de_passe.pdf
- ANSSI – Sécurité côté navigateur v2.0 (2021) : https://messervices.cyber.gouv.fr/documents-guides/anssi-guide-recommandations_mise_en_oeuvre_site_web_maitriser_standards_securite_cote_navigateur-v2.0.pdf
- ISO/IEC 27002:2022, intitulés des contrôles (source secondaire) : https://www.isms.online/iso-27002/
### Données personnelles et santé
- RGPD (EUR-Lex) : https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32016R0679
- CNIL – Délibération 2022-100 mots de passe : https://www.cnil.fr/sites/cnil/files/atoms/files/deliberation-2022-100-du-21-juillet-2022_recommandation-aux-mots-de-passe.pdf
- CNIL – Recommandation journalisation (2021-122) : https://www.cnil.fr/sites/cnil/files/atoms/files/recommandation_-_journalisation.pdf
- CNIL – Recommandation MFA (2025, non lue) : https://cnil.fr/sites/cnil/files/2025-05/recommandation_relative_a_l_authentification_multifacteur.pdf
- CNIL – Guide sécurité des données personnelles 2024 : https://www.cnil.fr/sites/cnil/files/2024-03/cnil_guide_securite_personnelle_2024.pdf
- CNIL – Guide RGPD du développeur : https://lincnil.github.io/Guide-RGPD-du-developpeur/
- Note DSSIS 2019 sur le champ HDS : https://affairesjuridiques.aphp.fr/textes/note-explicitation-du-champ-dapplication-du-cadre-juridique-de-lhebergement-de-donnees-de-sante-ministere-de-la-sante-represente-par-la-delegation-la-strategie-des-s/telecharger/629195
- Référentiel HDS v2 (source secondaire CMS) : https://cms.law/en/fra/news-information/nouveau-referentiel-de-certification-des-hebergeurs-de-donnees-de-sante-hds
- ANS – PGSSI-S (non lu, site bloqué) : https://esante.gouv.fr/produits-et-services/pgssi-s-corpus-documentaire-de-la-politique-generale-de-securite-des-systemes-d-information-de-sante
- NIS2 (EUR-Lex) : https://eur-lex.europa.eu/legal-content/FR/TXT/HTML/?uri=CELEX:32022L2555
### Qualité
- HAS – Référentiel de certification 2025 : https://www.has-sante.fr/upload/docs/application/pdf/2025-01/referentiel_certification_es_qualite_des_soins_version_2025.pdf
- HAS – Fiche pédagogique management qualité et risques (2025) : https://has-sante.fr/upload/docs/application/pdf/2025-10/fiche_pedagogique_6e_cycle_management_qualite.pdf
- HAS – Référentiel ESSMS (2022) : https://www.has-sante.fr/upload/docs/application/pdf/2022-03/referentiel_devaluation_de_la_qualite_essms.pdf
- ISO 9001 §6.2.2, §10.2 (sources secondaires) : https://open-exam-prep.com/study-guides/cqi-irca-qms-lead-auditor/clauses-6-7/clause-6-planning · https://blog.auditortrainingonline.com/blog/iso-9001-clause-10.2-nonconformity-and-corrective-action
- ISO 7101:2023 (notice) : https://scc-ccn.ca/standardsdb/standards/8185439
- MDCG 2019-11 rev.1 (qualification des logiciels DM) : https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en
### Accessibilité
- RGAA : https://accessibilite.numerique.gouv.fr/ · champ d'application : https://accessibilite.numerique.gouv.fr/obligations/champ-application/
- Code de la commande publique R2111-6 : https://www.marche-public.fr/ccp/R2111-06-specifications-techniques-criteres-accessibilite-fonctionnalite.htm
- European Accessibility Act (EUR-Lex) : https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019L0882
- WCAG 2.2 : https://www.w3.org/TR/WCAG22/
- EN 301 549 V4.1.1 (NDA) : https://nda.ie/news/en301549-published
- eslint-plugin-jsx-a11y : https://github.com/jsx-eslint/eslint-plugin-jsx-a11y
- axe-core : https://github.com/dequelabs/axe-core
- Testing Library – priorité des requêtes : https://testing-library.com/docs/queries/about/#priority

## Briques réutilisées (`docs/stack.md`)
### Backend
- NestJS v11 (doc archivée) : https://docs.nestjs.com/v11/ · authentification : https://docs.nestjs.com/v11/security/authentication · cookies : https://docs.nestjs.com/v11/techniques/cookies
- NestJS : rate limiting https://docs.nestjs.com/security/rate-limiting · helmet https://docs.nestjs.com/security/helmet · CORS https://docs.nestjs.com/security/cors · CSRF https://docs.nestjs.com/v11/security/csrf
- NestJS : validation https://docs.nestjs.com/v11/techniques/validation · OpenAPI https://docs.nestjs.com/v11/openapi/introduction · CQRS https://docs.nestjs.com/v11/recipes/cqrs · logger https://docs.nestjs.com/v11/techniques/logger · testing https://docs.nestjs.com/v11/fundamentals/testing · SWC/Vitest https://docs.nestjs.com/recipes/swc
- OWASP Password Storage Cheat Sheet : https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP CSRF Prevention Cheat Sheet : https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- Node.js crypto (scrypt, timingSafeEqual) : https://nodejs.org/api/crypto.html
- SecLists (listes de mots de passe, MIT) : https://github.com/danielmiessler/SecLists/tree/master/Passwords/Common-Credentials
- TypeORM : entités https://typeorm.io/docs/entity/entities · migrations https://typeorm.io/docs/migrations/why
- RFC 9457 Problem Details : https://www.rfc-editor.org/rfc/rfc9457 · RFC 9110 (ETag, If-Match, 412) : https://www.rfc-editor.org/rfc/rfc9110
- Testcontainers Node (PostgreSQL) : https://node.testcontainers.org/modules/postgresql/
- esbuild – limitation emitDecoratorMetadata : https://esbuild.github.io/content-types/#typescript-caveats
### Frontend
- FSD : React Query https://feature-sliced.design/docs/guides/tech/with-react-query · requêtes API https://feature-sliced.design/docs/guides/examples/api-requests · auth https://feature-sliced.design/docs/guides/examples/auth · layout https://feature-sliced.design/docs/guides/examples/page-layout
- Steiger : https://github.com/feature-sliced/steiger
- React Router : https://reactrouter.com/ · TanStack Query : https://tanstack.com/query/latest
- openapi-typescript : https://openapi-ts.dev/ · zod : https://zod.dev/ · React `useActionState` : https://react.dev/reference/react/useActionState
- React Aria Components : https://react-spectrum.adobe.com/react-aria/
- MSW : https://mswjs.io/docs/ · Testing Library : https://testing-library.com/docs/react-testing-library/intro/
### Outillage
- Nx : générateur Vitest https://nx.dev/docs/technologies/test-tools/vitest · module boundaries https://nx.dev/docs/features/enforce-module-boundaries
- commitlint (local setup) : https://commitlint.js.org/guides/local-setup.html · husky : https://typicode.github.io/husky/
### Tests front et choix complémentaires
- Kent C. Dodds : https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications · https://kentcdodds.com/blog/write-tests · https://kentcdodds.com/blog/common-mistakes-with-react-testing-library · https://kentcdodds.com/blog/testing-implementation-details · https://kentcdodds.com/blog/how-to-know-what-to-test · https://kentcdodds.com/blog/when-i-follow-tdd
- Testing Library – guiding principles : https://testing-library.com/docs/guiding-principles
- Martin Fowler – TestCoverage : https://martinfowler.com/bliki/TestCoverage.html
- Vitest : browser mode https://vitest.dev/guide/browser/ · coverage https://vitest.dev/config/coverage
- TanStack Query – Testing : https://tanstack.com/query/latest/docs/framework/react/guides/testing
- React Router – Testing : https://reactrouter.com/start/data/testing
- MSW – best practices : https://mswjs.io/docs/best-practices/structuring-handlers · https://mswjs.io/docs/best-practices/avoid-request-assertions
- vitest-cucumber : https://github.com/amiceli/vitest-cucumber · langues : https://amiceli.github.io/vitest-cucumber-docs/features/spoken-languages
- Nx Playwright : https://nx.dev/docs/technologies/test-tools/playwright/introduction · Nx affected : https://nx.dev/docs/features/ci-features/affected
- Playwright – accessibilité : https://playwright.dev/docs/accessibility-testing
- eslint-plugin-testing-library : https://github.com/testing-library/eslint-plugin-testing-library · @vitest/eslint-plugin : https://github.com/vitest-dev/eslint-plugin-vitest
- Vite – CSS Modules : https://vite.dev/guide/features.html · FSD layers : https://feature-sliced.design/docs/reference/layers · React Aria styling : https://react-aria.adobe.com/styling
- Radix Toast : https://www.radix-ui.com/primitives/docs/components/toast · WCAG 4.1.3 : https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
