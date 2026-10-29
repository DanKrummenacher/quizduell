# Deployment auf Render

playduelio läuft auf Render in zwei Umgebungen, alle Dienste in der Region
**Frankfurt**. Sie sind als Blueprint in [`render.yaml`](../render.yaml) beschrieben.

**Produktion** (die URL auf den QR-Codes):

| Dienst           | Render-Typ  | Name             | URL                                   | Kosten (ca.)     |
| ---------------- | ----------- | ---------------- | ------------------------------------- | ---------------- |
| Frontend (Spiel) | Static Site | `playduelio`     | `https://playduelio.onrender.com`     | gratis           |
| Backend (API)    | Web Service | `playduelio-api` | `https://playduelio-api.onrender.com` | Starter ~7 $/Mt. |
| Datenbank        | PostgreSQL  | `playduelio-db`  | nur intern                            | Basic ~6 $/Mt.   |

**Test** (gleicher Code, eigene Daten, eigenes Admin-Passwort; zum Ausprobieren vor
der Freigabe):

| Dienst           | Render-Typ  | Name                  | URL                                        | Kosten (ca.)             |
| ---------------- | ----------- | --------------------- | ------------------------------------------ | ------------------------ |
| Frontend (Spiel) | Static Site | `playduelio-test`     | `https://playduelio-test.onrender.com`     | gratis                   |
| Backend (API)    | Web Service | `playduelio-api-test` | `https://playduelio-api-test.onrender.com` | Free (schläft ein)       |
| Datenbank        | PostgreSQL  | `playduelio-db-test`  | nur intern                                 | Free oder Basic ~6 $/Mt. |

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

| Variable         | Bedeutung                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`       | `production`: erzwingt Datenbank, CORS und Passwort                                                                    |
| `DATABASE_URL`   | interne URL der Render-Datenbank (automatisch)                                                                         |
| `CORS_ORIGINS`   | exakte Frontend-URL ohne `/`, mehrere mit Komma                                                                        |
| `ADMIN_PASSWORD` | das Admin-Passwort, mindestens 12 Zeichen; ändern = Variable ändern, der Dienst startet neu und alle Anmeldungen enden |

**Frontend** (`rootDir: frontend`): `npm ci && npm run build`, veröffentlicht
`dist/frontend/browser`. Jede Adresse wird auf `index.html` umgeschrieben (Angular
Router), dazu die Security-Header aus dem Blueprint.

**Datenbank:** PostgreSQL 18, Plan Basic-256mb (der Gratis-Plan wird nach 30 Tagen
gelöscht). Render sichert sie täglich; Wiederherstellung unter _Backups_ im
Dashboard der Datenbank.

## 3. Deploy-Pipeline

Render deployt nicht mehr von selbst (Auto-Deploy ist auf allen Diensten aus).
GitHub steuert die Deploys über die Render-API mit dem Workflow [`deploy.yml`](../.github/workflows/deploy.yml):

1. Ein Merge auf `main` startet die CI. Ist sie grün, deployt der Workflow die
   **Test-Umgebung** und wartet, bis `/health` den neuen Commit meldet.
2. Danach wartet der Job **Production** auf eine Freigabe: GitHub → _Actions_ →
   Lauf «Deploy» → **Review deployments** → `production` → **Approve and deploy**.
   Wer freigeben darf, steht in _Settings → Environments → production_.
3. Die Produktion wird deployt und ebenfalls auf den neuen Commit geprüft.

Ein Deploy lässt sich auch von Hand starten: _Actions → Deploy → Run workflow_.
Ohne Freigabe bleibt die Produktion auf dem alten Stand; offene Freigaben verfallen
nach 30 Tagen.

Auf GitHub (einmalig, von Hand):

- _Settings → Secrets and variables → Actions_:
  - **`CSS_PACKAGES_TOKEN`** (GitHub-Token mit `read:packages`), damit die CI die
    `@css-ch`-Pakete installieren kann. Dasselbe Token unter _Dependabot secrets_.
  - **`RENDER_API_KEY`**: ein API-Key aus Render (_Account Settings → API Keys_),
    mit dem der Workflow die Deploys startet. Der Key ist ein Geheimnis.
- _Settings → Secrets and variables → Actions → Variables_: die Render-Service-IDs
  (`srv-…`, in Render in der URL des Dienstes) als **`RENDER_SERVICE_PROD_API`**,
  **`RENDER_SERVICE_PROD_WEB`**, **`RENDER_SERVICE_TEST_API`** und
  **`RENDER_SERVICE_TEST_WEB`**.
- _Settings → Environments_: `test` ohne Schutz, `production` mit **Required
  reviewers** (die Person, die freigibt) und nur vom Branch `main`.
- _Settings → Rules → Rulesets_, Ruleset `main`: Pull Request Pflicht, nur Squash-Merge,
  lineare Historie, die vier Checks _Shared contracts_, _Backend_, _Frontend_ und
  _End-to-end_ müssen grün und der Branch aktuell sein; kein Löschen, kein Force-Push.

Weitere Workflows: `uptime.yml` prüft die Produktion alle 30 Minuten und eröffnet bei
einem Ausfall ein Issue «incident»; `dependabot-automerge.yml` mergt Minor- und
Patch-Updates bei grüner CI; `release.yml` macht aus einem Tag `v1.2.3` ein
GitHub-Release mit den Notizen aus dem CHANGELOG; `pr-title.yml` prüft den PR-Titel;
`dependency-review.yml` blockiert neue Pakete mit bekannten Schwachstellen.

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
