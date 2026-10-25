import { expect, type Page, test } from '@playwright/test';
import { prepareBackend } from './helpers';

const PASSWORD = 'e2e-admin-password';

let session: string | null = null;

/**
 * Opens an admin page signed in. The session is fetched once: sign-ins are
 * limited to 10 per minute and IP, and only the first test tests the form.
 */
async function signIn(page: Page, path = '/admin'): Promise<void> {
  if (!session) {
    const response = await page.request.post(
      'http://localhost:3100/api/admin/login',
      {
        data: { password: PASSWORD },
      },
    );
    expect(response.ok()).toBeTruthy();
    session = JSON.stringify(await response.json());
  }
  await page.addInitScript((value) => {
    localStorage.setItem('playduelio.admin.session', value);
  }, session);
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

test.describe('admin', () => {
  test.beforeEach(async ({ request }) => {
    await prepareBackend(request);
  });

  test('signs in with the admin password and back out', async ({ page }) => {
    await page.goto('/admin/fragen');
    await expect(page).toHaveURL(/\/admin\/anmelden\?weiter=%2Fadmin%2Ffragen/);

    await page.getByLabel('Admin-Passwort').fill('falsch');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    await expect(page.getByRole('alert')).toHaveText('Das Passwort stimmt nicht.');

    await page.getByLabel('Admin-Passwort').fill(PASSWORD);
    await page.getByRole('button', { name: 'Anmelden' }).click();
    await expect(page).toHaveURL(/\/admin\/fragen$/);
    await expect(
      page.getByRole('heading', { name: 'Fragen', level: 1 }),
    ).toBeVisible();

    // A reload keeps the session.
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Fragen', level: 1 }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Abmelden' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Abmelden' }).click();
    await expect(page).toHaveURL(/\/admin\/anmelden/);
    await expect(page.getByText('Du bist abgemeldet.')).toBeVisible();
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/anmelden/);
  });

  test('every area loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });
    await signIn(page);
    const areas = [
      ['Übersicht', /^Guten (Morgen|Tag|Abend), Admin$/],
      ['Live', 'Live'],
      ['Fragen', 'Fragen'],
      ['Hinweise', 'Hinweise'],
      ['Auswertung', 'Auswertung'],
      ['Spielregeln', 'Spielregeln'],
      ['Verlauf', 'Verlauf'],
    ] as const;
    for (const [link, heading] of areas) {
      await page
        .getByRole('navigation', { name: 'Bereiche' })
        .getByRole('link', { name: link })
        .click();
      await expect(
        page.getByRole('heading', { name: heading, level: 1 }),
      ).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('creates, pauses, deletes and restores a question', async ({ page }) => {
    await signIn(page, '/admin/fragen');
    await page.getByRole('button', { name: 'Neue Frage' }).click();
    const editor = page.getByRole('dialog', { name: 'Frage erfassen' });

    // Nothing is saved while something is missing.
    await editor.getByRole('button', { name: 'Speichern', exact: true }).click();
    await expect(editor.getByText('Die Frage fehlt.')).toBeVisible();

    await editor
      .getByLabel('Frage', { exact: true })
      .fill('Wie heisst die Hauptstadt von Kanada?');
    const answers = ['Toronto', 'Ottawa', 'Vancouver', 'Montreal'];
    for (const [index, answer] of answers.entries()) {
      await editor
        .getByLabel(`Antwort ${'ABCD'[index]}`, { exact: true })
        .fill(answer);
    }
    await editor.getByLabel('Antwort B ist richtig').check();
    await editor.getByLabel('Kategorie').fill('Geografie');
    await editor.getByRole('button', { name: 'Speichern', exact: true }).click();
    await expect(editor).toBeHidden();

    await page.getByRole('searchbox', { name: 'Fragen durchsuchen' }).fill('Kanada');
    const row = page.getByRole('row', { name: /Hauptstadt von Kanada/ });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('Ottawa');

    await row.getByRole('switch').click();
    await expect(row.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByText(/pausiert$/).first()).toBeVisible();

    await row.getByRole('button', { name: /Hauptstadt von Kanada/ }).click();
    const edit = page.getByRole('dialog', { name: 'Frage bearbeiten' });
    await edit.getByRole('button', { name: 'Löschen' }).click();
    await page
      .getByRole('dialog', { name: /löschen\?/ })
      .getByRole('button', { name: 'Löschen', exact: true })
      .click();
    await expect(edit).toBeHidden();
    await expect(page.getByText('Keine Frage passt')).toBeVisible();

    // The deleted question waits in the trash and comes back from there.
    await page.getByRole('button', { name: /^Papierkorb/ }).click();
    const trash = page.getByRole('dialog', { name: 'Papierkorb' });
    const trashed = trash.getByRole('listitem').filter({ hasText: 'Kanada' });
    await trashed.getByRole('button', { name: 'Wiederherstellen' }).click();
    await expect(trashed).toBeHidden();
    await trash.getByRole('button', { name: 'Schliessen' }).first().click();
    await expect(row).toHaveCount(1);
  });

  test('changes a rule and restores it from the history', async ({ page }) => {
    await signIn(page, '/admin/regeln');
    await page.getByRole('button', { name: 'Fragen pro Duell erhöhen' }).click();
    await expect(page.getByText('Fragen pro Duell 3 → 4')).toBeVisible();
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByText(/Spielregeln gespeichert/)).toBeVisible();

    await page.getByRole('link', { name: 'Frühere Regeln' }).click();
    // The log keeps the entries of earlier runs against the same backend.
    await expect(page.getByText('Spielregeln geändert').first()).toBeVisible();
    await page
      .getByRole('button', { name: 'Davor wiederherstellen' })
      .first()
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Wiederherstellen' })
      .click();
    await expect(
      page.getByText('Frühere Spielregeln wiederhergestellt').first(),
    ).toBeVisible();
  });

  test('fits a phone screen', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();
    await signIn(page);
    for (const path of [
      '',
      '/live',
      '/fragen',
      '/hinweise',
      '/auswertung',
      '/regeln',
      '/verlauf',
    ]) {
      await page.goto(`/admin${path}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width, `/admin${path}`).toBeLessThanOrEqual(375);
    }
    await context.close();
  });
});
