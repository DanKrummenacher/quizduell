# Changelog

Alle nennenswerten Änderungen, neueste zuerst. Das Format folgt
[Keep a Changelog](https://keepachangelog.com/de/1.1.0/), die Versionen
[SemVer](https://semver.org/lang/de/).

## [1.0.0] – 2026-10-28

Erste produktive Version.

### Spiel

- Schnellspiel 1 vs 1 mit automatischer Gegnersuche und Freundesspiel mit Code
- Echtzeit-Duell mit Timer, Tempo-Bonus, Auflösung und Revanche
- Läuft nach Verbindungsabbruch oder Neuladen weiter; Stand-Modus für geteilte Geräte
- Für Handy, Tablet und Desktop bis Ultrawide

### Admin

- Übersicht mit Kennzahlen, Live-Stand und den letzten Änderungen
- Live: laufende Duelle Frage für Frage, Gegnersuche, offene Spiele, Ereignisse
- Fragen: Suche, Filter, Massenaktionen, CSV-Import und -Export, Papierkorb,
  Statistik pro Frage mit Hinweisen im Editor
- Auswertung über 7, 30 oder 90 Tage
- Spielregeln mit Vorlagen und Vorschau der Auswirkung
- Verlauf jeder Änderung, frühere Spielregeln wiederherstellbar
- Admin-Passwort im Admin änderbar, gehasht gespeichert
- Hinweise-Seite als «Bald verfügbar»; die Prüfungen laufen bereits im Editor

### Betrieb

- Deployment auf Render per Blueprint (`render.yaml`)
- CI mit Format, Lint, Typen, Tests mit Abdeckung, Audit, Build und E2E
