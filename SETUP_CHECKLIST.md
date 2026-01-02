# ✅ CHECKLIST - Thiết lập Database từ đầu

**Sử dụng checklist này để đảm bảo setup database đúng cách**

---

## 📋 Phase 1: PostgreSQL Setup

- [ ] PostgreSQL đã được cài đặt
  ```bash
  psql --version
  # Expected: psql (PostgreSQL) 15.x
  ```

- [ ] PostgreSQL service đang chạy
  ```bash
  # Windows
  Get-Service postgresql*
  
  # Linux/macOS
  sudo systemctl status postgresql
  ```

- [ ] Có thể connect vào PostgreSQL
  ```bash
  psql -U postgres
  ```

---

## 📋 Phase 2: Database Creation

- [ ] Tạo database user
  ```sql
  CREATE USER bus_booking_user WITH PASSWORD 'your_secure_password';
  ```

- [ ] Tạo database
  ```sql
  CREATE DATABASE bus_booking;
  ```

- [ ] Grant privileges
  ```sql
  GRANT ALL PRIVILEGES ON DATABASE bus_booking TO bus_booking_user;
  \c bus_booking
  GRANT ALL ON SCHEMA public TO bus_booking_user;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bus_booking_user;
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bus_booking_user;
  ```

- [ ] Test connection
  ```bash
  psql -U bus_booking_user -d bus_booking -h localhost
  # Should connect successfully
  \q
  ```

---

## 📋 Phase 3: Environment Configuration

- [ ] Copy .env.example to .env
  ```bash
  cd bus-booking-server
  copy .env.example .env  # Windows
  # OR
  cp .env.example .env    # Linux/macOS
  ```

- [ ] Update DATABASE_URL in .env
  ```env
  DATABASE_URL=postgresql://bus_booking_user:your_password@localhost:5432/bus_booking
  ```

- [ ] Update other database configs
  ```env
  PG_USER=bus_booking_user
  PG_PASSWORD=your_password
  PG_HOST=localhost
  PG_PORT=5432
  PG_DATABASE=bus_booking
  ```

---

## 📋 Phase 4: Migration Import

### Option A: Manual Migration (Recommended)

- [ ] Navigate to migrations folder
  ```bash
  cd database/migrations
  ```

- [ ] Run migration 1: Bus management updates
  ```bash
  psql -U bus_booking_user -d bus_booking -h localhost -f 20260101-bus-management-updates.sql
  ```
  Expected output: `ALTER TABLE` commands executed

- [ ] Run migration 2: Add fullName to customers
  ```bash
  psql -U bus_booking_user -d bus_booking -h localhost -f add_fullname_to_customers.sql
  ```
  Expected output: Column added

- [ ] Run migration 3: Add schedule status
  ```bash
  psql -U bus_booking_user -d bus_booking -h localhost -f add_schedule_status.sql
  ```
  Expected output: Column added

### Option B: Automatic Sync (Development Only)

- [ ] Run sync command
  ```bash
  cd bus-booking-server
  npm run sync-db
  ```
  ⚠️ Warning: This drops all tables!

---

## 📋 Phase 5: Verification

- [ ] Check tables exist
  ```bash
  psql -U bus_booking_user -d bus_booking -h localhost
  ```
  ```sql
  \dt
  -- Should see: buses, customers, bus_schedules, routes, etc.
  ```

- [ ] Check buses table structure
  ```sql
  \d buses
  -- Should see: plateNumber, photos columns
  ```

- [ ] Check customers table structure
  ```sql
  \d customers
  -- Should see: fullName column
  ```

- [ ] Check bus_schedules table structure
  ```sql
  \d bus_schedules
  -- Should see: status column
  ```

- [ ] Count tables
  ```sql
  SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema = 'public';
  -- Should be around 10-15 tables
  ```

---

## 📋 Phase 6: Seed Data (Optional)

- [ ] Create admin user
  ```bash
  cd bus-booking-server
  npm run seed-admin
  # OR manually:
  cd database/seeds
  psql -U bus_booking_user -d bus_booking -h localhost -f admin-user.sql
  ```

