# Go-live, Schritt für Schritt

Alles im Repository ist vorbereitet. Diese Schritte brauchen deine Konten auf GitHub
und Render und dauern zusammen etwa 30 Minuten. Reihenfolge einhalten.

## 1. GitHub-Token für die Shared Library (5 Min.)

Die privaten `@css-ch`-Pakete brauchen ein Token zum Lesen.

1. GitHub → oben rechts Profilbild → **Settings** → ganz unten **Developer settings**
   → **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
2. Name `playduelio packages`, Ablauf z. B. 1 Jahr, Haken bei **read:packages**, generieren.
3. Token kopieren und im Passwort-Manager als «playduelio css-ch Token» speichern.
   Du brauchst ihn gleich zweimal.

## 2. Secrets im Repository (3 Min.)

1. Repository `quizduell` → **Settings** → **Secrets and variables** → **Actions**
   → **New repository secret**: Name `CSS_PACKAGES_TOKEN`, Wert = das Token aus Schritt 1.
2. Dasselbe unter **Secrets and variables** → **Dependabot** → **New repository secret**:
   Name `CSS_PACKAGES_TOKEN`, Wert = das Token.
3. Prüfen: **Actions** → letzter Lauf auf `main` → bei Bedarf **Re-run all jobs**.
   Alle vier Jobs müssen grün sein: *Shared contracts*, *Backend*, *Frontend*, *End-to-end*.

## 3. Branch-Schutz für `main` (3 Min.)

1. Repository → **Settings** → **Branches** → **Add branch ruleset** (oder *Add rule*).
2. Name `main`, Ziel-Branch `main`.
3. Einschalten: **Require status checks to pass** und die vier Checks aus Schritt 2 auswählen;
   **Block force pushes**. Optional: **Require a pull request before merging**.
4. Speichern.

## 4. Render: Datenbank und Backend anlegen, Static Site einstellen (15 Min.)

Die Static Site `playduelio` existiert schon (ihre URL steht auf den QR-Codes, nie
löschen). Datenbank und Backend kommen neu dazu. Alles im selben Projekt und derselben
Umgebung wie die Static Site anlegen.

**4a. Datenbank**

1. Render → **New** → **Postgres**.
2. Name `playduelio-db`, Project/Environment wie die Static Site, Region **Frankfurt (EU Central)**,
   PostgreSQL **17**, Plan **Basic-256mb** (der Gratis-Plan wird nach 30 Tagen gelöscht).
3. **Create Database** und warten, bis der Status *Available* ist.

**4b. Backend**

1. Render → **New** → **Web Service** → *Build and deploy from a Git repository* →
   Repository `DanKrummenacher/quizduell`.
2. Einstellungen:

   | Feld           | Wert                                      |
   | -------------- | ----------------------------------------- |
   | Name           | `playduelio-api`                          |
   | Region         | Frankfurt (EU Central)                    |
   | Branch         | `main`                                    |
   | Root Directory | `backend`                                 |
   | Language       | Node                                      |
   | Build Command  | `npm ci --include=dev && npm run build`   |
   | Start Command  | `npm run start:prod`                      |
   | Instance Type  | **Starter**                               |

3. **Environment Variables** (Add Environment Variable):

   | Key              | Value                                                     |
   | ---------------- | --------------------------------------------------------- |
   | `NODE_VERSION`   | `24`                                                      |
   | `NODE_ENV`       | `production`                                              |
   | `CORS_ORIGINS`   | `https://playduelio.onrender.com`                         |
   | `ADMIN_PASSWORD` | neues Passwort, mindestens 12 Zeichen, in den Passwort-Manager |
   | `DATABASE_URL`   | *Add from Database* → `playduelio-db` → **Internal Database URL** |

4. **Advanced** aufklappen: **Health Check Path** `/health`.
5. **Deploy Web Service**. Der erste Build dauert ein paar Minuten. Im Log steht am Ende
   `playduelio backend listening on port …`.
6. Danach bei `playduelio-api` → **Settings** → **Build & Deploy** → **Auto-Deploy**:
   **After CI Checks Pass**.
7. Prüfen: `https://playduelio-api.onrender.com/health` zeigt `{"status":"ok"}`.
   Hat der Dienst eine andere URL bekommen, diese mir geben.

**4c. Static Site `playduelio` prüfen**

Bei `playduelio` → **Settings**:

- **Build & Deploy:** Root Directory `frontend`, Build Command `npm ci && npm run build`,
  Publish Directory `dist/frontend/browser`, **Auto-Deploy: After CI Checks Pass**.
- **Environment:** `GITHUB_TOKEN` (ist gesetzt) und `NODE_VERSION` = `24`.
- **Redirects/Rewrites:** eine Regel: Source `/*`, Destination `/index.html`, Action **Rewrite**.
- **Headers**, je für Path `/*`:

  | Name                        | Value                                        |
  | --------------------------- | -------------------------------------------- |
  | `X-Frame-Options`           | `DENY`                                       |
  | `X-Content-Type-Options`    | `nosniff`                                    |
  | `Referrer-Policy`           | `strict-origin-when-cross-origin`            |
  | `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`   |
  | `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`        |

- Zum Schluss **Manual Deploy → Deploy latest commit**, damit der aktuelle Stand live ist.

Prüfen: `https://playduelio.onrender.com` zeigt das Spiel, `/admin` die Anmeldung.

**4d. Aufräumen:** Static Sites, die nicht gebraucht werden (alte Versuche), unter
*Settings → Delete* löschen. `playduelio` bleibt.

`render.yaml` im Repo beschreibt dieselben drei Dienste; es dient als Referenz und zum
Aufbau in einem neuen Workspace (Render → New → Blueprint).

## 5. Erste Anmeldung und eigenes Passwort (3 Min.)

1. `/admin` öffnen, mit `ADMIN_PASSWORD` anmelden.
2. Oben rechts auf das Schloss-Symbol → **Passwort ändern**: bisheriges = `ADMIN_PASSWORD`,
   neues Passwort aus dem Passwort-Manager, speichern.
3. Ab jetzt zählt nur das neue Passwort. Vergessen? → `docs/BETRIEB.md`, «Admin-Passwort».

## 6. Inhalt und Probe (5 Min.)

1. **Fragen**: erfassen oder per CSV importieren (Vorlage: **Exportieren**).
2. **Spielregeln** prüfen (Fragen pro Duell, Zeit pro Frage, automatischer Neustart).
3. Mit zwei Geräten (Handy und Laptop) ein Duell spielen, dann unter **Live** und
   **Auswertung** nachsehen, dass es ankommt.

## 7. Übergabe (5 Min.)

1. Wenn mit leerer Datenbank übergeben wird: in Render bei `playduelio-db` die
   **External Database URL** kopieren und lokal ausführen:
   `DATABASE_URL='<URL>' npm --prefix backend run db:reset -- --yes`
   Danach in Render `playduelio-api` → **Manual Deploy** → **Restart service**.
2. `docs/UEBERGABE.md`: Platzhalter in spitzen Klammern ausfüllen (Konten, Kontakte).
   Passwörter gehören nicht in die Datei, nur in den Passwort-Manager.
3. Zugang zum GitHub-Repository und zum Render-Team an die Betreiberin oder den
   Betreiber geben.

## Fertig

Ab jetzt deployt jeder Push auf `main` automatisch, sobald die CI grün ist. Dependabot
schlägt montags Updates vor. Für den Betrieb vor Ort gilt die Checkliste in
`docs/BETRIEB.md`.
