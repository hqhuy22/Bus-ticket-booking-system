# 🌱 Database Seeding Guide

## ✨ Đã Gộp Chung - Chỉ 1 Lệnh!

Tất cả các file seed data đã được gộp lại thành **1 file duy nhất**: `seed.js`

**Chỉ cần chạy 1 lệnh:**

```bash
cd bus-booking-server
npm run seed
```

Hoặc nếu đang ở thư mục gốc:

```bash
cd bus-booking-server && npm run seed
```

### Dữ Liệu Được Tạo

Script `seed.js` sẽ tạo tất cả dữ liệu mẫu:

1. **👥 Users (6 người)**
   - 1 Admin: `admin@busbook.com` / `Admin@123`
   - 5 Customers (bao gồm local và Google user)

2. **🚌 Buses (5 xe)**
   - Giường nằm (2 xe)
   - Ghế ngồi (2 xe)
   - Limousine (1 xe)

3. **🛣️ Routes (4 tuyến đường)**
   - Hà Nội → Đà Nẵng
   - TP.HCM → Đà Lạt
   - Hà Nội → Hải Phòng
   - TP.HCM → Vũng Tàu
   - Mỗi tuyến có RouteStops chi tiết

4. **📅 Bus Schedules (70+ lịch trình)**
   - Tự động tạo cho 14 ngày tới
   - Mỗi tuyến có 3-5 chuyến/ngày
   - Trạng thái: Scheduled, In Progress, Completed

5. **🎫 Bookings (9 đặt vé)**
   - Các trạng thái: pending, confirmed, completed, cancelled
   - Nhiều phương thức thanh toán

6. **⭐ Reviews (5 đánh giá)**
   - Đánh giá 4-5 sao
   - Comments bằng tiếng Việt và English

7. **💬 Chat History (12 messages)**
   - 3 session chat mẫu
   - Câu hỏi và trả lời về tuyến đường

8. **🔔 Notification Preferences**
   - Tự động tạo cho tất cả users

9. **🔒 Seat Locks**
   - Demo seat lock cho active schedule

## Test Credentials

### Admin
```
Email: admin@busbook.com
Password: Admin@123
```

### Customer
```
Email: john.doe@gmail.com
Password: User@123
```

## Các File Cũ (Không Cần Dùng Nữa)

Các file sau đã được gộp vào `seed.js`:
- ~~`seed_admin.js`~~
- ~~`seed_mock_data.js`~~
- ~~`seed_simple.js`~~
- ~~`seed_reviews_single_schedule.js`~~

Bạn có thể xóa hoặc giữ lại để tham khảo.

## Kiểm Tra Database

Sau khi seed, bạn có thể kiểm tra:

```bash
node scripts/check_database.js
```

Hoặc xem trực tiếp trong pgAdmin/psql:

```sql
SELECT COUNT(*) FROM "Customers";
SELECT COUNT(*) FROM "Buses";
SELECT COUNT(*) FROM "Routes";
SELECT COUNT(*) FROM "BusSchedules";
SELECT COUNT(*) FROM "BusBookings";
```

## Lưu Ý

- Script sẽ **không xóa** dữ liệu cũ
- Sử dụng `findOrCreate` nên có thể chạy nhiều lần an toàn
- Nếu muốn reset database hoàn toàn, dùng:
  ```bash
  npm run sync-db
  npm run seed
  ```

## Troubleshooting

### Lỗi kết nối database
```bash
# Kiểm tra PostgreSQL đang chạy
# Kiểm tra file .env có đúng thông tin DB
```

### Lỗi "already exists"
```bash
# Bình thường - script sẽ skip dữ liệu đã tồn tại
# Không cần lo lắng
```

---

**Chúc bạn test vui vẻ! 🎉**
