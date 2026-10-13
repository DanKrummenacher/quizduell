import {
  type BrowserContextOptions,
  devices,
  expect,
  type Page,
  test,
} from '@playwright/test';
import {
  ADMIN_PASSWORD,
  answer,
  createFriendGame,
  enterName,
  expectNoHorizontalOverflow,
  joinByLink,
  newPlayer,
  prepareBackend,
  waitForQuestion,
} from './helpers';

interface Device {
  name: string;
  options: BrowserContextOptions;
  apple?: boolean;
}

const fromPreset = (name: string, apple = false): Device => ({
  name,
  options: {
    ...devices[name],
    defaultBrowserType: undefined,
  } as BrowserContextOptions,
  apple,
});

const desktop = (name: string, width: number, height: number): Device => ({
  name,
  options: { viewport: { width, height }, deviceScaleFactor: 1 },
});

/** From the smallest phone to an ultrawide monitor. */
const DEVICES: Device[] = [
  fromPreset('iPhone SE', true),
  fromPreset('iPhone 15', true),
  fromPreset('iPhone 15 Pro Max', true),
  fromPreset('iPhone 15 landscape', true),
  fromPreset('Pixel 7'),
  fromPreset('Galaxy S24'),
  fromPreset('iPad Mini', true),
  fromPreset('iPad Mini landscape', true),
  fromPreset('iPad Pro 11 landscape', true),
  fromPreset('Galaxy Tab S9'),
  desktop('Laptop 1280x800', 1280, 800),
  desktop('MacBook 1440x900', 1440, 900),
  desktop('Full HD 1920x1080', 1920, 1080),
  desktop('Ultrawide 3440x1440', 3440, 1440),
];

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

async function capture(page: Page, device: Device, step: string): Promise<void> {
  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: `e2e-results/screens/${slug(device.name)}/${step}.png`,
    fullPage: true,
    animations: 'disabled',
  });
}

test.describe('responsive layout', () => {
  test.beforeAll(async ({ request }) => {
    await prepareBackend(request, { questionDurationSec: 30 });
  });

  for (const device of DEVICES) {
    test(`game screens on ${device.name}`, async ({ browser, browserName }) => {
      test.skip(
        browserName === 'webkit' && !device.apple,
        'Non-Apple devices only in Chromium',
      );

      const player = await newPlayer(browser, device.options);
      const opponent = await newPlayer(browser, {
        viewport: { width: 1280, height: 800 },
      });

      await player.goto('/');
      await expect(player.getByText('Wer ist schneller im Kopf?')).toBeVisible();
      await capture(player, device, '01-start');

      await enterName(player, 'Alexandra');
      await capture(player, device, '02-lobby');

      const code = await createFriendGame(player);
      await capture(player, device, '03-waiting');

      await joinByLink(opponent, code, 'Maximilian');
      await expect(player.getByText('Gegner gefunden')).toBeVisible();
      await capture(player, device, '04-countdown');

      await waitForQuestion(player, 1);
      await capture(player, device, '05-question');

      await answer(opponent, 1);
      await expect(player.locator('.answered')).toBeVisible();
      await answer(player, 0);
      await expect(player.locator('.feedback')).toHaveText(/Richtig|Leider falsch/);
      await capture(player, device, '06-reveal');

      await opponent.getByRole('button', { name: /Aufgeben/ }).click();
      await opponent.getByRole('button', { name: 'Verlassen', exact: true }).click();
      await expect(
        player.getByText('Maximilian hat das Spiel verlassen.'),
      ).toBeVisible();
      await capture(player, device, '07-aborted');

      await player.context().close();
      await opponent.context().close();
    });
  }

  for (const device of [DEVICES[1]!, DEVICES[6]!, DEVICES[11]!]) {
    test(`admin screens on ${device.name}`, async ({ browser, browserName }) => {
      test.skip(
        browserName === 'webkit' && !device.apple,
        'Non-Apple devices only in Chromium',
      );

      const admin = await newPlayer(browser, device.options);
      await admin.goto('/admin/login');
      await capture(admin, device, '10-admin-login');
      await admin.locator('css-input-text input').fill(ADMIN_PASSWORD);
      await admin.getByRole('button', { name: 'Anmelden' }).click();
      await expect(admin.getByText('Alles bereit.')).toBeVisible();
      await capture(admin, device, '11-admin-dashboard');

      await admin.getByRole('link', { name: 'Fragen' }).click();
      await expect(admin.locator('.item').first()).toBeVisible();
      await capture(admin, device, '12-admin-questions');

      await admin.getByRole('button', { name: 'Neue Frage' }).click();
      await expect(
        admin.getByText('Neue Frage', { exact: true }).last(),
      ).toBeVisible();
      await admin.screenshot({
        path: `e2e-results/screens/${slug(device.name)}/13-admin-editor.png`,
        animations: 'disabled',
      });
      await admin.getByRole('button', { name: 'Abbrechen' }).click();

      await admin.getByRole('link', { name: 'Einstellungen' }).click();
      await expect(admin.getByText('Fragen pro Duell')).toBeVisible();
      await capture(admin, device, '14-admin-settings');
      await admin.context().close();
    });
  }
});
