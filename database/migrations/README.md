# 🔄 Database Migrations Guide

This folder contains all database migration scripts for the Bus Ticket Booking System.

## 📋 Overview

Migrations are SQL scripts that modify the database schema in a controlled, version-controlled manner. Each migration file represents a specific change to the database structure.

## 📁 Migration Files

### Current Migrations

| File | Date | Description | Status |
|------|------|-------------|--------|
| `20260101-bus-management-updates.sql` | 2026-01-01 | Adds `plateNumber` and `photos` columns to buses table, removes `seatMapConfig` from bus_schedules | ✅ Ready |
| `add_fullname_to_customers.sql` | 2026-01-01 | Adds `fullName` column to customers table | ✅ Ready |
| `add_schedule_status.sql` | 2026-01-01 | Adds `status` column to bus_schedules table | ✅ Ready |

## 🚀 How to Run Migrations

### Prerequisites

- PostgreSQL 15.x or higher installed
- Database user with appropriate privileges
- Database already created

### Method 1: Run All Migrations (Recommended)

```bash
# Navigate to migrations folder
cd database/migrations

# Run migrations in order (Windows PowerShell)
psql -U bus_booking_user -d bus_booking -h localhost -f 20260101-bus-management-updates.sql
psql -U bus_booking_user -d bus_booking -h localhost -f add_fullname_to_customers.sql
psql -U bus_booking_user -d bus_booking -h localhost -f add_schedule_status.sql
```

**For Linux/macOS:**
```bash
psql -U bus_booking_user -d bus_booking -h localhost -f 20260101-bus-management-updates.sql
psql -U bus_booking_user -d bus_booking -h localhost -f add_fullname_to_customers.sql
psql -U bus_booking_user -d bus_booking -h localhost -f add_schedule_status.sql
```

### Method 2: Run Individual Migration

```bash
# Run a specific migration
psql -U bus_booking_user -d bus_booking -h localhost -f <migration-file.sql>

# Example:
psql -U bus_booking_user -d bus_booking -h localhost -f 20260101-bus-management-updates.sql
```

### Method 3: Interactive Mode

```bash
# Connect to database
psql -U bus_booking_user -d bus_booking -h localhost

# Copy and paste migration SQL content
# Or use \i command
\i 20260101-bus-management-updates.sql
\i add_fullname_to_customers.sql
\i add_schedule_status.sql

# Exit
\q
```

## ✅ Verify Migrations

After running migrations, verify the changes:

```bash
# Connect to database
psql -U bus_booking_user -d bus_booking -h localhost
```

**Check table structure:**
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

**Expected output for buses table:**
```
Column      | Type                  | Nullable
------------|-----------------------|----------
id          | integer               | not null
plateNumber | character varying(20) | 
photos      | text[]                | 
...
```

## 📝 Migration Details

### 1. Bus Management Updates (20260101-bus-management-updates.sql)

**Purpose:** Enhance bus management capabilities

**Changes:**
- ✅ Adds `plateNumber` VARCHAR(20) column to `buses` table (UNIQUE)
- ✅ Adds `photos` TEXT[] column to `buses` table (for multiple images)
- ✅ Creates index on `plateNumber` for faster searches
- ✅ Removes `seatMapConfig` from `bus_schedules` (moved to bus level)

**Impact:**
- Buses can now store multiple photos
- Each bus has a unique plate number
- Improved query performance on plate number searches

**SQL Preview:**
```sql
ALTER TABLE buses ADD COLUMN IF NOT EXISTS "plateNumber" VARCHAR(20) UNIQUE;
ALTER TABLE buses ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_buses_plate_number ON buses("plateNumber");
ALTER TABLE bus_schedules DROP COLUMN IF EXISTS "seatMapConfig";
```

### 2. Add FullName to Customers (add_fullname_to_customers.sql)

**Purpose:** Store customer full name for better identification

**Changes:**
- ✅ Adds `fullName` VARCHAR(255) column to `customers` table

**Impact:**
- Customers can have a separate full name field
- Better user experience in forms and displays

**SQL Preview:**
```sql
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "fullName" VARCHAR(255);
```

### 3. Add Schedule Status (add_schedule_status.sql)

**Purpose:** Track schedule operational status

**Changes:**
- ✅ Adds `status` VARCHAR(20) column to `bus_schedules` table
- ✅ Default value: 'active'
- ✅ Possible values: 'active', 'cancelled', 'completed'

