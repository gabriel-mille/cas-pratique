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
10. Ajout de deux règles de méthode : « ne pas réinventer la roue, se renseigner avant d'attaquer » et « recenser et suivre les normes (sécurité, ISO, domaine santé) ; si non demandé, au moins noter et prévoir » → règles n°2 et n°3 de `AGENTS.md`.
11. « Oui » à la recherche des normes → 4 recherches parallèles (sécurité, données de santé, qualité, accessibilité) → `docs/compliance.md` et questions Q20–Q27.
12. Validation de Q20–Q27 → décisions D15–D22.
13. « Avant d'attaquer, fait-on aussi la recherche pour la règle n°2 (ne pas réinventer la roue) ? » → 3 recherches parallèles (outillage Nx, backend, frontend) → `docs/stack.md`, questions S1–S8.
14. Questions sur le code maison (« t'es sûr qu'on doit le faire nous-mêmes ? »), CI jugée inutile, tests et lint automatiques via hooks, puis demande d'une stratégie de tests front sourcée où chaque besoin est testé automatiquement → recherches style/toasts et tests front, essai de vitest-cucumber sur nos `.feature` → décisions D23–D27.
