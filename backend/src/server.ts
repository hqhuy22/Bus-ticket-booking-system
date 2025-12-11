import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import morgan from 'morgan';
import apiRouter from './routes';
import { errorHandler } from './middlewares/error.middleware';
import pool from './config/db';
import { runMigrations } from './db/migrations';
let cookieParser: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  cookieParser = require('cookie-parser');
} catch (e) {
  // cookie-parser not installed in some test environments; fall back to no-op
  cookieParser = () => (req: any, res: any, next: any) => next();
}
import passport from './config/passport';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
// initialize passport (strategy configured in src/config/passport.ts)
app.use(passport.initialize());

// Serve a small static site (verify page) from src/public
app.use(express.static(path.join(__dirname, 'public')));

// Explicit route so /verify works (serves src/public/verify.html)
app.get('/verify', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'verify.html'));
});

// Mount API router
app.use('/api/v1', apiRouter);

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Centralized error handler
app.use(errorHandler);

if (require.main === module) {
  (async () => {
    try {
      if (process.env.DB_INIT === 'true') {
        // run idempotent migrations
        // eslint-disable-next-line no-console
        console.log('Running DB migrations...');
        await runMigrations();
        // eslint-disable-next-line no-console
        console.log('Migrations finished');
      }

      await pool.connect();
      app.listen(PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`Server listening on port ${PORT}`);
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize application', err);
      process.exit(1);
    }
  })();
}

export default app;
