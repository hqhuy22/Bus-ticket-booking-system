# Bus Ticket Booking - Backend

Lightweight Node + TypeScript scaffold using Express.

Scripts:
- npm run dev  -> start dev server with ts-node-dev
- npm run build -> compile to `dist/`
- npm run start -> run compiled `dist/server.js`

Environment:
- Copy `.env.example` to `.env` and set values.

Health check: GET /api/v1/health

Database setup
----------------
This service uses Postgres. Copy `.env.example` to `.env` and set the following vars:

PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=yourpassword
PG_DATABASE=bus_ticket_db

Running migrations
------------------
Migrations were previously run automatically by the server when `DB_INIT=true`.
They are now separated into their own command so you can run them independently.

1) Install dependencies:

npm install

2) Run migrations once (recommended before first start or after schema changes):

npm run migrate

3) Start the dev server (no automatic migration run):

npm run dev

Continuous Integration (GitHub Actions)
-------------------------------------

This repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` which runs on pushes and pull requests to `main`. The workflow:

- Starts a Postgres 15 service container.
- Installs dependencies with `npm ci`.
- Runs migrations with `npm run migrate`.
- Executes unit tests with `npm test`.

If your project requires additional environment variables (SMTP credentials, third-party API keys, etc.), add them to the repository secrets in GitHub and reference them in a separate deploy workflow or modify the CI workflow to inject them only for specific jobs.

Suggested next steps for CD:

- Add a deployment job that builds the project (`npm run build`) and deploys the `dist/` artifact to your hosting provider (Heroku, AWS, Azure, DigitalOcean, etc.).
- Use repository secrets (Settings → Secrets) for any production credentials and access tokens.

