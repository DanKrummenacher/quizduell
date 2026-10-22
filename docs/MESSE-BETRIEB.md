# Betrieb an der Messe

Checkliste und Notfallplan für den Einsatz am Messestand.

## Eine Woche vorher

- [ ] Backend auf Render-Plan **Starter** (schläft nicht ein)
- [ ] Fragenkatalog fertig, genügend aktive Fragen (Startseite zeigt keinen Hinweis)
- [ ] Einstellungen geprüft (Fragen pro Duell, Zeit pro Frage, Stand-Modus), siehe
      [Fragen und Spielregeln pflegen](DEPLOYMENT.md#5-fragen-und-spielregeln-pflegen)
- [ ] Duell mit **echten Geräten** gespielt: iPhone, Android, iPad, Laptop
- [ ] Lasttest gegen das Live-Backend, z. B. 100 Duelle gleichzeitig:
      `npm --prefix backend run load-test -- https://playduelio-api.onrender.com 100`
      (die Testduelle zählen in der Tabelle `played_games` mit)
- [ ] QR-Code auf die Frontend-URL gedruckt und mit mehreren Handys getestet
- [ ] **Code-Freeze:** nur noch dringende Korrekturen pushen

## Am Messetag – vor Türöffnung

- [ ] `https://playduelio-api.onrender.com/health` zeigt `{"status":"ok"}`
- [ ] Am Stand ein Testduell im **Messe-WLAN** spielen
- [ ] Stand-Geräte: Helligkeit hoch, Auto-Sperre aus, Seite als App auf den
      Home-Bildschirm legen (Teilen → «Zum Home-Bildschirm»), dann Vollbild
- [ ] Handy-Hotspot als Reserve bereit
- [ ] Auf Render **Auto-Deploy ausschalten**, damit kein Push den Server neu startet

## Stand-Modus

Stand-Geräte springen nach einer einstellbaren Zeit ohne Bedienung zur Startseite
zurück und vergessen den Namen – die nächste Person startet frisch. Während eines
Duells oder einer Gegnersuche passiert das nie. Einstellbar in der Tabelle `settings`
unter `idle_reset_sec` (0 = aus).

## Wenn etwas nicht funktioniert

| Problem                                   | Lösung                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| Banner «Verbindung wird wiederhergestellt»| Kurz warten – Spiele laufen 20 s weiter und werden automatisch fortgesetzt |
| Startseite: «Server nicht erreichbar»     | WLAN prüfen, ggf. Hotspot nutzen; Render-Dashboard → Backend → Logs     |
| Startseite: «wird gerade vorbereitet»     | Zu wenige aktive Fragen → in der Tabelle `questions` aktivieren/erfassen |
| Eine Frage ist falsch                     | In der Tabelle `questions` `active` auf `false` (gilt sofort für neue Fragen) |
| Ein Gerät hängt                           | Seite neu laden – ein laufendes Duell wird fortgesetzt                  |
| Backend reagiert gar nicht                | Render → `playduelio-api` → *Manual Deploy → Restart service*           |

Ein Neustart des Backends beendet laufende Duelle (die Spielenden sehen eine Meldung
und starten einfach neu). Fragen, Einstellungen und Statistik bleiben erhalten.

## Datenschutz

Es werden keine Personendaten gespeichert. Spielernamen existieren nur während eines
Duells im Arbeitsspeicher. In der Datenbank liegen nur Fragen, Einstellungen und die
Anzahl gespielter Duelle.
