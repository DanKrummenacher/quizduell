# Architektur

```
Browser (Angular)  ──HTTP /api──▶  NestJS-Backend  ──▶  PostgreSQL
        ▲                              │
        └──────── Socket.IO ───────────┘   (Spielstand in Echtzeit)
```

## Grundprinzipien

- **Server-autoritativ:** Das Backend entscheidet alles – welche Frage gilt, ob eine
  Antwort noch zählt, wie viel Zeit vergangen ist, wie viele Punkte es gibt und wie es um
  die Revanche steht. Der Client misst keine Zeit für die Wertung; Schummeln über
  manipulierte Nachrichten ist dadurch nicht möglich.
- **State-Sync:** Nach jeder Änderung schickt der Server jedem Spieler einen vollständigen,
  persönlichen Spielstand (`GameStateView`). Das Frontend stellt diesen nur dar und leitet
  nichts selbst her. Verpasste Nachrichten spielen deshalb keine Rolle.
- **Gemeinsamer Vertrag:** `contracts/game.contract.ts` (Socket-Events, Spielstand,
  öffentliche Infos) existiert identisch in Backend und Frontend. `npm run check:contracts` und die CI prüfen das.

## Spielablauf

`waiting` (nur Freundesspiel) → `countdown` → (`question` → `reveal`) × n → `finished`
bzw. `aborted` (mit `endReason`).

Punkte: 100 pro richtige Antwort, plus bis zu 100 Tempo-Bonus (linear nach Restzeit).

**Revanche** (beide Modi): Nach `finished` können beide Spieler innerhalb der eingestellten
Zeit eine Revanche gegen denselben Gegner starten. Mit der ersten Anfrage beginnt die Zeit
neu, damit der Gegner die volle Zeit zum Antworten hat und die angezeigte Restzeit bei der
Anfrage voll startet. Der Server meldet jedem Spieler den Stand als `rematch`:

| Status          | Bedeutung                                         | Ergebnis-Screen                    |
| --------------- | ------------------------------------------------- | ---------------------------------- |
| `open`          | Noch niemand hat gefragt                          | «Revanche fordern»                 |
| `requested`     | Ich habe gefragt                                  | «Anfrage gesendet» + Restzeit      |
| `offered`       | Der Gegner hat gefragt                            | «Revanche annehmen!» + Restzeit    |
| `paused`        | Eine Verbindung ist unterbrochen                  | Warten auf die Wiederverbindung    |
| `opponent-left` | Der Gegner hat das Spiel verlassen                | «Neuen Gegner suchen» / «Neues Spiel erstellen» |
| `unanswered`    | Ich habe gefragt, der Gegner hat nicht reagiert   | dito, mit Hinweis                  |
| `expired`       | Die Zeit ist abgelaufen                           | dito                               |

## Verbindung und Spiel verlassen

Niemand soll allein weiterspielen. Die Regeln dafür stehen an genau einer Stelle, im
`GameLifecycleService` (Frontend):

| Situation                                              | Verhalten                                                  |
| ------------------------------------------------------ | ---------------------------------------------------------- |
| Spielseite verlassen (Link, Zurück, Adresse, unbekannter Pfad) | Duell wird sofort beendet, der Gegner sieht es direkt |
| Seite neu geladen                                      | Das Duell läuft nahtlos weiter (`sessionToken`)            |
| Tab geschlossen oder andere Website geöffnet           | Seite trennt bewusst, Server wartet 5 s, dann beendet      |
| Netzwerkproblem (WLAN weg, Handy gesperrt)             | Server wartet 20 s, Gegner sieht einen Hinweis             |
| Seite wird beim Tippen der Adresse vorgeladen          | Erst beim tatsächlichen Öffnen (Enter) passiert etwas      |

Umsetzung:

- Spielseiten sind in den Routen markiert (`data: GAME_SCREEN_DATA`). Beim ersten
  Bildschirm entscheidet der Lifecycle, ob ein gespeichertes Spiel fortgesetzt
  (Spielseite) oder verlassen wird (alles andere). Danach beendet jeder Wechsel weg von den
  Spielseiten das Spiel.
- Vorgeladene Seiten (Prerendering) werden über `document.prerendering` und das Event
  `prerenderingchange` erkannt.
- Beim Entladen (`pagehide`) trennt der Client die Verbindung selbst. Der Server erkennt
  das am Trennungsgrund von Socket.IO und verkürzt die Wartezeit.
- Lobby, Quiz und Resultat ersetzen sich im Browserverlauf (`replaceUrl`): Ein Duell ist
  ein einziger Eintrag, «Zurück» verlässt es.
- Ein gespeichertes Spiel lässt sich mit `LEAVE_GAME { sessionToken }` in einem Schritt
  verlassen, ohne es vorher fortzusetzen.

## Backend (`backend/src`)

