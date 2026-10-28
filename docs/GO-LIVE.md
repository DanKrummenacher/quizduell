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

## 4. Render: Dienste per Blueprint anlegen (10 Min.)

1. Render → **New** → **Blueprint** → Repository `quizduell` verbinden (GitHub-Zugriff erlauben).
2. Render liest `render.yaml` und zeigt drei Dienste: `playduelio-api`, `playduelio`, `playduelio-db`.
3. Es fragt zwei Werte:
   - `ADMIN_PASSWORD` bei `playduelio-api`: ein neues Passwort, mindestens 12 Zeichen,
     im Passwort-Manager speichern. Es gilt nur für die erste Anmeldung.
   - `GITHUB_TOKEN` bei `playduelio`: das Token aus Schritt 1.
4. **Apply**. Render baut und deployt; das dauert ein paar Minuten.
5. Prüfen:
   - `https://playduelio-api.onrender.com/health` zeigt `{"status":"ok"}`.
   - `https://playduelio.onrender.com` zeigt das Spiel.
   - `https://playduelio.onrender.com/admin` zeigt die Anmeldung.

Wenn ein Dienst eine andere URL bekommt (Render hängt bei belegten Namen ein Suffix an):
die neue URL mir geben, dann passe ich `render.yaml` und `environment.ts` an.

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
