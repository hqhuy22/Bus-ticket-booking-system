# 📡 API Documentation - Bus Ticket Booking System

Complete API reference for the Bus Ticket Booking System backend.

## Table of Contents

- [Authentication](#authentication)
- [Customer APIs](#customer-apis)
- [Bus Schedule APIs](#bus-schedule-apis)
- [Booking APIs](#booking-apis)
- [Bus Management APIs](#bus-management-apis)
- [Route Management APIs](#route-management-apis)
- [Seat Lock APIs](#seat-lock-apis)
- [Payment APIs](#payment-apis)
- [Review APIs](#review-apis)
- [Analytics APIs](#analytics-apis)
- [Chatbot APIs](#chatbot-apis)
- [Notification APIs](#notification-apis)
- [Error Responses](#error-responses)

## Base URL

```
Development: http://localhost:4000
Production: https://your-domain.com
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Headers

Include authentication token in requests:
```http
Authorization: Bearer <your-jwt-token>
```

### Authentication Flow

1. Register or Login → Receive JWT token
2. Include token in subsequent requests
3. Token expires after 7 days (configurable)

---

## Customer APIs

### 1. Register New Customer

Create a new customer account.

**Endpoint:** `POST /api/customer/register`

**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "phoneNumber": "+84901234567"
}
```

**Success Response (201):**
```json
{
  "msg": "Registration successful! Please check your email to verify your account.",
  "customer": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "isVerified": false,
    "position": "customer",
    "provider": "local"
  }
}
```

**Error Response (400):**
```json
{
  "msg": "Email already exists"
}
```

---

### 2. Login Customer

Authenticate and receive JWT token.

**Endpoint:** `POST /api/customer/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "customer": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "fullName": "John Doe",
    "position": "customer",
    "isVerified": true,
    "avatar": "/uploads/avatar-123.jpg"
  }
}
```

**Error Response (401):**
```json
{
  "msg": "Invalid email or password"
}
```

---

### 3. Verify Email

Verify email address using token sent to email.

**Endpoint:** `GET /api/customer/verify-email?token=<verification-token>`

**Access:** Public

**Success Response (200):**
```json
{
  "msg": "Email verified successfully! You can now log in."
}
```

---

### 4. Get Profile

Get logged-in customer profile.

**Endpoint:** `GET /api/customer/profile`

**Access:** Authenticated

**Success Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "fullName": "John Doe",
  "phoneNumber": "+84901234567",
  "position": "customer",
  "isVerified": true,
  "avatar": "/uploads/avatar-123.jpg",
  "provider": "local",
  "createdAt": "2024-01-01T10:00:00.000Z"
}
```

---

### 5. Update Profile

Update customer profile information.

**Endpoint:** `PUT /api/customer/profile`

**Access:** Authenticated

**Request Body:**
```json
{
  "fullName": "John Michael Doe",
  "phoneNumber": "+84901234567",
  "username": "johnmdoe"
}
```

**Success Response (200):**
```json
{
  "msg": "Profile updated successfully",
  "customer": {
    "id": 1,
    "email": "user@example.com",
    "username": "johnmdoe",
    "fullName": "John Michael Doe",
    "phoneNumber": "+84901234567"
  }
}
```

---

### 6. Change Password

Change customer password.

**Endpoint:** `POST /api/customer/change-password`

**Access:** Authenticated

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!",
  "confirmPassword": "NewPass456!"
}
```

**Success Response (200):**
```json
{
  "msg": "Password changed successfully"
}
```

---

### 7. Forgot Password

Request password reset email.

**Endpoint:** `POST /api/customer/forgot-password`

**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "msg": "Password reset email sent"
}
```

---

### 8. Reset Password

Reset password using token from email.

**Endpoint:** `POST /api/customer/reset-password`

**Access:** Public

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response (200):**
```json
{
  "msg": "Password reset successful"
}
```

---

### 9. Upload Avatar

Upload profile avatar image.

**Endpoint:** `POST /api/customer/avatar`

**Access:** Authenticated

**Content-Type:** `multipart/form-data`

**Request Body:**
```
avatar: <image-file>
```

**Success Response (200):**
```json
{
  "msg": "Avatar uploaded successfully",
  "avatarUrl": "/uploads/avatar-1234567890.jpg"
}
```

---

### 10. Logout

Logout customer (clear session).

**Endpoint:** `GET /api/customer/logout`

**Access:** Authenticated

**Success Response (200):**
```json
{
  "msg": "Logged out successfully"
}
```

---

## Bus Schedule APIs

### 1. Search Bus Schedules

Search for available bus schedules.

**Endpoint:** `GET /api/bus-schedules`

**Access:** Public

**Query Parameters:**
```
departure_city: string (required)
arrival_city: string (required)
departure_date: YYYY-MM-DD (required)
busType: string (optional)
minPrice: number (optional)
maxPrice: number (optional)
sortBy: price|duration|departure_time (optional)
sortOrder: asc|desc (optional)
```

**Example Request:**
```
GET /api/bus-schedules?departure_city=Ho Chi Minh&arrival_city=Da Nang&departure_date=2024-12-25
```

**Success Response (200):**
```json
{
  "schedules": [
    {
      "id": 1,
      "routeNo": 101,
      "departure_city": "Ho Chi Minh",
      "departure_date": "2024-12-25",
      "departure_time": "08:00",
      "arrival_city": "Da Nang",
      "arrival_date": "2024-12-25",
      "arrival_time": "20:00",
      "duration": "12:00",
      "busType": "Giường nằm",
      "model": "Hyundai Universe",
      "price": "350000",
      "availableSeats": 28,
      "status": "Scheduled",
      "depotName": "Bến xe Miền Đông",
      "bus": {
        "id": 5,
        "busNumber": "51B-12345",
        "totalSeats": 40,
        "amenities": ["WiFi", "AC", "USB"],
        "photos": ["/uploads/bus-photo.jpg"]
      },
      "route": {
        "id": 10,
        "origin": "Ho Chi Minh",
        "destination": "Da Nang",
        "distance": 950
      }
    }
  ],
  "total": 15
}
```

---

### 2. Get Bus Schedule by ID

Get detailed information about a specific schedule.

**Endpoint:** `GET /api/bus-schedule/:id`

**Access:** Public

**Success Response (200):**
```json
{
  "id": 1,
  "routeNo": 101,
  "departure_city": "Ho Chi Minh",
  "departure_date": "2024-12-25",
  "departure_time": "08:00",
  "arrival_city": "Da Nang",
  "arrival_date": "2024-12-25",
  "arrival_time": "20:00",
  "duration": "12:00",
  "busType": "Giường nằm",
  "model": "Hyundai Universe",
  "price": "350000",
  "availableSeats": 28,
  "status": "Scheduled",
  "bus": {
    "id": 5,
    "busNumber": "51B-12345",
    "totalSeats": 40,
    "seatLayout": "2x1",
    "amenities": ["WiFi", "AC", "USB Charging"],
    "photos": ["/uploads/bus1.jpg"]
  },
  "route": {
    "id": 10,
    "origin": "Ho Chi Minh",
    "destination": "Da Nang",
    "stops": [
      {"name": "Nha Trang", "order": 1, "arrivalTime": "14:00"},
      {"name": "Quy Nhon", "order": 2, "arrivalTime": "17:00"}
    ]
  }
}
```

---

### 3. Fulltext Search Schedules

Advanced search with natural language.

**Endpoint:** `GET /api/bus-schedules/search`

**Access:** Public

**Query Parameters:**
```
q: string (search query)
```

**Example:**
```
GET /api/bus-schedules/search?q=Ho Chi Minh to Da Nang tomorrow
```

---

### 4. Get Alternative Trips

Get alternative schedules for a route.

**Endpoint:** `GET /api/bus-schedule/:scheduleId/alternatives`

**Access:** Public

**Query Parameters:**
```
timeRange: number (hours before/after, default: 3)
```

---

### 5. Create Bus Schedule (Admin)

Create a new bus schedule.

**Endpoint:** `POST /api/bus-schedule`

**Access:** Admin only

**Request Body:**
```json
{
  "routeNo": 101,
  "busId": 5,
  "routeId": 10,
  "departure_city": "Ho Chi Minh",
  "departure_date": "2024-12-25",
  "departure_time": "08:00",
  "arrival_city": "Da Nang",
  "arrival_date": "2024-12-25",
  "arrival_time": "20:00",
  "duration": "12:00",
  "price": "350000",
  "depotName": "Bến xe Miền Đông"
}
```

---

### 6. Update Bus Schedule (Admin)

**Endpoint:** `PUT /api/bus-schedule/:id`

**Access:** Admin only

---

### 7. Complete Bus Schedule (Admin)

Mark schedule as completed.

**Endpoint:** `POST /api/bus-schedule/:id/complete`

**Access:** Admin only

---

### 8. Cancel Bus Schedule (Admin)

Cancel a scheduled trip.

**Endpoint:** `POST /api/bus-schedule/:id/cancel`

**Access:** Admin only

**Request Body:**
```json
{
  "reason": "Vehicle maintenance required"
}
```

---

## Booking APIs

### 1. Create Booking (Authenticated)

Create a new booking for logged-in user.

**Endpoint:** `POST /api/bookings`

**Access:** Authenticated

**Request Body:**
```json
{
  "busScheduleId": 1,
  "seatNumbers": [1, 2],
  "passengers": [
    {
      "name": "John Doe",
      "age": 30,
      "gender": "Male",
      "seatNumber": 1
    },
    {
      "name": "Jane Doe",
      "age": 28,
      "gender": "Female",
      "seatNumber": 2
    }
  ],
  "pickupPoint": "Ben xe Mien Dong",
  "dropoffPoint": "Ben xe Da Nang"
}
```

**Success Response (201):**
```json
{
  "msg": "Booking created successfully",
  "booking": {
    "id": 100,
    "bookingReference": "BKG-ABC123XYZ",
    "customerId": 1,
    "busScheduleId": 1,
    "seatNumbers": [1, 2],
    "status": "pending",
    "payment_totalPay": "720000",
    "expiresAt": "2024-12-20T10:15:00.000Z",
    "passengers": [...],
    "schedule": {...}
  }
}
```

---

### 2. Create Guest Booking

Create booking without login (guest user).

**Endpoint:** `POST /api/bookings/guest`

**Access:** Public

**Request Body:**
```json
{
  "busScheduleId": 1,
  "seatNumbers": [3],
  "guestEmail": "guest@example.com",
  "guestPhone": "+84901234567",
  "guestName": "Guest User",
  "passengers": [
    {
      "name": "Guest User",
      "age": 25,
      "gender": "Male",
      "seatNumber": 3
    }
  ],
  "pickupPoint": "Ben xe Mien Dong",
  "dropoffPoint": "Ben xe Da Nang"
}
```

**Success Response (201):**
```json
{
  "msg": "Guest booking created successfully",
  "booking": {
    "id": 101,
    "bookingReference": "BKG-DEF456GHI",
    "status": "pending",
    "guestEmail": "guest@example.com",
    "payment_totalPay": "360000",
    "expiresAt": "2024-12-20T10:15:00.000Z"
  }
}
```

---

### 3. Get My Bookings

Get all bookings for logged-in user.

**Endpoint:** `GET /api/bookings/my-bookings`

**Access:** Authenticated

**Query Parameters:**
```
status: pending|confirmed|cancelled|completed (optional)
page: number (default: 1)
limit: number (default: 10)
```

**Success Response (200):**
```json
{
  "bookings": [
    {
      "id": 100,
      "bookingReference": "BKG-ABC123XYZ",
      "status": "confirmed",
      "journeyDate": "2024-12-25",
      "seatNumbers": [1, 2],
      "payment_totalPay": "720000",
      "schedule": {
        "departure_city": "Ho Chi Minh",
        "arrival_city": "Da Nang",
        "departure_time": "08:00"
      },
      "createdAt": "2024-12-20T09:00:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "totalPages": 1
}
```

---

### 4. Get Booking by Reference

Get booking details by reference number.

**Endpoint:** `GET /api/bookings/reference/:reference`

**Access:** Authenticated (owner or admin)

---

### 5. Guest Booking Lookup

Request verification email to view guest booking.

**Endpoint:** `POST /api/bookings/guest/lookup/request`

**Access:** Public

**Request Body:**
```json
{
  "bookingReference": "BKG-DEF456GHI",
  "email": "guest@example.com"
}
```

**Success Response (200):**
```json
{
  "msg": "Verification email sent. Please check your inbox."
}
```

---

### 6. Verify Guest Booking

Verify token and view booking details.

**Endpoint:** `GET /api/bookings/guest/verify?token=<verification-token>`

**Access:** Public

**Success Response (200):**
```json
{
  "booking": {
    "id": 101,
    "bookingReference": "BKG-DEF456GHI",
    "status": "confirmed",
    "seatNumbers": [3],
    "payment_totalPay": "360000",
    "schedule": {...}
  }
}
```

---

### 7. Confirm Booking

Confirm booking after payment.

**Endpoint:** `POST /api/bookings/:id/confirm`

**Access:** Authenticated (owner)

**Success Response (200):**
```json
{
  "msg": "Booking confirmed successfully",
  "booking": {
    "id": 100,
    "status": "confirmed",
    "bookingReference": "BKG-ABC123XYZ"
  }
}
```

---

### 8. Cancel Booking

Cancel an existing booking.

**Endpoint:** `POST /api/bookings/:id/cancel`

**Access:** Authenticated (owner)

**Request Body:**
```json
{
  "reason": "Change of plans"
}
```

**Success Response (200):**
```json
{
  "msg": "Booking cancelled successfully",
  "refundAmount": "648000"
}
```

---

### 9. Download E-Ticket

Download booking ticket as PDF.

**Endpoint:** `GET /api/bookings/:id/download-ticket`

**Access:** Authenticated (owner)

**Response:** PDF file download

---

### 10. Email E-Ticket

Send e-ticket to customer email.

**Endpoint:** `POST /api/bookings/:id/email-ticket`

**Access:** Authenticated (owner)

**Success Response (200):**
```json
{
  "msg": "E-ticket sent to your email successfully"
}
```

---

## Seat Lock APIs

### 1. Get Seat Availability

Get available and locked seats for a schedule.

**Endpoint:** `GET /api/seats/availability/:scheduleId`

**Access:** Public

**Success Response (200):**
```json
{
  "scheduleId": 1,
  "totalSeats": 40,
  "availableSeats": 28,
  "lockedSeats": [1, 2, 5],
  "bookedSeats": [3, 4, 6, 7, 8, 9, 10, 11, 12, 13],
  "seatMap": {
    "1": "locked",
    "2": "locked",
    "3": "booked",
    "4": "booked",
    "5": "locked",
    "6": "booked",
    "14": "available",
    "15": "available"
  }
}
```

---

### 2. Lock Seats

Temporarily lock seats during booking process.

**Endpoint:** `POST /api/seats/lock`

**Access:** Public (uses session)

**Request Body:**
```json
{
  "scheduleId": 1,
  "seatNumbers": [14, 15],
  "sessionId": "unique-session-id"
}
```

**Success Response (200):**
```json
{
  "msg": "Seats locked successfully",
  "expiresAt": "2024-12-20T10:15:00.000Z",
  "lockedSeats": [14, 15]
}
```

**Error Response (409):**
```json
{
  "msg": "Some seats are already locked or booked",
  "unavailableSeats": [14]
}
```

---

### 3. Release Seats

Release locked seats.

**Endpoint:** `POST /api/seats/release`

**Access:** Public (uses session)

**Request Body:**
```json
{
  "scheduleId": 1,
  "seatNumbers": [14, 15],
  "sessionId": "unique-session-id"
}
```

---

### 4. Confirm Seats

Convert seat lock to booking (prevents auto-release).

**Endpoint:** `POST /api/seats/confirm`

**Access:** Public (uses session)

---

### 5. Extend Lock

Extend seat lock duration.

**Endpoint:** `POST /api/seats/extend`

**Access:** Public (uses session)

**Request Body:**
```json
{
  "scheduleId": 1,
  "seatNumbers": [14, 15],
  "sessionId": "unique-session-id"
}
```

---

## Payment APIs

### 1. Create Payment Session

Create a payment session for booking.

**Endpoint:** `POST /api/payments/create`

**Access:** Public (optional auth)

**Request Body:**
```json
{
  "bookingId": 100,
  "amount": 720000,
  "description": "Bus ticket payment - BKG-ABC123XYZ"
}
```

**Success Response (200):**
```json
{
  "paymentId": "PAY-123456",
  "checkoutUrl": "https://payment-gateway.com/checkout/...",
  "qrCode": "data:image/png;base64,...",
  "amount": 720000,
  "expiresAt": "2024-12-20T10:30:00.000Z"
}
```

---

### 2. Get Payment Status

Check payment status.

**Endpoint:** `GET /api/payments/:paymentId/status`

**Access:** Public

**Success Response (200):**
```json
{
  "paymentId": "PAY-123456",
  "status": "completed",
  "amount": 720000,
  "bookingReference": "BKG-ABC123XYZ"
}
```

---

### 3. Process Sandbox Payment

Test payment without real gateway (development).

**Endpoint:** `POST /api/payments/process`

**Access:** Public

**Request Body:**
```json
{
  "paymentId": "PAY-123456",
  "status": "success"
}
```

---

### 4. Payment Webhook

Handle payment gateway callbacks.

**Endpoint:** `POST /api/payments/webhook`

**Access:** Payment gateway only

---

## Review APIs

### 1. Get Schedule Reviews

Get all reviews for a bus schedule.

**Endpoint:** `GET /api/reviews/schedule/:scheduleId`

**Access:** Public

**Success Response (200):**
```json
{
  "reviews": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Excellent service!",
      "customer": {
        "fullName": "John Doe",
        "avatar": "/uploads/avatar.jpg"
      },
      "helpful": 10,
      "notHelpful": 1,
      "createdAt": "2024-12-15T10:00:00.000Z"
    }
  ],
  "averageRating": 4.5,
  "totalReviews": 25
}
```

---

### 2. Create Review

Create a review for completed booking.

**Endpoint:** `POST /api/reviews`

**Access:** Authenticated

**Request Body:**
```json
{
  "bookingId": 100,
  "rating": 5,
  "comment": "Great experience!",
  "serviceRating": 5,
  "driverRating": 5,
  "vehicleRating": 4
}
```

---

### 3. Get My Reviews

Get all reviews by logged-in user.

**Endpoint:** `GET /api/reviews/my-reviews`

**Access:** Authenticated

---

### 4. Update Review

Update an existing review.

**Endpoint:** `PUT /api/reviews/:id`

**Access:** Authenticated (owner)

---

### 5. Delete Review

Delete a review.

**Endpoint:** `DELETE /api/reviews/:id`

**Access:** Authenticated (owner)

---

### 6. Vote Review

Vote review as helpful/not helpful.

**Endpoint:** `POST /api/reviews/:id/vote`

**Access:** Authenticated

**Request Body:**
```json
{
  "voteType": "helpful"
}
```

---

## Analytics APIs (Admin Only)

### 1. Get Dashboard Summary

**Endpoint:** `GET /api/analytics/summary`

**Access:** Admin

**Success Response (200):**
```json
{
  "totalRevenue": 50000000,
  "totalBookings": 1250,
  "totalCustomers": 850,
  "activeSchedules": 45,
  "revenueGrowth": 15.5,
  "bookingGrowth": 12.3
}
```

---

### 2. Get Revenue Analytics

**Endpoint:** `GET /api/analytics/revenue`

**Access:** Admin

**Query Parameters:**
```
startDate: YYYY-MM-DD
endDate: YYYY-MM-DD
groupBy: day|week|month
```

---

### 3. Get Booking Analytics

**Endpoint:** `GET /api/analytics/bookings`

**Access:** Admin

---

### 4. Get Financial Report

**Endpoint:** `GET /api/analytics/financial`

**Access:** Admin

---

## Chatbot APIs

### 1. Send Message

Send message to AI chatbot.

**Endpoint:** `POST /api/chatbot/message`

**Access:** Public

**Request Body:**
```json
{
  "message": "Tôi muốn đi từ Sài Gòn đến Đà Nẵng ngày mai",
  "sessionId": "unique-session-id"
}
```

**Success Response (200):**
```json
{
  "response": "Tôi tìm thấy 15 chuyến xe...",
  "suggestions": ["Xem chuyến 8h sáng", "Xem chuyến tối"],
  "data": {
    "schedules": [...]
  }
}
```

---

### 2. Natural Language Search

Search buses using natural language.

**Endpoint:** `POST /api/chatbot/search`

**Access:** Public

**Request Body:**
```json
{
  "query": "xe giường nằm đi Đà Lạt tuần sau"
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "msg": "Error message description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common HTTP Status Codes

- **200 OK** - Success
- **201 Created** - Resource created
- **400 Bad Request** - Invalid input
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource conflict (e.g., seat already booked)
- **500 Internal Server Error** - Server error

---

## Rate Limiting

API rate limits (if enabled):
- **Public endpoints**: 100 requests/15 minutes
- **Authenticated endpoints**: 1000 requests/15 minutes
- **Admin endpoints**: Unlimited

## Swagger/OpenAPI

For interactive API documentation, visit:
```
http://localhost:4000/api-docs
```

(Note: Swagger integration can be added using swagger-jsdoc and swagger-ui-express)

---

**Last Updated:** January 2, 2026
