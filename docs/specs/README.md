# Spécification fonctionnelle – Plans d'actions

Traduction des besoins fonctionnels de l'énoncé en un format exploitable pour le développement.

## Méthode (sources : `docs/references.md`)

| Étape | Technique | Source | Fichier |
|---|---|---|---|
| 1 | User stories « En tant que… je veux… afin de… », vérifiées avec INVEST | Connextra / Mike Cohn, Bill Wake | `example-mapping.md` |
| 2 | Example Mapping : story → règles → exemples → **questions** | Matt Wynne (Cucumber) | `example-mapping.md` |
| 3 | Table de transitions d'états. Les cases vides révèlent les transitions invalides ou oubliées. | ISTQB CTFL v4.0.1 §4.2.4 | `state-transitions.md` |
| 4 | Matrice rôle × opération | Modèle NIST RBAC (la présentation en matrice est un choix du projet) | `permissions.md` |
| 5 | Scénarios Gherkin : `Rule` = une règle métier, `Example` = un cas. Ils servent de liste de tests pour le TDD. | Dan North (BDD), référence Gherkin de Cucumber | `features/*.feature` |

Les questions ouvertes (`Qn`) sont centralisées dans `open-questions.md`. Une fois tranchées, elles passent dans `docs/decisions.md`.

## Convention de marquage

- **[Énoncé]** : exigence écrite dans le sujet.
- **[Implicite]** : nécessaire au fonctionnement de l'énoncé sans y être écrit (ex. se connecter).
- **[À décider → Qn]** : non spécifié. À trancher, jamais supposé.

## Langage ubiquitaire

| Terme métier | Définition | Nom dans le code |
|---|---|---|
| Organisation | Structure cliente ; isole toutes ses données | `Organization` |
| Compte | La personne qui se connecte | `User` |
| Membre | Appartenance d'un compte à une organisation ; porte le rôle | `Membership` |
| Rôle | Utilisateur, Gestionnaire, Administrateur | `Role.MEMBER`, `Role.MANAGER`, `Role.ADMIN` |
| Plan d'actions | Ensemble d'actions d'une organisation | `ActionPlan` |
| Action | Titre, description, état | `Action` |
| État | À faire, En cours, À valider, Terminé | `ActionStatus.TODO`, `IN_PROGRESS`, `TO_VALIDATE`, `DONE` |
| Refus de validation | Retour de À valider à En cours, avec un motif | `rejectValidation` |
| Historique | Trace de chaque changement d'état | `ActionStatusChange` |
