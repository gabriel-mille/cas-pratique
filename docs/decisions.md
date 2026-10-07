# Décisions

Points ambigus de l'énoncé et choix d'architecture. Chaque décision suit le format : contexte → décision → raison ou source.
Les numéros `Qn` renvoient à `docs/specs/open-questions.md`. Les URLs des sources sont dans `docs/references.md`.

## D1 – Fichiers d'instructions IA
- Contexte : l'énoncé demande de fournir les prompts et les fichiers d'instructions IA.
- Décision : `AGENTS.md` (format ouvert) est la source unique, importée par `CLAUDE.md` via `@AGENTS.md`. Chaque app a son propre `AGENTS.md` (backend DDD, frontend FSD).
- Alternative écartée : un symlink `CLAUDE.md → AGENTS.md`, déconseillé sous Windows par la doc Claude Code.

## Règles métier

### D2 – Rôles hiérarchiques (Q1)
- L'Administrateur a tous les droits du Gestionnaire, y compris les transitions À faire → En cours → À valider.
- Raison : sinon, une organisation sans gestionnaire serait bloquée.
- Limite : l'énoncé ne le dit pas. C'est une hypothèse à confirmer avec le métier.

### D3 – Cycle de vie strict (Q2, Q4)
- Une action est toujours créée à l'état À faire.
- Elle ne passe à Terminé que depuis À valider.
- Les sauts d'état sont interdits.
- Raison : l'énoncé définit un cycle ; s'il avait voulu un autre point d'entrée, il l'aurait décrit.

### D4 – Refus de validation tracé (Q3)
- Un Administrateur peut refuser une action À valider : elle repasse à En cours.
- Un **motif est obligatoire**, et le refus est enregistré : qui, quand, motif.
- Une action Terminée ne peut pas être rouverte.
- Raison : « à valider » implique qu'une validation peut être refusée. Sans trace, le refus serait invisible.

### D5 – Historique des changements dès la v1 (Q16)
- Chaque transition d'état est enregistrée : action, état de départ, état d'arrivée, auteur, date, commentaire (obligatoire pour un refus).
- Les suppressions sont aussi enregistrées.
- Dans le domaine, chaque transition produit un événement nommé au passé (domain event, MS Learn).
- Hors v1 : l'écran d'historique et l'audit des modifications de titre et de description.
- Raison : la traçabilité est attendue en certification HAS (critère 3.7-03 : suivi des actions). Le modèle est pensé pour l'étendre.

### D6 – Plan d'actions (Q5, Q7, Q8)
- Un plan a un titre (obligatoire) et une description (facultative). Il n'a pas d'état.
- Le modèle doit pouvoir accepter d'autres attributs plus tard.
- L'Administrateur crée et modifie les plans et les actions (titre, description).
- Un plan peut être vide, et on peut lui ajouter des actions après sa création.
- Consultation : liste des plans, puis actions d'un plan, puis détail d'une action.
- La liste globale de toutes les actions n'est pas en v1, mais ne doit pas être bloquée par le modèle.

### D7 – Suppression logique (Q6)
- Une action supprimée reçoit `deletedAt` et `deletedBy`. Elle disparaît des listes mais reste en base, et la suppression est tracée (D5).
- La suppression de plan est hors périmètre (non demandée).
- Raisons :
  - traçabilité attendue par la HAS ;
  - maîtrise de la conservation (ISO 9001 §7.5.3, lu en sources secondaires) ;
  - MS Learn présente le soft delete comme moyen de préserver une piste d'audit.
- Limite RGPD (art. 5.1.e, CNIL) : la conservation ne peut pas être indéfinie. La politique de purge et d'archivage est hors périmètre, mais documentée.
- Piège connu : filtrer les éléments supprimés partout, de manière centralisée dans le repository.

