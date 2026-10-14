# playduelio

**Quizduell Challenge – das Quiz-Duell im Browser.** Zwei Personen treten in
Echtzeit gegeneinander an – wer schneller richtig antwortet, holt mehr Punkte. Ohne App, ohne Konto, auf jedem
Gerät vom iPhone bis zum grossen Monitor.

Ursprünglich als IPA-Projekt entstanden, weiterentwickelt für den Einsatz an der
Zentralschweizer Bildungsmesse (ZEBI).

## Funktionen

**Für Spielerinnen und Spieler**

- **Schnellspiel 1vs1:** automatische Gegnersuche
- **Freund herausfordern:** Spiel erstellen und Code teilen oder mit Code beitreten
- Echtzeit-Duell mit Timer, Tempo-Bonus, Auflösung und Revanche
- Läuft weiter nach Verbindungsabbrüchen oder einem Neuladen der Seite
- Stand-Modus: Geräte am Messestand springen nach Inaktivität zur Startseite zurück
- Optimiert für Handy (hoch/quer), Tablet und Desktop bis Ultrawide

**Für Administratorinnen und Administratoren** (`/admin`)

- Live-Übersicht: verbundene Geräte, laufende Duelle, Statistik
- Fragen erstellen, bearbeiten, (de)aktivieren, löschen – inkl. Trefferquote je Frage
- Einstellungen: Fragen pro Duell, Zeit pro Frage, Tempo-Bonus, Stand-Modus u. a.
- Optionales Startpaket mit Beispielfragen

## Technik

| Bereich      | Technologie                                                       |
| ------------ | ----------------------------------------------------------------- |
| Frontend     | Angular 22 (Standalone, Signals, zoneless), Shared Library `@css-ch` |
| Backend      | NestJS 12, Socket.IO, Drizzle ORM                                 |
| Datenbank    | PostgreSQL (lokal via Docker, Tests mit In-Memory-PGlite)         |
| Tests        | Vitest (Unit/Integration), Playwright (End-to-End, 14 Geräte)     |
| Hosting      | Render (Static Site + Web Service + Postgres)                     |

Das Design stammt aus der IPA-Version und nutzt die aktuellen Komponenten der
Shared Library (`@css-ch/components`, `@css-ch/calc-ui-text`, Design-Tokens).

Mehr Details: [docs/ARCHITEKTUR.md](docs/ARCHITEKTUR.md)

## Lokal starten

Voraussetzungen: Node.js 24, Docker Desktop und ein GitHub-Token mit `read:packages`
für die privaten `@css-ch`-Pakete (als Umgebungsvariable `GITHUB_TOKEN`).

```bash
npm run install:all     # Abhängigkeiten installieren
npm run db:up           # PostgreSQL in Docker starten
cp backend/.env.example backend/.env
npm run dev:backend     # http://localhost:3000
npm run dev:frontend    # http://localhost:4200
```

Ohne `DATABASE_URL` startet das Backend mit einer temporären In-Memory-Datenbank.
Admin-Bereich: <http://localhost:4200/admin> (Passwort aus `backend/.env`).

## Qualität

```bash
npm run lint            # ESLint für Backend und Frontend
npm test                # Vertragsprüfung + Unit- und Integrationstests
npm run e2e             # End-to-End-Tests (startet Backend und Frontend selbst)
npm run build           # Produktions-Builds
```

Jeder Push auf `main` läuft durch die GitHub-Actions-CI (Lint, Tests, Build, E2E).

Die Dateien in `backend/src/contracts` und `frontend/src/app/core/contracts`
beschreiben die Schnittstelle zwischen Frontend und Backend und müssen identisch
sein – `npm run check:contracts` prüft das.

## Dokumentation

- [Deployment auf Render](docs/DEPLOYMENT.md)
- [Betrieb an der Messe](docs/MESSE-BETRIEB.md)
- [Architektur](docs/ARCHITEKTUR.md)
