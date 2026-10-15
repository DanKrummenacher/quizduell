import { type Browser, devices, expect, type Page, test } from '@playwright/test';
import {
  answer,
  createFriendGame,
  enterName,
  expectNoHorizontalOverflow,
  joinByCode,
  newPlayer,
  prepareBackend,
  removeAllQuestions,
  waitForQuestion,
  closePlayers,
} from './helpers';

const phone = { ...devices['iPhone 15'], defaultBrowserType: undefined };

/** Anna and Ben in a running friend duel, both at the first question. */
async function startDuel(browser: Browser): Promise<[Page, Page]> {
  const anna = await newPlayer(browser, phone);
  const ben = await newPlayer(browser, phone);
  await enterName(anna, 'Anna');
  const code = await createFriendGame(anna);
  await joinByCode(ben, code, 'Ben');
  await waitForQuestion(anna, 1);
  await waitForQuestion(ben, 1);
  return [anna, ben];
}

/** Answers all three questions so both players reach the result screen. */
async function playToResult(anna: Page, ben: Page): Promise<void> {
  for (let number = 1; number <= 3; number++) {
    await waitForQuestion(anna, number);
    await waitForQuestion(ben, number);
    await answer(anna, 0);
    await answer(ben, 1);
  }
  await expect(anna.locator('.result-title')).toBeVisible({ timeout: 20_000 });
  await expect(ben.locator('.result-title')).toBeVisible({ timeout: 20_000 });
}

const aborted = 'Schade! Spiel abgebrochen';
const tablet = { ...devices['iPad (gen 11)'], defaultBrowserType: undefined };

test.afterEach(closePlayers);

