// Triggers the Render deploy hooks of one environment and waits until the API
// answers with the deployed commit and the game answers at all.
// Used by .github/workflows/deploy.yml; all input comes from the environment:
//   TARGET      test | production (only for the messages)
//   COMMIT      the commit that is being deployed
//   HOOK_API    deploy hook URL of the API service
//   HOOK_WEB    deploy hook URL of the static site
//   HEALTH_URL  https://…/health of the API
//   WEB_URL     https://… of the game
const env = (name) => {
  const value = process.env[name];
  if (!value) {
    console.error(
      `${name} is not set. Deploy hooks are repository secrets, see docs/DEPLOYMENT.md.`,
    );
    process.exit(1);
  }
  return value;
};

const target = env('TARGET');
const commit = env('COMMIT');
const hooks = { api: env('HOOK_API'), web: env('HOOK_WEB') };
const healthUrl = env('HEALTH_URL');
const webUrl = env('WEB_URL');
const waitMinutes = 15;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const [name, url] of Object.entries(hooks)) {
  const response = await fetch(url, { method: 'POST' });
  if (!response.ok) {
    console.error(`Deploy hook ${name} answered with HTTP ${response.status}.`);
    process.exit(1);
  }
  console.log(`${target}: deploy of ${name} triggered.`);
}

const deadline = Date.now() + waitMinutes * 60_000;
let apiReady = false;
while (Date.now() < deadline) {
  try {
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(30_000) });
    const body = await response.json();
    if (response.ok && body.status === 'ok' && body.commit === commit) {
      apiReady = true;
      break;
    }
    console.log(
      `API: ${body.status ?? response.status}, commit ${body.commit ?? '–'} (waiting for ${commit.slice(0, 7)})`,
    );
  } catch (error) {
    console.log(`API not reachable yet: ${error.message}`);
  }
  await sleep(20_000);
}
if (!apiReady) {
  console.error(
    `${target}: the API does not run commit ${commit.slice(0, 7)} after ${waitMinutes} minutes.`,
  );
  process.exit(1);
}

let webReady = false;
while (Date.now() < deadline) {
  try {
    const response = await fetch(webUrl, { signal: AbortSignal.timeout(30_000) });
    if (response.ok) {
      webReady = true;
      break;
    }
    console.log(`Game: HTTP ${response.status}`);
  } catch (error) {
    console.log(`Game not reachable yet: ${error.message}`);
  }
  await sleep(20_000);
}
if (!webReady) {
  console.error(`${target}: the game at ${webUrl} does not answer.`);
  process.exit(1);
}

console.log(`${target}: commit ${commit.slice(0, 7)} is live.`);
