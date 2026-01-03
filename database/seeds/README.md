# 🌱 Database Seed Data

This folder contains seed data scripts for populating the database with initial and sample data.

## 📋 Overview

Seed data is used to:
- Initialize the database with required data (admin users, configurations)
- Provide sample data for development and testing
- Set up demo environments

## 🗂️ Seed Files

### Available Seeds

| File | Purpose | Environment | Records | Status |
|------|---------|-------------|---------|--------|
| `admin-user.sql` | Create default admin account | All | 1 admin + preferences | ✅ Ready |
| `sample-routes.sql` | Popular bus routes in Vietnam | Dev/Test | 13 routes + 10 stops | ✅ Ready |
| `sample-buses.sql` | Sample bus fleet (various types) | Dev/Test | 10 buses | ✅ Ready |
| `sample-schedules.sql` | Bus schedules (next 7 days) | Dev/Test | ~70 schedules | ✅ Ready |
| `sample-customers.sql` | Test customer accounts | Dev/Test | 6 customers | ✅ Ready |

**Total Sample Data:** ~100 database records

## 🚀 How to Import Seed Data

### Prerequisites

- Database created and running
- Migrations completed (or auto-sync enabled)
- Appropriate user permissions (`bus_booking_user`)

### Method 1: Using npm Scripts (Recommended)

**From project root or server directory:**

```bash
cd bus-booking-server

# Import all seeds in correct order
npm run seed

# Or import specific seeds:
npm run seed:admin      # Admin user only
npm run seed:routes     # Routes and stops
npm run seed:buses      # Bus fleet
npm run seed:schedules  # Schedules for next 7 days
npm run seed:customers  # Test customers
```

### Method 2: Import All Seeds Manually

**Windows PowerShell:**
```powershell
cd database/seeds

# Import in dependency order
psql -U bus_booking_user -d bus_booking -h localhost -f admin-user.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-routes.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-buses.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-schedules.sql
psql -U bus_booking_user -d bus_booking -h localhost -f sample-customers.sql
```

**Linux/macOS Bash:**
```bash
cd database/seeds

# Import all at once
for file in admin-user.sql sample-routes.sql sample-buses.sql sample-schedules.sql sample-customers.sql; do
  echo "Importing $file..."
  psql -U bus_booking_user -d bus_booking -h localhost -f $file
done
```

### Method 3: Import Specific Seed

```bash
# Import only admin user
psql -U bus_booking_user -d bus_booking -h localhost -f admin-user.sql

# Import only routes
psql -U bus_booking_user -d bus_booking -h localhost -f sample-routes.sql

# Import only buses
psql -U bus_booking_user -d bus_booking -h localhost -f sample-buses.sql
```

### Important: Import Order

⚠️ **Seeds must be imported in this order due to foreign key dependencies:**

1. `admin-user.sql` (no dependencies)
2. `sample-routes.sql` (no dependencies)
3. `sample-buses.sql` (no dependencies)
4. `sample-customers.sql` (no dependencies)
5. `sample-schedules.sql` (requires routes and buses)

**Wrong order will cause foreign key constraint errors!**

## 📝 Seed Data Details

### 1. Admin User (admin-user.sql)

**Purpose:** Create default administrator account

**Data Included:**
- Admin email: `admin@busbooking.com`
- Admin username: `admin`
- Default password: `Admin@123456` (⚠️ change after first login!)
- Position: `admin`
- Verified account: `true`
- Notification preferences: enabled

**Records Created:** 1 admin user + 1 notification preference

**Usage:**
```bash
psql -U bus_booking_user -d bus_booking -f admin-user.sql
```

**Login After Seeding:**
- Email: `admin@busbooking.com`
- Password: `Admin@123456`

---

### 2. Sample Routes (sample-routes.sql)

**Purpose:** Create popular bus routes across Vietnam

**Data Included:**
- **13 routes** covering major cities:
  - North-South: HCM-Hanoi, HCM-Da Nang, Hanoi-Da Nang
  - Southern: HCM-Nha Trang, HCM-Vung Tau, HCM-Can Tho, HCM-Dalat
  - Central: Da Nang-Hue, Da Nang-Hoi An, Nha Trang-Dalat
  - Northern: Hanoi-Haiphong, Hanoi-Ninh Binh, Hanoi-Ha Long
- **10 route stops** for major routes (HCM-Da Nang, HCM-Nha Trang)
- Distance and estimated duration for each route
- Route numbers (101-403)

**Records Created:** 13 routes + 10 route stops

**Sample Route:**
```
Route 102: Ho Chi Minh - Da Nang
Distance: 964 km
Duration: 18 hours
Stops: 6 (including pickup/dropoff points)
```

---

### 3. Sample Buses (sample-buses.sql)

**Purpose:** Create a diverse bus fleet for testing

**Data Included:**
- **10 buses** with various types:
  - 3 Sleeper buses (32-40 seats)
  - 2 Semi-Sleeper buses (42-45 seats)
  - 2 Seater buses (29-35 seats)
  - 2 Limousine buses (16-18 seats)
  - 1 bus in maintenance status
- Bus numbers: BUS001-BUS010
- Plate numbers: 51B-12345, etc.
- Seat configurations (JSONB)
- Amenities arrays (WiFi, AC, USB, Water, etc.)
- Depot assignments

**Records Created:** 10 buses

**Bus Types:**
- **Sleeper:** Long-distance overnight trips, reclining beds
- **Semi-Sleeper:** Medium comfort, adjustable seats
- **Seater:** Standard seating buses
- **Limousine:** Premium service, fewer seats

---

