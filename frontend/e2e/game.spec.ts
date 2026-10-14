import { devices, expect, test } from '@playwright/test';
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

    await anna.locator('css-button', { hasText: 'Erneut Spielen' }).click();
    await expect(anna.getByText('Warte auf den Gegner...')).toBeVisible();
    await expect(ben.getByText('Dein Gegner möchte eine Revanche.')).toBeVisible();
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
    await expect(anna.getByText('Schade! Spiel abgebrochen')).toBeVisible({
      timeout: 40_000,
    });
    await anna.locator('css-button', { hasText: 'Zum Spielmodus' }).click();
    await expect(anna.getByText('Spielmodus')).toBeVisible();
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
