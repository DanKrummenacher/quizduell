import {
  type APIRequestContext,
  type Browser,
  type BrowserContextOptions,
  expect,
  type Page,
} from '@playwright/test';

export const API_URL = 'http://localhost:3100';
export const ADMIN_PASSWORD = 'e2e-admin-password';

export const FAST_SETTINGS = {
  questionsPerGame: 3,
  questionDurationSec: 6,
  revealDurationSec: 2,
  speedBonusEnabled: true,
  rematchTimeoutSec: 20,
  idleResetSec: 0,
};

let cachedToken: string | null = null;

/** Logs in once per test worker; the login endpoint is rate limited. */
export async function adminToken(request: APIRequestContext): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }
  const response = await request.post(`${API_URL}/api/admin/auth/login`, {
    data: { password: ADMIN_PASSWORD },
  });
  expect(response.ok()).toBeTruthy();
  cachedToken = ((await response.json()) as { token: string }).token;
  return cachedToken;
}

/** Fresh question set and fast settings so games finish quickly. */
export async function prepareBackend(
  request: APIRequestContext,
  settings: Partial<typeof FAST_SETTINGS> = {},
): Promise<void> {
  const token = await adminToken(request);
  const headers = { Authorization: `Bearer ${token}` };
  await request.delete(`${API_URL}/api/admin/questions`, { headers });
  const imported = await request.post(
    `${API_URL}/api/admin/questions/import-samples`,
    { headers },
  );
  expect(imported.ok()).toBeTruthy();
  const saved = await request.put(`${API_URL}/api/admin/settings`, {
    headers,
    data: { ...FAST_SETTINGS, ...settings },
  });
  expect(saved.ok()).toBeTruthy();
}

export async function removeAllQuestions(request: APIRequestContext): Promise<void> {
  const token = await adminToken(request);
  await request.delete(`${API_URL}/api/admin/questions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function newPlayer(
  browser: Browser,
  options: BrowserContextOptions = {},
): Promise<Page> {
  const context = await browser.newContext(options);
  return context.newPage();
}

export async function enterName(page: Page, name: string): Promise<void> {
  await page.goto('/');
  const input = page.locator('css-input-text input');
  await input.fill(name);
  await page.getByRole('button', { name: /Los geht/i }).click();
  await expect(page).toHaveURL(/\/lobby$/);
}

/** Creates a friend game and returns its code. */
export async function createFriendGame(page: Page): Promise<string> {
  await page.getByRole('button', { name: /Freund herausfordern/ }).click();
  await page.getByRole('button', { name: /Spiel erstellen/ }).click();
  await expect(page).toHaveURL(/\/spiel$/);
  const chars = page.locator('app-game-waiting .char');
  await expect(chars).toHaveCount(4);
  return (await chars.allTextContents()).map((c) => c.trim()).join('');
}

export async function joinByLink(
  page: Page,
  code: string,
  name: string,
): Promise<void> {
  await page.goto(`/?code=${code}`);
  await expect(page.getByText('Du wurdest zum Duell eingeladen')).toBeVisible();
  const input = page.locator('css-input-text input');
  await input.fill(name);
  await page.getByRole('button', { name: /Los geht/i }).click();
  await expect(page).toHaveURL(/\/spiel$/);
}

export async function waitForQuestion(page: Page, number: number): Promise<void> {
  await expect(page.getByText(`Frage ${number} von`)).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator('button.answer.state-idle').first()).toBeVisible();
}

export async function answer(page: Page, index: number): Promise<void> {
  await page.locator('button.answer').nth(index).click();
}

/** The page must never scroll horizontally, on any device. */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'page is wider than the viewport').toBeLessThanOrEqual(0);
}
