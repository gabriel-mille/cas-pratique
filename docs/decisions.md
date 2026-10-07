# Décisions

Points ambigus de l'énoncé et choix d'architecture. Format : contexte → décision → alternatives écartées.

## D1 – Fichiers d'instructions IA
- Contexte : l'énoncé demande de fournir les prompts / fichiers d'instructions IA.
- Décision : `AGENTS.md` (format ouvert) comme source unique, importé par `CLAUDE.md` via `@AGENTS.md` ; un `AGENTS.md` par app (backend DDD, frontend FSD).
- Alternative écartée : symlink `CLAUDE.md → AGENTS.md`, déconseillé par la doc Claude Code sous Windows.
