import axe from 'axe-core';

/** Règles WCAG 2.0 à 2.2, niveaux A et AA (cible WCAG 2.2 AA, qui couvre le RGAA 4.1 : docs/compliance.md). */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Violations axe-core du conteneur, résumées pour un message d'échec lisible. */
export async function accessibilityViolations(container: Element) {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: WCAG_TAGS },
    // jsdom ne calcule pas de rendu : le contraste est vérifié dans le navigateur (Playwright + axe).
    rules: { 'color-contrast': { enabled: false } },
  });
  return results.violations.map(
    ({ id, nodes }) =>
      `${id} : ${nodes.map((node) => node.target.join(' ')).join(', ')}`
  );
}
