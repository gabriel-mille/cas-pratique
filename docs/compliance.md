# Normes et référentiels applicables

Règle de travail n°3 (`AGENTS.md`) : recenser les normes du domaine, les suivre et le vérifier. Ce qui n'est pas demandé par l'énoncé est au minimum noté et prévu.

Recherche faite le 2026-10-07.

**Statuts** :
- ✅ **appliqué** : implémenté et vérifié dans ce test ;
- 🟨 **prévu** : noté, la conception ne le bloque pas, mais il n'est pas implémenté ;
- ⬜ **hors périmètre** : ne concerne pas ce test ou ne relève pas de l'éditeur ;
- ❓ **à décider** : voir `docs/specs/open-questions.md`.

**Fiabilité des sources** :
- **[S]** texte primaire lu ;
- **[S2]** source secondaire seulement (norme payante ou site inaccessible) ;
- **[D]** déduction du projet, non tranchée par une source.

Les URLs sont dans `docs/references.md`.

---

## 1. Sécurité applicative

### OWASP ASVS 5.0.0 (mai 2025) [S]
- L'ASVS ne fixe pas de niveau obligatoire : « an organization should analyze its risks ». Pour le niveau L2, elle précise : « most applications should be striving to achieve this level ».
- Cible proposée : **L2**, les écarts étant justifiés par écrit (❓ Q20).

| Exigence | Niveau | Statut | Mise en œuvre / remarque |
|---|---|---|---|
| 8.3.1 Contrôle d'accès côté serveur, refus par défaut | L1 | ✅ | Guards NestJS, règles dans le domaine (D2, D9) |
| 8.2.1 Accès par fonction | L1 | ✅ | Matrice `permissions.md` |
| 8.2.2 Accès par donnée (IDOR/BOLA) | L1 | ✅ | Toute requête est filtrée par l'organisation du membre connecté ; un id d'une autre organisation renvoie 404 |
| 8.4.1 Contrôles inter-organisations (cross-tenant) | L2 | ✅ | Idem ; tests dédiés |
| 8.3.2 Changement de droits appliqué immédiatement | L3 | ✅ | Le rôle est relu en base à chaque requête (Q21) |
| 2.2.1, 2.2.2 Validation par liste autorisée, côté serveur | L1 | ✅ | DTO + `ValidationPipe` (`whitelist`) puis invariants du domaine |
| 2.3.1 Respect de l'ordre des étapes | L1 | ✅ | Machine à états (`state-transitions.md`) |
| 2.3.3 Transactions | L2 | ✅ | Changement d'état et historique écrits dans la même transaction |
| 6.2.1 Mot de passe ≥ 8 caractères, 15 « strongly recommended » | L1 | ✅ | 15 (D13) |
| 6.2.5 Aucune règle de composition | L1 | ✅ | D13 |
| 6.2.9 Au moins 64 caractères acceptés | L2 | ✅ | D13 |
| 6.2.10 Pas de rotation périodique | L2 | ✅ | D13 ; divergence ANSSI/CNIL pour les admins : ❓ Q24 |
| 6.2.4 Refuser les mots de passe les plus courants | **L1** | ❓ Q23 | D13 le classait « amélioration future », mais c'est une exigence L1 |
| 6.2.12 Vérifier contre les mots de passe ayant fuité | L2 | 🟨 | Service externe nécessaire |
| 6.1.1, 6.3.1 Anti brute force, sans blocage malveillant | **L1** | ❓ Q22 | Proposition : `@nestjs/throttler` (module officiel) |
| 6.3.2 Pas de compte par défaut | L1 | ✅ | Le premier admin est créé à l'inscription |
| 6.3.3 Authentification multifacteur | L2 | 🟨 | Écart justifié par écrit (❓ Q20) |
| 6.3.8 Ne pas révéler si un compte existe | L3 | ✅ | Message générique (D13). L'inscription révèle qu'un email est pris : écart connu |
| 11.4.2 Hachage lent | – | ✅ | scrypt (D13) |
| 7.2.1, 7.2.4 Jeton vérifié côté serveur, nouveau jeton à chaque connexion | L1 | ✅ | `@nestjs/jwt` |
| 7.4.1 La déconnexion invalide le jeton | **L1** | ❓ Q21 | Un JWT reste valide jusqu'à expiration |
| 7.4.2 Couper les sessions d'un compte désactivé | **L1** | ❓ Q21 | Membre retiré (D9) |
| 7.3.1, 7.3.2 Expiration après inactivité et durée maximale | L2 | ✅ | Durée de vie courte du jeton |
| 7.4.5 Un admin termine les sessions d'un membre | L2 | 🟨 | Couvert si Q21 est retenue |
| 3.3.1–3.3.4 Cookie `__Host-`, Secure, HttpOnly, SameSite | L1-L2 | ✅ | D13 |
| 3.4.1–3.4.6 HSTS, CSP, nosniff, Referrer-Policy, frame-ancestors | L1-L2 | ✅ | `helmet` (recommandé par la doc NestJS) |
| 3.4.2 CORS : origine fixe | L1 | ✅ | Origine du frontend uniquement |
| 3.5.1–3.5.3 Anti-CSRF, pas de GET qui modifie | L1 | ✅ | SameSite + JSON (préflight CORS) ; GET en lecture seule |
| 16.2.1, 16.3.1, 16.3.2 Journaliser les authentifications et les refus d'accès | L2 | ❓ Q27 | |
| 16.2.5 Pas d'identifiants dans les logs | L2 | ✅ | |
| 16.4.2 Logs non modifiables | L2 | ⬜ | Relève de l'infrastructure d'hébergement |
| 16.5.1 Erreur générique, sans stack trace | L2 | ✅ | Filtre d'exceptions NestJS |
| 13.4.2 Pas de debug en production | L2 | 🟨 | `synchronize: true` aussi à retirer en production (migrations) |

