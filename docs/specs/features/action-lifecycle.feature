# language: fr
# Sources : state-transitions.md, décisions D2, D3, D4, D5, D14
Fonctionnalité: Cycle de vie d'une action
  Une action passe de À faire à En cours, puis À valider, puis Terminé.
  L'Administrateur peut refuser une validation, avec un motif.

  Contexte:
    Soit l'organisation "Clinique des Lilas"
    Et les membres suivants :
      | nom   | rôle         |
      | Alice | Admin        |
      | Bob   | Gestionnaire |
      | Carla | Utilisateur  |
    Et le plan "Audit hygiène 2026" contenant l'action "Former au lavage des mains"

  Règle: Le Gestionnaire et l'Administrateur démarrent et soumettent une action

    Plan du Scénario: Transition autorisée
      Soit l'action est "<depuis>"
      Quand <membre> passe l'action à "<vers>"
      Alors l'action est "<vers>"
      Et l'historique contient "<depuis>" → "<vers>" par <membre>

      Exemples:
        | membre | depuis   | vers      |
        | Bob    | À faire  | En cours  |
        | Bob    | En cours | À valider |
        | Alice  | À faire  | En cours  |
        | Alice  | En cours | À valider |

  Règle: Seul l'Administrateur termine une action, et uniquement depuis À valider

    Exemple: Alice termine une action à valider
      Soit l'action est "À valider"
      Quand Alice passe l'action à "Terminé"
      Alors l'action est "Terminé"

    Exemple: Bob ne peut pas terminer une action
      Soit l'action est "À valider"
      Quand Bob passe l'action à "Terminé"
      Alors l'opération est refusée car interdite
      Et l'action est "À valider"

  Règle: Les transitions hors cycle sont refusées

    Plan du Scénario: Transition interdite
      Soit l'action est "<depuis>"
      Quand Alice passe l'action à "<vers>"
      Alors l'opération est refusée car la transition est invalide
      Et l'action est "<depuis>"

      Exemples:
        | depuis    | vers      |
        | À faire   | À valider |
        | À faire   | Terminé   |
        | En cours  | À faire   |
        | En cours  | Terminé   |
        | À valider | À faire   |
        | Terminé   | À faire   |
        | Terminé   | En cours  |
        | Terminé   | À valider |

  Règle: Un Utilisateur ne change jamais l'état d'une action

    Plan du Scénario: Carla tente une transition
      Soit l'action est "<depuis>"
      Quand Carla passe l'action à "<vers>"
      Alors l'opération est refusée car interdite

      Exemples:
        | depuis    | vers      |
        | À faire   | En cours  |
        | En cours  | À valider |
        | À valider | Terminé   |

  Règle: Un refus de validation exige un motif et est tracé

    Exemple: Alice refuse avec un motif
      Soit l'action est "À valider"
      Quand Alice refuse la validation avec le motif "Preuve de formation manquante"
      Alors l'action est "En cours"
      Et l'historique contient "À valider" → "En cours" par Alice avec le motif "Preuve de formation manquante"

    Exemple: Alice refuse sans motif
      Soit l'action est "À valider"
      Quand Alice refuse la validation sans motif
      Alors l'opération est refusée car le motif est obligatoire
      Et l'action est "À valider"

    Exemple: Bob ne peut pas refuser une validation
      Soit l'action est "À valider"
      Quand Bob refuse la validation avec le motif "Incomplet"
      Alors l'opération est refusée car interdite

  Règle: Une modification basée sur une version périmée est rejetée

    Exemple: Deux changements simultanés
      Soit l'action est "À faire" en version 1
      Et Bob passe l'action à "En cours" depuis la version 1
      Quand Alice passe l'action à "En cours" depuis la version 1
      Alors l'opération est refusée car la version est périmée
