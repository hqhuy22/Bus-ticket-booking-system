# 🏙️ Cities Configuration & Validation

## Danh Sách Thành Phố Chuẩn

File `config/cities.js` chứa danh sách **44 thành phố chuẩn** với tên tiếng Việt có dấu.

### ✅ Quy Tắc Đặt Tên

**Sử dụng tên tiếng Việt có dấu chính thống:**
- ✅ `Hà Nội` (không phải `Hanoi` hay `Ha Noi`)
- ✅ `Hồ Chí Minh` (không phải `Ho Chi Minh City` hay `Saigon`)
- ✅ `Đà Nẵng` (không phải `Da Nang` hay `Danang`)
- ✅ `Hải Phòng` (không phải `Hai Phong`)
- ✅ `Vũng Tàu` (không phải `Vung Tau`)
- ✅ `Đà Lạt` (không phải `Da Lat` hay `Dalat`)
- ✅ `Cần Thơ` (không phải `Can Tho`)
- ✅ `Hạ Long` (không phải `Ha Long` hay `Halong`)

## 📋 Danh Sách Đầy Đủ

### Miền Bắc (14 thành phố)
```
Hà Nội, Hải Phòng, Hạ Long, Ninh Bình, Hải Dương, Bắc Ninh, 
Bắc Giang, Lạng Sơn, Sapa, Lào Cai, Yên Bái, Thái Nguyên, 
Vinh, Thanh Hóa
```

### Miền Trung (12 thành phố)
```
Đông Hới, Huế, Đà Nẵng, Hội An, Tam Kỳ, Quảng Ngãi, 
Quy Nhơn, Tuy Hòa, Nha Trang, Cam Ranh, Phan Rang, Phan Thiết
```

### Miền Nam (14 thành phố)
```
Hồ Chí Minh, Biên Hòa, Vũng Tàu, Đà Lạt, Bảo Lộc, Mỹ Tho, 
Vĩnh Long, Cần Thơ, Sóc Trăng, Cà Mau, Rạch Giá, Hà Tiên, 
Long Xuyên, Châu Đốc
```

## 🔧 Validation

### Seed Data Validation

File `seed.js` tự động validate tất cả routes trước khi seed:

```javascript
import { VIETNAM_CITIES, isValidCity } from '../config/cities.js';

// Trong seedDatabase()
const citiesValid = validateRouteCities();
if (!citiesValid) {
  console.log('❌ Seeding aborted due to invalid city names in routes.\n');
  process.exit(1);
}
```

### Helper Functions

```javascript
// Kiểm tra city có hợp lệ không
isValidCity('Hà Nội')  // true
isValidCity('Hanoi')   // false

// Gợi ý city name chuẩn
getCitySuggestion('hanoi')         // 'Hà Nội'
getCitySuggestion('ho chi minh')   // 'Hồ Chí Minh'
getCitySuggestion('da nang')       // 'Đà Nẵng'
```

## 📝 Cách Sử Dụng

### 1. Import Cities

```javascript
import { VIETNAM_CITIES, isValidCity, getCitySuggestion } from '../config/cities.js';
```

### 2. Validate Route

```javascript
const route = {
  origin: 'Hà Nội',
  destination: 'Đà Nẵng'
};

if (!isValidCity(route.origin)) {
  const suggestion = getCitySuggestion(route.origin);
  console.log(`Invalid origin. Did you mean: ${suggestion}?`);
}
```

### 3. Thêm Route Mới

Khi thêm route mới vào `seed.js`, **bắt buộc** sử dụng tên từ `VIETNAM_CITIES`:

```javascript
{
  routeName: 'Hà Nội - Huế Heritage',
  routeNo: 106,
  origin: 'Hà Nội',        // ✅ Correct
  destination: 'Huế',      // ✅ Correct
  // origin: 'Hanoi',      // ❌ Wrong - seed sẽ fail
  // destination: 'Hue',   // ❌ Wrong - seed sẽ fail
}
```

## ⚠️ Lưu Ý

### Database Hiện Tại

Database có thể chứa các routes cũ với tên không chuẩn:
- `Hanoi`, `Ho Chi Minh City`, `Da Nang`, etc.

Những routes cũ này vẫn hoạt động, nhưng **tất cả routes mới** phải sử dụng tên chuẩn.

### Migration (Tùy Chọn)

Nếu muốn chuẩn hóa toàn bộ database:

```sql
-- Update existing routes to standard names
UPDATE routes SET origin = 'Hà Nội' WHERE origin IN ('Hanoi', 'Ha Noi');
UPDATE routes SET origin = 'Hồ Chí Minh' WHERE origin IN ('Ho Chi Minh City', 'Saigon', 'HCM');
UPDATE routes SET origin = 'Đà Nẵng' WHERE origin IN ('Da Nang', 'Danang');
-- ... repeat for destination and other cities
```

## ✅ Benefits

1. **Consistency** - Tất cả routes sử dụng tên thống nhất
2. **Validation** - Tự động phát hiện lỗi khi seed
3. **Autocomplete** - IDE có thể suggest từ danh sách chuẩn
4. **Documentation** - Danh sách rõ ràng, dễ reference

## 🚀 Commands

```bash
# Kiểm tra cities trong database
node scripts/check_cities.js

# Kiểm tra routes với stops
node scripts/check_routes.js

# Seed với validation
npm run seed
```

---

**Mọi thắc mắc về cities, vui lòng tham khảo file `config/cities.js`** 📖
