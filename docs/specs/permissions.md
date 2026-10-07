# Matrice rôles × opérations

Modèle NIST RBAC : membres → rôles → permissions. Toutes les opérations sont limitées à l'organisation du membre connecté.

| Opération | Utilisateur | Gestionnaire | Administrateur | Origine |
|---|---|---|---|---|
| Créer un compte (organisation + admin) | visiteur non connecté | | | [Énoncé] |
| Ajouter un membre et lui donner un rôle | ❌ | ❌ | ✅ | [Énoncé] |
| Modifier le rôle d'un membre / retirer un membre | ❌ | ❌ | ? | Q10 |
| Lister les membres | ? | ? | ? | Q19 |
| Créer un plan d'actions | ❌ | ❌ | ✅ | [Énoncé] |
| Ajouter une action à un plan | ❌ | ❌ | ✅ | [Énoncé] (Q7) |
| Modifier titre / description (plan, action) | ? | ? | ? | Q5 |
| Supprimer un plan | ? | ? | ? | Q6 |
| Supprimer une action | ❌ | ❌ | ✅ | [Énoncé] |
| Transitions À faire → En cours → À valider | ❌ | ✅ | ? | [Énoncé] / Q1 |
| Transition → Terminé | ❌ | ❌ | ✅ | [Énoncé] |
| Voir la liste des actions et le détail | ✅ | ✅ | ✅ | [Énoncé] |

Un ❌ sur une ligne [Énoncé] est déduit des formules « l'administrateur doit pouvoir » et « le gestionnaire doit pouvoir ». C'est une lecture restrictive (moindre privilège), à confirmer en Q1.
