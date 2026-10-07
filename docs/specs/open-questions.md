# Questions ouvertes

Points que l'énoncé ne spécifie pas. Chaque proposition est **une suggestion à valider**, pas une décision.

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
