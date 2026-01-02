# 🚀 QUICK START - Database Migration Import

**Hướng dẫn nhanh import database migrations trong 5 phút**

---

## ⚡ Cách nhanh nhất (Windows)

```powershell
# 1. Tạo database (chỉ làm 1 lần)
psql -U postgres
```

```sql
CREATE USER bus_booking_user WITH PASSWORD 'your_password';
CREATE DATABASE bus_booking;
GRANT ALL PRIVILEGES ON DATABASE bus_booking TO bus_booking_user;
\c bus_booking
GRANT ALL ON SCHEMA public TO bus_booking_user;
\q
```

```powershell
# 2. Import migrations
cd database\migrations
psql -U bus_booking_user -d bus_booking -h localhost -f 20260101-bus-management-updates.sql
psql -U bus_booking_user -d bus_booking -h localhost -f add_fullname_to_customers.sql
psql -U bus_booking_user -d bus_booking -h localhost -f add_schedule_status.sql

# 3. Verify
psql -U bus_booking_user -d bus_booking -h localhost
```

```sql
\dt    -- List tables
\q     -- Exit
```

✅ **Done!** Migrations đã được import.

---

## 📝 Alternative: Dùng npm scripts

```powershell
# Từ thư mục bus-booking-server
cd bus-booking-server
npm run sync-db
```

⚠️ **Warning:** Cách này sẽ drop tất cả tables và tạo lại từ models.

---

## 🔍 Kiểm tra migrations đã import

```sql
-- Connect to database
psql -U bus_booking_user -d bus_booking -h localhost

-- Check buses table
\d buses
-- Should show: plateNumber, photos columns

-- Check customers table  
\d customers
-- Should show: fullName column

-- Check bus_schedules table
\d bus_schedules
-- Should show: status column

\q
```

---

## 📚 Chi tiết đầy đủ

Xem file [`database/migrations/README.md`](./database/migrations/README.md) để biết thêm chi tiết về:
- Rollback procedures
- Troubleshooting
- Creating new migrations
- Best practices

---

**Last Updated:** January 2, 2026
