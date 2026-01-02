# 🔧 Setup Guide - Bus Ticket Booking System

Complete installation and configuration guide for developers.

## Table of Contents

- [System Requirements](#system-requirements)
- [Development Environment Setup](#development-environment-setup)
- [Database Setup](#database-setup)
- [Backend Configuration](#backend-configuration)
- [Frontend Configuration](#frontend-configuration)
- [Email Service Setup](#email-service-setup)
- [OAuth Setup (Google)](#oauth-setup-google)
- [Payment Gateway Setup](#payment-gateway-setup)
- [AI Chatbot Setup](#ai-chatbot-setup)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements
- **Node.js**: v16.x or higher
- **npm**: v8.x or higher
- **PostgreSQL**: v12.x or higher
- **RAM**: 4GB minimum
- **Storage**: 2GB free space

### Recommended
- **Node.js**: v18.x or v20.x
- **PostgreSQL**: v14.x or v15.x
- **RAM**: 8GB or more
- **Storage**: 5GB free space

### Operating Systems
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu 20.04+, Debian, CentOS)

## Development Environment Setup

### 1. Install Node.js

**Windows:**
1. Download from https://nodejs.org/
2. Run installer
3. Verify installation:
```bash
node --version
npm --version
```

**macOS:**
```bash
# Using Homebrew
brew install node

# Or download from nodejs.org
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install PostgreSQL

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Run installer (remember password for postgres user)
3. Add to PATH if not automatically added

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Install Git

**Windows:** Download from https://git-scm.com/

**macOS:** `brew install git`

**Linux:** `sudo apt install git`

## Database Setup

### 1. Create Database User

Connect to PostgreSQL:
```bash
# Windows/Linux
psql -U postgres

# macOS
psql postgres
```

Create user and database:
```sql
-- Create user
CREATE USER bus_booking_user WITH PASSWORD 'your_secure_password';

-- Create database
CREATE DATABASE bus_booking;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bus_booking TO bus_booking_user;

-- Connect to database
\c bus_booking

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO bus_booking_user;

-- Exit
\q
```

### 2. Test Database Connection

```bash
# Test connection
psql -U bus_booking_user -d bus_booking -h localhost

# If successful, you'll see:
# bus_booking=>
```

### 3. Database Configuration

The application will automatically create tables on first run. You can also manually sync:

```bash
cd bus-booking-server
npm run sync-db
```

## Backend Configuration

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd bus-ticket-booking-app-main

# Install root dependencies
npm install

# Install backend dependencies
cd bus-booking-server
npm install
```

### 2. Environment Variables

Create `bus-booking-server/.env`:

```env
# ================================
# DATABASE CONFIGURATION
# ================================
DATABASE_URL=postgresql://bus_booking_user:your_secure_password@localhost:5432/bus_booking

# Or use separate variables
PG_USER=bus_booking_user
PG_PASSWORD=your_secure_password
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=bus_booking

# Database logging (set to true for debugging)
SQL_LOGGING=false

# ================================
# SERVER CONFIGURATION
# ================================
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Quiet logs (suppress verbose startup logs)
QUIET_LOGS=false

# ================================
# AUTHENTICATION & SECURITY
# ================================
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
SESSION_SECRET=your-super-secret-session-key-minimum-32-characters

# JWT expiration (e.g., '7d', '24h', '30m')
JWT_EXPIRES_IN=7d

# ================================
# EMAIL CONFIGURATION (Option 1: NodeMailer)
# ================================
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
FROM_EMAIL=your-email@gmail.com

# ================================
# EMAIL CONFIGURATION (Option 2: SendGrid)
# ================================
# SENDGRID_API_KEY=SG.your-sendgrid-api-key
# FROM_EMAIL=noreply@yourdomain.com

# ================================
# GOOGLE OAUTH (Optional)
# ================================
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# ================================
# AI CHATBOT (Google Gemini)
# ================================
GEMINI_API_KEY=your-gemini-api-key

# ================================
# PAYMENT GATEWAY (PayOS)
# ================================
PAYOS_CLIENT_ID=your-payos-client-id
PAYOS_API_KEY=your-payos-api-key
PAYOS_CHECKSUM_KEY=your-payos-checksum-key
PAYMENT_RETURN_URL=http://localhost:5173/payment/success
PAYMENT_CANCEL_URL=http://localhost:5173/payment/failed

# ================================
# FILE UPLOAD
# ================================
MAX_FILE_SIZE=5242880  # 5MB in bytes
UPLOAD_PATH=./uploads

# ================================
# BOOKING CONFIGURATION
# ================================
SEAT_LOCK_DURATION=900000      # 15 minutes in milliseconds
BOOKING_EXPIRATION=900000       # 15 minutes in milliseconds
```

### 3. Generate Strong Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Frontend Configuration

### 1. Install Dependencies

```bash
cd bus-booking-client
npm install
```

### 2. Environment Variables

Create `bus-booking-client/.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:4000

# Optional: Google Analytics, etc.
# VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

## Email Service Setup

### Option 1: Gmail (NodeMailer)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification
   - App passwords → Generate
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password

3. **Configure .env**:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
FROM_EMAIL=your-email@gmail.com
```

### Option 2: SendGrid

1. **Create SendGrid Account**: https://sendgrid.com/
2. **Generate API Key**:
   - Settings → API Keys → Create API Key
   - Full Access or Mail Send access
   - Copy the key

3. **Verify Sender**:
   - Settings → Sender Authentication
   - Verify your email address

4. **Configure .env**:
```env
SENDGRID_API_KEY=SG.your-api-key
FROM_EMAIL=noreply@yourdomain.com
```

### Test Email Configuration

```bash
cd bus-booking-server
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});
transporter.verify((error, success) => {
  if (error) console.log('Error:', error);
  else console.log('Email service ready!');
});
"
```

## OAuth Setup (Google)

### 1. Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable Google+ API

### 2. Create OAuth Credentials

1. **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Bus Booking System`
5. Authorized JavaScript origins:
   ```
   http://localhost:5173
   http://localhost:4000
   ```
6. Authorized redirect URIs:
   ```
   http://localhost:4000/api/auth/google/callback
   ```
7. Click **Create** and copy Client ID and Client Secret

### 3. Configure OAuth Consent Screen

1. **OAuth consent screen**
2. User Type: **External**
3. Fill in app information
4. Add scopes: `email`, `profile`
5. Add test users (for development)

### 4. Update .env

```env
GOOGLE_CLIENT_ID=123456789-abcdefghijk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

## Payment Gateway Setup

### PayOS Configuration

1. **Register**: https://payos.vn/
2. **Get Credentials**:
   - Dashboard → Settings → API Keys
   - Copy: Client ID, API Key, Checksum Key

3. **Configure .env**:
```env
PAYOS_CLIENT_ID=your-client-id
PAYOS_API_KEY=your-api-key
PAYOS_CHECKSUM_KEY=your-checksum-key
PAYMENT_RETURN_URL=http://localhost:5173/payment/success
PAYMENT_CANCEL_URL=http://localhost:5173/payment/failed
```

4. **Test Mode**: The application includes a sandbox mode for testing without real payments.

## AI Chatbot Setup

### Google Gemini API

1. **Get API Key**:
   - Visit https://makersuite.google.com/app/apikey
   - Create API key

2. **Configure .env**:
```env
GEMINI_API_KEY=your-gemini-api-key
```

3. **Test Chatbot** (optional):
```bash
cd bus-booking-server
node test-chatbot-search.js
```

## Running the Application

### 1. Start Backend

```bash
cd bus-booking-server

# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Expected output:
```
✓ Postgres connected and synced
✓ Server running on http://localhost:4000
✓ Model associations initialized
```

### 2. Create Admin User

```bash
cd bus-booking-server
npm run seed-admin
```

Default admin credentials:
- Email: `admin@admin.com`
- Password: `admin123`

**⚠️ Change these in production!**

### 3. Start Frontend

```bash
cd bus-booking-client
npm run dev
```

Expected output:
```
  VITE v6.0.5  ready in 1234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Admin Dashboard**: http://localhost:5173/admin (login with admin credentials)

## Troubleshooting

### Database Connection Issues

**Error**: `ECONNREFUSED` or `password authentication failed`

```bash
# Check PostgreSQL is running
# Windows
pg_isready

# Linux/Mac
sudo systemctl status postgresql

# Verify connection
psql -U bus_booking_user -d bus_booking -h localhost

# Check pg_hba.conf allows local connections
# Location: /etc/postgresql/*/main/pg_hba.conf (Linux)
# Should have: local   all   all   md5
```

### Port Already in Use

**Error**: `EADDRINUSE` or `Port 4000 is already in use`

```bash
# Windows - Find and kill process
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill -9
```

### Email Not Sending

**Issue**: Emails not being sent

1. **Check email credentials** in `.env`
2. **Verify 2FA and App Password** for Gmail
3. **Test email service**:
```bash
cd bus-booking-server
npm run test:email  # If available
```
4. **Check spam folder**
5. **Review server logs** for email errors

### Module Not Found

**Error**: `Cannot find module`

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or
npm ci  # Clean install from package-lock.json
```

### OAuth Redirect Issues

**Error**: `redirect_uri_mismatch`

1. Check Google Cloud Console redirect URIs match exactly
2. Verify `GOOGLE_CALLBACK_URL` in `.env`
3. Ensure no trailing slashes
4. Use exact protocol (http/https)

### Database Migration Issues

**Issue**: Tables not created or schema mismatch

```bash
# Force sync (⚠️ CAUTION: Drops tables)
cd bus-booking-server
npm run sync-db

# Or manually run migrations
psql -U bus_booking_user -d bus_booking -f migrations/001_initial.sql
```

### Build Errors

**Frontend Build Fails**

```bash
cd bus-booking-client

# Clear cache
rm -rf node_modules/.vite

# Reinstall
npm install

# Try build again
npm run build
```

### Performance Issues

**Application Running Slow**

1. **Enable Redis caching** - Verify Redis is running
2. **Check database indexes** - Run EXPLAIN ANALYZE on slow queries
3. **Monitor resources**:
```bash
# Check Node.js memory
node --max-old-space-size=4096 index.js

# Monitor processes
top  # Linux/Mac
Get-Process node  # Windows PowerShell
```

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- Frontend: Vite automatically reloads
- Backend: Nodemon watches for changes

### Debugging

**Backend (VS Code)**:
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/bus-booking-server/index.js",
      "envFile": "${workspaceFolder}/bus-booking-server/.env"
    }
  ]
}
```

**Frontend**:
Use browser DevTools and React DevTools extension.

### Database Tools

**Recommended GUI Tools**:
- pgAdmin 4 (Free, cross-platform)
- DBeaver (Free, cross-platform)
- TablePlus (Paid, Mac/Windows)
- Postico (Mac only)

### API Testing

Use **Postman** or **Thunder Client** (VS Code extension):
1. Import API endpoints from documentation
2. Setup environment variables
3. Test authentication flow
4. Test booking flow

## Next Steps

After successful setup:

1. **Read API Documentation** - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. **Understand Database Schema** - [DATABASE_DESIGN.md](./DATABASE_DESIGN.md)
3. **Review Architecture** - [ARCHITECTURE.md](./ARCHITECTURE.md)
4. **Run Tests** - `cd bus-booking-server && npm test`
5. **Explore Admin Dashboard** - Login and test features

## Production Deployment

For production deployment, see:
- Set `NODE_ENV=production`
- Use environment variable management (e.g., AWS Secrets Manager)
- Setup SSL/TLS certificates
- Configure reverse proxy (Nginx)
- Setup monitoring and logging
- Configure database backups
- Use process manager (PM2)
- Setup CI/CD pipeline

---

**Need Help?** Check existing issues or create a new one on GitHub.
