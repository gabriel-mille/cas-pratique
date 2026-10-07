# Example Mapping

Pour chaque story :
- 🟦 règles
- 🟩 exemples
- ✅ questions tranchées (détail dans `docs/decisions.md`)

Marqueur supplémentaire : **[Décidé → Dn]** = règle issue d'une question tranchée, absente de l'énoncé.

Personnages : Alice (Admin), Bob (Gestionnaire), Carla (Utilisateur), Denis (2ᵉ Admin), organisation « Clinique des Lilas », plan « Audit hygiène 2026 ».

---

## US0 – Se connecter [Implicite]

> En tant que **membre**, je veux **me connecter**, afin que **l'application sache qui je suis et quel est mon rôle**.

- 🟦 R0.1 Toute opération exige d'être connecté, sauf créer un compte et se connecter. [Implicite]
- 🟦 R0.2 Un échec de connexion renvoie un message générique. [Décidé → D13]
- 🟦 R0.3 Un membre avec un mot de passe temporaire doit le changer avant toute autre opération. [Décidé → D8]
- 🟦 R0.4 Un nouveau mot de passe fait au moins 15 caractères, sans règle de composition. [Décidé → D13]
- 🟩 Bob se connecte avec un email et un mot de passe corrects → il accède à son organisation.
- 🟩 Mot de passe incorrect ou email inconnu → même message d'échec.
- 🟩 Carla se connecte avec son mot de passe temporaire → elle doit d'abord le changer.
- 🟩 Carla choisit un mot de passe de 10 caractères → refusé.
- ✅ Q12 → D13

## US1 – Créer un compte [Énoncé]

> En tant que **visiteur**, je veux **créer un compte**, afin de **disposer d'une organisation que j'administre**.

- 🟦 R1.1 La création d'un compte crée une organisation **et** un compte membre. [Énoncé]
- 🟦 R1.2 Ce premier membre a le rôle Administrateur. [Énoncé]
- 🟦 R1.3 L'organisation créée est isolée des autres organisations. [Implicite]
- 🟦 R1.4 Champs : nom de l'organisation, nom, email, mot de passe. [Décidé → D8]
- 🟦 R1.5 L'email est unique dans toute l'application. [Décidé → D8]
- 🟩 Alice crée « Clinique des Lilas » → l'organisation existe et Alice en est administratrice.
- 🟩 Un membre de « Clinique des Lilas » ne voit aucune donnée d'une autre organisation.
- 🟩 Inscription avec l'email d'Alice déjà utilisé → refusé.
- ✅ Q9, Q11 → D8

## US2 – Ajouter un membre [Énoncé]

> En tant qu'**administrateur**, je veux **ajouter un utilisateur à mon organisation et lui donner un rôle**, afin de **le faire participer aux plans d'actions**.

- 🟦 R2.1 Seul un Administrateur peut ajouter un membre. [Énoncé]
- 🟦 R2.2 Le membre est ajouté à l'organisation de l'administrateur, jamais à une autre. [Énoncé]
- 🟦 R2.3 Le rôle attribué est l'un des 3 rôles. [Énoncé]
- 🟦 R2.4 Un mot de passe temporaire est généré et affiché une seule fois à l'admin. [Décidé → D8]
- 🟩 Alice (Admin) ajoute Bob comme Gestionnaire → Bob devient Gestionnaire de la Clinique des Lilas, Alice reçoit son mot de passe temporaire.
- 🟩 Bob (Gestionnaire) tente d'ajouter Carla → refusé.
- 🟩 Alice ajoute un membre avec un email déjà utilisé → refusé.
- ✅ Q9 → D8

## US2b – Gérer les membres [Décidé → D9]

> En tant qu'**administrateur**, je veux **lister les membres, changer leur rôle et en retirer**, afin de **garder des accès à jour**.

- 🟦 R2b.1 Seul un Administrateur liste, modifie ou retire des membres.
- 🟦 R2b.2 Personne ne peut changer son propre rôle ni se retirer lui-même.
- 🟦 R2b.3 Le retrait est logique et tracé ; un membre retiré ne peut plus se connecter.
- 🟩 Alice passe Carla de Utilisateur à Gestionnaire → OK.
- 🟩 Alice passe Denis (Admin) à Gestionnaire → OK.
- 🟩 Alice tente de changer son propre rôle → refusé.
- 🟩 Alice retire Carla → Carla ne peut plus se connecter.
- 🟩 Alice tente de se retirer → refusé.
- ✅ Q10, Q19 → D9

## US3 – Créer un plan d'actions [Énoncé]

> En tant qu'**administrateur**, je veux **créer un plan d'actions contenant des actions**, afin d'**organiser le traitement d'un sujet qualité**.