### 4. Sample Schedules (sample-schedules.sql)

**Purpose:** Generate bus schedules for the next 7 days

**Data Included:**
- **~70 schedules** covering:
  - HCM - Da Nang: 2 trips/day (morning & evening)
  - HCM - Nha Trang: 2 trips/day (day & night)
  - HCM - Vung Tau: 3 trips/day (every 4 hours)
  - HCM - Dalat: 1 limousine trip/day
- Dynamic date generation (next 7 days from import date)
- Prices: 120,000 - 480,000 VND depending on route/type
- All seats initially available
- Status: 'Scheduled'

**Records Created:** ~70 bus schedules

**Schedule Pattern:**
```
Daily schedules for:
- Long routes: 2-3 departures/day
- Short routes: 3-4 departures/day
- Premium routes: 1-2 departures/day
```

⚠️ **Note:** Schedules use `CURRENT_DATE` + offset, so they're always relevant when seeded.

---

### 5. Sample Customers (sample-customers.sql)

**Purpose:** Create test customer accounts for development

**Data Included:**
- **6 customer accounts:**
  1. John Doe (verified, local auth)
  2. Jane Smith (verified, local auth, Vietnamese locale)
  3. Nguyễn Văn A (verified, Vietnamese)
  4. Trần Thị B (verified, notifications disabled)
  5. New User (unverified)
  6. Google User (OAuth)
- All local users password: `Test@123456`
- Notification preferences for all customers
- Phone numbers for Vietnamese customers

**Records Created:** 6 customers + 6 notification preferences

**Test Accounts:**

| Email | Username | Password | Verified | Provider |
|-------|----------|----------|----------|----------|
| john.doe@example.com | johndoe | Test@123456 | ✅ | local |
| jane.smith@example.com | janesmith | Test@123456 | ✅ | local |
| nguyen.van.a@example.com | nguyenvana | Test@123456 | ✅ | local |
| tran.thi.b@example.com | tranthib | Test@123456 | ✅ | local |
| new.user@example.com | newuser | Test@123456 | ❌ | local |
| google.user@gmail.com | googleuser | N/A | ✅ | google |

**Usage for Testing:**
- Login testing: Use `john.doe@example.com` / `Test@123456`
- Email verification flow: Use `new.user@example.com`
- OAuth testing: Check `google.user@gmail.com`

---

## 🔄 Re-seeding Data

### Clean and Re-seed

If you need to reset all seed data:

```bash
# Method 1: Drop and recreate database
dropdb -U postgres bus_booking
createdb -U postgres bus_booking
# Then run all seeds again

# Method 2: Delete specific data
psql -U bus_booking_user -d bus_booking -c "TRUNCATE customers, routes, buses, bus_schedules, route_stops CASCADE;"
# Then re-import seeds
```

⚠️ **Warning:** This will delete ALL data including real bookings!

---

## 🧪 Verifying Seed Data

After importing, verify the data:

```sql
-- Check all tables
SELECT 
  'customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'routes', COUNT(*) FROM routes
UNION ALL
SELECT 'route_stops', COUNT(*) FROM route_stops
UNION ALL
SELECT 'buses', COUNT(*) FROM buses
UNION ALL
SELECT 'bus_schedules', COUNT(*) FROM bus_schedules
UNION ALL
SELECT 'notification_preferences', COUNT(*) FROM notification_preferences;

-- Check admin user
SELECT email, username, position, "isVerified" 
FROM customers 
WHERE position = 'admin';

-- Check upcoming schedules
SELECT 
  "departure_city",
  "arrival_city",
  "departure_date",
  "departure_time",
  "busType",
  "availableSeats"
FROM bus_schedules
WHERE "departure_date" >= CURRENT_DATE
ORDER BY "departure_date", "departure_time"
LIMIT 10;
```

---

## 📊 Expected Results

After successful seeding:

```
✅ Admin user: 1
✅ Routes: 13
✅ Route stops: 10
✅ Buses: 10 (9 active, 1 maintenance)
✅ Bus schedules: ~70 (next 7 days)
✅ Customers: 7 (1 admin + 6 test accounts)
✅ Notification preferences: 7
---
Total records: ~117
```

---

## 🚨 Troubleshooting

### Error: "duplicate key value violates unique constraint"

**Cause:** Seeds already imported

**Solution:**
```sql
-- Skip conflicts (already in seed files with ON CONFLICT)
-- OR manually delete existing data first
DELETE FROM customers WHERE email = 'admin@busbooking.com';
```

### Error: "relation does not exist"

**Cause:** Tables not created yet

**Solution:**
```bash
# Run migrations or sync database first
cd bus-booking-server
npm run sync-db
# Then re-import seeds
```

### Error: "foreign key violation"

**Cause:** Wrong import order

**Solution:** Import in correct order (see "Import Order" section above)

### Schedules are in the past

**Cause:** Seed file creates schedules from import date

**Solution:** Re-import `sample-schedules.sql` to generate new dates

---

## 💡 Tips

1. **Always import admin-user.sql first** - You'll need admin access for testing
2. **Import seeds after migrations** - Ensure schema is up-to-date
3. **Use npm scripts when available** - They handle order and errors
4. **Check seed output** - Each file shows success messages and counts
5. **Don't use seed data in production** - These are test accounts with weak passwords

---

## 🔗 Related Documentation

- [Database README](../README.md) - Database setup and migrations
- [Database Design](../../docs/DATABASE_DESIGN.md) - Schema documentation
- [Setup Guide](../../docs/SETUP_GUIDE.md) - Full application setup

---

**Last Updated:** January 3, 2026 
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
