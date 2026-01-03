# 🗄️ Database Documentation

Complete guide for database setup, migrations, and maintenance.

## 📋 Table of Contents

- [Overview](#-overview)
- [Database Structure](#-database-structure)
- [Initial Setup](#-initial-setup)
- [Migrations](#-migrations)
- [Seed Data](#-seed-data)
- [Backups](#-backups)
- [Troubleshooting](#-troubleshooting)

## 🌟 Overview

The Bus Ticket Booking System uses **PostgreSQL 15.x** as the primary database with Sequelize ORM for data modeling and migrations.

### Database Information

- **Database Name:** `bus_booking` (or `bus_booking_db` - check your .env)
- **User:** `bus_booking_user`
- **ORM:** Sequelize v6
- **Migration Tool:** SQL scripts + Sequelize migrations + Auto-migration on boot
- **Backup Strategy:** Daily automated backups

### Auto-Migration on Boot

The system automatically runs `scripts/migrate_booking_schema.js` on server startup to:
- Safely handle ENUM type changes (especially `bus_bookings.status`)
- Prevent data loss during schema updates
- Ensure database compatibility with current models

## 📁 Database Structure

```
database/
├── migrations/                     # SQL migration scripts
│   ├── 20260101-bus-management-updates.sql
│   ├── add_fullname_to_customers.sql
│   ├── add_schedule_status.sql
│   └── README.md                   # Migration instructions
│
├── seeds/                          # Seed data for development
│   ├── admin-user.sql
│   ├── sample-routes.sql
│   ├── sample-buses.sql
│   └── README.md
│
├── backups/                        # Backup scripts and storage
│   ├── backup.sh
│   ├── restore.sh
│   └── README.md
│
└── README.md                       # This file
```

## 🚀 Initial Setup

### 1. Install PostgreSQL

#### Windows
```powershell
# Download and install from https://www.postgresql.org/download/windows/
# Or use Chocolatey
choco install postgresql
```

#### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

```bash
# Connect to PostgreSQL
psql -U postgres

# Or on macOS
psql postgres
```

Run the following SQL commands:

```sql
-- Create user
CREATE USER bus_booking_user WITH PASSWORD 'your_secure_password';

-- Create database (use either name, but match it in your .env file)
CREATE DATABASE bus_booking;
-- OR
-- CREATE DATABASE bus_booking_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bus_booking TO bus_booking_user;

-- Connect to the new database
\c bus_booking

-- Grant schema privileges (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO bus_booking_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bus_booking_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bus_booking_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bus_booking_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO bus_booking_user;

-- Exit
\q
```

### 3. Configure Application

Edit `bus-booking-server/.env`:

```env
# Database Configuration
DATABASE_URL=postgresql://bus_booking_user:your_secure_password@localhost:5432/bus_booking

# Or use individual variables
PG_USER=bus_booking_user
PG_PASSWORD=your_secure_password
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=bus_booking

# Enable SQL logging for debugging
SQL_LOGGING=false
```

### 4. Test Connection

```bash
# Test database connection
psql -U bus_booking_user -d bus_booking -h localhost

# You should see:
# bus_booking=>
```

If successful, type `\q` to exit.

## 🔄 Migrations

### Understanding Migrations

Migrations are version-controlled database schema changes. They allow you to:
- Track database changes over time
- Roll back changes if needed
- Synchronize database schema across environments
- Maintain data integrity during updates

### Available Migrations

| Migration File | Description | Date | Auto-Run |
|----------------|-------------|------|----------|
| `migrate_booking_schema.js` | Safely handles booking status ENUM changes | 2026-01-01 | ✅ Yes (on boot) |
| `20260101-bus-management-updates.sql` | Adds `plateNumber` and `photos` to buses, removes `seatMapConfig` from schedules | 2026-01-01 | ❌ Manual |
| `add_fullname_to_customers.sql` | Adds `fullName` column to customers table | 2026-01-01 | ❌ Manual |
| `add_schedule_status.sql` | Adds `status` ENUM to bus_schedules table | 2026-01-01 | ❌ Manual |

**Note:** The `migrate_booking_schema.js` script runs automatically when the server starts (`index.js` calls `migrateBookingSchema()` before syncing models).

### Running Migrations

#### Method 1: Automatic Sync (Development Only)

⚠️ **Warning:** This will drop and recreate all tables. Use only in development!

```bash
cd bus-booking-server
npm run sync-db
```

This runs Sequelize's `sync({ force: true })` which:
- Drops all existing tables
- Creates tables from models
- Loses all data

#### Method 2: Manual SQL Migrations (Recommended for Production)

**Step-by-step guide:**

1. **Navigate to the database directory:**
   ```bash
   cd database/migrations
   ```

2. **Run migrations in order:**
   ```bash
   # Migration 1: Bus management updates
   psql -U bus_booking_user -d bus_booking -h localhost -f 20260101-bus-management-updates.sql

   # Migration 2: Add fullName to customers
   psql -U bus_booking_user -d bus_booking -h localhost -f add_fullname_to_customers.sql

   # Migration 3: Add schedule status
   psql -U bus_booking_user -d bus_booking -h localhost -f add_schedule_status.sql
   ```

3. **Verify migrations:**
   ```bash
   psql -U bus_booking_user -d bus_booking -h localhost
   ```

   ```sql
   -- Check buses table
   \d buses

   -- Check customers table
   \d customers

   -- Check bus_schedules table
   \d bus_schedules

   -- List all tables
   \dt

   -- Exit
   \q
   ```

#### Method 3: Using Migration Script (Coming Soon)

```bash
cd bus-booking-server
npm run migrate
```

### Creating New Migrations

1. **Create a new SQL file:**
   ```bash
   # Format: YYYYMMDD-description.sql
   touch database/migrations/20260102-add-user-preferences.sql
   ```

2. **Write migration SQL:**
   ```sql
   -- Migration: Add User Preferences
   -- Date: 2026-01-02
   -- Description: Add user preferences table for customization

   -- Create table
   CREATE TABLE IF NOT EXISTS user_preferences (
     id SERIAL PRIMARY KEY,
     customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
     theme VARCHAR(20) DEFAULT 'light',
     language VARCHAR(10) DEFAULT 'en',
     notifications BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Create index
   CREATE INDEX idx_user_preferences_customer_id ON user_preferences(customer_id);

   -- Verify
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'user_preferences' 
   ORDER BY ordinal_position;
   ```

3. **Test migration:**
   ```bash
   psql -U bus_booking_user -d bus_booking -f database/migrations/20260102-add-user-preferences.sql
   ```

4. **Document in README:**
   Update this file with the new migration details.

### Rollback Migrations

If you need to rollback a migration:

1. **Create a rollback script:**
   ```bash
   touch database/migrations/rollback-20260101-bus-management-updates.sql
   ```

2. **Write rollback SQL:**
   ```sql
   -- Rollback: Bus Management Updates
   -- Date: 2026-01-01
   
   -- Remove added columns
   ALTER TABLE buses DROP COLUMN IF EXISTS "plateNumber";
   ALTER TABLE buses DROP COLUMN IF EXISTS photos;
   
   -- Re-add removed column (if needed)
   ALTER TABLE bus_schedules ADD COLUMN IF NOT EXISTS "seatMapConfig" JSONB;
   ```

3. **Run rollback:**
   ```bash
   psql -U bus_booking_user -d bus_booking -f database/migrations/rollback-20260101-bus-management-updates.sql
   ```

## 🌱 Seed Data

Seed data is used for development and testing purposes.

### Quick Start

```bash
cd bus-booking-server

# Option 1: Use the automated seed script (recommended)
npm run seed

# Option 2: Seed specific data
npm run seed:admin      # Admin user only
npm run seed:routes     # Routes and route stops
npm run seed:buses      # Bus fleet
npm run seed:schedules  # Bus schedules (next 7 days)
npm run seed:customers  # Test customer accounts
```

### Manual SQL Import

If npm scripts are not available:

```powershell
# Windows PowerShell
cd database/seeds

# Import in order (dependencies matter!)
psql -U bus_booking_user -d bus_booking -h localhost -f admin-user.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-routes.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-buses.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-schedules.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-customers.sql
```

```bash
# Linux/macOS
cd database/seeds

# Import all seeds
for file in admin-user.sql sample-routes.sql sample-buses.sql sample-schedules.sql sample-customers.sql; do
  psql -U bus_booking_user -d bus_booking -h localhost -f $file
done
```

### Available Seed Files

| File | Description | Records | Dependencies |
|------|-------------|---------|--------------|
| `admin-user.sql` | Default admin account | 1 admin | None |
| `sample-routes.sql` | 13 popular routes + stops | 13 routes, 10 stops | None |
| `sample-buses.sql` | Bus fleet (various types) | 10 buses | None |
| `sample-schedules.sql` | Next 7 days schedules | ~70 schedules | routes, buses |
| `sample-customers.sql` | Test customer accounts | 6 customers | None |

**Total:** ~100 database records ready for testing

### Test Accounts After Seeding

**Admin Account:**
- Email: `admin@busbooking.com`
- Username: `admin`
- Password: `Admin@123456`

**Customer Account:**
- Email: `john.doe@example.com`
- Username: `johndoe`
- Password: `Test@123456`

⚠️ **Change default passwords in production!**

For detailed seed information, see `database/seeds/README.md`.

## 💾 Backups

### Automated Backups

#### Setup Backup Script

See `database/backups/README.md` for detailed backup instructions.

#### Quick Backup

```bash
# Manual backup
pg_dump -U bus_booking_user -d bus_booking > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use the backup script
cd database/backups
./backup.sh
```

#### Restore from Backup

```bash
# Restore from backup file
psql -U bus_booking_user -d bus_booking < backup_20260101_120000.sql

# Or use the restore script
cd database/backups
./restore.sh backup_20260101_120000.sql
```

### Backup Schedule (Production)

Recommended backup strategy:
- **Daily:** Full database backup at 2 AM
- **Weekly:** Keep weekly backups for 1 month
- **Monthly:** Keep monthly backups for 1 year
- **Location:** Store backups in separate server/cloud storage

## 🔍 Database Schema Overview

### Core Tables

| Table | Description | Key Columns |
|-------|-------------|-------------|
| `customers` | User accounts (local, OAuth, guest) | id, email, username, fullName, position, provider, isGuest |
| `buses` | Bus fleet information | id, busNumber, plateNumber, busType, totalSeats, seatMapConfig, amenities, photos, depotName |
| `routes` | Bus routes | id, routeNo, routeName, origin, destination, distance, estimatedDuration |
| `route_stops` | Intermediate stops | id, routeId, stopOrder, stopName, stopType, arrivalTime |
| `bus_schedules` | Trip schedules | id, routeNo, busId, departure_date, departure_time, price, availableSeats, status |
| `bus_bookings` | Customer bookings | id, customerId, busScheduleId, seatNumbers, status, bookingReference, expiresAt |
| `seat_locks` | Temporary seat locks | id, scheduleId, seatNumber, sessionId, customerId, expiresAt, status |
| `reviews` | Trip reviews & ratings | id, bookingId, customerId, rating, comment, helpfulCount, isVisible |
| `review_votes` | Review helpfulness votes | id, reviewId, customerId, voteType |
| `notification_preferences` | User notification settings | id, customerId, email*, sms*, push*, reminderTiming |
| `chat_histories` | AI chatbot conversations | id, sessionId, userId, role, content, intent, metadata |

For complete schema details, see [`docs/DATABASE_DESIGN.md`](../docs/DATABASE_DESIGN.md).

## 🛠️ Database Maintenance

### Regular Maintenance Tasks

```sql
-- Vacuum and analyze (recommended weekly)
VACUUM ANALYZE;

-- Reindex all tables (recommended monthly)
REINDEX DATABASE bus_booking;

-- Check database size
SELECT pg_size_pretty(pg_database_size('bus_booking'));

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'bus_booking';

-- Check indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Performance Monitoring

```sql
-- Slow queries (requires pg_stat_statements extension)
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Cache hit ratio (should be > 90%)
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
FROM pg_statio_user_tables;
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Connection Refused

**Error:** `ECONNREFUSED` or `could not connect to server`

**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check if listening on correct port
sudo netstat -tulpn | grep 5432
```

#### 2. Permission Denied

**Error:** `permission denied for schema public`

**Solution:**
```sql
-- Run as postgres user
GRANT ALL ON SCHEMA public TO bus_booking_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bus_booking_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bus_booking_user;
```

#### 3. Migration Failed

**Error:** Migration script fails partially

**Solution:**
```bash
# Check what was executed
psql -U bus_booking_user -d bus_booking

# Run this to see table structure
\d table_name

# Manually fix or rollback and retry
```

#### 4. Database Already Exists

**Error:** `database "bus_booking" already exists`

**Solution:**
```bash
# Drop and recreate (WARNING: loses all data)
psql -U postgres
DROP DATABASE bus_booking;
CREATE DATABASE bus_booking;
\q

# Or use a different database name
CREATE DATABASE bus_booking_dev;
```

#### 5. Cannot Drop Database

**Error:** `database "bus_booking" is being accessed by other users`

**Solution:**
```sql
-- Terminate all connections
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'bus_booking'
  AND pid <> pg_backend_pid();

-- Then drop
DROP DATABASE bus_booking;
```

### Debug Mode

Enable detailed logging:

```env
# In bus-booking-server/.env
SQL_LOGGING=true
DB_LOGGING=true
NODE_ENV=development
```

This will log all SQL queries to the console.

## 📚 Additional Resources

- **[Database Design](../docs/DATABASE_DESIGN.md)** - Complete schema documentation
- **[Database ERD](../docs/DATABASE_ERD.md)** - Entity relationship diagrams
- **[Setup Guide](../docs/SETUP_GUIDE.md)** - Development environment setup
- **[API Documentation](../docs/API_DOCUMENTATION.md)** - API endpoints using database

## 🔗 Quick Links

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [SQL Tutorial](https://www.postgresql.org/docs/tutorial/)

---

**Last Updated:** January 2, 2026
