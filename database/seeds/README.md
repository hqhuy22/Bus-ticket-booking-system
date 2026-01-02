# 🌱 Database Seed Data

This folder contains seed data scripts for populating the database with initial and sample data.

## 📋 Overview

Seed data is used to:
- Initialize the database with required data (admin users, configurations)
- Provide sample data for development and testing
- Set up demo environments

## 🗂️ Seed Files

### Available Seeds

| File | Purpose | Environment | Status |
|------|---------|-------------|--------|
| `admin-user.sql` | Create default admin account | All | 📝 To Create |
| `sample-routes.sql` | Popular bus routes in Vietnam | Dev/Test | 📝 To Create |
| `sample-buses.sql` | Sample bus fleet | Dev/Test | 📝 To Create |
| `sample-schedules.sql` | Sample bus schedules | Dev/Test | 📝 To Create |
| `sample-customers.sql` | Test customer accounts | Dev/Test | 📝 To Create |

## 🚀 How to Import Seed Data

### Prerequisites

- Database created and migrations completed
- PostgreSQL client installed
- Appropriate user permissions

### Method 1: Import All Seeds

**Windows PowerShell:**
```powershell
cd database/seeds

# Import in order
psql -U bus_booking_user -d bus_booking -h localhost -f admin-user.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-routes.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-buses.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-schedules.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-customers.sql
```

**Linux/macOS:**
```bash
cd database/seeds

# Import in order
psql -U bus_booking_user -d bus_booking -h localhost -f admin-user.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-routes.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-buses.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-schedules.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-customers.sql
```

### Method 2: Import Specific Seed

```bash
# Import only admin user
psql -U bus_booking_user -d bus_booking -h localhost -f admin-user.sql

# Import only routes
psql -U bus_booking_user -d bus_booking -h localhost -f sample-routes.sql
```

### Method 3: Using npm Scripts (from server)

```bash
cd bus-booking-server

# Seed admin user
npm run seed-admin

# Seed all sample data
npm run seed-data

# Clean and reseed (WARNING: deletes all data)
npm run reseed
```

## 📝 Seed Data Details

### 1. Admin User (admin-user.sql)

**Purpose:** Create default administrator account

**Data Included:**
- Admin username: `admin`
- Admin email: `admin@busbooking.com`
- Default password: `Admin@123456` (should be changed after first login)
- Position: `admin`
- Verified account

**Example:**
```sql
INSERT INTO customers (
  email, 
  username, 
  password, 
  "fullName", 
  position, 
  "isVerified",
  provider,
  "createdAt",
  "updatedAt"
) VALUES (
  'admin@busbooking.com',
  'admin',
  '$2b$10$YourHashedPasswordHere', -- bcrypt hash of Admin@123456
  'System Administrator',
  'admin',
  true,
  'local',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;
```

**Login Credentials:**
- Email: `admin@busbooking.com`
- Password: `Admin@123456` ⚠️ Change this immediately!

### 2. Sample Routes (sample-routes.sql)

**Purpose:** Populate common bus routes in Vietnam

**Data Included:**
- Hanoi ↔ Ho Chi Minh City
- Hanoi ↔ Da Nang
- Ho Chi Minh ↔ Da Lat
- Hanoi ↔ Hai Phong
- And more...

**Example:**
```sql
-- Sample routes between major cities
INSERT INTO routes (origin, destination, distance, duration, "createdAt", "updatedAt")
VALUES
  ('Hanoi', 'Ho Chi Minh City', 1700, 1800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Hanoi', 'Da Nang', 764, 720, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Ho Chi Minh City', 'Da Lat', 308, 360, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
```

### 3. Sample Buses (sample-buses.sql)

**Purpose:** Create sample bus fleet

**Data Included:**
- Different bus types (Sleeper, Seat, VIP)
- Various capacities (20-45 seats)
- Different amenities

**Example:**
```sql
INSERT INTO buses (
  "licensePlate",
  "plateNumber",
  type,
  capacity,
  amenities,
  photos,
  "createdAt",
  "updatedAt"
) VALUES
  ('29A-12345', '29A-12345', 'Sleeper', 40, 
   ARRAY['WiFi', 'AC', 'TV', 'Toilet'], 
   ARRAY['https://example.com/bus1.jpg'],
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('30B-67890', '30B-67890', 'Seat', 45,
   ARRAY['WiFi', 'AC'],
   ARRAY['https://example.com/bus2.jpg'],
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("licensePlate") DO NOTHING;
```

### 4. Sample Schedules (sample-schedules.sql)

**Purpose:** Create bus schedules for testing

**Data Included:**
- Multiple daily departures
- Different time slots
- Varied pricing

**Example:**
```sql
INSERT INTO bus_schedules (
  bus_id,
  route_id,
  departure_time,
  arrival_time,
  price,
  available_seats,
  status,
  "createdAt",
  "updatedAt"
) VALUES
  (1, 1, '2026-01-15 08:00:00', '2026-01-16 14:00:00', 500000, 40, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (2, 2, '2026-01-15 09:00:00', '2026-01-15 21:00:00', 300000, 45, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
```

