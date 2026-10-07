# Prompts IA utilisés

Journal des demandes significatives faites à l'assistant (Claude Code), dans l'ordre.

1. Comprendre l'énoncé : rappel de ce qu'est un plan d'actions et de ce qui est attendu.
2. Rappel des notions DDD, Feature-Sliced Design, Nx, dump de base.
3. Vérifier que l'environnement de développement est prêt (install, Docker/Postgres, build, serve, tests).
4. « Renseigne-toi via des sources fiables, sans inventer, sur comment écrire et gérer les fichiers d'instructions IA ; préciser le contexte du test ; donner l'encadrement DDD et FSD ; ordre : besoins fonctionnels → backend en TDD → frontend ; commit/push réguliers selon les recommandations ; si on ne sait pas, le dire clairement. »
5. « La liste des besoins fonctionnels n'est pas le format le plus adapté pour développer : existe-t-il un format standard qui permet en plus de combler les trous ? » → user stories + Example Mapping + table de transitions + matrice RBAC + Gherkin (sources vérifiées).
6. « Je valide, fais ça » → rédaction de `docs/specs/`.
7. « Tu as ajouté une US (se connecter) : pourquoi celle-là et pas d'autres ? » → explication du marqueur [Implicite].
8. Réponses aux questions Q1–Q19, avec demandes de recherche sourcée sur : suppression physique/logique dans le domaine qualité/audit (Q6), gouvernance des admins (Q10), authentification standard (Q12), modifications concurrentes (Q15), vocabulaire User/Member (Q17).
9. Validation finale des choix → consignation dans `docs/decisions.md` (D2–D14), mise à jour des specs et rédaction des scénarios Gherkin (`docs/specs/features/`).
