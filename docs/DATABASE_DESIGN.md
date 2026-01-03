# 🗄️ Database Design - Bus Ticket Booking System

Complete database schema and design documentation.

## Table of Contents

- [Overview](#overview)
- [Database Technology](#database-technology)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Tables](#tables)
- [Relationships](#relationships)
- [Indexes](#indexes)
- [Constraints](#constraints)
- [Data Types](#data-types)

## Overview

The database is designed to support a full-featured bus ticket booking system with the following key features:
- Customer management (local and OAuth)
- Bus fleet management
- Route and schedule management
- Real-time seat locking and booking
- Payment processing
- Review and rating system
- AI chatbot history
- Notification preferences

## Database Technology

**Primary Database:** PostgreSQL 12+

**Why PostgreSQL?**
- ✅ JSONB support for flexible data structures
- ✅ Array data types for seat management
- ✅ Full-text search capabilities
- ✅ ACID compliance
- ✅ Excellent performance with indexes
- ✅ Rich ecosystem and community support

**ORM:** Sequelize v6

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│  Customer   │──────<│ BusBooking   │>──────│BusSchedule  │
└─────────────┘       └──────────────┘       └─────────────┘
       │                     │                      │
       │                     │                      │
       ▼                     ▼                      ▼
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│Notification │       │   Review     │       │  SeatLock   │
│Preferences  │       └──────────────┘       └─────────────┘
└─────────────┘              │
       │                     │
       ▼                     ▼
┌─────────────┐       ┌──────────────┐
│ChatHistory  │       │  ReviewVote  │
└─────────────┘       └──────────────┘

       ┌─────────────┐       ┌─────────────┐
       │    Bus      │──────<│BusSchedule  │
       └─────────────┘       └─────────────┘
                                    │
                                    │
                             ┌─────────────┐
                             │   Route     │
                             └─────────────┘
                                    │
                                    ▼
                             ┌─────────────┐
                             │ RouteStop   │
                             └─────────────┘
```

## Tables

### 1. customers

Stores customer/user information including guests and OAuth users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique customer ID |
| email | VARCHAR(255) | UNIQUE | Customer email (nullable for guests) |
| username | VARCHAR(255) | UNIQUE | Username (nullable for guests) |
| password | VARCHAR(255) | | Hashed password (nullable for OAuth/guest) |
| fullName | VARCHAR(255) | | Customer's full name |
| position | VARCHAR(50) | DEFAULT 'customer' | Role: customer/admin |
| isVerified | BOOLEAN | DEFAULT false | Email verification status |
| verificationToken | VARCHAR(255) | | Email verification token |
| resetPasswordToken | VARCHAR(255) | | Password reset token |
| resetPasswordExpires | TIMESTAMP | | Token expiration time |
| googleId | VARCHAR(255) | UNIQUE | Google OAuth ID |
| provider | VARCHAR(50) | DEFAULT 'local' | Auth provider: local/google/guest |
| isGuest | BOOLEAN | DEFAULT false | Guest user flag |
| guestEmail | VARCHAR(255) | | Email for guest bookings |
| guestPhone | VARCHAR(20) | | Phone for guest bookings |
| guestName | VARCHAR(255) | | Name for guest bookings |
| phoneNumber | VARCHAR(20) | | Phone number |
| avatar | VARCHAR(500) | | Profile photo URL |
| preferences | JSONB | | User preferences (JSON) |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`
- UNIQUE INDEX on `username`
- UNIQUE INDEX on `googleId`
- INDEX on `provider`

**Sample Data:**
```sql
{
  "id": 1,
  "email": "john@example.com",
  "username": "johndoe",
  "fullName": "John Doe",
  "position": "customer",
  "isVerified": true,
  "provider": "local",
  "phoneNumber": "+84901234567",
  "preferences": {
    "language": "vi",
    "currency": "VND"
  }
}
```

---

### 2. buses

Stores bus fleet information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique bus ID |
| busNumber | VARCHAR(255) | NOT NULL, UNIQUE | Bus registration number |
| plateNumber | VARCHAR(20) | UNIQUE | License plate number |
| busType | VARCHAR(255) | NOT NULL | Type: Normal, AC, Sleeper, Semi-Sleeper |
| model | VARCHAR(255) | NOT NULL | Bus model/manufacturer |
| totalSeats | INTEGER | NOT NULL | Total seat capacity |
| seatMapConfig | JSONB | | Seat layout configuration (JSON) |
| amenities | TEXT[] | DEFAULT '{}' | Array of amenities (WiFi, AC, Water, etc.) |
| status | VARCHAR(255) | DEFAULT 'active' | active/maintenance/retired |
| depotName | VARCHAR(255) | NOT NULL | Bus depot/garage name |
| photos | TEXT[] | DEFAULT '{}' | Array of photo URLs |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `busNumber`
- UNIQUE INDEX on `plateNumber`
- INDEX on `busType`
- INDEX on `status`

**Sample Data:**
```sql
{
  "id": 1,
  "busNumber": "BUS001",
  "plateNumber": "51B-12345",
  "busType": "Sleeper",
  "model": "Hyundai Universe",
  "totalSeats": 40,
  "seatMapConfig": {
    "rows": 10,
    "columns": 4,
    "layout": "2x1"
  },
  "amenities": ["WiFi", "AC", "USB Charging", "Water", "Blanket"],
  "photos": ["/uploads/buses/bus1.jpg", "/uploads/buses/bus2.jpg"],
  "status": "active",
  "depotName": "Ho Chi Minh Central Depot"
}
```

---

### 3. routes

Stores bus route information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique route ID |
| routeName | VARCHAR(255) | NOT NULL | Route name |
| routeNo | INTEGER | NOT NULL, UNIQUE | Route number identifier |
| origin | VARCHAR(255) | NOT NULL | Starting city |
| destination | VARCHAR(255) | NOT NULL | Ending city |
| distance | DECIMAL(10,2) | | Distance in km |
| estimatedDuration | VARCHAR(50) | | Estimated travel time (e.g., "10:00") |
| status | VARCHAR(50) | DEFAULT 'active' | active/inactive |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `routeNo`
- INDEX on `origin, destination`
- INDEX on `status`

---

### 4. route_stops

Stores intermediate stops for routes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique stop ID |
| routeId | INTEGER | FOREIGN KEY → routes(id) | Route reference |
| stopOrder | INTEGER | NOT NULL | Order in route |
| stopName | VARCHAR(255) | NOT NULL | Stop location name |
| stopType | VARCHAR(50) | NOT NULL | pickup/dropoff/both |
| arrivalTime | VARCHAR(10) | | Relative time (e.g., "+2:00") |
| departureTime | VARCHAR(10) | | Departure time offset |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `routeId`
- INDEX on `routeId, stopOrder`

---

### 5. bus_schedules

Stores scheduled bus trips.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique schedule ID |
| routeNo | INTEGER | NOT NULL | Route number |
| busId | INTEGER | FOREIGN KEY → buses(id) | Bus reference |
| routeId | INTEGER | FOREIGN KEY → routes(id) | Route reference |
| departure_city | VARCHAR(255) | NOT NULL | Departure city |
| departure_date | DATE | NOT NULL | Departure date |
| departure_time | VARCHAR(10) | NOT NULL | Departure time (HH:MM) |
| arrival_city | VARCHAR(255) | NOT NULL | Arrival city |
| arrival_date | DATE | NOT NULL | Arrival date |
| arrival_time | VARCHAR(10) | NOT NULL | Arrival time (HH:MM) |
| duration | VARCHAR(50) | NOT NULL | Journey duration |
| busType | VARCHAR(100) | NOT NULL | Type of bus |
| model | VARCHAR(100) | NOT NULL | Bus model |
| busScheduleID | VARCHAR(100) | NOT NULL | Schedule identifier |
| depotName | VARCHAR(255) | NOT NULL | Departure depot |
| bookingClosingDate | DATE | NOT NULL | Last booking date |
| bookingClosingTime | VARCHAR(10) | NOT NULL | Last booking time |
| price | DECIMAL(10,2) | NOT NULL | Ticket price |
| availableSeats | INTEGER | NOT NULL | Available seat count |
| status | ENUM | DEFAULT 'Scheduled' | Scheduled/In Progress/Completed/Cancelled |
| isCompleted | BOOLEAN | DEFAULT false | Completion flag |
| departedAt | TIMESTAMP | | Actual departure time |
| completedAt | TIMESTAMP | | Completion time |
| cancelledAt | TIMESTAMP | | Cancellation time |
| cancelledBy | INTEGER | FOREIGN KEY → customers(id) | Admin who cancelled |
| cancellationReason | TEXT | | Reason for cancellation |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `busId`
- FOREIGN KEY on `routeId`
- INDEX on `departure_city`
- INDEX on `arrival_city`
- INDEX on `departure_date`
- INDEX on `price`
- INDEX on `busType`
- COMPOSITE INDEX on `departure_city, arrival_city, departure_date`
- COMPOSITE INDEX on `busId, departure_date, departure_time`

**Enums:**
- status: 'Scheduled', 'In Progress', 'Completed', 'Cancelled'

---

### 6. bus_bookings

Stores customer bookings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique booking ID |
| customerId | INTEGER | NOT NULL, FOREIGN KEY → customers(id) | Customer reference |
| busScheduleId | INTEGER | FOREIGN KEY → bus_schedules(id) | Schedule reference |
| routeNo | INTEGER | NOT NULL | Route number |
| departure | VARCHAR(255) | NOT NULL | Departure city |
| arrival | VARCHAR(255) | NOT NULL | Arrival city |
| depotName | VARCHAR(255) | NOT NULL | Depot name |
| seatNumbers | INTEGER[] | NOT NULL | Array of seat numbers |
| booking_startSession | TIMESTAMP | | Session start time |
| booking_endSession | TIMESTAMP | | Session end time |
| booking_startTime | VARCHAR(10) | NOT NULL | Departure time |
| booking_endTime | VARCHAR(10) | NOT NULL | Arrival time |
| journeyDate | DATE | NOT NULL | Journey date |
| status | ENUM | DEFAULT 'pending' | pending/confirmed/cancelled/completed/expired |
| expiresAt | TIMESTAMP | | Booking expiration |
| payment_busFare | DECIMAL(10,2) | NOT NULL | Base fare |
| payment_convenienceFee | DECIMAL(10,2) | NOT NULL | Service fee |
| payment_bankCharge | DECIMAL(10,2) | NOT NULL | Payment processing fee |
| payment_totalPay | DECIMAL(10,2) | NOT NULL | Total amount |
| passengers | JSONB | NOT NULL | Passenger details (JSON array) |
| bookingReference | VARCHAR(50) | NOT NULL, UNIQUE | Unique booking reference |
| pickupPoint | VARCHAR(255) | | Pickup location |
| dropoffPoint | VARCHAR(255) | | Dropoff location |
| cancellationReason | TEXT | | Reason for cancellation |
| cancelledAt | TIMESTAMP | | Cancellation time |
| reminderSentAt | TIMESTAMP | | Trip reminder sent time |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `customerId`
- FOREIGN KEY on `busScheduleId`
- UNIQUE INDEX on `bookingReference`
- INDEX on `status`
- INDEX on `journeyDate`
- INDEX on `customerId, status`

**Enums:**
- status: 'pending', 'confirmed', 'cancelled', 'completed', 'expired'

**Passengers JSONB Structure:**
```json
[
  {
    "name": "John Doe",
    "age": 30,
    "gender": "Male",
    "seatNumber": 1,
    "idNumber": "123456789",
    "checkedIn": false
  }
]
```

**Hooks:**
- `beforeValidate`: Auto-generate `bookingReference` if not set
- `beforeValidate`: Set `expiresAt` for pending bookings (15 minutes)

---

### 7. seat_locks

Stores temporary seat locks during booking process.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique lock ID |
| scheduleId | INTEGER | NOT NULL, FOREIGN KEY → bus_schedules(id) | Schedule reference |
| seatNumber | VARCHAR(10) | NOT NULL | Locked seat identifier |
| customerId | INTEGER | | Customer ID (nullable) |
| sessionId | VARCHAR(255) | NOT NULL | User session ID |
| lockedAt | TIMESTAMP | NOT NULL, DEFAULT NOW() | When seat was locked |
| expiresAt | TIMESTAMP | NOT NULL | Lock expiration time |
| status | ENUM | DEFAULT 'locked' | locked/confirmed/released/expired |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `scheduleId`
- INDEX on `scheduleId, seatNumber`
- INDEX on `sessionId`
- INDEX on `expiresAt, status`

**Enums:**
- status: 'locked', 'confirmed', 'released', 'expired'

**TTL:** Locks expire after 15 minutes (900 seconds)

---

### 8. reviews

Stores customer reviews for completed trips.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique review ID |
| customerId | INTEGER | NOT NULL, FOREIGN KEY → customers(id) | Customer reference |
| busScheduleId | INTEGER | NOT NULL, FOREIGN KEY → bus_schedules(id) | Schedule reference |
| bookingId | INTEGER | NOT NULL, FOREIGN KEY → bus_bookings(id) | Booking reference |
| rating | INTEGER | NOT NULL, CHECK 1-5 | Overall rating (1-5 stars) |
| title | VARCHAR(200) | | Review title/summary |
| comment | TEXT | NOT NULL | Review content/feedback |
| cleanlinessRating | INTEGER | CHECK 1-5 | Cleanliness rating (1-5) |
| comfortRating | INTEGER | CHECK 1-5 | Comfort rating (1-5) |
| punctualityRating | INTEGER | CHECK 1-5 | Punctuality rating (1-5) |
| staffRating | INTEGER | CHECK 1-5 | Staff service rating (1-5) |
| helpfulCount | INTEGER | DEFAULT 0 | Number of helpful votes |
| notHelpfulCount | INTEGER | DEFAULT 0 | Number of not helpful votes |
| isVerified | BOOLEAN | DEFAULT true | Review from verified booking |
| isVisible | BOOLEAN | DEFAULT true | Whether review is visible |
| adminResponse | TEXT | | Response from admin/company |
| adminResponseAt | TIMESTAMP | | When admin responded |
| journeyDate | DATE | NOT NULL | Date of the journey reviewed |
| routeInfo | JSONB | | Route details (JSON) |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `customerId`
- FOREIGN KEY on `busScheduleId`
- FOREIGN KEY on `bookingId`
- UNIQUE INDEX on `bookingId` (one review per booking)
- INDEX on `rating`
- INDEX on `isVisible`
- INDEX on `createdAt`

**Route Info JSONB Structure:**
```json
{
  "departure": "Ho Chi Minh",
  "arrival": "Da Nang",
  "routeNo": 101
}
```

---

### 9. review_votes

Stores helpful/not helpful votes for reviews.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique vote ID |
| reviewId | INTEGER | NOT NULL, FOREIGN KEY → reviews(id) | Review reference |
| customerId | INTEGER | NOT NULL, FOREIGN KEY → customers(id) | Customer reference |
| voteType | ENUM | NOT NULL | helpful/not_helpful |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `reviewId`
- FOREIGN KEY on `customerId`
- UNIQUE INDEX on `reviewId, customerId` (one vote per user per review)

**Enums:**
- voteType: 'helpful', 'not_helpful'

---

### 10. notification_preferences

Stores customer notification settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique preference ID |
| customerId | INTEGER | NOT NULL, UNIQUE, FOREIGN KEY → customers(id) | Customer reference |
| emailBookingConfirmation | BOOLEAN | DEFAULT true | Email on booking confirm |
| emailTripReminders | BOOLEAN | DEFAULT true | Email trip reminder |
| emailCancellations | BOOLEAN | DEFAULT true | Email cancellations |
| emailPromotions | BOOLEAN | DEFAULT false | Email promotions |
| emailNewsletter | BOOLEAN | DEFAULT false | Email newsletter |
| smsBookingConfirmation | BOOLEAN | DEFAULT false | SMS on booking confirm |
| smsTripReminders | BOOLEAN | DEFAULT false | SMS trip reminder |
| smsCancellations | BOOLEAN | DEFAULT false | SMS cancellations |
| pushBookingConfirmation | BOOLEAN | DEFAULT true | Push notification on booking |
| pushTripReminders | BOOLEAN | DEFAULT true | Push trip reminder |
| pushPromotions | BOOLEAN | DEFAULT false | Push promotions |
| phoneNumber | VARCHAR(20) | | Phone number for SMS |
| reminderTiming | INTEGER | DEFAULT 24 | Hours before trip (1,3,6,12,24,48) |
| timezone | VARCHAR(50) | DEFAULT 'Asia/Kolkata' | User timezone |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updatedAt | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE FOREIGN KEY on `customerId`

---

### 11. chat_histories

Stores AI chatbot conversation history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique chat ID |
| sessionId | UUID | NOT NULL, INDEX | Session identifier |
| userId | INTEGER | FOREIGN KEY → customers(id) | User reference (nullable for guests) |
| role | ENUM | NOT NULL | user/assistant/system |
| content | TEXT | NOT NULL | Message content |
| intent | VARCHAR(50) | | Detected intent |
| metadata | JSONB | DEFAULT '{}' | Additional data (JSON) |
| createdAt | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `sessionId`
- INDEX on `sessionId, createdAt`
- INDEX on `userId`

**Enums:**
- role: 'user', 'assistant', 'system'

**Metadata JSONB Example:**
```json
{
  "intent": "search_bus",
  "entities": {
    "from": "Ho Chi Minh",
    "to": "Da Nang",
    "date": "2024-12-25"
  },
  "confidence": 0.95,
  "searchParams": {
    "departure_city": "Ho Chi Minh",
    "arrival_city": "Da Nang"
  }
}
```

---

## Relationships

### One-to-Many Relationships

1. **Customer → BusBooking**
   - One customer can have many bookings
   - Foreign Key: `bus_bookings.customerId → customers.id`

2. **BusSchedule → BusBooking**
   - One schedule can have many bookings
   - Foreign Key: `bus_bookings.busScheduleId → bus_schedules.id`

3. **Bus → BusSchedule**
   - One bus can have many schedules
   - Foreign Key: `bus_schedules.busId → buses.id`

4. **Route → BusSchedule**
   - One route can have many schedules
   - Foreign Key: `bus_schedules.routeId → routes.id`

5. **Route → RouteStop**
   - One route can have many stops
   - Foreign Key: `route_stops.routeId → routes.id`

6. **BusSchedule → SeatLock**
   - One schedule can have many seat locks
   - Foreign Key: `seat_locks.scheduleId → bus_schedules.id`

7. **Customer → Review**
   - One customer can write many reviews
   - Foreign Key: `reviews.customerId → customers.id`

8. **BusSchedule → Review**
   - One schedule can have many reviews
   - Foreign Key: `reviews.busScheduleId → bus_schedules.id`

9. **Review → ReviewVote**
   - One review can have many votes
   - Foreign Key: `review_votes.reviewId → reviews.id`

10. **Customer → ChatHistory**
    - One customer can have many chat messages
    - Foreign Key: `chat_histories.userId → customers.id`

### One-to-One Relationships

1. **Customer ↔ NotificationPreferences**
   - One customer has one notification preference
   - Foreign Key: `notification_preferences.customerId → customers.id` (UNIQUE)

2. **BusBooking ↔ Review**
   - One booking can have one review
   - Foreign Key: `reviews.bookingId → bus_bookings.id` (UNIQUE)

---

## Indexes

### Performance Optimization

**Search Performance:**
- `bus_schedules(departure_city, arrival_city, departure_date)` - Composite index for common searches
- `bus_schedules(departure_date)` - Date filtering
- `bus_schedules(price)` - Price sorting

**Booking Performance:**
- `bus_bookings(customerId, status)` - User booking queries
- `seat_locks(scheduleId, seatNumber)` - Seat availability checks

**Session Management:**
- `seat_locks(sessionId)` - Session-based seat locks
- `seat_locks(expiresAt)` - Expired lock cleanup

**Full-Text Search:**
- PostgreSQL full-text search on `departure_city` and `arrival_city`
- Trigram indexes for fuzzy matching (optional)

---

## Constraints

### Foreign Key Constraints

All foreign keys have `ON DELETE` and `ON UPDATE` actions:
- **CASCADE** - For dependent data (e.g., route stops)
- **SET NULL** - For optional references
- **RESTRICT** - For critical relationships (prevent deletion)

### Check Constraints

- `reviews.rating` - CHECK (rating >= 1 AND rating <= 5)
- `reviews.cleanlinessRating` - CHECK (cleanlinessRating >= 1 AND cleanlinessRating <= 5)
- `reviews.comfortRating` - CHECK (comfortRating >= 1 AND comfortRating <= 5)
- `reviews.punctualityRating` - CHECK (punctualityRating >= 1 AND punctualityRating <= 5)
- `reviews.staffRating` - CHECK (staffRating >= 1 AND staffRating <= 5)
- `buses.totalSeats` - CHECK (totalSeats > 0)
- `bus_schedules.availableSeats` - CHECK (availableSeats >= 0)
- `notification_preferences.reminderTiming` - CHECK (reminderTiming IN (1,3,6,12,24,48))

### Unique Constraints

- `customers.email` - UNIQUE
- `customers.username` - UNIQUE
- `customers.googleId` - UNIQUE
- `buses.busNumber` - UNIQUE
- `buses.plateNumber` - UNIQUE
- `routes.routeNo` - UNIQUE
- `bus_bookings.bookingReference` - UNIQUE
- `reviews.bookingId` - UNIQUE
- `review_votes(reviewId, customerId)` - UNIQUE (composite)
- `notification_preferences.customerId` - UNIQUE

---

## Data Types

### PostgreSQL-Specific Types

**Arrays:**
- `TEXT[]` - For amenities, photos
- `INTEGER[]` - For seat numbers

**JSONB:**
- Faster than JSON for queries
- Supports indexing
- Used for: passengers, preferences, metadata

**ENUM:**
- Type-safe status values
- Better performance than VARCHAR
- Used for: booking status, schedule status

**Timestamps:**
- Always use `TIMESTAMP WITH TIME ZONE` in production
- Current setup uses `TIMESTAMP` (no timezone)

---

## Migration Strategy

### Initial Setup

Database schema is automatically created by Sequelize on first run:
```bash
npm run sync-db
```

### Schema Migrations

For production, use Sequelize migrations:
```bash
npx sequelize-cli migration:generate --name migration-name
npx sequelize-cli db:migrate
```

### Safe Migrations

The system includes safe migration handling:
- `scripts/migrate_booking_schema.js` - Handles ENUM changes safely
- Prevents data loss during schema updates

---

## Backup and Recovery

### Recommended Backup Strategy

**Daily Full Backup:**
```bash
pg_dump -U bus_booking_user -d bus_booking -F c -f backup_$(date +%Y%m%d).dump
```

**Restore:**
```bash
pg_restore -U bus_booking_user -d bus_booking -c backup_20241225.dump
```

---

## Performance Considerations

1. **Connection Pooling** - Sequelize handles connection pool (default: 5-10 connections)
2. **Query Optimization** - Use indexes for WHERE clauses
3. **Avoid N+1 Queries** - Use `include` for eager loading
4. **Pagination** - Always paginate large result sets
5. **Caching** - Use Redis for frequently accessed data

---

**Last Updated:** January 2, 2026
