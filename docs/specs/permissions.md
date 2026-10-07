# Matrice rôles × opérations

Modèle NIST RBAC : comptes → appartenance (`Membership`) → rôle → permissions. Toutes les opérations sont limitées à l'organisation du membre connecté.

Rôles : Utilisateur = `MEMBER`, Gestionnaire = `MANAGER`, Administrateur = `ADMIN` (D12).

| Opération | Utilisateur | Gestionnaire | Admin | Réf. |
|---|---|---|---|---|
| Créer un compte (organisation + admin) | visiteur non connecté | | | US1 |
| Se connecter, changer son mot de passe | ✅ | ✅ | ✅ | US0, D8 |
| Lister les membres | ❌ | ❌ | ✅ | US2b, D9 |
| Ajouter un membre avec un rôle | ❌ | ❌ | ✅ | US2 |
| Changer le rôle d'un **autre** membre | ❌ | ❌ | ✅ | US2b, D9 |
| Retirer un **autre** membre | ❌ | ❌ | ✅ | US2b, D9 |
| Changer son propre rôle / se retirer | ❌ | ❌ | ❌ | US2b, D9 |
| Créer / modifier un plan | ❌ | ❌ | ✅ | US3, US3b, D6 |
| Ajouter / modifier une action | ❌ | ❌ | ✅ | US3, US3b, D6 |
| À faire → En cours → À valider | ❌ | ✅ | ✅ | US4, D2 |
| À valider → Terminé | ❌ | ❌ | ✅ | US5 |
| Refuser : À valider → En cours (motif) | ❌ | ❌ | ✅ | D4 |
| Supprimer une action (suppression logique) | ❌ | ❌ | ✅ | US6, D7 |
| Supprimer un plan | hors périmètre | | | D7 |
| Voir les plans, les actions et leur détail | ✅ | ✅ | ✅ | US7 |