- [ ] Verify admin user exists
  ```sql
  SELECT email, username, position FROM customers WHERE position = 'admin';
  -- Should show admin user
  ```

- [ ] Import sample data (optional)
  ```bash
  npm run seed-data
  ```

---

## 📋 Phase 7: Application Testing

- [ ] Install dependencies
  ```bash
  cd bus-booking-server
  npm install
  ```

- [ ] Start backend server
  ```bash
  npm run dev
  ```
  Expected: Server running on port 4000

- [ ] Test database connection
  - Check terminal logs for "Database connected" message
  - No errors about database connection

- [ ] Test API endpoints
  ```bash
  # In new terminal
  curl http://localhost:4000/api/health
  # Should return OK status
  ```

---

## 📋 Phase 8: Frontend Setup

- [ ] Install frontend dependencies
  ```bash
  cd bus-booking-client
  npm install
  ```

- [ ] Start frontend
  ```bash
  npm run dev
  ```
  Expected: Running on http://localhost:5173

- [ ] Test in browser
  - [ ] Open http://localhost:5173
  - [ ] Homepage loads correctly
  - [ ] Can search for buses
  - [ ] No console errors

---

## 📋 Phase 9: Backup Setup (Recommended)

- [ ] Test backup script
  ```bash
  cd database/backups
  ./backup.sh  # Linux/macOS
  # OR
  .\backup.ps1  # Windows
  ```

- [ ] Verify backup file created
  - Check backups/daily/ folder
  - Backup file should exist

- [ ] Setup automated backups (optional)
  - [ ] Linux/macOS: Setup cron job
  - [ ] Windows: Setup Task Scheduler

---

## 📋 Phase 10: Documentation Review

- [ ] Read main README.md
- [ ] Read docs/SETUP_GUIDE.md
- [ ] Read database/README.md
- [ ] Read database/migrations/README.md
- [ ] Bookmark docs/DEPLOYMENT_GUIDE.md for later

---

## ✅ Completion Checklist

After all phases complete, verify:

- [ ] ✅ PostgreSQL installed and running
- [ ] ✅ Database and user created
- [ ] ✅ All migrations imported successfully
- [ ] ✅ Tables exist and have correct structure
- [ ] ✅ Backend server starts without errors
- [ ] ✅ Frontend app loads correctly
- [ ] ✅ Can create/read data through API
- [ ] ✅ Admin user created (if needed)
- [ ] ✅ Backup tested (recommended)

---

## 🐛 Common Issues

### Issue 1: Cannot connect to PostgreSQL
**Error:** `ECONNREFUSED` or `connection refused`

**Solution:**
```bash
# Check if PostgreSQL is running
# Windows
Get-Service postgresql*

# Linux
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Issue 2: Permission denied
**Error:** `permission denied for schema public`

**Solution:**
```sql
-- Run as postgres user
psql -U postgres -d bus_booking
GRANT ALL ON SCHEMA public TO bus_booking_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bus_booking_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bus_booking_user;
```

### Issue 3: Migration already ran
**Error:** `column already exists`

**Solution:**
- This is normal if migrations use `IF NOT EXISTS`
- Migration will skip already-applied changes
- No action needed

### Issue 4: npm run sync-db fails
**Error:** Database connection error

**Solution:**
1. Check .env file has correct DATABASE_URL
2. Check PostgreSQL is running
3. Check user has correct permissions
4. Try connecting manually with psql first

---

## 📞 Need Help?

1. **Check Troubleshooting:**
   - `database/README.md` - Section: Troubleshooting
   - `database/migrations/README.md` - Section: Troubleshooting
   
2. **Review Documentation:**
   - `docs/SETUP_GUIDE.md` - Complete setup guide
   - `docs/DATABASE_DESIGN.md` - Database schema details

3. **Check Error Logs:**
   - Backend console output
   - PostgreSQL logs
   - Browser console (F12)

---

**Status:** Use this checklist to track your progress  
**Last Updated:** January 2, 2026
