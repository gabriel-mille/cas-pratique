import { loadFeature } from '@amiceli/vitest-cucumber';
import { resolve } from 'node:path';

/** Type de retour explicite : le type inféré pointe vers un fichier interne du paquet (TS2742). */
type Feature = Awaited<ReturnType<typeof loadFeature>>;

/**
 * Charge une `.feature` partagée avec le back (`docs/specs/features`, D26).
 * Chemin absolu construit avec `node:path` : sous jsdom, `URL` est celui de jsdom et `fileURLToPath` le refuse.
 */
export const loadSpecFeature = (name: string): Promise<Feature> =>
  loadFeature(
    resolve(import.meta.dirname, '../../../../docs/specs/features', name),
    { language: 'fr' }
  );
