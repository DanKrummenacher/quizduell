# Sicherheit

## Schwachstelle melden

Bitte keine öffentlichen Issues für Sicherheitslücken. Melde sie direkt an den
Betreiber (Kontakt in `docs/UEBERGABE.md`). Du bekommst innert 3 Arbeitstagen
eine Antwort; behobene Lücken werden im CHANGELOG genannt.

## Was die Anwendung schützt

- **Admin:** ein gemeinsames Passwort, gesetzt als Umgebungsvariable beim Hoster
  (mindestens 12 Zeichen), im Code nie im Klartext. Sitzungen sind signierte Tokens
  (12 Stunden), die mit jedem Passwortwechsel ungültig werden. Höchstens 10
  Anmeldeversuche pro Minute und IP.
- **Spiel:** keine Konten, keine Personendaten. Spielernamen leben nur während
  eines Duells im Arbeitsspeicher.
- **API:** Eingaben werden validiert (DTOs, eigene Parser für Socket-Events),
  Rate-Limits für HTTP und Socket-Events, Helmet-Security-Header, CORS nur für
  die konfigurierte Frontend-Domain, kleine Socket-Nachrichten (10 kB).
- **Betrieb:** Geheimnisse nur als Umgebungsvariablen auf Render, nie im Repo.
  Die Teststeuerung (`/api/test/*`) lässt sich in der Produktion nicht einschalten.

## Abhängigkeiten

Die CI bricht bei bekannten Schwachstellen in Produktionspaketen ab
(`npm audit --audit-level=high`). Dependabot schlägt wöchentlich Updates vor.
