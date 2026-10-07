export const CLOCK = Symbol('CLOCK');

/** Source de la date courante, injectée pour rendre les dates testables (D30). */
export interface Clock {
  now(): Date;
}
