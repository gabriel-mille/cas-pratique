/** Chargement annoncé poliment aux lecteurs d'écran (WCAG 4.1.3). */
export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return <p role="status">{label}</p>;
}
