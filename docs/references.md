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
