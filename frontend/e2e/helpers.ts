import {
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  expect,
  type Page,
} from '@playwright/test';

const API_URL = 'http://localhost:3100';

export const FAST_SETTINGS = {
  questionsPerGame: 3,
  questionDurationSec: 6,
  revealDurationSec: 2,
  speedBonusEnabled: true,
  rematchTimeoutSec: 20,
  idleResetSec: 0,
};

/** Fresh question set and fast settings so games finish quickly. */
export async function prepareBackend(
  request: APIRequestContext,
  settings: Partial<typeof FAST_SETTINGS> = {},
): Promise<void> {
  await removeAllQuestions(request);
  const imported = await request.post(`${API_URL}/api/test/questions/samples`);
  expect(imported.ok()).toBeTruthy();
  const saved = await request.put(`${API_URL}/api/test/settings`, {
    data: { ...FAST_SETTINGS, ...settings },
  });
  expect(saved.ok()).toBeTruthy();
}

export async function removeAllQuestions(request: APIRequestContext): Promise<void> {
  const removed = await request.delete(`${API_URL}/api/test/questions`);
  expect(removed.ok()).toBeTruthy();
}

const openContexts = new Set<BrowserContext>();

export async function newPlayer(
  browser: Browser,
  options: BrowserContextOptions = {},
): Promise<Page> {
  const context = await browser.newContext(options);
  openContexts.add(context);
  context.on('close', () => openContexts.delete(context));
  return context.newPage();
}

/** Closes every player opened during a test so no sockets linger. */
export async function closePlayers(): Promise<void> {
  await Promise.all([...openContexts].map((context) => context.close()));
  openContexts.clear();
}

export async function enterName(page: Page, name: string): Promise<void> {
  await page.goto('/');
  await page.locator('css-input-text input').fill(name);
  await page.locator('css-button', { hasText: /Los Geht/i }).click();
  await expect(page).toHaveURL(/\/lobby$/);
}

/** Creates a friend game and returns its code. */
export async function createFriendGame(page: Page): Promise<string> {
  await page.getByText('Freund herausfordern').first().click();
  await page.getByText('Spiel erstellen').first().click();
  await expect(page.getByText('Spiel erstellt')).toBeVisible();
  return readGameCode(page);
}

/** Reads the code of «Spiel erstellt» from its boxes. */
export async function readGameCode(page: Page): Promise<string> {
  const code = page.locator('.code-boxes');
  await expect(code).toHaveAttribute('aria-label', /^Code [A-Z2-9]{4}$/);
  return ((await code.getAttribute('aria-label')) ?? '').replace('Code ', '');
}

export async function joinByCode(
  page: Page,
  code: string,
  name: string,
): Promise<void> {
  await enterName(page, name);
  await page.getByText('Freund herausfordern').first().click();
  // The fourth character joins by itself.
  await page.locator('#friendCode').fill(code);
}

export async function waitForQuestion(page: Page, number: number): Promise<void> {
  // The quiz header shows the question number as «3/7» in its diamond.
  await expect(page.locator('app-quiz-status .clock-value')).toHaveText(
    new RegExp(`^${number}/`),
    { timeout: 25_000 },
  );
  await expect(
    page.locator('button.answer-card:not([disabled])').first(),
  ).toBeVisible();
}

export async function answer(page: Page, index: number): Promise<void> {
  await page.locator('button.answer-card').nth(index).click();
}

/** The page must never scroll horizontally, on any device. */
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'page is wider than the viewport').toBeLessThanOrEqual(0);
}