### D8 – Ajout de membre et identifiants (Q9, Q11)
- Inscription : nom de l'organisation, nom, email, mot de passe.
- Ajout d'un membre par un admin :
  - l'admin saisit l'email, le nom et le rôle ;
  - le système génère un mot de passe temporaire aléatoire (générateur cryptographique), affiché **une seule fois** à l'admin, qui le transmet lui-même ;
  - le membre doit changer ce mot de passe à sa première connexion.
- L'email est unique sur toute l'application.
- Pas d'envoi d'email en v1 (amélioration future).
- Limite : aucune source NIST ou OWASP n'impose explicitement le changement forcé à la première connexion. C'est une bonne pratique par analogie avec les jetons de réinitialisation (usage unique).

### D9 – Gestion des membres et des admins (Q10, Q19)
- L'Administrateur liste les membres, change leur rôle et retire un membre (retrait logique, tracé).
- Plusieurs admins sont possibles, puisque l'énoncé permet de donner n'importe quel rôle.
- Tous les admins sont égaux.
- **Un membre ne peut ni changer son propre rôle ni se retirer lui-même** (règle de GitHub et Atlassian).
- Conséquence : il reste toujours au moins un admin. Un admin ne peut être rétrogradé que par un autre admin, qui lui reste en place.
- Pas de super-admin en v1. Ce serait un rôle supplémentaire, comme le Primary Owner de Slack (amélioration future).
- Le risque qu'un admin en retire un autre est atténué par l'historique.

### D10 – Périmètre des gestionnaires et des organisations (Q13, Q14)
- Le Gestionnaire agit sur toutes les actions de son organisation. L'assignation est une amélioration future.
- Un compte appartient à une seule organisation en v1. Le modèle `Membership` (D12) permettra le multi-organisation plus tard.

### D11 – Champs obligatoires (Q18)
- Titre obligatoire et non vide, description facultative, pour les plans comme pour les actions.
- Les longueurs maximales seront fixées à l'implémentation et documentées.

### D12 – Vocabulaire (Q17)
- Code :
  - `User` = le compte (la personne) ;
  - `Membership` = son appartenance à une organisation, qui porte le rôle ;
  - rôles `ADMIN`, `MANAGER`, `MEMBER`.
