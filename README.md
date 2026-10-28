# playduelio

**Das Quiz-Duell im Browser.** Zwei Personen treten in Echtzeit gegeneinander an;
wer schneller richtig antwortet, holt mehr Punkte. Ohne App, ohne Konto, auf jedem
Gerät vom Handy bis zum grossen Bildschirm. Fragen, Spielregeln und Auswertung
pflegt man im eingebauten Admin.

[![CI](https://github.com/DanKrummenacher/quizduell/actions/workflows/ci.yml/badge.svg)](https://github.com/DanKrummenacher/quizduell/actions/workflows/ci.yml)

## Funktionen

**Für Spielerinnen und Spieler**

- **Schnellspiel 1 vs 1:** automatische Gegnersuche
- **Freund herausfordern:** Spiel erstellen und Code teilen oder mit Code beitreten
- Echtzeit-Duell mit Timer, Tempo-Bonus, Auflösung und Revanche gegen denselben Gegner
- Läuft weiter nach Verbindungsabbrüchen oder einem Neuladen der Seite; wer das Spiel
  verlässt, beendet es sofort für beide
- Stand-Modus: geteilte Geräte springen nach Inaktivität zur Startseite zurück
- Optimiert für Handy (hoch/quer), Tablet und Desktop bis Ultrawide

**Admin** (unter `/admin`, Anmeldung mit dem Admin-Passwort)

- **Übersicht:** Kennzahlen im Vergleich zur Vorperiode, Duelle pro Tag, Live-Stand,
  Fragenbestand, Spielregeln und die letzten Änderungen
- **Live:** laufende Duelle in Echtzeit, jedes Duell Frage für Frage, Gegnersuche,
  offene Spiele mit Code und ein Ereignisprotokoll
- **Fragen:** Suche, Filter, Sortierung, Erfassen und Bearbeiten mit Prüfung,
  Massenaktionen, CSV-Import mit Prüfung jeder Zeile und CSV-Export, Papierkorb; pro
  Frage die Verteilung auf die Antworten, Trefferquote, Antwortzeit und Verlauf
- **Hinweise im Editor:** Das Admin erkennt Fragen, bei denen eine falsche Antwort
  lockt, die zu schwer oder zu leicht sind oder bei denen oft die Zeit abläuft, und
  zeigt sie beim Bearbeiten mit Einordnung und Vorschlag. Die Übersichtsseite aller
  Hinweise ist als «Bald verfügbar» angelegt.
- **Auswertung:** 7, 30 oder 90 Tage – Duelle, Abbrüche, Revanchen, Spielzeiten
  (Wochentag × Stunde), Trefferquote, Kategorien, schwerste und leichteste Fragen
- **Spielregeln:** Vorlagen, jede Regel einzeln, Auswirkung vor dem Speichern
- **Verlauf:** jede Änderung im Admin; frühere Spielregeln lassen sich wiederherstellen
- **Passwort:** das Admin-Passwort im Admin ändern

## Technik

| Bereich   | Technologie                                                                |
| --------- | -------------------------------------------------------------------------- |
| Frontend  | Angular 22 (Standalone, Signals, zoneless), Shared Library `@css-ch`        |
| Backend   | NestJS 12, Socket.IO, Drizzle ORM                                          |
| Datenbank | PostgreSQL (lokal via Docker, Tests mit In-Memory-PGlite)                  |
| Tests     | Vitest (Unit/Integration mit Abdeckung), Playwright (End-to-End, 14 Geräte) |
| Hosting   | Render (Static Site + Web Service + Postgres, als Blueprint `render.yaml`) |

Mehr dazu in [docs/ARCHITEKTUR.md](docs/ARCHITEKTUR.md).

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

Ohne `DATABASE_URL` startet das Backend mit einer temporären In-Memory-Datenbank, die
bereits die Beispielfragen enthält. Das Admin liegt unter http://localhost:4200/admin;
ohne `ADMIN_PASSWORD` gilt lokal das Passwort `admin`.

Für ein Admin mit realistischen Zahlen (60 Tage Duelle und Antworten) das Backend mit
Teststeuerung starten und die Demodaten laden:

```bash
TEST_CONTROL=true DATABASE_URL= npm run dev:backend
curl -X POST http://localhost:3000/api/test/demo-data
```

## Qualität

```bash
npm run format:check    # Prettier
npm run lint            # ESLint (typgeprüft) für Backend, Frontend und E2E-Tests
npm run typecheck       # TypeScript im strengen Modus
npm test                # Vertragsprüfung + Unit- und Integrationstests
npm run e2e             # End-to-End-Tests (startet Backend und Frontend selbst)
npm run build           # Produktions-Builds
```

Jeder Push auf `main` und jeder Pull Request läuft durch die CI: Vertrag, Format,
Lint, Typen, Tests mit Abdeckung, Audit der Produktionspakete, Build und E2E. Render
deployt `main` erst, wenn die CI grün ist.

Die Dateien in `backend/src/contracts` und `frontend/src/app/core/contracts`
beschreiben die Schnittstelle zwischen Frontend und Backend und müssen identisch
sein – `npm run check:contracts` prüft das.

## Dokumentation

- [Deployment auf Render](docs/DEPLOYMENT.md)
- [Betrieb](docs/BETRIEB.md) – Checklisten, Notfallplan, Datenbank zurücksetzen
- [Übergabe](docs/UEBERGABE.md) – Konten, Geheimnisse, Kosten, wer was weiss
- [Architektur](docs/ARCHITEKTUR.md)
- [Mitarbeiten](CONTRIBUTING.md) · [Sicherheit](SECURITY.md) · [Changelog](CHANGELOG.md)
