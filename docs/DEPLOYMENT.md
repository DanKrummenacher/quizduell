# Deployment auf Render

playduelio besteht auf Render aus drei Diensten, alle in der Region **Frankfurt**:

| Dienst              | Render-Typ   | Name (Vorschlag)  | URL                                  | Kosten (ca.)   |
| ------------------- | ------------ | ----------------- | ------------------------------------ | -------------- |
| Frontend (Spiel)    | Static Site  | `playduelio`      | `https://playduelio.onrender.com`    | gratis         |
| Backend (API)       | Web Service  | `playduelio-api`  | `https://playduelio-api.onrender.com`| Starter ~7 $/Mt|
| Datenbank           | PostgreSQL   | `playduelio-db`   | nur intern                           | Basic ~6 $/Mt  |

> **Die URL des Frontends ist die URL für den QR-Code.** Die Static Site darf nie
> gelöscht oder neu erstellt werden. Repo, Branch, Build-Befehle und Plan können
> jederzeit in den Einstellungen geändert werden, ohne dass sich die URL ändert.

## 1. Datenbank erstellen

1. Render → **New → Postgres**
2. Name `playduelio-db`, Region **Frankfurt (EU Central)**, PostgreSQL 17
3. Plan **Basic-256mb** (der Gratis-Plan wird nach 30 Tagen gelöscht!)
4. Nach dem Erstellen die **Internal Database URL** kopieren

Die Tabellen legt das Backend beim Start automatisch an (Migrationen).

## 2. Backend erstellen

Render → **New → Web Service** → Repository `quizduell` verbinden.

| Feld              | Wert                                         |
| ----------------- | -------------------------------------------- |
| Name              | `playduelio-api`                             |
| Region            | Frankfurt (EU Central) – *nicht änderbar*    |
| Branch            | `main`                                       |
| Root Directory    | `backend`                                    |
| Runtime           | Node                                         |
| Build Command     | `npm ci --include=dev && npm run build`      |
| Start Command     | `npm run start:prod`                         |
| Instance Type     | **Starter** (kein Einschlafen)               |
| Health Check Path | `/health` (unter *Advanced*)                 |

**Environment Variables:**

| Variable         | Wert                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| `NODE_VERSION`   | `24`                                                                 |
| `NODE_ENV`       | `production`                                                         |
| `DATABASE_URL`   | Internal Database URL aus Schritt 1                                  |
| `CORS_ORIGINS`   | `https://playduelio.onrender.com` (exakte Frontend-URL, ohne `/`)    |
| `ADMIN_PASSWORD` | Selbst gewähltes Passwort, **mindestens 12 Zeichen**                 |
| `JWT_SECRET`     | Mit dem Button **Generate** erzeugen lassen                          |

Das Backend startet nur, wenn alle Werte gültig sind – sonst steht im Log genau,
was fehlt. Test: `https://playduelio-api.onrender.com/health` liefert `{"status":"ok"}`.

## 3. Frontend (bestehende Static Site) prüfen

| Feld                | Wert                                                    |
| ------------------- | ------------------------------------------------------- |
| Root Directory      | `frontend`                                              |
| Build Command       | `npm ci && npm run build`                               |
| Publish Directory   | `dist/frontend/browser`                                 |
| `GITHUB_TOKEN`      | GitHub-Token mit `read:packages` (für `@css-ch`-Pakete) |
| `NODE_VERSION`      | `24`                                                    |
| Redirects/Rewrites  | `/*` → `/index.html`, Action **Rewrite**                |

Die Backend-Adresse steht in `frontend/src/environments/environment.ts`. Bekommt das
Backend auf Render eine andere URL als `https://playduelio-api.onrender.com`
(z. B. mit Zufallssuffix), dort anpassen und pushen.

## 4. Automatische Deploys absichern

- In beiden Diensten unter *Settings → Build & Deploy*: **Auto-Deploy: After CI Checks Pass**.
  So wird nur deployt, was die GitHub-Actions-CI bestanden hat.
- Damit die CI die privaten `@css-ch`-Pakete installieren kann, im GitHub-Repo unter
  *Settings → Secrets and variables → Actions* das Secret **`CSS_PACKAGES_TOKEN`**
  anlegen (GitHub-Token mit `read:packages`).

## 5. Erste Inbetriebnahme

1. `https://playduelio.onrender.com/admin` öffnen und mit `ADMIN_PASSWORD` anmelden
2. Unter **Fragen** eigene Fragen erfassen (oder testweise *Beispielfragen importieren*)
3. Unter **Einstellungen** Fragen pro Duell, Zeit usw. festlegen
4. Mit zwei Geräten ein Duell spielen

Solange zu wenige aktive Fragen vorhanden sind, zeigt die Startseite einen freundlichen
Hinweis und der Admin-Bereich meldet, wie viele Fragen noch fehlen.

## Passwort oder Secret ändern

Wert in Render unter *Environment* ändern → der Dienst startet automatisch neu.
Ein neues `JWT_SECRET` meldet alle Admin-Sitzungen ab.

## Kosten sparen nach der Messe

- Backend auf **Free** zurückstellen (schläft dann nach 15 Min. ein, erster Aufruf
  dauert ~1 Min.). Die URLs bleiben gleich.
- Die Datenbank behalten, damit Fragen und Statistik erhalten bleiben.
