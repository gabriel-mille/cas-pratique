# Questions ouvertes

Points que l'énoncé ne spécifie pas. **Toutes ces questions ont été tranchées le 2026-10-07.** La décision retenue, qui peut différer de la proposition initiale, se trouve dans `docs/decisions.md` (D2 à D14).

La table ci-dessous est conservée comme trace du raisonnement.

| # | Question | Proposition | Raison |
|---|---|---|---|
| Q1 | L'Administrateur peut-il aussi faire les transitions du Gestionnaire ? | Oui (rôles hiérarchiques) | Sinon une organisation sans gestionnaire est bloquée |
| Q2 | Depuis quels états peut-on passer à « Terminé » ? | Uniquement depuis À valider | Respecte le principe « celui qui fait ≠ celui qui valide » |
| Q3 | Retours arrière (refus de validation, réouverture, sauts d'état) ? | Refus par l'admin : À valider → En cours. Ni saut d'état ni réouverture | Le refus de validation est un cas réel ; le reste n'est pas demandé |
| Q4 | État d'une action à sa création ? | Toujours À faire | Sinon on contourne le cycle de vie |
| Q5 | Attributs d'un plan ; qui modifie le titre et la description ? | Plan : titre, plus une description facultative. Modification réservée à l'admin | Non demandé, mais un plan sans titre n'est pas identifiable |
| Q6 | Suppression physique ou logique ? Action terminée ? Plan ? | Suppression physique d'une action, quel que soit son état. Suppression de plan hors périmètre | Simple ; la traçabilité relève de Q16 |
| Q7 | Plan vide autorisé ? Ajout d'actions après la création ? | Oui aux deux | Usage réel : un plan s'enrichit au fil du temps |
| Q8 | « L'ensemble des actions » : tous plans confondus ou par plan ? | Liste des plans, puis actions d'un plan. Liste globale en bonus | À arbitrer selon le temps |
| Q9 | Comment le membre ajouté obtient-il ses identifiants ? L'email est-il unique ? | L'admin saisit l'email et un mot de passe initial. Email unique globalement | Pas d'envoi d'email dans le périmètre |
| Q10 | Modifier un rôle, retirer un membre, protéger le dernier admin ? | Hors périmètre. Si on le fait : interdire de retirer le dernier admin | Invariant important à signaler |
| Q11 | Champs de l'inscription ? | Nom de l'organisation, nom, email, mot de passe | Minimum utile |
| Q12 | Mécanisme d'authentification ? | Mot de passe haché + jeton JWT | Choix technique, à sourcer (doc NestJS) |
| Q13 | Le Gestionnaire agit-il sur toutes les actions ou seulement sur celles qui lui sont assignées ? | Toutes (l'énoncé ne parle pas d'assignation) | L'assignation est une évolution possible |
| Q14 | Un membre peut-il appartenir à plusieurs organisations ? | Non | Simplifie l'isolation |
| Q15 | Deux membres changent l'état de la même action en même temps ? | Verrouillage optimiste (numéro de version) | Montre la conscience du problème ; à sourcer |
| Q16 | Historique des changements d'état (qui, quand) ? | Hors périmètre, à mentionner | Pertinent dans le secteur santé |
| Q17 | « Utilisateur » désigne à la fois un compte et un rôle : quel vocabulaire ? | Compte = « membre » ; rôle = « Utilisateur » | Lever l'ambiguïté dans le code |
| Q18 | Champs obligatoires et longueurs (titre, description) ? | Titre obligatoire, description facultative | À confirmer |
| Q19 | Qui peut lister les membres de l'organisation ? | L'Administrateur | Nécessaire pour gérer les rôles |

## Questions issues du recensement des normes (`docs/compliance.md`)

Tranchées le 2026-10-07 : propositions retenues, voir D15 à D22.

| # | Question | Proposition | Source |
|---|---|---|---|
| Q20 | Niveau de sécurité visé | ASVS **L2**, écarts justifiés par écrit (dont la MFA, prévue mais non implémentée) | ASVS 5.0 « most applications should be striving to achieve this level » ; CNIL 2022-100 §11 |
| Q21 | Déconnexion, retrait d'un membre et changement de rôle avec un JWT | À chaque requête, relire en base l'appartenance (active, rôle) et une date `sessionsValidAfter` ; la déconnexion ou le retrait la met à jour. Jeton à durée de vie courte | ASVS 7.4.1 (L1, cite « disallowing tokens produced before a per-user date and time »), 7.4.2 (L1), 8.3.2 (L3) |
| Q22 | Limiter les tentatives de connexion | `@nestjs/throttler` (module officiel) par IP + email, sans bloquer le compte | ASVS 6.1.1, 6.3.1 (L1) ; ANSSI R10 ; CNIL §43 |
| Q23 | Refuser les mots de passe courants | Appliquer dès la v1 avec une liste publique reconnue (source à vérifier avant de choisir) | ASVS 6.2.4 (L1) ; CNIL §37 ; NIST |
| Q24 | Expiration des mots de passe admin | Non : ni le NIST ni l'ASVS (6.2.10) ne la recommandent ; l'ANSSI (R25) et la CNIL (§54) la permettent pour les comptes à privilèges. Divergence notée | ASVS, NIST, ANSSI, CNIL |
| Q25 | Pilote, échéance, indicateur et efficacité d'une action (attendus HAS) | Non demandés par l'énoncé → 🟨 prévus et documentés, le modèle doit pouvoir les ajouter | Fiche pédagogique HAS 2025 ; critères 2.4-06/07 ; ISO 9001 §6.2.2, §10.2 [S2] |
| Q26 | Données patients saisies dans les descriptions libres (risque HDS) | Avertissement dans le formulaire (« ne saisissez pas de données patients ») ; règle à inscrire dans les conditions d'utilisation (hors test) | Note DSSIS 2019 (« même pour une partie seulement ») |
| Q27 | Journaliser les connexions et les refus d'accès | Oui, dans les logs applicatifs (sans identifiants ni mots de passe) ; stockage séparé hors périmètre | ASVS 16.3.1, 16.3.2 ; CNIL 2021-122 |