### OWASP Top 10 2025 [S]
Il sert de liste de contrôle en relecture. Les points les plus exposés ici sont :
- A01 Broken Access Control : ASVS V8 ci-dessus ;
- A07 Authentication Failures : V6, V7 ;
- A03 Software Supply Chain Failures : `npm audit`, dépendances maintenues (règle n°2) ;
- A10 Mishandling of Exceptional Conditions : 16.5.3, pas d'« ouverture en cas d'échec ».

### ANSSI [S]
**Guide « Authentification multifacteur et mots de passe » (2021)**
- R10 (limiter les tentatives) et R14 (ne rien dire de l'échec) : voir Q22 et D13.
- R1 (MFA) : 🟨.
- R25 (expiration imposée pour les comptes à privilèges) : ❓ Q24.

**Guide « Sécurité côté navigateur » (v2.0, 2021)**
- R30 à R33 (cookies HttpOnly, Secure, SameSite) : ✅.
- R2 (HSTS) et R13 à R16 (CSP) : ✅ via `helmet`.

### ISO/IEC 27001:2022 et 27002:2022 [S2]
- Norme payante, non lue. Seuls les intitulés des contrôles sont connus.
- Concerne surtout l'organisation de l'éditeur : ⬜ pour ce test.
- Côté code, plusieurs contrôles sont couverts par nos pratiques ✅ :
  - 8.25 à 8.29 (cycle de développement sécurisé, exigences de sécurité, codage sécurisé, tests de sécurité) : TDD, revue, ASVS ;
  - 8.31 (séparation des environnements) : `.env` ;
  - 8.32 (gestion des changements) : Git, PR.

## 2. Données personnelles et données de santé

### RGPD [S]
| Exigence | Statut | Mise en œuvre / remarque |
|---|---|---|
| Art. 5.1.c, art. 25 : minimisation, protection dès la conception | ✅ | Compte : nom et email seulement. Les données sont cloisonnées par organisation |
| Art. 5.1.e : conservation limitée | 🟨 | Suppression logique (D7). La politique de purge est à définir avec les clients : aucune durée sectorielle trouvée |
| Art. 5.1.f, art. 32 : sécurité | ✅ | Section 1 |
| Art. 17 : effacement / art. 20 : portabilité | 🟨 | Anonymiser un compte retiré ; export JSON ou CSV. Textes non cités mot pour mot |
| Art. 28.3.g : restituer ou supprimer les données en fin de contrat | 🟨 | Export et purge d'une organisation entière, possibles car tout est rattaché à `organizationId` |
| Art. 30.2 : registre du sous-traitant | ⬜ | Documentaire, côté éditeur |
| Art. 33 : notifier une violation | ⬜ | Procédure organisationnelle |

### CNIL [S]
**Délibération 2022-100 sur les mots de passe**
- Dans le cas « mot de passe seul », la CNIL demande une entropie d'au moins 80 bits, par exemple 14 caractères sans caractère spécial obligatoire. Nos 15 caractères sans composition y répondent ✅.
- Autres exigences déjà respectées ✅ :
  - taille maximale d'au moins 50 caractères (nous en acceptons 64) ;
  - copier-coller non bloqué ;
  - sel aléatoire d'au moins 128 bits ;
  - message d'échec non informatif.
- §37, refuser les mots de passe courants : ❓ Q23.
- §11 : pour des données de santé, des mesures plus fortes comme la MFA sont nécessaires : 🟨.
- §54 : le renouvellement est possible pour les comptes à privilèges : ❓ Q24.

**Délibération 2021-122 sur la journalisation**
- Tracer la création, la consultation, la modification et la suppression, avec l'auteur, la date et la donnée concernée.
- Historique des transitions et des suppressions (D5) : ✅.
- Journal des accès en consultation : 🟨.
- Stockage séparé et durée de conservation de 6 mois à 1 an : ⬜, relève de l'infrastructure.

### Hébergement de données de santé (HDS, CSP art. L.1111-8)
Source : note du ministère de la Santé de 2019, lue [S]. Le texte sur Légifrance n'a pas été lu.
- Le régime HDS ne s'applique que si deux conditions sont réunies :
  1. les données sont recueillies lors d'activités de prévention, de diagnostic ou de soins ;
  2. elles sont hébergées pour le compte du patient ou du professionnel qui les a produites.
- Une application qualité n'est a priori pas concernée [D].
- **Risque** : des données patients saisies dans les descriptions libres, alors que la note précise que le régime s'applique « même pour une partie seulement » : ❓ Q26.

### ANS : PGSSI-S et référentiel d'identification électronique
- Leur champ d'application à un logiciel non clinique **n'a pas pu être vérifié** (site inaccessible aux outils).
- ⬜ en l'état, à vérifier manuellement.

### NIS2 (directive 2022/2555) [S]
- Les établissements de santé sont concernés.
- Qualineo l'est indirectement, en tant que fournisseur (art. 21, sécurité de la chaîne d'approvisionnement).
- La transposition française n'est pas encore en vigueur (presse, 2026-09).
- ⬜ pour ce test.

