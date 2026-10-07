export const AUTHOR_DIRECTORY = Symbol('AUTHOR_DIRECTORY');

/**
 * Noms des auteurs de l'historique (D34). Port défini ici et implémenté au câblage des modules
 * avec le contexte `identity` : `action-plans` n'en dépend pas (D30).
 */
export interface AuthorDirectory {
  /**
   * Nom de chaque compte, même retiré de l'organisation depuis ; les ids inconnus sont absents de la Map.
   * Les ids viennent de l'historique d'une action déjà filtrée par organisation.
   */
  namesOf(userIds: string[]): Promise<Map<string, string>>;
}
