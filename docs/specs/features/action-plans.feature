# language: fr
# Sources : US3, US3b, US6, US7, décisions D3, D6, D7, D11
Fonctionnalité: Plans d'actions et actions

  Contexte:
    Soit l'organisation "Clinique des Lilas" avec Alice (Admin), Bob (Gestionnaire) et Carla (Utilisateur)

  Règle: Seul l'Administrateur crée et modifie les plans et les actions

    Exemple: Alice crée un plan vide puis y ajoute une action
      Quand Alice crée le plan "Audit hygiène 2026"
      Alors le plan "Audit hygiène 2026" existe et ne contient aucune action
      Quand Alice ajoute l'action "Former au lavage des mains" au plan
      Alors l'action "Former au lavage des mains" est "À faire"

    Plan du Scénario: Un non-administrateur ne crée ni ne modifie rien
      Quand <membre> tente de <opération>
      Alors l'opération est refusée car interdite

      Exemples:
        | membre | opération                  |
        | Bob    | créer un plan              |
        | Bob    | ajouter une action         |
        | Bob    | modifier une action        |
        | Carla  | créer un plan              |
        | Carla  | modifier un plan           |

    Exemple: Modifier une action ne change pas son état
      Soit l'action "Former au lavage des mains" est "En cours"
      Quand Alice renomme l'action en "Former tout le personnel au lavage des mains"
      Alors l'action est "En cours"

    Exemple: Alice modifie un plan
      Soit le plan "Audit hygiène 2026"
      Quand Alice renomme le plan en "Audit hygiène 2026 - suivi"
      Alors le plan "Audit hygiène 2026 - suivi" existe

  Règle: Le titre est obligatoire, la description facultative

    Exemple: Plan sans titre
      Quand Alice crée un plan avec le titre ""
      Alors l'opération est refusée car le titre est obligatoire

    Exemple: Action sans description
      Soit le plan "Audit hygiène 2026"
      Quand Alice ajoute l'action "Afficher les consignes" sans description
      Alors l'action "Afficher les consignes" existe

  Règle: La suppression d'une action est logique et réservée à l'Administrateur

    Exemple: Alice supprime une action
      Soit l'action "Former au lavage des mains" dans le plan "Audit hygiène 2026"
      Quand Alice supprime l'action
      Alors l'action n'apparaît plus dans le plan ni en détail
      Et la suppression est enregistrée avec son auteur et sa date

    Exemple: Bob ne peut pas supprimer
      Quand Bob supprime l'action "Former au lavage des mains"
      Alors l'opération est refusée car interdite

  Règle: Tout membre consulte les plans et les actions de son organisation uniquement

    Exemple: Carla consulte
      Soit le plan "Audit hygiène 2026" contenant l'action "Former au lavage des mains"
      Quand Carla consulte la liste des plans, puis les actions du plan, puis le détail de l'action
      Alors elle voit le titre, la description et l'état de l'action

    Exemple: Action d'une autre organisation
      Soit une action de l'organisation "Hôpital du Lac"
      Quand Carla consulte cette action
      Alors l'action est introuvable
