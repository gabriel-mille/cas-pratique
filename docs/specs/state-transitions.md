# Cycle de vie d'une action

Technique : table de transitions d'états (ISTQB CTFL v4.0.1 §4.2.4).
- Les lignes sont l'état courant, les colonnes l'état cible.
- Chaque case indique **qui** peut faire la transition.
- Une case « ? » est une transition que l'énoncé ne spécifie pas : elle peut être invalide, ou avoir été oubliée.

```
À faire ──(Gestionnaire)──▶ En cours ──(Gestionnaire)──▶ À valider ──(Administrateur)──▶ Terminé
```

| Depuis \ Vers | À faire | En cours | À valider | Terminé |
|---|---|---|---|---|
| **À faire** | – | Gestionnaire [Énoncé] · Admin ? (Q1) | ? (Q3) | Admin ? (Q2) |
| **En cours** | ? (Q3) | – | Gestionnaire [Énoncé] · Admin ? (Q1) | Admin ? (Q2) |
| **À valider** | ? (Q3) | ? refus de validation (Q3) | – | Administrateur [Énoncé] |
| **Terminé** | ? réouverture (Q3) | ? (Q3) | ? (Q3) | – |

- Rôle Utilisateur : aucune transition, l'énoncé ne lui en donne aucune.
- État initial à la création : voir Q4.
- Couverture de tests visée (ISTQB « all transitions ») : chaque transition valide **et** chaque tentative de transition invalide a son test.