## 3. Qualité – domaine métier

### HAS : référentiel de certification des établissements de santé, version 2025 [S]
- Critère 3.1-01 : le programme d'actions (PAQSS) doit être « structuré, pertinent, actualisé, unique et évalué chaque année ».
- La fiche pédagogique HAS (2025) précise qu'il indique, pour chaque action :
  - « un pilotage (personne, instance…) » ;
  - « un calendrier » ;
  - « des indicateurs de suivi et une cible » ;
  - « un état d'avancement actualisé ».
- Les critères 2.4-06 et 2.4-07 demandent de mesurer l'efficacité des actions.
- Les critères 3.1-04, 1.4-06, 2.2-06, 3.1-07 et 3.4-01 relient les actions à leur origine : événement indésirable, audit, contrôle externe.

| Attendu HAS | Statut | Remarque |
|---|---|---|
| État d'avancement actualisé | ✅ | Cycle des 4 états, historique |
| Plan structuré, unique | ✅ | Plan → actions |
| Pilote par action | ❓ Q25 | L'assignation avait été reportée (D10) |
| Calendrier / échéance | ❓ Q25 | |
| Indicateur de suivi + cible, évaluation de l'efficacité | ❓ Q25 | « Terminé » ne dit pas si l'action a été efficace |
| Origine de l'action (EI, audit, indicateur…) | 🟨 | [D] |
| Bilan annuel | 🟨 | Dates de création et de fin déjà disponibles |

