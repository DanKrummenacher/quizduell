# Architektur

```
Browser (Angular)  ──HTTP /api──▶  NestJS-Backend  ──▶  PostgreSQL
        ▲                              │
        └──────── Socket.IO ───────────┘   (Spielstand in Echtzeit)
```

## Grundprinzipien

- **Server-autoritativ:** Das Backend entscheidet alles – welche Frage gilt, ob eine
  Antwort noch zählt, wie viel Zeit vergangen ist und wie viele Punkte es gibt. Der
  Client misst keine Zeit für die Wertung; Schummeln über manipulierte Nachrichten ist
  dadurch nicht möglich.
- **State-Sync:** Nach jeder Änderung schickt der Server jedem Spieler einen vollständigen,
  persönlichen Spielstand (`GameStateView`). Das Frontend stellt diesen nur dar.
  Verpasste Nachrichten spielen deshalb keine Rolle.
- **Wiederaufnahme:** Jeder Spieler erhält einen geheimen `sessionToken`. Nach einem
  Verbindungsabbruch oder Neuladen meldet sich der Client damit zurück. Der Server wartet
  20 Sekunden, bevor ein getrennter Spieler das Duell verliert; der Gegner sieht in dieser
  Zeit einen Hinweis. Wer die Spielseiten (`/lobby`, `/quiz`, `/result`) verlässt – per
  Link, Zurück-Taste oder eingetippter Adresse –, verlässt das Duell sofort, damit
  niemand allein weiterspielt.
- **Gemeinsamer Vertrag:** `contracts/game.contract.ts` (Socket-Events, Spielstand) und
  `contracts/admin.contract.ts` (Admin-API) existieren identisch in Backend und Frontend.

## Backend (`backend/src`)

| Modul         | Aufgabe                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| `game/`       | Spiel-Engine (`GameService`), Socket-Gateway, Namensfilter, Rate-Limit  |
| `questions/`  | Fragen in der Datenbank, Zufallsauswahl, Trefferstatistik               |
| `settings/`   | Spieleinstellungen (im Speicher gecacht, gelten ab dem nächsten Duell)  |
| `stats/`      | Anzahl gespielter Duelle                                                |
| `admin/`      | Admin-REST-API (Fragen, Einstellungen, Übersicht, Login)                |
| `auth/`       | Passwort-Login, JWT-Sitzungen, Brute-Force-Schutz                       |
| `database/`   | Drizzle-Schema, Verbindung, Migrationen beim Start                      |
| `config/`     | Validierte Konfiguration aus Umgebungsvariablen                         |

Ablauf eines Duells: `waiting` (nur Freundesspiel) → `countdown` → (`question` →
`reveal`) × n → `finished` (Revanche möglich) bzw. `aborted`.

Punkte: 100 pro richtige Antwort, plus bis zu 100 Tempo-Bonus (linear nach Restzeit).

## Frontend (`frontend/src/app`)

| Ordner                 | Inhalt                                                          |
| ---------------------- | --------------------------------------------------------------- |
| `core/game/`           | `GameClient` (Socket-Verbindung, Spielstand als Signal)         |
| `core/platform/`       | Stand-Modus (Idle-Reset), Wake-Lock, sicherer Storage           |
| `core/ui/`             | Header, Logo-Symbol, Verbindungsbanner                          |
| `features/start`       | Startseite mit Namenseingabe                                    |
| `features/lobby`       | Spielmodus, Freund herausfordern, Suche, Warten, Gegner gefunden|
| `features/quiz`        | Frage, Timer, Scoreboard, Auflösung                             |
| `features/result`      | Endstand, Revanche, «Erneut Spielen»                            |
| `admin/`               | Admin-Bereich (lazy geladen)                                    |

Jedes Feature folgt dem Smart/Dumb-Pattern: ein Container verbindet den `GameClient`
mit reinen Darstellungskomponenten. UI-Komponenten stammen aus `@css-ch/components`
und `@css-ch/calc-ui-text`, Farben und Schrift aus den Design-Tokens der Shared Library.
Auf Tablets und Desktops steht das Mobile-Design in einer zentrierten, mitwachsenden
Spalte; der Admin-Bereich (`admin/`) nutzt denselben Kartenstil. Das Layout ist
Mobile-first und wurde automatisiert auf 14 Geräten getestet (`frontend/e2e/responsive.spec.ts`).

## Sicherheit

- Eingaben werden im Backend validiert (DTOs bzw. eigene Parser für Socket-Events)
- Rate-Limits: HTTP global, Admin-Login 5 Versuche/Minute, Socket-Events 30/10 s
- Helmet-Security-Header, CORS nur für die konfigurierte Frontend-Domain
- Admin-Passwort und JWT-Secret nur als Umgebungsvariablen, nie im Code; Passwortvergleich
  zeitkonstant, JWT nur HS256, 12 h gültig und beim Abmelden serverseitig widerrufen
- Keine Personendaten in der Datenbank