test.describe('playing duels', () => {
  test.beforeEach(async ({ request }) => {
    await prepareBackend(request);
  });

  test('friend duel from code to rematch (phone vs. tablet)', async ({
    browser,
  }) => {
    const anna = await newPlayer(browser, phone);
    const ben = await newPlayer(browser, tablet);

    await enterName(anna, 'Anna');
    await expect(anna.getByText('Hallo Anna')).toBeVisible();
    const code = await createFriendGame(anna);
    await expectNoHorizontalOverflow(anna);

    await joinByCode(ben, code, 'Ben');
    await expect(anna.getByText('Gegner gefunden!')).toBeVisible();
    await expect(anna.locator('.opponent-name')).toHaveText('Ben');

    for (let number = 1; number <= 3; number++) {
      await waitForQuestion(anna, number);
      await waitForQuestion(ben, number);
      await expectNoHorizontalOverflow(anna);
      await expectNoHorizontalOverflow(ben);

      await answer(anna, 0);
      await expect(anna.getByText('Warte auf den Gegner...')).toBeVisible();
      await answer(ben, 1);

      const feedback = /Richtig! \+\d+ Punkte|Falsch! \+0 Punkte/;
      await expect(anna.locator('.feedback-wrapper')).toHaveText(feedback);
      await expect(ben.locator('.feedback-wrapper')).toHaveText(feedback);
      await expect(anna.getByText('Es geht weiter in:')).toBeVisible();
    }

    const outcome = /Gewonnen!|Verloren!|Unentschieden!/;
    await expect(anna).toHaveURL(/\/result$/);
    await expect(anna.locator('.result-title')).toHaveText(outcome);
    await expect(ben.locator('.result-title')).toHaveText(outcome);
    await expect(anna.locator('.player-result-card')).toHaveCount(2);
    await expectNoHorizontalOverflow(anna);

    await anna.locator('css-button', { hasText: 'Revanche fordern' }).click();
    await expect(anna.getByText('Warte auf Ben …')).toBeVisible();
    await expect(ben.getByText('Anna möchte eine Revanche!')).toBeVisible();
    await ben.locator('css-button', { hasText: 'Revanche annehmen!' }).click();
    await expect(anna.getByText('Gegner gefunden!')).toBeVisible();
    await expect(ben.getByText('Gegner gefunden!')).toBeVisible();
    await waitForQuestion(anna, 1);
  });

  test('quick duel: matchmaking and an opponent who disappears', async ({
    browser,
  }) => {
    const anna = await newPlayer(browser, phone);
    const ben = await newPlayer(browser, phone);

    await enterName(anna, 'Anna');
    await anna.getByText('Schnellspiel 1vs1').click();
    await expect(anna.getByText('Suche Gegner...')).toBeVisible();

    await enterName(ben, 'Ben');
    await ben.getByText('Schnellspiel 1vs1').click();

    await expect(anna.getByText('Gegner gefunden!')).toBeVisible();
    await waitForQuestion(anna, 1);
    await waitForQuestion(ben, 1);

    // Ben closes the app; after the grace period Anna is informed.
    await ben.context().close();
    await expect(anna.getByText('Verbindung zu Ben unterbrochen')).toBeVisible({
      timeout: 25_000,
    });
    // Depending on the browser the closed tab says goodbye (left) or not (lost).
    await expect(
      anna.getByText(/Schade! (Verbindung verloren|Spiel abgebrochen)/),
    ).toBeVisible({
      timeout: 40_000,
    });
    await anna.locator('css-button', { hasText: 'Zum Spielmodus' }).click();
    await expect(anna.getByText('Spielmodus')).toBeVisible();
  });

  for (const [label, target] of [
    ['the start page', '/'],
    ['the admin area', '/admin/login'],
    ['an unknown game path', '/quiz/sdfsdfd'],
  ] as const) {
    test(`typing the address of ${label} during a duel ends it for both`, async ({
      browser,
    }) => {
      const [anna, ben] = await startDuel(browser);

      await ben.goto(target);

      // Immediately, not only after the reconnect grace period.
      await expect(anna.getByText(aborted)).toBeVisible({ timeout: 4_000 });
    });
  }

  test('opening another website ends the duel within seconds', async ({
    browser,
  }) => {
    const [anna, ben] = await startDuel(browser);

    await ben.goto('about:blank');

    await expect(anna.getByText('Verbindung zu Ben unterbrochen')).toBeVisible();
    await expect(anna.getByText(aborted)).toBeVisible({ timeout: 9_000 });
  });

  test('a page preloaded while typing an address does not end the duel', async ({
    browser,
  }) => {
    const [anna, ben] = await startDuel(browser);

    // Chrome prerenders pages from the address bar while the visitor is still
    // typing. DevTools (and thus Playwright) disable real prerendering, so the
    // page reports the same state the browser would: prerendering until shown.
    await ben.context().addInitScript(() => {
      let prerendering = true;
      Object.defineProperty(Document.prototype, 'prerendering', {
        configurable: true,
        get: () => prerendering,
      });
      (window as Window & { activate?: () => void }).activate = () => {
        prerendering = false;
        document.dispatchEvent(new Event('prerenderingchange'));
      };
    });
    // A new tab opened by the game tab shares its stored game, like a
    // prerendered page in the same tab does.
    const [preloaded] = await Promise.all([
      ben.waitForEvent('popup'),
      ben.evaluate(() => window.open('/admin/login')),
    ]);
    await expect(preloaded.getByText('Admin-Bereich')).toBeVisible();
    await anna.waitForTimeout(3_000);
    await expect(anna.getByText(aborted)).toHaveCount(0);
    await expect(anna.locator('.question-text')).toBeVisible();

    // Pressing Enter shows the page: only now the duel ends.
    await preloaded.evaluate(() =>
      (window as Window & { activate?: () => void }).activate?.(),
    );
    await expect(anna.getByText(aborted)).toBeVisible({ timeout: 4_000 });
  });

  test('browser back from a running duel ends it for both', async ({ browser }) => {
    const [anna, ben] = await startDuel(browser);

    await ben.goBack();
    await expect(anna.getByText(aborted)).toBeVisible({ timeout: 8_000 });
  });

  test('quick duel: rematch against the same opponent', async ({ browser }) => {
    const anna = await newPlayer(browser, phone);
    const ben = await newPlayer(browser, phone);
    await enterName(anna, 'Anna');
    await anna.getByText('Schnellspiel 1vs1').click();
    await enterName(ben, 'Ben');
    await ben.getByText('Schnellspiel 1vs1').click();
    await playToResult(anna, ben);

    await ben.locator('css-button', { hasText: 'Revanche fordern' }).click();
    await expect(
      anna.getByText(/Ben möchte eine Revanche! \(noch \d+ s\)/),
    ).toBeVisible();
    await anna.locator('css-button', { hasText: 'Revanche annehmen!' }).click();
    await expect(anna.getByText('Gegner gefunden!')).toBeVisible();
    await waitForQuestion(ben, 1);
  });

  test('no rematch when the opponent leaves the result screen', async ({
    browser,
  }) => {
    const [anna, ben] = await startDuel(browser);
    await playToResult(anna, ben);

    await anna.locator('css-button', { hasText: 'Revanche fordern' }).click();
    await ben.locator('css-button', { hasText: 'Zurück zur Lobby' }).click();

    await expect(anna.getByText('Schade! Keine Revanche')).toBeVisible();
    await anna.locator('css-flyout css-button', { hasText: 'OK' }).click();
    await expect(anna.locator('.status-text')).toHaveText(
      'Ben hat das Spiel verlassen.',
    );
    await anna.locator('css-button', { hasText: 'Neues Spiel erstellen' }).click();
    await expect(anna.getByText('Spiel erstellt')).toBeVisible();
  });

  test('a reload on the result screen keeps the rematch', async ({ browser }) => {
    const [anna, ben] = await startDuel(browser);
    await playToResult(anna, ben);

    await ben.reload();
    await expect(ben.locator('.result-title')).toBeVisible();
    await ben.locator('css-button', { hasText: 'Revanche fordern' }).click();
    await anna.locator('css-button', { hasText: 'Revanche annehmen!' }).click();
    await waitForQuestion(anna, 1);
  });

  test('leaving the waiting screen closes the created game', async ({ browser }) => {
    const anna = await newPlayer(browser, phone);
    const ben = await newPlayer(browser, phone);
    await enterName(anna, 'Anna');
    const code = await createFriendGame(anna);

    await anna.goBack();
    await expect(anna).toHaveURL(/\/$/);

    await joinByCode(ben, code, 'Ben');
    await expect(
      ben.getByText('Zu diesem Code gibt es kein offenes Spiel.'),
    ).toBeVisible();
  });

  test('cancelling the search returns to the game modes', async ({ browser }) => {
    const anna = await newPlayer(browser, phone);
    await enterName(anna, 'Anna');
    await anna.getByText('Schnellspiel 1vs1').click();
    await anna.locator('css-button', { hasText: 'Abbrechen' }).click();
    await expect(anna.getByText('Spielmodus')).toBeVisible();
  });

  test('a reload during the duel resumes the game', async ({ browser, request }) => {
    // Longer questions: the reload must finish within the same question.
    await prepareBackend(request, { questionDurationSec: 30 });
    const anna = await newPlayer(browser, phone);
    const ben = await newPlayer(browser, phone);
    await enterName(anna, 'Anna');
    const code = await createFriendGame(anna);
    await joinByCode(ben, code, 'Ben');
    await waitForQuestion(ben, 1);

    await ben.reload();
    await waitForQuestion(ben, 1);
    await expect(ben.getByText('Ben (Du)')).toBeVisible();
    // Still running after the short grace for closed pages.
    await ben.waitForTimeout(6_000);
    await expect(ben.getByText(aborted)).toHaveCount(0);
    await answer(ben, 2);
    await expect(ben.getByText('Warte auf den Gegner...')).toBeVisible();
  });

  test('missing names and wrong codes are explained', async ({ browser }) => {
    const anna = await newPlayer(browser, phone);
    await anna.goto('/');
    await anna.locator('css-button', { hasText: /Los Geht/i }).click();
    await expect(anna.getByText('Bitte gib einen Namen ein.')).toBeVisible();

    await enterName(anna, 'Anna');
    await anna.getByText('Freund herausfordern').first().click();
    await anna.locator('css-input-text#roomCode input').fill('ZZZZ');
    await anna.locator('css-button.join-button').click();
    await expect(
      anna.getByText('Zu diesem Code gibt es kein offenes Spiel.'),
    ).toBeVisible();
  });

  test('offensive names are rejected', async ({ browser }) => {
    const anna = await newPlayer(browser, phone);
    await enterName(anna, 'Arschloch');
    await anna.getByText('Schnellspiel 1vs1').click();
    await expect(anna.getByText('Dieser Name ist nicht erlaubt.')).toBeVisible();
    await anna.locator('css-button', { hasText: 'OK' }).click();
    await expect(anna.getByText('Spielmodus')).toBeVisible();
  });
});

test.describe('without questions', () => {
  test.afterAll(async ({ request }) => {
    await prepareBackend(request);
  });

  test('visitors see a friendly notice', async ({ browser, request }) => {
    await removeAllQuestions(request);
    const anna = await newPlayer(browser, phone);
    await anna.goto('/');
    await expect(anna.getByText('Das Quiz wird gerade vorbereitet.')).toBeVisible();

    await enterName(anna, 'Anna');
    await anna.getByText('Schnellspiel 1vs1').click();
    await expect(anna.getByText('nicht genügend Fragen')).toBeVisible();
  });
});