Aucune source ne fixe de liste d'états : la HAS demande seulement un « état d'avancement actualisé ».

### HAS : référentiel d'évaluation des ESSMS (2022) [S]
- Le médico-social a les mêmes attentes de plan d'actions correctives.
- Pas d'impact supplémentaire sur le modèle.

### ISO 9001:2015 [S2]
- Norme payante, non lue.
- §6.2.2 (qui, quoi, quand, comment évaluer) et §10.2.1.d (revoir l'efficacité) : rejoignent la HAS, voir Q25.
- §10.2.2 et §7.5.3 (conserver les preuves, les protéger contre l'altération) : ✅ avec l'historique et la suppression logique.

### ISO 7101:2023 (management de la qualité en santé) [S2]
- Seuls le titre et le domaine d'application ont été vérifiés.
- Contenu non lu : ⬜.

### Statut de dispositif médical : règlement UE 2017/745, guide MDCG 2019-11 rev.1 [S]
- Un logiciel n'est un dispositif médical que s'il agit « for the benefit of individual patients ».
- Il ne l'est pas s'il se limite au stockage, à la communication ou au suivi administratif.
- Qualineo plans d'actions n'est donc **pas un dispositif médical** [D, selon la finalité déclarée par l'éditeur] : ⬜.

## 4. Accessibilité

### Obligations [S]
- **RGAA 4.1.2** :
  - Il s'impose aux organismes publics et aux entreprises dont le chiffre d'affaires dépasse 250 M€ (loi 2005-102 art. 47, décret 2019-768).
  - Il couvre les progiciels utilisés via un navigateur.
  - Les hôpitaux publics doivent prendre en compte l'accessibilité dans leurs achats (Code de la commande publique, R2111-6).
  - L'accessibilité est donc un enjeu commercial direct [D].
- **European Accessibility Act** : il vise les services aux consommateurs. Un SaaS B2B n'est probablement pas concerné [D], mais la transposition française n'a pas été lue.

### Cible : WCAG 2.2 niveau AA [S]
- Cette cible couvre le RGAA 4.1.2 (basé sur WCAG 2.1).
- Elle anticipe l'EN 301 549 V4.1.1, dont l'application est attendue fin 2026.

| Critère | Statut | Mise en œuvre |
|---|---|---|
| 1.3.1, 3.3.2 Libellés de formulaire, structure des tableaux | ✅ | `<label>`, `<table>` sémantique |
| 3.3.1, 3.3.3 Erreurs identifiées en texte, suggestion | ✅ | Messages par champ |
| 2.1.1, 2.4.3, 2.4.7, 2.4.11 Clavier, ordre du focus, focus visible | ✅ | Éléments natifs (`button`, `a`) |
| 4.1.2 Nom, rôle, valeur | ✅ | Éléments natifs ; tests via `getByRole` |
| 4.1.3 Messages de statut | ✅ | `role="status"` lors d'un changement d'état |
| 1.4.3, 1.4.11 Contrastes | ✅ | Vérifiés sur la palette |
| 2.5.8 Taille des cibles ≥ 24 px | ✅ | CSS |
| Audit RGAA complet, déclaration d'accessibilité | ⬜ | Hors test |

### Outils retenus (règle n°2) [S]
- `eslint-plugin-jsx-a11y` : analyse statique.
- Testing Library `getByRole` : requête prioritaire, qui interroge l'arbre d'accessibilité.
- `axe-core` : détecte environ 57 % des problèmes selon Deque. Son intégration aux tests reste à vérifier.
- `@axe-core/react` est écarté : il ne prend pas en charge React 18 et versions suivantes.

---

## Questions ouvertes issues de ce recensement
Voir `docs/specs/open-questions.md`, questions Q20 à Q27.