- 🟦 R3.1 Seul un Administrateur crée un plan. [Énoncé]
- 🟦 R3.2 Un plan contient un ensemble d'actions. [Énoncé]
- 🟦 R3.3 Une action a un titre, une description et un état parmi les 4. [Énoncé]
- 🟦 R3.4 Un plan a un titre obligatoire et une description facultative ; il peut être vide. [Décidé → D6, D11]
- 🟦 R3.5 Une action est créée à l'état À faire ; titre obligatoire, description facultative. [Décidé → D3, D11]
- 🟦 R3.6 Seul un Administrateur ajoute des actions à un plan existant. [Décidé → D6]
- 🟩 Alice crée « Audit hygiène 2026 » puis ajoute l'action « Former au lavage des mains » → l'action est À faire.
- 🟩 Alice crée un plan sans titre → refusé.
- 🟩 Bob (Gestionnaire) tente de créer un plan → refusé.
- ✅ Q4, Q5, Q7, Q18 → D3, D6, D11

## US3b – Modifier un plan ou une action [Décidé → D6]

> En tant qu'**administrateur**, je veux **modifier le titre et la description d'un plan ou d'une action**, afin de **corriger ou préciser leur contenu**.

- 🟦 R3b.1 Seul un Administrateur modifie un plan ou une action.
- 🟦 R3b.2 La modification ne change pas l'état de l'action.
- 🟦 R3b.3 Une modification sur une version périmée est rejetée. [D14]
- 🟩 Alice renomme l'action → OK, l'état reste inchangé.
- 🟩 Bob tente de modifier une action → refusé.

## US4 – Démarrer puis soumettre une action [Énoncé]

> En tant que **gestionnaire**, je veux **passer une action de « à faire » à « en cours » puis à « à valider »**, afin de **rendre compte de l'avancement**.

- 🟦 R4.1 Gestionnaire : À faire → En cours. [Énoncé]
- 🟦 R4.2 Gestionnaire : En cours → À valider. [Énoncé]
- 🟦 R4.3 L'Administrateur peut aussi faire ces transitions. [Décidé → D2]
- 🟦 R4.4 Le Gestionnaire agit sur toutes les actions de son organisation. [Décidé → D10]
- 🟦 R4.5 Pas de saut d'état. [Décidé → D3]
- 🟦 R4.6 Deux changements simultanés : le second, basé sur une version périmée, est rejeté. [Décidé → D14]
- 🟩 Bob passe « Former au lavage des mains » de À faire à En cours → OK, la transition est historisée.
- 🟩 Bob tente de passer directement de À faire à À valider → refusé.
- 🟩 Carla (Utilisateur) tente À faire → En cours → refusé.
- 🟩 Bob et Alice démarrent la même action en même temps → l'un réussit, l'autre reçoit un conflit.
- ✅ Q1, Q13, Q15 → D2, D10, D14

## US5 – Terminer ou refuser une action [Énoncé + Décidé → D4]

> En tant qu'**administrateur**, je veux **passer une action à « terminé » ou refuser sa validation**, afin de **valider qu'elle est réalisée ou de la renvoyer en cours**.

- 🟦 R5.1 Seul un Administrateur passe une action à Terminé. [Énoncé]
- 🟦 R5.2 Uniquement depuis À valider. [Décidé → D3]
- 🟦 R5.3 Refus : À valider → En cours, motif obligatoire, enregistré. [Décidé → D4]
- 🟦 R5.4 Une action Terminée ne change plus d'état. [Décidé → D4]
- 🟩 Alice passe une action de À valider à Terminé → OK.
- 🟩 Alice tente En cours → Terminé → refusé.
- 🟩 Bob (Gestionnaire) tente À valider → Terminé → refusé.
- 🟩 Alice refuse avec le motif « Preuve de formation manquante » → l'action est En cours, le motif est dans l'historique.
- 🟩 Alice refuse sans motif → refusé.
- ✅ Q2, Q3, Q16 → D3, D4, D5

## US6 – Supprimer une action [Énoncé]

> En tant qu'**administrateur**, je veux **supprimer une action**, afin de **retirer une action devenue inutile**.

- 🟦 R6.1 Seul un Administrateur supprime une action. [Énoncé]
- 🟦 R6.2 Suppression logique, quel que soit l'état : l'action disparaît des listes et du détail, mais reste en base avec auteur et date. [Décidé → D7]
- 🟩 Alice supprime une action → elle n'apparaît plus, la suppression est tracée.
- 🟩 Bob tente de supprimer une action → refusé.
- ✅ Q6 → D7

## US7 – Consulter les actions [Énoncé]

> En tant que **membre (tout rôle)**, je veux **voir l'ensemble des actions et le détail d'une action**, afin de **suivre l'avancement**.

- 🟦 R7.1 Tous les rôles voient toutes les actions de leur organisation. [Énoncé]
- 🟦 R7.2 Tous les rôles voient le détail d'une action. [Énoncé]
- 🟦 R7.3 Une action d'une autre organisation est introuvable. [Implicite]
- 🟦 R7.4 Navigation : liste des plans → actions d'un plan → détail. [Décidé → D6]
- 🟩 Carla (Utilisateur) consulte la liste et le détail → OK.
- 🟩 Carla demande une action d'une autre organisation → introuvable.
- ✅ Q8 → D6
