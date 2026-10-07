# language: fr
# Sources : US0, US1, US2, US2b, décisions D8, D9, D13
Fonctionnalité: Comptes, connexion et membres

  Règle: Créer un compte crée une organisation et son premier administrateur

    Exemple: Alice crée la Clinique des Lilas
      Quand un visiteur s'inscrit avec l'organisation "Clinique des Lilas", le nom "Alice", l'email "alice@lilas.fr" et un mot de passe valide
      Alors l'organisation "Clinique des Lilas" existe
      Et Alice en est Admin

    Exemple: Email déjà utilisé
      Soit un compte existant avec l'email "alice@lilas.fr"
      Quand un visiteur s'inscrit avec l'email "alice@lilas.fr"
      Alors l'opération est refusée car l'email est déjà utilisé

    Exemple: Mot de passe trop court
      Quand un visiteur s'inscrit avec un mot de passe de 14 caractères
      Alors l'opération est refusée car le mot de passe fait moins de 15 caractères

  Règle: Un échec de connexion ne révèle pas si l'email existe

    Plan du Scénario: Échec de connexion
      Quand quelqu'un se connecte avec l'email "<email>" et un mauvais mot de passe
      Alors le message est "Email ou mot de passe incorrect"

      Exemples:
        | email            |
        | alice@lilas.fr   |
        | inconnu@lilas.fr |

  Règle: L'Administrateur ajoute des membres avec un mot de passe temporaire

    Exemple: Alice ajoute Bob comme Gestionnaire
      Soit Alice, Admin de "Clinique des Lilas"
      Quand Alice ajoute "bob@lilas.fr" nommé "Bob" avec le rôle Gestionnaire
      Alors Bob est Gestionnaire de "Clinique des Lilas"
      Et Alice reçoit une seule fois le mot de passe temporaire de Bob

    Exemple: Bob doit changer son mot de passe temporaire
      Soit Bob a un mot de passe temporaire
      Quand Bob se connecte
      Alors il doit changer son mot de passe avant toute autre opération

    Exemple: Un Gestionnaire ne peut pas ajouter de membre
      Quand Bob ajoute "carla@lilas.fr" avec le rôle Utilisateur
      Alors l'opération est refusée car interdite

  Règle: Personne ne modifie son propre rôle ni ne se retire

    Contexte:
      Soit "Clinique des Lilas" avec Alice (Admin), Denis (Admin), Bob (Gestionnaire) et Carla (Utilisateur)

    Exemple: Alice rétrograde un autre admin
      Quand Alice change le rôle de Denis en Gestionnaire
      Alors Denis est Gestionnaire

    Exemple: Alice ne peut pas changer son propre rôle
      Quand Alice change son propre rôle en Gestionnaire
      Alors l'opération est refusée car on ne peut pas modifier son propre rôle

    Exemple: Alice retire Carla
      Quand Alice retire Carla
      Alors Carla n'apparaît plus dans la liste des membres
      Et Carla ne peut plus se connecter

    Exemple: Alice ne peut pas se retirer
      Quand Alice se retire de l'organisation
      Alors l'opération est refusée car on ne peut pas se retirer soi-même

    Exemple: Seul un admin liste les membres
      Quand Bob consulte la liste des membres
      Alors l'opération est refusée car interdite
