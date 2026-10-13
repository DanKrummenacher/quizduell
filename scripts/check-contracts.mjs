// Fails if the shared contract files of backend and frontend differ.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const backendDir = 'backend/src/contracts';
const frontendDir = 'frontend/src/app/core/contracts';
const files = new Set([...readdirSync(backendDir), ...readdirSync(frontendDir)]);
let failed = false;

for (const file of files) {
  let backend = '';
  let frontend = '';
  try {
    backend = readFileSync(join(backendDir, file), 'utf8');
    frontend = readFileSync(join(frontendDir, file), 'utf8');
  } catch {
    console.error(`✗ ${file} exists only on one side`);
    failed = true;
    continue;
  }
  if (backend !== frontend) {
    console.error(`✗ ${file} differs between backend and frontend`);
    failed = true;
  } else {
    console.log(`✓ ${file}`);
  }
}

if (failed) {
  console.error('\nCopy the changed contract to the other side so both stay identical.');
  process.exit(1);
}
