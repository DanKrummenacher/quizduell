# Betrieb

Checklisten und Notfallplan für den laufenden Betrieb, zum Beispiel an einem Stand,
einem Anlass oder im Dauerbetrieb.

## Go-live-Checkliste

- [ ] Blueprint angewendet, `/health` liefert `{"status":"ok"}` ([DEPLOYMENT.md](DEPLOYMENT.md))
- [ ] Backend auf Plan **Starter** (schläft nicht ein)
- [ ] GitHub: Secret `CSS_PACKAGES_TOKEN` gesetzt, Branch-Schutz auf `main` aktiv
- [ ] Datenbank leer übergeben oder mit dem gewünschten Fragenbestand gefüllt
- [ ] Fragenkatalog fertig, genügend aktive Fragen (Startseite zeigt keinen Hinweis)
- [ ] **Spielregeln** geprüft: Fragen pro Duell, Zeit pro Frage, automatischer Neustart
- [ ] Duell mit **echten Geräten** gespielt: iPhone, Android, iPad, Laptop
- [ ] Lasttest gegen das Live-Backend, z. B. 100 Duelle gleichzeitig:
      `npm --prefix backend run load-test -- https://playduelio-api.onrender.com 100`
      danach die Statistik zurücksetzen (**Fragen → alle auswählen → Statistik zurücksetzen**
      oder `db:reset --keep-questions`, siehe unten)
- [ ] QR-Code auf die Frontend-URL gedruckt und mit mehreren Handys getestet
- [ ] **Code-Freeze:** nur noch dringende Korrekturen pushen

## Vor einem Anlass

- [ ] `https://playduelio-api.onrender.com/health` zeigt `{"status":"ok"}`
- [ ] Vor Ort ein Testduell im lokalen WLAN spielen
- [ ] Geteilte Geräte: Helligkeit hoch, Auto-Sperre aus, Seite als App auf den
      Home-Bildschirm legen (Teilen → «Zum Home-Bildschirm»), dann Vollbild
- [ ] Handy-Hotspot als Reserve bereit
- [ ] Auf Render **Auto-Deploy ausschalten**, damit kein Push den Server neu startet

## Stand-Modus

Geteilte Geräte springen nach einer einstellbaren Zeit ohne Bedienung zur Startseite
zurück und vergessen den Namen – die nächste Person startet frisch. Während eines
Duells oder einer Gegnersuche passiert das nie. Einstellbar im Admin unter
**Spielregeln → Automatischer Neustart** (0 = aus).

## Wenn etwas nicht funktioniert

| Problem                                    | Lösung                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------- |
| Banner «Verbindung wird wiederhergestellt» | Kurz warten – Spiele laufen 20 s weiter und werden automatisch fortgesetzt         |
| Startseite: «Server nicht erreichbar»      | WLAN prüfen, ggf. Hotspot nutzen; Render-Dashboard → `playduelio-api` → Logs       |
| Startseite: «wird gerade vorbereitet»      | Zu wenige aktive Fragen → im Admin unter **Fragen** aktivieren oder erfassen       |
| Eine Frage ist falsch                      | Im Admin unter **Fragen** pausieren oder korrigieren (gilt sofort für neue Duelle) |
| Läuft gerade etwas?                        | Admin → **Live**: laufende Duelle, Gegnersuche und Ereignisse in Echtzeit          |
| Ein Gerät hängt                            | Seite neu laden – ein laufendes Duell wird fortgesetzt                             |
| Backend reagiert gar nicht                 | Render → `playduelio-api` → _Manual Deploy → Restart service_                      |
| Neue Duelle sollen kurz nicht starten      | Admin → **Übersicht → Spiel pausieren**; laufende Duelle spielen zu Ende           |

Ein Neustart des Backends beendet laufende Duelle (die Spielenden sehen eine Meldung
und starten einfach neu). Fragen, Einstellungen und Statistik bleiben erhalten.

## Admin-Passwort

- Ändern oder vergessen: in Render bei `playduelio-api` → _Environment_ die Variable
  `ADMIN_PASSWORD` auf ein neues Passwort setzen (mindestens 12 Zeichen) → _Save_.
  Der Dienst startet neu, und alle bestehenden Anmeldungen enden; laufende Duelle
  werden dabei beendet, deshalb nicht während eines Anlasses.

## Datenbank zurücksetzen

Für die Übergabe oder einen Neuanfang. Das Skript leert Fragen, Statistik, Duelle,
Verlauf und ignorierte Hinweise und setzt die Spielregeln auf Standard.

```bash
# Nur anzeigen, was passieren würde:
DATABASE_URL='<External Database URL>' npm --prefix backend run db:reset

# Ausführen:
DATABASE_URL='<External Database URL>' npm --prefix backend run db:reset -- --yes

# Fragen behalten, nur Statistik, Duelle und Verlauf leeren:
DATABASE_URL='<External Database URL>' npm --prefix backend run db:reset -- --yes --keep-questions
```

Die External Database URL steht in Render bei `playduelio-db`. Nach dem Zurücksetzen
den Backend-Dienst neu starten, damit er die Standardregeln übernimmt.

## Sicherung und Wiederherstellung

Render sichert die Datenbank täglich (Dashboard → `playduelio-db` → _Backups_).
Dort lässt sich ein Stand wiederherstellen oder als Datei herunterladen. Zusätzlich
lässt sich der Fragenbestand jederzeit im Admin als CSV exportieren und wieder
importieren.

## Datenschutz

Es werden keine Personendaten gespeichert. Spielernamen existieren nur während eines
Duells im Arbeitsspeicher (und sind so lange im Admin unter **Live** sichtbar). In der
Datenbank liegen nur Fragen, Spielregeln, anonyme Zahlen zu Duellen und Antworten,
und der Verlauf der Änderungen im Admin.