### 5. Sample Customers (sample-customers.sql)

**Purpose:** Create test user accounts

**Data Included:**
- Regular customer accounts
- Test accounts for different scenarios

**Example:**
```sql
INSERT INTO customers (
  email,
  username,
  password,
  "fullName",
  position,
  "isVerified",
  "phoneNumber",
  provider,
  "createdAt",
  "updatedAt"
) VALUES
  ('customer1@test.com', 'customer1', '$2b$10$...', 'John Doe', 'customer', true, '0123456789', 'local', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('customer2@test.com', 'customer2', '$2b$10$...', 'Jane Smith', 'customer', true, '0987654321', 'local', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;
```

## ✅ Verify Seeded Data

After importing seeds, verify the data:

```bash
# Connect to database
psql -U bus_booking_user -d bus_booking -h localhost
```

**Check data counts:**
```sql
-- Count customers
SELECT COUNT(*) FROM customers;

-- Count routes
SELECT COUNT(*) FROM routes;

-- Count buses
SELECT COUNT(*) FROM buses;

-- Count schedules
SELECT COUNT(*) FROM bus_schedules;

-- View admin user
SELECT email, username, position FROM customers WHERE position = 'admin';

-- View routes
SELECT id, origin, destination, distance FROM routes LIMIT 5;

-- Exit
\q
```

## 🔒 Security Notes

### Production Environment

⚠️ **IMPORTANT:** DO NOT use seed data in production!

- Seed data is for **development and testing only**
- Contains default passwords and test data
- Can expose security vulnerabilities

### Password Hashing

All passwords in seed files should be:
- Hashed using bcrypt
- Minimum 12 characters
- Include complexity requirements

**Generate bcrypt hash:**
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('YourPassword123!', 10);
console.log(hash);
```

## 🧹 Clean Database

To remove all data and reseed:

```bash
cd bus-booking-server

# WARNING: This deletes ALL data!
npm run db:reset

# Or manually
psql -U bus_booking_user -d bus_booking -h localhost
```

```sql
-- Delete all data (keep structure)
TRUNCATE customers, routes, buses, bus_schedules, bus_bookings, reviews RESTART IDENTITY CASCADE;

-- Exit
\q
```

Then re-import seeds.

## 📝 Creating New Seed Files

### Naming Convention

Use descriptive names:
- `admin-user.sql` - System administration
- `sample-[entity].sql` - Sample data
- `config-[feature].sql` - Configuration data

### Seed File Template

```sql
-- ====================================
-- Seed: [Description]
-- Purpose: [Why this seed exists]
-- Environment: [Production/Development/All]
-- Date: YYYY-MM-DD
-- ====================================

-- Use transactions for atomicity
BEGIN;

-- Insert data
INSERT INTO table_name (columns...)
VALUES
  (values...),
  (values...)
ON CONFLICT (unique_column) DO NOTHING; -- Prevent duplicates

-- Verify insertion
SELECT COUNT(*) FROM table_name;

COMMIT;

-- ====================================
-- Verification
-- ====================================

-- Check inserted data
SELECT * FROM table_name LIMIT 5;
```

### Best Practices

1. **Use transactions** - Wrap in BEGIN/COMMIT
2. **Handle conflicts** - Use ON CONFLICT clauses
3. **Make idempotent** - Can run multiple times safely
4. **Document clearly** - Add comments explaining data
5. **Validate data** - Include verification queries
6. **Version control** - Track all seed files in git
7. **Separate environments** - Don't mix prod and dev seeds

## 🐛 Troubleshooting

### Common Issues

#### 1. Foreign Key Constraint Error

**Error:** `ERROR: insert or update on table violates foreign key constraint`

**Solution:**
- Import seeds in correct order (parents before children)
- Ensure referenced data exists
- Check foreign key columns match

**Correct order:**
1. customers (no dependencies)
2. buses (no dependencies)
3. routes (no dependencies)
4. bus_schedules (depends on buses, routes)
5. bus_bookings (depends on customers, bus_schedules)

#### 2. Unique Constraint Violation

**Error:** `ERROR: duplicate key value violates unique constraint`

**Solution:**
- Use `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE`
- Clear table before reseeding
- Check for existing data

#### 3. Password Hash Invalid

**Error:** Authentication fails with seeded users

**Solution:**
- Ensure password is bcrypt hashed
- Hash format: `$2b$10$...` (bcrypt with cost 10)
- Generate new hash if needed

#### 4. Date/Time Format Error

**Error:** `ERROR: invalid input syntax for type timestamp`

**Solution:**
- Use ISO 8601 format: `YYYY-MM-DD HH:MM:SS`
- Or use `CURRENT_TIMESTAMP`
- Check timezone settings

## 🔗 Related Documentation

- **[Database README](../README.md)** - Main database documentation
- **[Migrations README](../migrations/README.md)** - Database migrations
- **[Setup Guide](../../docs/SETUP_GUIDE.md)** - Initial setup

## 📞 Support

For seed data issues:
1. Check import order
2. Verify database schema matches
3. Review error messages
4. Contact development team

---

**Last Updated:** January 2, 2026  
**Maintained By:** Database Team
