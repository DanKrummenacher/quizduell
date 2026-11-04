# Mitarbeiten

## Ablauf

1. Branch von `main`: `feat/…`, `fix/…`, `chore/…`, `docs/…`.
2. Kleine, abgeschlossene Commits im Stil von
   [Conventional Commits](https://www.conventionalcommits.org): `feat(frontend): …`,
   `fix(backend): …`, `chore: …`. Die Betreffzeile sagt, was sich für wen ändert.
3. Pull Request gegen `main` mit der Vorlage. Der PR-Titel folgt Conventional Commits,
   denn er wird beim Squash-Merge zur Commit-Nachricht auf `main`. Die vier Checks
   müssen grün sein, dann **Squash and merge** (andere Merge-Arten sind gesperrt).
4. Nach dem Merge deployt GitHub die Test-Umgebung; die Produktion wartet auf eine
   Freigabe (siehe [DEPLOYMENT.md](docs/DEPLOYMENT.md)).

Beim ersten Einrichten einmal `npm install` im Hauptordner ausführen: Das richtet
den Git-Hook ein, der vor jedem Commit Prettier und ESLint über die geänderten
Dateien laufen lässt.

Dependabot-PRs mit Minor- und Patch-Updates werden bei grüner CI automatisch
gemergt; Major-Updates bekommen das Label «needs-review» und warten auf eine Person.

## Regeln im Code

- TypeScript im strengen Modus, kein `any`, kein `eslint-disable`.
- Eine Datei hat höchstens 500 Zeilen Code (ESLint `max-lines`); grössere Dinge
  werden aufgeteilt.
- Kommentare erklären das Warum, nicht das Was; Texte für Admin und Spiel sind
  deutsch (Schweiz, ohne ß), Code und Kommentare englisch.
- Der Vertrag zwischen Backend und Frontend (`backend/src/contracts`,
  `frontend/src/app/core/contracts`) wird immer auf beiden Seiten identisch geändert.
- Datenbankänderungen gehen über Drizzle-Migrationen (`npm --prefix backend run db:generate`)
  und werden nie von Hand in der Datenbank gemacht.
- Neue Logik bekommt Unit-Tests; neue Abläufe im Browser einen E2E-Test.

## Lokal prüfen

```bash
npm run format:check && npm run lint && npm run typecheck && npm test
npm run e2e
```
