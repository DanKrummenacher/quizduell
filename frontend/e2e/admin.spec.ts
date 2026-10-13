import { expect, type Page, test } from '@playwright/test';
import { ADMIN_PASSWORD, prepareBackend } from './helpers';

async function login(page: Page): Promise<void> {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.locator('css-input-text input').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page).toHaveURL(/\/admin\/uebersicht$/);
}

test.describe('admin area', () => {
  test.beforeEach(async ({ request }) => {
    await prepareBackend(request);
  });

  test('rejects a wrong password', async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('css-input-text input').fill('falsch');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    await expect(page.getByText('Das Passwort ist falsch.')).toBeVisible();
  });

  test('shows the live dashboard', async ({ page }) => {
    await login(page);
    await expect(page.getByText('Alles bereit.')).toBeVisible();
    await expect(page.getByText('Aktive Fragen')).toBeVisible();
    await expect(page.getByText('Geräte verbunden')).toBeVisible();
  });

  test('creates, edits, deactivates and deletes a question', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Fragen' }).click();
    await expect(page.getByRole('heading', { name: 'Fragen' })).toBeVisible();

    await page.getByRole('button', { name: 'Neue Frage' }).click();
    const dialog = page.locator('app-question-editor');
    await dialog.getByRole('button', { name: 'Frage erstellen' }).click();
    await expect(
      dialog.getByText('Die Frage braucht mindestens 5 Zeichen.'),
    ).toBeVisible();

    await dialog
      .locator('css-input-textarea textarea')
      .fill('Wie viele Beine hat eine Spinne?');
    const answers = dialog.locator('.answer-input input');
    await answers.nth(0).fill('6');
    await answers.nth(1).fill('8');
    await answers.nth(2).fill('10');
    await answers.nth(3).fill('8');
    await dialog.getByRole('button', { name: 'Frage erstellen' }).click();
    await expect(dialog.getByText('Diese Antwort gibt es schon.')).toBeVisible();

    await answers.nth(3).fill('12');
    await dialog.locator('css-toggle-group').getByText('B', { exact: true }).click();
    await dialog.locator('.category input').fill('Natur');
    await dialog.getByRole('button', { name: 'Frage erstellen' }).click();
    await expect(page.getByText('Frage erstellt.')).toBeVisible();

    const item = page.locator('.item', {
      hasText: 'Wie viele Beine hat eine Spinne?',
    });
    await expect(item).toBeVisible();
    await expect(item.locator('.option.correct')).toContainText('8');

    await item.getByRole('button', { name: 'Frage bearbeiten' }).click();
    await dialog
      .locator('css-input-textarea textarea')
      .fill('Wie viele Beine hat eine Spinne genau?');
    await dialog.getByRole('button', { name: 'Speichern' }).click();
    await expect(page.getByText('Änderungen gespeichert.')).toBeVisible();

    const edited = page.locator('.item', {
      hasText: 'Wie viele Beine hat eine Spinne genau?',
    });
    await edited.locator('css-switch label').click();
    await expect(edited.getByText('Inaktiv')).toBeVisible();

    await edited.getByRole('button', { name: 'Frage löschen' }).click();
    await page.getByRole('button', { name: 'Endgültig löschen' }).click();
    await expect(page.getByText('Frage gelöscht.')).toBeVisible();
    await expect(edited).toHaveCount(0);
  });

  test('saves settings', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'Einstellungen' }).click();
    const stepper = page.locator('css-input-stepper', {
      hasText: 'Sekunden pro Frage',
    });
    await stepper.locator('input').fill('15');
    await page.getByRole('button', { name: 'Speichern' }).click();
    await expect(
      page.getByText('Gespeichert. Gilt ab dem nächsten Duell.'),
    ).toBeVisible();

    await page.goto('/');
    await expect(page.getByText('15 Sek. pro Frage')).toBeVisible();
  });

  test('logs out', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Abmelden' }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    await page.goto('/admin/fragen');
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
