import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const out = process.argv[2];
const password = readFileSync('../backend/.env', 'utf8').match(/^ADMIN_PASSWORD=(.*)$/m)[1].trim();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await page.goto('http://localhost:4200/admin/login');
await page.locator('css-input-text input').fill(password);
await page.locator('css-button', { hasText: 'Anmelden' }).click();
await page.getByText('Übersicht').first().waitFor();
const shots = [];
for (const w of [1280, 1600, 1920]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto('http://localhost:4200/admin/einstellungen');
  await page.getByText('Fragen pro Duell').waitFor();
  await page.waitForTimeout(600);
  const fs = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
  await page.locator('css-switch').first().screenshot({ path: `${out}/sw-${w}.png` });
  await page.locator('css-input-stepper').first().screenshot({ path: `${out}/st-${w}.png` });
  await page.goto('http://localhost:4200/admin/fragen');
  await page.locator('.item').first().waitFor();
  await page.waitForTimeout(400);
  await page.locator('.item').first().screenshot({ path: `${out}/it-${w}.png` });
  shots.push([w, fs]);
}
console.log(JSON.stringify(shots));
await browser.close();
