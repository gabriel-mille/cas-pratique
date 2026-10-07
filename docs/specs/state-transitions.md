# Cycle de vie d'une action

Technique utilisée : table de transitions d'états (ISTQB CTFL v4.0.1 §4.2.4).
- Les lignes sont l'état courant, les colonnes l'état cible.
- Chaque case dit qui peut faire la transition.
- Une case **interdit** est une transition invalide, qui doit être refusée et testée.

Décisions appliquées : D2, D3, D4 (`docs/decisions.md`).

```
            (Gestionnaire, Admin)        (Gestionnaire, Admin)         (Admin)
À faire ──────────────────────▶ En cours ──────────────────────▶ À valider ─────────▶ Terminé
                                    ▲                                  │
                                    └──── refus, motif obligatoire ────┘
                                                (Admin)
```

| Depuis \ Vers | À faire | En cours | À valider | Terminé |
|---|---|---|---|---|
| **À faire** | – | Gestionnaire, Admin | interdit | interdit |
| **En cours** | interdit | – | Gestionnaire, Admin | interdit |
| **À valider** | interdit | Admin (refus + motif) | – | Admin |
| **Terminé** | interdit | interdit | interdit | – |

Règles complémentaires :
- Le rôle Utilisateur (`MEMBER`) ne peut faire aucune transition.
- À la création, une action est toujours à l'état **À faire**.
- Une action Terminée est définitive.
- Chaque transition réussie est enregistrée dans l'historique : de, vers, auteur, date, commentaire (D5).
- Une transition sur une version périmée est rejetée (D14).
- Couverture de tests visée (ISTQB « all transitions ») : les 4 transitions valides, et une tentative pour chaque case interdite et pour chaque rôle non autorisé.
