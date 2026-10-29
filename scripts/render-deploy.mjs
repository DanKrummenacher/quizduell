// Deploys one environment on Render (API and static site) and waits until
// both deploys are live and the API answers with the deployed commit.
// Used by .github/workflows/deploy.yml; all input comes from the environment:
//   TARGET          test | production (only for the messages)
//   COMMIT          the commit that is being deployed
//   RENDER_API_KEY  Render API key (repository secret)
//   SERVICE_API     Render service id of the API (srv-…)
//   SERVICE_WEB     Render service id of the static site (srv-…)
//   HEALTH_URL      https://…/health of the API
//   WEB_URL         https://… of the game
const env = (name) => {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is not set, see docs/DEPLOYMENT.md («Deploy-Pipeline»).`);
    process.exit(1);
  }
  return value;
};

const target = env('TARGET');
const commit = env('COMMIT');
const apiKey = env('RENDER_API_KEY');
const services = { api: env('SERVICE_API'), web: env('SERVICE_WEB') };
const healthUrl = env('HEALTH_URL');
const webUrl = env('WEB_URL');
const waitMinutes = 20;
const deadline = Date.now() + waitMinutes * 60_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const render = async (path, init = {}) => {
  const response = await fetch(`https://api.render.com/v1${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(
      `Render API ${path} answered with HTTP ${response.status}: ${await response.text()}`,
    );
  }
  return response.json();
};

// Start both deploys.
const deploys = {};
for (const [name, serviceId] of Object.entries(services)) {
  const deploy = await render(`/services/${serviceId}/deploys`, {
    method: 'POST',
    body: JSON.stringify({ clearCache: 'do_not_clear', commitId: commit }),
  });
  deploys[name] = deploy.id;
  console.log(`${target}: deploy of ${name} started (${deploy.id}).`);
}

// Wait until Render reports both as live.
const failed = new Set([
  'build_failed',
  'update_failed',
  'canceled',
  'deactivated',
  'pre_deploy_failed',
]);
const pending = new Map(Object.entries(deploys));
while (pending.size && Date.now() < deadline) {
  await sleep(15_000);
  for (const [name, deployId] of pending) {
    const deploy = await render(`/services/${services[name]}/deploys/${deployId}`);
    if (deploy.status === 'live') {
      console.log(`${target}: ${name} is live.`);
      pending.delete(name);
    } else if (failed.has(deploy.status)) {
      console.error(
        `${target}: deploy of ${name} ended with «${deploy.status}». See the Render dashboard.`,
      );
      process.exit(1);
    } else {
      console.log(`${target}: ${name} ${deploy.status} …`);
    }
  }
}
if (pending.size) {
  console.error(
    `${target}: ${[...pending.keys()].join(', ')} not live after ${waitMinutes} minutes.`,
  );
  process.exit(1);
}

// Check from outside: the API runs the commit, the game answers.
let healthy = false;
while (Date.now() < deadline) {
  try {
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(30_000) });
    const body = await response.json();
    if (response.ok && body.status === 'ok' && body.commit === commit) {
      healthy = true;
      break;
    }
    console.log(
      `API: ${body.status ?? response.status}, commit ${body.commit ?? '–'} (waiting for ${commit.slice(0, 7)})`,
    );
  } catch (error) {
    console.log(`API not reachable yet: ${error.message}`);
  }
  await sleep(15_000);
}
if (!healthy) {
  console.error(
    `${target}: the API does not answer with commit ${commit.slice(0, 7)}.`,
  );
  process.exit(1);
}

const web = await fetch(webUrl, { signal: AbortSignal.timeout(30_000) });
if (!web.ok) {
  console.error(`${target}: the game at ${webUrl} answers with HTTP ${web.status}.`);
  process.exit(1);
}

console.log(`${target}: commit ${commit.slice(0, 7)} is live.`);
