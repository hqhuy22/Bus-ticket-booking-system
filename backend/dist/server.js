"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const db_1 = __importDefault(require("./config/db"));
const migrations_1 = require("./db/migrations");
let cookieParser;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cookieParser = require('cookie-parser');
}
catch (e) {
    // cookie-parser not installed in some test environments; fall back to no-op
    cookieParser = () => (req, res, next) => next();
}
const passport_1 = __importDefault(require("./config/passport"));
// Load environment variables
dotenv_1.default.config();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const app = (0, express_1.default)();
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(cookieParser());
// initialize passport (strategy configured in src/config/passport.ts)
app.use(passport_1.default.initialize());
// Serve a small static site (verify page) from src/public
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
// Explicit route so /verify works (serves src/public/verify.html)
app.get('/verify', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'public', 'verify.html'));
});
// Mount API router
app.use('/api/v1', routes_1.default);
// Fallback 404
app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
});
// Centralized error handler
app.use(error_middleware_1.errorHandler);
if (require.main === module) {
    (async () => {
        try {
            if (process.env.DB_INIT === 'true') {
                // run idempotent migrations
                // eslint-disable-next-line no-console
                console.log('Running DB migrations...');
                await (0, migrations_1.runMigrations)();
                // eslint-disable-next-line no-console
                console.log('Migrations finished');
            }
            await db_1.default.connect();
            app.listen(PORT, () => {
                // eslint-disable-next-line no-console
                console.log(`Server listening on port ${PORT}`);
            });
        }
        catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to initialize application', err);
            process.exit(1);
        }
    })();
}
exports.default = app;
