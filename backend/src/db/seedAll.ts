import { runMigrations } from './migrations';
import { execSync } from 'child_process';
import path from 'path';

async function run() {
  try {
    // Run DB migrations first
    // eslint-disable-next-line no-console
    console.log('Running migrations...');
    await runMigrations();

    const scripts = [
      'seedOperators',
      'seedBuses',
      'seedRoutes',
      'seedSeats',
      'seedTrips',
      'seedUsers',
    ];
    for (const s of scripts) {
      // use ts-node if available via npm scripts; fallback to node compiled JS if present
      // We will try to run via ts-node using npx to avoid forcing dependency changes.
      // eslint-disable-next-line no-console
      console.log(`Running ${s}...`);
      const file = path.join(__dirname, `${s}.ts`);
      try {
        execSync(`npx ts-node ${file}`, { stdio: 'inherit' });
      } catch (e) {
        console.error(`Failed to run ${s} via ts-node`, e);
      }
    }

    // eslint-disable-next-line no-console
    console.log('Seeding finished');
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('seedAll failed', err);
    process.exit(1);
  }
}

run();
