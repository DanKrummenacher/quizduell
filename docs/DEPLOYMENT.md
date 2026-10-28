# Deployment auf Render

playduelio besteht auf Render aus drei Diensten, alle in der Region **Frankfurt**.
Sie sind als Blueprint in [`render.yaml`](../render.yaml) beschrieben.

| Dienst           | Render-Typ  | Name             | URL                                   | Kosten (ca.)     |
| ---------------- | ----------- | ---------------- | ------------------------------------- | ---------------- |
| Frontend (Spiel) | Static Site | `playduelio`     | `https://playduelio.onrender.com`     | gratis           |
| Backend (API)    | Web Service | `playduelio-api` | `https://playduelio-api.onrender.com` | Starter ~7 $/Mt. |
| Datenbank        | PostgreSQL  | `playduelio-db`  | nur intern                            | Basic ~6 $/Mt.   |

> **Die URL des Frontends ist die URL auf den QR-Codes.** Die Static Site darf nie
> gelöscht oder neu erstellt werden. Einstellungen lassen sich jederzeit ändern, ohne
> dass sich die URL ändert.

## 1. Zum ersten Mal: Blueprint anwenden

1. Render → **New → Blueprint** → Repository `quizduell` verbinden → `render.yaml`
   wird erkannt.
2. Render fragt die geheimen Werte ab (`sync: false`):
   - `ADMIN_PASSWORD` für `playduelio-api`: das Admin-Passwort, mindestens 12 Zeichen,
     aus dem Passwort-Manager.
   - `GITHUB_TOKEN` für `playduelio`: ein GitHub-Token mit `read:packages` für die
     privaten `@css-ch`-Pakete.
3. **Apply.** Render legt Datenbank, Backend und Static Site an, verbindet
   `DATABASE_URL` automatisch und deployt `main`.
4. Prüfen: `https://playduelio-api.onrender.com/health` liefert `{"status":"ok"}`,
   `https://playduelio.onrender.com` zeigt das Spiel, `/admin` die Anmeldung.

Bekommt ein Dienst eine andere URL als in der Tabelle (Render hängt bei Namens-
kollisionen ein Suffix an): `CORS_ORIGINS` in `render.yaml` und die Backend-Adresse in
`frontend/src/environments/environment.ts` anpassen und pushen.

Wenn die Dienste schon existieren (z. B. die Static Site mit der QR-URL), den Blueprint
trotzdem anwenden: Render übernimmt bestehende Dienste gleichen Namens und gleicht nur
die Einstellungen ab.

## 2. Was die Dienste tun

**Backend** (`rootDir: backend`): `npm ci --include=dev && npm run build`, dann
`npm run start:prod`. Beim Start legt es fehlende Tabellen per Migration an, liest
die Spielregeln aus der Datenbank. Health-Check auf `/health`.
Es startet nur mit gültiger Konfiguration, sonst steht im Log genau, was fehlt.

| Variable               | Bedeutung                                                                |
| ---------------------- | ------------------------------------------------------------------------ |
| `NODE_ENV`             | `production`: erzwingt Datenbank, CORS und Passwort                      |
| `DATABASE_URL`         | interne URL der Render-Datenbank (automatisch)                           |
| `CORS_ORIGINS`         | exakte Frontend-URL ohne `/`, mehrere mit Komma                          |
| `ADMIN_PASSWORD`       | das Admin-Passwort, mindestens 12 Zeichen; ändern = Variable ändern, der Dienst startet neu und alle Anmeldungen enden |

**Frontend** (`rootDir: frontend`): `npm ci && npm run build`, veröffentlicht
`dist/frontend/browser`. Jede Adresse wird auf `index.html` umgeschrieben (Angular
Router), dazu die Security-Header aus dem Blueprint.

**Datenbank:** PostgreSQL 18, Plan Basic-256mb (der Gratis-Plan wird nach 30 Tagen
gelöscht). Render sichert sie täglich; Wiederherstellung unter *Backups* im
Dashboard der Datenbank.

## 3. Automatische Deploys

Beide Dienste deployen `main` mit **Auto-Deploy: After CI Checks Pass**
(`autoDeployTrigger: checksPass` im Blueprint). Nur was die GitHub-Actions-CI
bestanden hat, geht live.

Auf GitHub (einmalig, von Hand):

- *Settings → Secrets and variables → Actions*: Secret **`CSS_PACKAGES_TOKEN`**
  (GitHub-Token mit `read:packages`), damit die CI die `@css-ch`-Pakete installieren kann.
  Dasselbe Token unter *Dependabot secrets* als **`CSS_PACKAGES_TOKEN`**, damit
  Dependabot die Frontend-Updates prüfen kann.
- *Settings → Branches → Branch protection rule* für `main`: «Require status checks to
  pass» mit den Checks *Shared contracts*, *Backend*, *Frontend* und *End-to-end*;
  «Do not allow force pushes»; optional «Require a pull request before merging».

## 4. Nach dem ersten Deploy

- Fragen erfassen oder per CSV importieren (**Fragen → Importieren**; eine Vorlage
  liefert **Exportieren**).
- Spielregeln prüfen; sie gelten ab dem nächsten Duell.
- Mit zwei Geräten ein Duell spielen, dann unter **Auswertung** die Zahlen sehen.

Alles Weitere zum laufenden Betrieb steht in [BETRIEB.md](BETRIEB.md).

## 5. Direkt an die Datenbank

Für Notfälle gibt es Drizzle Studio: in Render bei der Datenbank die **External
Database URL** kopieren und lokal starten:

```bash
DATABASE_URL='<External Database URL>' npm --prefix backend run db:studio
```

- Tabelle `questions`: Fragen; `active` nimmt sie aus dem Spiel. `options` sind genau
  vier Antworten, `correct_index` die Position der richtigen (0–3).
- Tabelle `settings` (eine Zeile): Spielregeln. Direkt geänderte Werte liest das
  Backend erst beim nächsten Start.

Die Datenbank ganz leeren (Übergabe, Neustart): siehe
[BETRIEB.md, «Datenbank zurücksetzen»](BETRIEB.md#datenbank-zurücksetzen).

## Kosten sparen

Wenn länger nicht gespielt wird: Backend auf **Free** zurückstellen (schläft nach
15 Min. ein, der erste Aufruf dauert dann ~1 Min.). Die URLs bleiben gleich. Die
Datenbank behalten, damit Fragen und Statistik erhalten bleiben.
