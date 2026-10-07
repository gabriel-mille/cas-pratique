# Backend – NestJS 11 en DDD, développé en TDD

Sources : Evans *DDD Reference* (2015), Microsoft Learn « DDD-oriented microservice » (chapitres domain model, value objects, validations, persistence, domain events), Fowler bliki (Aggregate, ValueObject, AnemicDomainModel), docs.nestjs.com (modules, custom providers, guards, testing, data/typeorm), Kent Beck « Canon TDD ». URLs : `docs/references.md`.

## Couches et dépendances

- `domain` : entités, value objects, agrégats, erreurs métier, **interfaces** de repository. TypeScript pur : aucun import de `@nestjs/*`, `typeorm` ni HTTP.
- `application` : cas d'usage, mince ; il orchestre (charger l'agrégat → appeler le domaine → sauvegarder), sans règle métier.
- `infrastructure` : implémentations TypeORM des repositories, entités ORM, mappers.
- `presentation` : controllers, DTO (validation de format), guards.
- Sens des dépendances : presentation → application → domain ← infrastructure. Le domaine ne dépend de rien.
- Ne jamais renvoyer une entité de domaine en réponse HTTP : passer par un DTO de réponse.

## Organisation (choix du projet)

```
apps/backend/src/
  modules/
    <bounded-context>/        # ex. identity, action-plans
      domain/
      application/
      infrastructure/
      presentation/
      <context>.module.ts
  shared/                     # briques transverses (erreurs, classes de base) – rester minimal
```

- Un module Nest par bounded context ; n'exporter que le nécessaire, pas de module global par défaut.
- Entités ORM (`@Entity`) séparées des entités de domaine, avec mappers `toDomain` / `toPersistence`.
  - Ce point est une pratique courante, pas une règle de la doc Nest. Il découle de l'isolation du domaine (Evans, MS Learn).

## Règles DDD

- **Entité** : identité stable et comportement. Pas de setters publics ; les changements d'état passent par des méthodes métier qui vérifient les invariants. Pas de modèle anémique.
- **Value object** : immuable, égalité par valeur. Candidats : `ActionStatus`, `Role`, `Email`, identifiants.
- **Agrégat** :
  - les objets externes ne référencent que la racine, et les enfants ne sont modifiés que via la racine ;
  - les autres agrégats sont référencés **par id** ;
  - une transaction = un agrégat.
- **Repository** : un par racine d'agrégat (jamais un par table). L'interface vit dans `domain`, l'implémentation dans `infrastructure`.
- **Injection** : les interfaces TS sont effacées à la compilation, donc chaque port a un token `Symbol`. Exemple : `{ provide: ACTION_PLAN_REPOSITORY, useClass: TypeOrmActionPlanRepository }` puis `@Inject(ACTION_PLAN_REPOSITORY)`.
- **Validation en deux temps** :
  - format sur les DTO ;
  - règles métier dans le domaine, qui lève une erreur métier typée et ne laisse jamais d'état partiel.
  - Un filtre d'exception traduit ces erreurs en HTTP (400 / 403 / 404 / 409).
- **Autorisation** :
  - un guard Nest contrôle l'accès aux routes (authentifié, rôle) ;
  - la règle « quel rôle peut faire quelle transition » est métier, donc dans le domaine, testée unitairement.
- **Multi-tenant** : toute lecture/écriture est filtrée par l'organisation de l'utilisateur authentifié. Ne jamais faire confiance à un `organizationId` venant du client.
- CQRS (`@nestjs/cqrs`) et les domain events sont optionnels : la doc Nest juge le modèle classique suffisant pour une petite application. Ne les introduire que sur besoin justifié dans `docs/decisions.md`.

## TDD (Canon TDD, Kent Beck)

1. Écrire la liste des comportements à tester (dans la spec ou le fichier de test).
2. Transformer **un seul** élément en test exécutable et le voir échouer (rouge).
3. Écrire le minimum de code pour le faire passer, avec tous les tests précédents (vert).
4. Refactorer si utile, tests toujours verts. Puis committer.
5. Recommencer jusqu'à épuiser la liste.

- À éviter :
  - tests sans assertion ;
  - écrire tous les tests d'un coup ;
  - refactorer en phase verte ;
  - recopier la valeur calculée dans l'attendu.
- Ordre :
  1. domaine en tests unitaires purs, sans Nest ni base ;
  2. cas d'usage avec repository en mémoire ou mocké ;
  3. quelques e2e (`createNestApplication` + Supertest) contre PostgreSQL.
- Fichiers : `*.spec.ts` à côté du code, e2e en `*.e2e-spec.ts`.

## Base de données

- `synchronize: true` est actif dans `app.module.ts`. La doc Nest l'interdit en production (il faut des migrations). C'est acceptable ici, mais à mentionner dans le README.
