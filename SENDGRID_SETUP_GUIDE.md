# 📧 Hướng Dẫn Cấu Hình SendGrid

> **Tình huống**: Render hoặc các nền tảng hosting khác chặn SMTP port 587/465, bạn cần thay thế bằng SendGrid API để gửi email.

## 🎯 Tại Sao Dùng SendGrid?

- ✅ **Miễn phí**: 100 emails/ngày (3,000 emails/tháng) miễn phí vĩnh viễn
- ✅ **Không bị chặn**: Sử dụng HTTPS API thay vì SMTP ports
- ✅ **Độ tin cậy cao**: Deliverability tốt hơn Gmail SMTP
- ✅ **Dễ setup**: Chỉ cần API key, không cần cấu hình SMTP phức tạp

---

## 📋 Bước 1: Đăng Ký SendGrid

1. Truy cập: https://signup.sendgrid.com/
2. Điền thông tin đăng ký (email, password, username)
3. Xác thực email của bạn
4. Hoàn thành form thông tin:
   - **Company Name**: Tên công ty hoặc dự án (vd: "QTechy Bus Booking")
   - **Company Website**: URL website (có thể để tạm https://github.com/yourusername)
   - **Role**: Chọn "Developer"
   - **Use Case**: Chọn "Transactional Email" (email giao dịch)

---

## 🔑 Bước 2: Tạo API Key

1. Sau khi đăng nhập, vào **Settings** → **API Keys**
   - Link trực tiếp: https://app.sendgrid.com/settings/api_keys

2. Click **"Create API Key"**

3. Cấu hình API Key:
   - **API Key Name**: `Bus-Booking-Production` (hoặc tên bạn muốn)
   - **API Key Permissions**: 
     - Chọn **"Restricted Access"**
     - Bật **"Mail Send"** → **"Full Access"**
     - (Các quyền khác để "No Access")
   
4. Click **"Create & View"**

5. **QUAN TRỌNG**: Copy API key ngay (chỉ hiển thị 1 lần duy nhất!)
   ```
   SG.xxxxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
   ```

---

## 📨 Bước 3: Xác Thực Email Gửi (Sender Identity)

SendGrid yêu cầu xác thực email người gửi để tránh spam.

### Option A: Single Sender Verification (Nhanh - Dùng cho Dev/Test)

1. Vào **Settings** → **Sender Authentication** → **Single Sender Verification**
   - Link: https://app.sendgrid.com/settings/sender_auth/senders

2. Click **"Create New Sender"**

3. Điền thông tin:
   - **From Name**: `QTechy Bus Booking` (tên hiển thị)
   - **From Email Address**: Email của bạn (Gmail, Outlook, etc.)
   - **Reply To**: Cùng email ở trên
   - **Company Address**: Địa chỉ (có thể điền tạm)
   - **City, State, Zip, Country**: Thông tin địa chỉ

4. Click **"Save"**

5. **Xác thực email**: 
   - SendGrid sẽ gửi email xác nhận đến địa chỉ bạn vừa nhập
   - Mở email và click link xác thực
   - Trạng thái sẽ chuyển từ "Pending" → "Verified"

### Option B: Domain Authentication (Production - Nâng cao)

> Chỉ dùng khi bạn có tên miền riêng (yourcompany.com)

1. Vào **Settings** → **Sender Authentication** → **Domain Authentication**
2. Follow wizard để thêm DNS records vào domain của bạn
3. Độ tin cậy cao hơn nhưng phức tạp hơn

---

## ⚙️ Bước 4: Cấu Hình Backend

### 4.1. Cài Đặt Package (Đã có sẵn)

Kiểm tra `package.json` đã có:
```json
{
  "dependencies": {
    "@sendgrid/mail": "^7.7.0"
  }
}
```

Nếu chưa có, chạy:
```bash
npm install @sendgrid/mail
```

### 4.2. Cập Nhật File `.env`

Mở file `bus-booking-server/.env` và cấu hình:

```bash
# ============================================
# EMAIL SERVICE CONFIGURATION
# ============================================

# Chuyển EMAIL_PROVIDER sang 'sendgrid'
EMAIL_PROVIDER=sendgrid

# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
SENDGRID_FROM_EMAIL=your-verified-email@gmail.com

# Comment hoặc xóa các config SMTP cũ (không cần nữa)
# EMAIL_SERVICE=gmail
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-app-password
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
```

**Lưu ý quan trọng:**
- `SENDGRID_API_KEY`: API key bạn vừa tạo ở bước 2
- `SENDGRID_FROM_EMAIL`: **PHẢI** là email đã xác thực ở bước 3
- Nếu dùng Single Sender Verification, email này phải khớp 100% với "From Email" đã verify

---

## 🚀 Bước 5: Test Gửi Email

### 5.1. Khởi Động Server

```bash
cd bus-booking-server
npm run dev
```

Kiểm tra log khởi động, phải thấy:
```
Using SendGrid for email service
```

### 5.2. Test Bằng API

#### Test 1: Đăng Ký Tài Khoản Mới

```bash
# Gửi request đăng ký
curl -X POST http://localhost:4000/api/customer/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!@#",
    "phone": "0123456789"
  }'
```

Kiểm tra:
- Log server phải hiển thị: `[Email] Using SendGrid provider`
- Email verification sẽ được gửi đến `test@example.com`

#### Test 2: Quên Mật Khẩu

```bash
curl -X POST http://localhost:4000/api/customer/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

#### Test 3: Booking Confirmation

Tạo một booking hoàn chỉnh qua UI hoặc API, email xác nhận sẽ được gửi.

### 5.3. Kiểm Tra SendGrid Dashboard

1. Vào **Activity** → **Email Activity**
   - Link: https://app.sendgrid.com/email_activity

2. Xem danh sách emails đã gửi với status:
   - ✅ **Delivered**: Thành công
   - ⚠️ **Deferred**: Tạm hoãn (thử lại sau)
   - ❌ **Bounced**: Thất bại (email không tồn tại)
   - ❌ **Blocked**: Bị chặn (spam filter)

---

## 🐛 Xử Lý Lỗi Thường Gặp

### Lỗi 1: "Forbidden - You do not have authorization"

**Nguyên nhân**: Email gửi chưa được xác thực

**Giải pháp**:
1. Kiểm tra `SENDGRID_FROM_EMAIL` trong `.env`
2. Đảm bảo email này đã verified trong SendGrid
3. Email phải khớp 100% (chữ hoa/thường, dấu chấm, etc.)

### Lỗi 2: "API key not valid"

**Nguyên nhân**: API key sai hoặc hết hạn

**Giải pháp**:
1. Kiểm tra lại `SENDGRID_API_KEY` trong `.env`
2. Tạo API key mới nếu cần
3. Đảm bảo không có khoảng trắng thừa khi copy/paste

### Lỗi 3: Email vào Spam

**Giải pháp**:
1. Sử dụng Domain Authentication thay vì Single Sender
2. Tránh nội dung spam (quá nhiều link, chữ IN HOA, ký tự đặc biệt)
3. Thêm SPF, DKIM records vào domain

### Lỗi 4: "Daily sending limit exceeded"

**Nguyên nhân**: Vượt quota 100 emails/ngày (free tier)

**Giải pháp**:
- Chờ đến ngày mới (reset hàng ngày)
- Hoặc upgrade plan SendGrid

---

## 🔄 Chuyển Đổi Giữa SMTP và SendGrid

Code đã được thiết kế để tự động chuyển đổi dựa trên biến môi trường.

### Dùng SendGrid (Production - Render)
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxx...
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Dùng Gmail SMTP (Development - Local)
```bash
EMAIL_PROVIDER=gmail
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Dùng Custom SMTP (VD: Mailtrap, SMTP2GO)
```bash
EMAIL_PROVIDER=smtp
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
EMAIL_USER=your-username
EMAIL_PASSWORD=your-password
```

**Không cần thay đổi code**, chỉ cần update `.env`!

---

## 📊 Giới Hạn Free Tier

| Feature | Free Plan | Paid Plans |
|---------|-----------|------------|
| Emails/ngày | 100 | Không giới hạn |
| Emails/tháng | ~3,000 | Không giới hạn |
| API Requests | Không giới hạn | Không giới hạn |
| Sender Authentication | ✅ Single Sender | ✅ Domain Auth |
| Email Templates | ✅ | ✅ |
| Analytics | 7 ngày | 30+ ngày |
| Support | Community | Email/Chat |

**Lưu ý**: 100 emails/ngày đủ cho development và small-scale production. Nếu cần nhiều hơn, xem xét upgrade.

---

## 🚢 Deploy Lên Render

### 1. Thêm Environment Variables

Trong Render Dashboard → Your Service → Environment:

```
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### 2. Xóa/Comment SMTP Variables

Đảm bảo các biến sau KHÔNG tồn tại hoặc được comment:
- `EMAIL_SERVICE`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `SMTP_HOST`
- `SMTP_PORT`

### 3. Redeploy

Click **"Manual Deploy"** → **"Deploy latest commit"**

### 4. Kiểm Tra Logs

Trong Render logs, tìm dòng:
```
Using SendGrid for email service
```

---

## 📝 Checklist Hoàn Thành

- [ ] Đăng ký tài khoản SendGrid
- [ ] Tạo API Key với quyền "Mail Send"
- [ ] Xác thực Single Sender (hoặc Domain)
- [ ] Cập nhật `.env` với `EMAIL_PROVIDER=sendgrid`
- [ ] Thêm `SENDGRID_API_KEY` và `SENDGRID_FROM_EMAIL`
- [ ] Test gửi email local (đăng ký, quên mật khẩu)
- [ ] Deploy lên Render với env variables mới
- [ ] Verify email gửi thành công trên production
- [ ] Kiểm tra SendGrid Activity Dashboard

---

## 🆘 Cần Trợ Giúp?

- **SendGrid Docs**: https://docs.sendgrid.com/
- **API Reference**: https://docs.sendgrid.com/api-reference/mail-send/mail-send
- **Support**: https://support.sendgrid.com/

---

## 💡 Mẹo Nâng Cao

### 1. Sử Dụng Email Templates

SendGrid cho phép tạo template với Handlebars:

```javascript
// Trong code
const msg = {
  to: 'user@example.com',
  from: process.env.SENDGRID_FROM_EMAIL,
  templateId: 'd-xxxxxxxxxxxxxxxxx', // Template ID từ SendGrid
  dynamicTemplateData: {
    username: 'John Doe',
    bookingReference: 'BK12345',
  },
};
await sgMail.send(msg);
```

### 2. Tracking & Analytics

Thêm tracking vào email:
```javascript
const msg = {
  // ... other fields
  trackingSettings: {
    clickTracking: { enable: true },
    openTracking: { enable: true },
  },
};
```

### 3. Attachments

Gửi file đính kèm:
```javascript
const msg = {
  // ... other fields
  attachments: [
    {
      content: Buffer.from('PDF content').toString('base64'),
      filename: 'ticket.pdf',
      type: 'application/pdf',
      disposition: 'attachment',
    },
  ],
};
```

---

**✅ Hoàn tất!** Email của bạn giờ đã hoạt động trên production mà không bị chặn bởi firewall/port restrictions.
