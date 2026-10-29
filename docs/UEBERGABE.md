# Übergabe

Was die Betreiberin oder der Betreiber braucht, um playduelio zu führen. Die
Platzhalter in spitzen Klammern bei der Übergabe ausfüllen und diese Datei danach
**nicht** ins Repository committen, wenn sie Geheimnisse enthält – Passwörter gehören
in den Passwort-Manager, hier stehen nur die Orte.

## Konten und Zugänge

| Was                          | Wo                                                  | Wer hat Zugriff |
| ---------------------------- | --------------------------------------------------- | --------------- |
| Quellcode                    | GitHub `DanKrummenacher/quizduell`                  | <Namen>         |
| Hosting                      | Render-Konto <E-Mail>, Team <Name>                  | <Namen>         |
| Admin-Passwort               | Passwort-Manager, Eintrag «playduelio Admin»        | <Namen>         |
| GitHub-Token `read:packages` | Passwort-Manager, Eintrag «playduelio css-ch Token» | <Namen>         |
| Domain / QR-URL              | `https://playduelio.onrender.com`                   | –               |

## Geheimnisse und wie man sie dreht

| Geheimnis                             | Wo es liegt                                              | Drehen                                                                        |
| ------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Admin-Passwort                        | Render → `playduelio-api` → Environment `ADMIN_PASSWORD` | Variable ändern, Dienst startet neu → [BETRIEB.md](BETRIEB.md#admin-passwort) |
| `GITHUB_TOKEN` (Render Static Site)   | Render → `playduelio` → Environment                      | neues Token auf GitHub (read:packages), in Render ersetzen, Deploy auslösen   |
| `CSS_PACKAGES_TOKEN` (CI, Dependabot) | GitHub → Settings → Secrets                              | dito                                                                          |
| `DATABASE_URL`                        | von Render verwaltet                                     | Render → Datenbank → _Rotate credentials_, Backend neu deployen               |

## Was wo läuft

- **Spiel:** `https://playduelio.onrender.com` (Static Site, URL auf den QR-Codes, nie neu anlegen)
- **Admin:** `https://playduelio.onrender.com/admin`
- **API:** `https://playduelio-api.onrender.com`, Health `/health`
- **Datenbank:** Render Postgres `playduelio-db`, Frankfurt, tägliche Sicherung
- **CI:** GitHub Actions bei jedem Push und Pull Request; Render deployt `main` nur nach grüner CI

## Kosten

| Dienst      | Plan        | ca. pro Monat |
| ----------- | ----------- | ------------- |
| Backend     | Starter     | 7 $           |
| Datenbank   | Basic-256mb | 6 $           |
| Static Site | Free        | 0 $           |

Ausserhalb der Nutzung lässt sich das Backend auf Free stellen (schläft ein, erster
Aufruf dauert ~1 Min.), die Datenbank sollte bleiben.

## Routine

| Wann          | Was                                                                                    |
| ------------- | -------------------------------------------------------------------------------------- |
| wöchentlich   | Dependabot-PRs prüfen und mergen (CI muss grün sein)                                   |
| vor Anlässen  | Checkliste in [BETRIEB.md](BETRIEB.md)                                                 |
| bei Bedarf    | Fragen pflegen, Statistik im Admin ansehen, CSV-Export als Sicherung                   |
| nach Anlässen | Statistik behalten oder zurücksetzen ([BETRIEB.md](BETRIEB.md#datenbank-zurücksetzen)) |

## Bekannte offene Punkte

- Die Seite **Hinweise** im Admin ist als «Bald verfügbar» angelegt. Die Prüfungen
  laufen bereits: Die Hinweise stehen im Editor jeder Frage und als Filter «Mit Hinweis»
  auf der Fragen-Seite. Die Übersichtsseite mit allen Hinweisen und dem Ignorieren
  einzelner Hinweise folgt in einer späteren Version.
- Laufende Duelle liegen im Arbeitsspeicher einer Backend-Instanz. Mehr als eine
  Instanz bräuchte einen gemeinsamen Spielstand (Redis); für den vorgesehenen Betrieb
  ist das nicht nötig (Lasttest: 500 Duelle gleichzeitig ohne Fehler).

## Kontakt

- Entwicklung und Übergabe: <Name, E-Mail>
- Betrieb: <Name, E-Mail>