**Impact:**
- Schedules can be marked as cancelled or completed
- Better schedule management and filtering

**SQL Preview:**
```sql
ALTER TABLE bus_schedules ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
```

## 🔄 Creating New Migrations

### Naming Convention

Use the following format for migration files:
```
YYYYMMDD-descriptive-name.sql
```

Examples:
- `20260102-add-payment-methods.sql`
- `20260103-create-loyalty-program.sql`
- `20260104-add-indexes-for-performance.sql`

### Migration Template

```sql
-- Migration: [Short Description]
-- Date: YYYY-MM-DD
-- Author: [Your Name]
-- Description: [Detailed description of what this migration does]

-- ====================================
-- MIGRATION START
-- ====================================

-- Add your changes here
-- Example:
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name VARCHAR(255);

-- Create indexes if needed
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column_name);

-- ====================================
-- VERIFICATION
-- ====================================

-- Verify changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'table_name' 
ORDER BY ordinal_position;

-- ====================================
-- MIGRATION END
-- ====================================
```

### Best Practices

1. **Always use `IF NOT EXISTS`** to make migrations idempotent
2. **Test migrations** on development database first
3. **Backup database** before running migrations in production
4. **Document changes** with comments in SQL
5. **Keep migrations small** and focused on one change
6. **Version control** all migration files
7. **Never modify** existing migration files after they've been deployed

## ⚠️ Rollback Migrations

If a migration fails or needs to be undone:

### Create Rollback Script

Create a file named `rollback-[original-name].sql`:

```sql
-- Rollback: Bus Management Updates
-- Date: 2026-01-01
-- Original: 20260101-bus-management-updates.sql

-- Remove added columns
ALTER TABLE buses DROP COLUMN IF EXISTS "plateNumber";
ALTER TABLE buses DROP COLUMN IF EXISTS photos;

-- Remove index
DROP INDEX IF EXISTS idx_buses_plate_number;

-- Restore removed column (if data needs to be preserved)
ALTER TABLE bus_schedules ADD COLUMN IF NOT EXISTS "seatMapConfig" JSONB;
```

### Run Rollback

```bash
psql -U bus_booking_user -d bus_booking -h localhost -f rollback-20260101-bus-management-updates.sql
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Permission Denied

**Error:** `ERROR: permission denied for table table_name`

**Solution:**
```sql
-- Run as postgres superuser
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bus_booking_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bus_booking_user;
```

#### 2. Column Already Exists

**Error:** `ERROR: column "column_name" already exists`

**Solution:**
- This is normal if using `IF NOT EXISTS`
- Migration will skip the change
- If not using `IF NOT EXISTS`, add it to the migration

#### 3. Foreign Key Constraint

**Error:** `ERROR: cannot drop column ... because other objects depend on it`

**Solution:**
```sql
-- Drop with cascade (careful!)
ALTER TABLE table_name DROP COLUMN column_name CASCADE;

-- Or first drop dependent objects
ALTER TABLE dependent_table DROP CONSTRAINT constraint_name;
```

#### 4. Syntax Error

**Error:** `ERROR: syntax error at or near ...`

**Solution:**
- Check SQL syntax
- Ensure double quotes for column names with capital letters
- Test query in psql first

### Debug Mode

Run migrations with detailed output:

```bash
# Verbose mode
psql -U bus_booking_user -d bus_booking -h localhost -f migration.sql -e -v ON_ERROR_STOP=1
```

Flags:
- `-e` : Echo commands
- `-v ON_ERROR_STOP=1` : Stop on first error

## 📊 Migration Status Tracking

### Check Migration History

```sql
-- Create migrations tracking table (one-time setup)
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Record a migration
INSERT INTO schema_migrations (migration_name) 
VALUES ('20260101-bus-management-updates.sql')
ON CONFLICT (migration_name) DO NOTHING;

-- View migration history
SELECT * FROM schema_migrations ORDER BY applied_at DESC;
```

## 🔗 Related Documentation

- **[Database README](../README.md)** - Main database documentation
- **[Database Design](../../docs/DATABASE_DESIGN.md)** - Complete schema
- **[Setup Guide](../../docs/SETUP_GUIDE.md)** - Initial setup instructions

## 📞 Support

If you encounter issues with migrations:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review error messages carefully
3. Verify database user permissions
4. Contact the development team

---

**Last Updated:** January 2, 2026  
**Maintained By:** Database Team
