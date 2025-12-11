"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const migrations_1 = require("./migrations");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
async function run() {
    try {
        // Run DB migrations first
        // eslint-disable-next-line no-console
        console.log('Running migrations...');
        await (0, migrations_1.runMigrations)();
        const scripts = ['seedOperators', 'seedBuses', 'seedRoutes', 'seedSeats', 'seedTrips', 'seedUsers'];
        for (const s of scripts) {
            // use ts-node if available via npm scripts; fallback to node compiled JS if present
            // We will try to run via ts-node using npx to avoid forcing dependency changes.
            // eslint-disable-next-line no-console
            console.log(`Running ${s}...`);
            const file = path_1.default.join(__dirname, `${s}.ts`);
            try {
                (0, child_process_1.execSync)(`npx ts-node ${file}`, { stdio: 'inherit' });
            }
            catch (e) {
                console.error(`Failed to run ${s} via ts-node`, e);
            }
        }
        // eslint-disable-next-line no-console
        console.log('Seeding finished');
        process.exit(0);
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('seedAll failed', err);
        process.exit(1);
    }
}
run();
