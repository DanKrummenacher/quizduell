import { devices, expect, test } from '@playwright/test';
import {
  answer,
  createFriendGame,
  enterName,
  expectNoHorizontalOverflow,
  joinByLink,
  newPlayer,
  prepareBackend,
  removeAllQuestions,
  waitForQuestion,
} from './helpers';

const phone = { ...devices['iPhone 15'], defaultBrowserType: undefined };
const tablet = { ...devices['iPad (gen 11)'], defaultBrowserType: undefined };

test.describe('playing duels', () => {
  test.beforeEach(async ({ request }) => {
    await prepareBackend(request);
  });

  test('friend duel from invitation to rematch (phone vs. tablet)', async ({
    browser,
  }) => {
    const anna = await newPlayer(browser, phone);
    const ben = await newPlayer(browser, tablet);

    await enterName(anna, 'Anna');
    await expect(anna.getByText('Hallo Anna')).toBeVisible();
    const code = await createFriendGame(anna);
    await expect(
      anna.getByRole('img', { name: 'QR-Code zum Beitreten' }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(anna);

    await joinByLink(ben, code, 'Ben');
    await expect(anna.getByText('Gegner gefunden')).toBeVisible();
    await expect(anna.getByText('Ben', { exact: true })).toBeVisible();

    for (let number = 1; number <= 3; number++) {
      await waitForQuestion(anna, number);
      await waitForQuestion(ben, number);
      await expectNoHorizontalOverflow(anna);
      await expectNoHorizontalOverflow(ben);

      await answer(anna, 0);
      await expect(ben.locator('.answered')).toBeVisible();
      await answer(ben, 1);

      await expect(anna.locator('.feedback')).toHaveText(/Richtig|Leider falsch/);
      await expect(ben.locator('.feedback')).toHaveText(/Richtig|Leider falsch/);
    }

    const outcome = /Gewonnen!|Knapp daneben|Unentschieden/;
    await expect(anna.locator('app-game-result h1')).toHaveText(outcome);
    await expect(ben.locator('app-game-result h1')).toHaveText(outcome);
    await expect(anna.locator('app-game-result .row')).toHaveCount(2);
    await expectNoHorizontalOverflow(anna);

    await anna.getByRole('button', { name: 'Revanche' }).click();
    await expect(ben.getByText('Anna will eine Revanche!')).toBeVisible();
    await ben.getByRole('button', { name: 'Revanche annehmen' }).click();
    await expect(anna.getByText('Revanche!')).toBeVisible();
    await expect(ben.getByText('Revanche!')).toBeVisible();
  });

  test('quick duel: matchmaking and giving up', async ({ browser }) => {
    const anna = await newPlayer(browser, phone);
    const ben = await newPlayer(browser, phone);

    await enterName(anna, 'Anna');
    await anna.getByRole('button', { name: /Schnelles Duell/ }).click();
    await expect(anna.getByText('Suche Gegner')).toBeVisible();

    await enterName(ben, 'Ben');
    await ben.getByRole('button', { name: /Schnelles Duell/ }).click();

    await expect(anna).toHaveURL(/\/spiel$/);
    await waitForQuestion(ben, 1);

    await ben.getByRole('button', { name: /Aufgeben/ }).click();
    await expect(ben.getByText('Spiel wirklich verlassen?')).toBeVisible();
    await ben.getByRole('button', { name: 'Verlassen', exact: true }).click();
    await expect(ben).toHaveURL(/\/lobby$/);

    await expect(anna.getByText('Ben hat das Spiel verlassen.')).toBeVisible();
    await anna.getByRole('button', { name: /Zum Menü/ }).click();
    await expect(anna).toHaveURL(/\/lobby$/);
  });

  test('cancelling the search returns to the menu', async ({ browser }) => {
    const anna = await newPlayer(browser, phone);
    await enterName(anna, 'Anna');
    await anna.getByRole('button', { name: /Schnelles Duell/ }).click();
    await anna.getByRole('button', { name: 'Abbrechen' }).click();
    await expect(anna.getByText('Wie möchtest du spielen?')).toBeVisible();
  });

  test('a reload during the duel resumes the game', async ({ browser, request }) => {
    // Longer questions: the reload must finish within the same question.
    await prepareBackend(request, { questionDurationSec: 30 });
    const anna = await newPlayer(browser, phone);
    const ben = await newPlayer(browser, phone);
    await enterName(anna, 'Anna');
    const code = await createFriendGame(anna);
    await joinByLink(ben, code, 'Ben');
    await waitForQuestion(ben, 1);

    await ben.reload();
    await waitForQuestion(ben, 1);
    await expect(ben.getByText('Ben (Du)')).toBeVisible();
    await answer(ben, 2);
    await expect(anna.locator('.answered')).toBeVisible();
  });

  test('wrong codes and missing names are explained', async ({ browser }) => {
    const anna = await newPlayer(browser, phone);
    await anna.goto('/');
    await anna.getByRole('button', { name: /Los geht/i }).click();
    await expect(anna.getByText('Bitte gib deinen Namen ein.')).toBeVisible();

    await enterName(anna, 'Anna');
    await anna.getByRole('button', { name: /Freund herausfordern/ }).click();
    await anna.locator('css-input-text input').fill('ZZZZ');
    await anna.getByRole('button', { name: 'Beitreten' }).click();
    await expect(
      anna.getByText('Zu diesem Code gibt es kein offenes Spiel.'),
    ).toBeVisible();
  });

  test('offensive names are rejected', async ({ browser }) => {
    const anna = await newPlayer(browser, phone);
    await enterName(anna, 'Arschloch');
    await anna.getByRole('button', { name: /Schnelles Duell/ }).click();
    await expect(anna.getByText('Dieser Name ist nicht erlaubt.')).toBeVisible();
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
    await expect(anna.getByText('Das Spiel wird gerade vorbereitet.')).toBeVisible();

    await enterName(anna, 'Anna');
    await anna.getByRole('button', { name: /Schnelles Duell/ }).click();
    await expect(anna.getByText('nicht genügend Fragen')).toBeVisible();
  });
});
