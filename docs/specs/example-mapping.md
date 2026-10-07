# Example Mapping

Pour chaque story :
- 🟦 règles
- 🟩 exemples
- 🟥 questions (détaillées dans `open-questions.md`)

---

## US0 – Se connecter [Implicite]

> En tant que **membre**, je veux **me connecter**, afin que **l'application sache qui je suis et quel est mon rôle**.

- 🟦 R0.1 Toute opération exige d'être connecté, sauf créer un compte et se connecter. [Implicite]
- 🟩 Bob se connecte avec un email et un mot de passe corrects → il accède à son organisation.
- 🟩 Mot de passe incorrect → refus, sans indiquer si l'email existe.
- 🟥 Q12 Mécanisme d'authentification

## US1 – Créer un compte [Énoncé]

> En tant que **visiteur**, je veux **créer un compte**, afin de **disposer d'une organisation que j'administre**.

- 🟦 R1.1 La création d'un compte crée une organisation **et** un compte membre. [Énoncé]
- 🟦 R1.2 Ce premier membre a le rôle Administrateur. [Énoncé]
- 🟦 R1.3 L'organisation créée est isolée des autres organisations. [Implicite]
- 🟩 Alice crée « Clinique des Lilas » → l'organisation existe et Alice en est administratrice.
- 🟩 Un membre de « Clinique des Lilas » ne voit aucune donnée d'une autre organisation.
- 🟥 Q11 Informations demandées · Q9 Unicité de l'email

## US2 – Ajouter un membre [Énoncé]

> En tant qu'**administrateur**, je veux **ajouter un utilisateur à mon organisation et lui donner un rôle**, afin de **le faire participer aux plans d'actions**.

- 🟦 R2.1 Seul un Administrateur peut ajouter un membre. [Énoncé]
- 🟦 R2.2 Le membre est ajouté à l'organisation de l'administrateur, jamais à une autre. [Énoncé]
- 🟦 R2.3 Le rôle attribué est l'un des 3 rôles. [Énoncé]
- 🟩 Alice (Admin) ajoute Bob comme Gestionnaire → Bob devient Gestionnaire de la Clinique des Lilas.
- 🟩 Bob (Gestionnaire) tente d'ajouter Carla → refusé.
- 🟥 Q9 Identifiants du nouveau membre · Q10 Modifier un rôle, retirer un membre, cas du dernier admin · Q19 Lister les membres

## US3 – Créer un plan d'actions [Énoncé]

> En tant qu'**administrateur**, je veux **créer un plan d'actions contenant des actions**, afin d'**organiser le traitement d'un sujet qualité**.

- 🟦 R3.1 Seul un Administrateur crée un plan. [Énoncé]
- 🟦 R3.2 Un plan contient un ensemble d'actions. [Énoncé]
- 🟦 R3.3 Une action a un titre, une description et un état parmi les 4. [Énoncé]
- 🟩 Alice crée « Audit hygiène 2026 » avec l'action « Former au lavage des mains ».
- 🟩 Bob (Gestionnaire) tente de créer un plan → refusé.
- 🟥 Q5 Attributs du plan · Q4 État initial d'une action · Q7 Ajout d'actions après création, plan vide · Q18 Champs obligatoires

## US4 – Démarrer puis soumettre une action [Énoncé]

> En tant que **gestionnaire**, je veux **passer une action de « à faire » à « en cours » puis à « à valider »**, afin de **rendre compte de l'avancement**.

- 🟦 R4.1 Gestionnaire : À faire → En cours. [Énoncé]
- 🟦 R4.2 Gestionnaire : En cours → À valider. [Énoncé]
- 🟩 Bob passe « Former au lavage des mains » de À faire à En cours → OK.
- 🟩 Bob tente de passer directement de À faire à À valider → ? (Q3, voir la table de transitions)
- 🟩 Carla (Utilisateur) tente À faire → En cours → refusé.
- 🟥 Q1 L'admin peut-il faire ces transitions ? · Q13 Sur toutes les actions ou seulement certaines ? · Q15 Modifications simultanées

## US5 – Terminer une action [Énoncé]

> En tant qu'**administrateur**, je veux **passer une action à « terminé »**, afin de **valider qu'elle est réalisée**.

- 🟦 R5.1 Seul un Administrateur passe une action à Terminé. [Énoncé]
- 🟩 Alice passe une action de À valider à Terminé → OK.
- 🟩 Bob (Gestionnaire) tente À valider → Terminé → refusé.
- 🟥 Q2 Depuis quel(s) état(s) ? · Q3 Refus de validation, retour arrière · Q16 Historique

## US6 – Supprimer une action [Énoncé]

> En tant qu'**administrateur**, je veux **supprimer une action**, afin de **retirer une action devenue inutile**.

- 🟦 R6.1 Seul un Administrateur supprime une action. [Énoncé]
- 🟩 Alice supprime une action → elle n'apparaît plus.
- 🟩 Bob tente de supprimer une action → refusé.
- 🟥 Q6 Suppression physique ou logique, action terminée, suppression d'un plan

## US7 – Consulter les actions [Énoncé]

> En tant que **membre (tout rôle)**, je veux **voir l'ensemble des actions et le détail d'une action**, afin de **suivre l'avancement**.

- 🟦 R7.1 Tous les rôles voient toutes les actions de leur organisation. [Énoncé]
- 🟦 R7.2 Tous les rôles voient le détail d'une action. [Énoncé]
- 🟦 R7.3 Une action d'une autre organisation est introuvable. [Implicite]
- 🟩 Carla (Utilisateur) consulte la liste et le détail → OK.
- 🟩 Carla demande une action d'une autre organisation → introuvable.
- 🟥 Q8 Liste globale ou par plan ? · Q5 Modification du titre et de la description