- Interface : Administrateur, Gestionnaire, **Utilisateur** (terme de l'énoncé).
- Sources :
  - NIST RBAC (« user » = la personne) ;
  - GitHub, Slack et Auth0 (« member » = rôle de base, rôle porté par l'appartenance) ;
  - Fowler (lever les ambiguïtés du langage ubiquitaire).

## Choix techniques

### D13 – Authentification (Q12)
- `@nestjs/jwt`, avec le jeton dans un cookie `HttpOnly; Secure; SameSite`. Jamais dans `localStorage` (OWASP Session Management et HTML5).
- Hachage avec scrypt de `node:crypto` (défaut de la doc NestJS, conforme à l'ordre de préférence OWASP).
- Mots de passe (NIST SP 800-63B rev 4) :
  - 15 caractères minimum ;
  - au moins 64 acceptés ;
  - aucune règle de composition ;
  - pas d'expiration périodique.
- Refus des mots de passe courants dès la v1 : voir D18.
- Échec de connexion : message générique, sans révéler si l'email existe (OWASP Authentication).
- Alternative écartée : le nouveau paquet officiel `@nestjs/authentication`, encore en version 0.0.1 (registre npm, 2026-10).

### D14 – Concurrence : verrou optimiste (Q15)
- Les actions portent une `version`.
- La mise à jour est conditionnelle : `UPDATE … WHERE id = ? AND version = ?`, et 0 ligne modifiée signifie un conflit.
- Côté HTTP :
  - `ETag` renvoyé sur le GET ;
  - `If-Match` exigé sur les modifications ;
  - réponse **412** si la version ne correspond pas, **428** si l'en-tête manque.
- Sources :
  - Fowler PoEAA (verrou optimiste quand les conflits sont rares) ;
  - Vernon (version des agrégats) ;
  - RFC 9110 (« lost update ») et RFC 6585 (428) ;
  - doc PostgreSQL (réévaluation du WHERE en Read Committed).
- Piège vérifié dans TypeORM 0.3.28 (code installé) : `@VersionColumn` incrémente la version, mais `save()` ne la vérifie pas. D'où l'update conditionnel écrit à la main.

## Normes (`docs/compliance.md`, questions Q20 à Q27)

### D15 – Niveau de sécurité : OWASP ASVS 5.0 niveau L2 (Q20)
- L'ASVS recommande ce niveau pour la plupart des applications (« most applications should be striving to achieve this level »). Le niveau L1 serait insuffisant pour des données d'établissements de santé.
- Écart assumé : la MFA (ASVS 6.3.3) n'est pas implémentée dans ce test. Elle est prévue.
- Mesures compensatoires, conformément à l'exigence de l'ASVS d'un « plan on how the risks around authentication will be mitigated » :
  - mots de passe d'au moins 15 caractères ;
  - liste de mots de passe interdits (D18) ;
  - limitation des tentatives de connexion (D17) ;
  - sessions courtes et révocables (D16).

### D16 – Révocation des sessions JWT (Q21)
- Jeton à courte durée de vie.
- À chaque requête, le serveur relit en base l'appartenance (active ou non, rôle) et une date `sessionsValidAfter`. Les jetons émis avant cette date sont refusés.
- La déconnexion, le retrait d'un membre et le changement de rôle mettent cette date à jour.
- Sources :
  - ASVS 7.4.1 (L1), qui cite « disallowing tokens produced before a per-user date and time » ;
  - ASVS 7.4.2 (L1) ;
  - ASVS 8.3.2 (L3).
- Coût : une lecture en base par requête.

### D17 – Limitation des tentatives de connexion (Q22)
- `@nestjs/throttler` (module officiel NestJS), par IP et par email.
- Pas de blocage du compte, pour éviter qu'un tiers bloque un compte volontairement (ASVS 6.3.1).
- Sources : ASVS 6.1.1 et 6.3.1 (L1), ANSSI R10, CNIL 2022-100 §43.

### D18 – Refus des mots de passe courants (Q23)
- Appliqué dès la v1, avec une liste publique reconnue. La source de la liste sera vérifiée avant de la choisir (règle n°2).
- Sources : ASVS 6.2.4 (L1), CNIL §37, NIST 800-63B.

### D19 – Pas d'expiration périodique des mots de passe (Q24)
- Y compris pour les admins.
- Sources : NIST 800-63B et ASVS 6.2.10.
- Divergence notée : l'ANSSI (R25) et la CNIL (§54) permettent l'expiration pour les comptes à privilèges. À revoir si un client l'exige.

### D20 – Champs HAS d'une action : prévus, non implémentés (Q25)
- Champs concernés : pilote, échéance, indicateur et cible, évaluation de l'efficacité, origine de l'action.
- Ils sont attendus par la HAS (fiche pédagogique 2025, critères 2.4-06 et 2.4-07) et par l'ISO 9001 (§6.2.2, §10.2, sources secondaires). L'énoncé ne les demande pas.
- Le modèle `Action` doit pouvoir les accueillir sans refonte.

### D21 – Données patients dans les textes libres (Q26)
- Le formulaire d'action affiche un avertissement : ne pas saisir de données patients.
- Raison : la note DSSIS de 2019 dit que le régime HDS s'applique dès qu'une fonctionnalité porte sur des données de santé, « même pour une partie seulement ».
- La règle sera aussi à inscrire dans les conditions d'utilisation (hors test).

### D22 – Journalisation de sécurité (Q27)
- Journaliser les connexions (réussies et échouées) et les refus d'accès : qui, quoi, quand.
- Ne jamais journaliser de mot de passe ni d'identifiant non reconnu.
- Sources : ASVS 16.3.1 et 16.3.2, CNIL 2021-122, CNIL 2022-100 §64.
- Le stockage séparé et non modifiable des logs relève de l'infrastructure, hors périmètre.
