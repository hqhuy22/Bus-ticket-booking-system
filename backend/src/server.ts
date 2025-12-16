import express from 'express';
import path from 'path';
import cors from 'cors';
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
import { setupBookingCleanupJob } from './jobs/bookingCleanup';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
// initialize passport (strategy configured in src/config/passport.ts)
app.use(passport.initialize());

// Enable CORS for frontend dev server and configured app base URL
const allowedOrigins = [
  process.env.APP_BASE_URL || 'http://localhost:3000',
  'http://localhost:5173',
];
app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // allow requests with no origin like curl/postman
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.options('*', cors());

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

      // start booking cleanup job in non-test environments
      if (process.env.NODE_ENV !== 'test') {
        setupBookingCleanupJob();
        // eslint-disable-next-line no-console
        console.log('Booking cleanup job started');
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