| Modul        | Aufgabe                                                                |
| ------------ | ---------------------------------------------------------------------- |
| `game/`      | Spiel-Engine (`GameService`), Socket-Gateway, Namensfilter, Rate-Limit |
| `questions/` | Fragen in der Datenbank, Zufallsauswahl, Trefferstatistik, Beispielfragen |
| `settings/`  | Spieleinstellungen (im Speicher gecacht, gelten ab dem nächsten Duell) |
| `stats/`     | Anzahl gespielter Duelle                                               |
| `testing/`   | Teststeuerung `/api/test/*` für die E2E-Tests (nur mit `TEST_CONTROL=true`) |
| `database/`  | Drizzle-Schema, Verbindung, Migrationen beim Start                     |
| `config/`    | Validierte Konfiguration aus Umgebungsvariablen                        |

Die Beispielfragen (`questions/sample-questions.ts`) sind von Hand geschrieben und fest im
Code hinterlegt. Eine leere In-Memory-Datenbank (lokal ohne `DATABASE_URL`) startet damit,
die E2E-Tests laden sie über die Teststeuerung. Die Teststeuerung ist in der Produktion
gesperrt: Die Konfiguration verweigert dort `TEST_CONTROL=true`.

## Frontend (`frontend/src/app`)

| Ordner             | Inhalt                                                              |
| ------------------ | ------------------------------------------------------------------- |
| `core/game/`       | `GameClient` (Verbindung, Befehle, Spielstand als Signal), `GameLifecycleService` (Seite und Bildschirm ↔ Spiel) |
| `core/platform/`   | Stand-Modus (Idle-Reset), Wake-Lock, sicherer Storage               |
| `core/ui/`         | Header, Logo-Symbol, Verbindungsbanner                              |
| `features/start`   | Startseite mit Namenseingabe                                        |
| `features/lobby`   | Spielmodus, Freund herausfordern, Suche, Warten, Gegner gefunden    |
| `features/quiz`    | Frage, Timer, Scoreboard, Auflösung                                 |
| `features/result`  | Endstand, Revanche, neues Spiel                                     |

- **Angular ohne Zone.js**, durchgehend Signals und Standalone-Komponenten.
- **Smart/Dumb-Pattern** in den Spiel-Features: Ein Container verbindet den `GameClient`
  mit reinen Darstellungskomponenten (nur Inputs/Outputs).
- UI-Komponenten aus `@css-ch/components` und `@css-ch/calc-ui-text`, Farben und Schrift aus
  den Design-Tokens der Shared Library.
- Ein Layout-System für alle Seiten: dieselbe Grössen-Skala
  (16 px, ab 1600 px Breite 18 px, ab 1920 px 20 px – nur Grössen, bei denen die
  Bedienelemente der Shared Library auf ganzen Pixeln liegen), derselbe Header und dieselbe
  Inhaltsspalte (`styles/_layout.scss`, 40rem breit) mit dem Logo in der Mitte.
- Ein Interaktionskonzept für alle selbst gebauten klickbaren Elemente
  (`styles/_interaction.scss`): Hover nur bei Maus-Bedienung (helle Fläche und Schatten,
  Rahmen bleiben gleich), kurzer Klick-Zustand, überall derselbe sichtbare Tastatur-Fokus.
- Grosse Bildschirme (ab 1024 px): Die freien Seitenflächen tragen dezent die Markenfarben,
  die Inhaltsspalte geht weich darin über. Quiz und Resultat bleiben als Block in der Mitte
  zusammen, statt sich über die ganze Höhe zu verteilen.
- Automatisiert getestet auf 14 Geräten vom iPhone SE bis Ultrawide
  (`e2e/responsive.spec.ts`).

## Qualität

- TypeScript im strengsten Modus (u. a. `noUncheckedIndexedAccess`, `strictTemplates`)
- ESLint mit typgeprüften Regeln in Backend, Frontend und E2E-Tests, Prettier
- Tests: Unit- und Integrationstests (Vitest, Backend mit In-Memory-Postgres),
  End-to-End-Tests (Playwright, Chromium und WebKit, 14 Geräte)
- Jeder Push läuft durch die CI: Vertrag, Format, Lint, Typen, Tests, Build, E2E

## Skalierung

Laufende Duelle liegen im Arbeitsspeicher einer Backend-Instanz; das hält jede Antwort im
Millisekundenbereich. Lasttest lokal (`npm --prefix backend run load-test -- <url> 500`):

| Gleichzeitig    | Fehler | Antwortzeit (Median / 99 %) |
| --------------- | ------ | --------------------------- |
| 500 Duelle (1000 Spielende) | 0 | 1 ms / 4 ms        |

Das ist ein Vielfaches dessen, was an einem Messestand passiert. Für mehrere Instanzen
bräuchte es einen gemeinsamen Spielstand (z. B. Redis mit dem Socket.IO-Redis-Adapter);
für diesen Einsatz ist das bewusst nicht nötig.

## Sicherheit

- Eingaben werden im Backend validiert (DTOs bzw. eigene Parser für Socket-Events)
- Rate-Limits: HTTP global, Socket-Events 30/10 s
- Helmet-Security-Header, CORS nur für die konfigurierte Frontend-Domain
- Keine Schreibzugriffe über die API: Fragen und Einstellungen ändern sich nur direkt in der
  Datenbank (die Teststeuerung ist in der Produktion gesperrt)
- Keine Personendaten in der Datenbank
