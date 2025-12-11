"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("../config/db"));
const migrations_1 = require("./migrations");
// Load environment variables
dotenv_1.default.config();
(async () => {
    try {
        // Ensure DB pool can connect
        await db_1.default.connect();
        // Run migrations
        // eslint-disable-next-line no-console
        console.log('Running DB migrations...');
        await (0, migrations_1.runMigrations)();
        // eslint-disable-next-line no-console
        console.log('Migrations finished');
        // Close pool
        await db_1.default.end();
        process.exit(0);
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error('Migration failed', err);
        try {
            await db_1.default.end();
        }
        catch (e) {
            // ignore
        }
        process.exit(1);
    }
})();
