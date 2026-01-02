# 🗂️ Database ERD Diagrams

Visual database schema diagrams for the Bus Ticket Booking System.

## Entity Relationship Diagram

### Main Entities Overview

```mermaid
erDiagram
    CUSTOMER ||--o{ BUS_BOOKING : "makes"
    CUSTOMER ||--o| NOTIFICATION_PREFERENCES : "has"
    CUSTOMER ||--o{ CHAT_HISTORY : "has"
    CUSTOMER ||--o{ REVIEW : "writes"
    CUSTOMER ||--o{ REVIEW_VOTE : "casts"
    
    BUS ||--o{ BUS_SCHEDULE : "operates"
    ROUTE ||--o{ BUS_SCHEDULE : "defines"
    ROUTE ||--o{ ROUTE_STOP : "includes"
    
    BUS_SCHEDULE ||--o{ BUS_BOOKING : "receives"
    BUS_SCHEDULE ||--o{ SEAT_LOCK : "manages"
    BUS_SCHEDULE ||--o{ REVIEW : "receives"
    
    BUS_BOOKING ||--o| REVIEW : "reviewed_by"
    REVIEW ||--o{ REVIEW_VOTE : "receives"

    CUSTOMER {
        int id PK
        string email UK
        string username UK
        string password
        string fullName
        string position
        boolean isVerified
        string googleId UK
        string provider
        boolean isGuest
        string phoneNumber
        string avatar
        json preferences
    }
    
    BUS {
        int id PK
        string busNumber UK
        string busType
        string model
        int totalSeats
        string seatLayout
        array amenities
        array photos
        string status
    }
    
    ROUTE {
        int id PK
        string routeName
        string origin
        string destination
        decimal distance
        string estimatedDuration
        decimal basePrice
        string status
    }
    
    ROUTE_STOP {
        int id PK
        int routeId FK
        string stopName
        int stopOrder
        string arrivalTime
        string departureTime
        decimal distanceFromOrigin
    }
    
    BUS_SCHEDULE {
        int id PK
        int routeNo
        int busId FK
        int routeId FK
        string departure_city
        date departure_date
        string departure_time
        string arrival_city
        date arrival_date
        string arrival_time
        string duration
        decimal price
        int availableSeats
        string status
        boolean isCompleted
    }
    
    BUS_BOOKING {
        int id PK
        int customerId FK
        int busScheduleId FK
        array seatNumbers
        date journeyDate
        string status
        timestamp expiresAt
        decimal payment_totalPay
        jsonb passengers
        string bookingReference UK
        string pickupPoint
        string dropoffPoint
    }
    
    SEAT_LOCK {
        int id PK
        int scheduleId FK
        int seatNumber
        string sessionId
        string status
        timestamp expiresAt
    }
    
    REVIEW {
        int id PK
        int customerId FK
        int busScheduleId FK
        int bookingId FK
        int rating
        text comment
        int serviceRating
        int driverRating
        int vehicleRating
        int helpful
        int notHelpful
    }
    
    REVIEW_VOTE {
        int id PK
        int reviewId FK
        int customerId FK
        string voteType
    }
    
    NOTIFICATION_PREFERENCES {
        int id PK
        int customerId FK
        boolean emailBookingConfirmation
        boolean emailTripReminder
        boolean emailPaymentReceipt
        boolean emailPromotions
        boolean smsBookingConfirmation
        boolean smsTripReminder
        boolean pushNotifications
    }
    
    CHAT_HISTORY {
        int id PK
        int userId FK
        string sessionId
        text message
        text response
        jsonb metadata
    }
```

## Detailed Relationship Diagrams

### Customer and Authentication Module

```mermaid
erDiagram
    CUSTOMER ||--o{ BUS_BOOKING : "customerId"
    CUSTOMER ||--o| NOTIFICATION_PREFERENCES : "customerId"
    CUSTOMER ||--o{ REVIEW : "customerId"
    CUSTOMER ||--o{ REVIEW_VOTE : "customerId"
    CUSTOMER ||--o{ CHAT_HISTORY : "userId"

    CUSTOMER {
        int id PK "Primary Key"
        string email UK "Unique, for local users"
        string username UK "Unique, for local users"
        string password "Hashed with bcrypt"
        string fullName "Customer full name"
        string position "customer or admin"
        boolean isVerified "Email verification status"
        string verificationToken "Email verification token"
        string resetPasswordToken "Password reset token"
        timestamp resetPasswordExpires "Reset token expiry"
        string googleId UK "Google OAuth ID"
        string provider "local, google, or guest"
        boolean isGuest "Guest user flag"
        string guestEmail "For guest bookings"
        string guestPhone "For guest bookings"
        string guestName "For guest bookings"
        string phoneNumber "Contact number"
        string avatar "Profile photo URL"
        jsonb preferences "User preferences"
        timestamp createdAt "Creation timestamp"
        timestamp updatedAt "Last update"
    }
```

### Bus Schedule and Booking Module

```mermaid
erDiagram
    BUS ||--o{ BUS_SCHEDULE : "busId"
    ROUTE ||--o{ BUS_SCHEDULE : "routeId"
    BUS_SCHEDULE ||--o{ BUS_BOOKING : "busScheduleId"
    BUS_SCHEDULE ||--o{ SEAT_LOCK : "scheduleId"
    BUS_SCHEDULE ||--o{ REVIEW : "busScheduleId"

    BUS {
        int id PK
        string busNumber UK
        string busType
        string model
        int totalSeats
        string seatLayout
        array amenities
        array photos
        string status
        timestamp createdAt
        timestamp updatedAt
    }

    ROUTE {
        int id PK
        string routeName
        string origin
        string destination
        decimal distance
        string estimatedDuration
        decimal basePrice
        string status
        timestamp createdAt
        timestamp updatedAt
    }

    BUS_SCHEDULE {
        int id PK
        int routeNo
        int busId FK
        int routeId FK
        string departure_city
        date departure_date
        string departure_time
        string arrival_city
        date arrival_date
        string arrival_time
        string duration
        string busType
        string model
        decimal price
        int availableSeats
        string status
        boolean isCompleted
        timestamp departedAt
        timestamp completedAt
        timestamp cancelledAt
        timestamp createdAt
        timestamp updatedAt
    }
```

### Booking and Payment Flow

```mermaid
erDiagram
    CUSTOMER ||--o{ BUS_BOOKING : "creates"
    BUS_SCHEDULE ||--o{ BUS_BOOKING : "for"
    BUS_BOOKING ||--o| REVIEW : "reviewed_in"

    BUS_BOOKING {
        int id PK
        int customerId FK
        int busScheduleId FK
        int routeNo
        string departure
        string arrival
        array seatNumbers
        date journeyDate
        string status
        timestamp expiresAt
        decimal payment_busFare
        decimal payment_convenienceFee
        decimal payment_bankCharge
        decimal payment_totalPay
        jsonb passengers
        string bookingReference UK
        string pickupPoint
        string dropoffPoint
        string cancellationReason
        timestamp cancelledAt
        timestamp reminderSentAt
        timestamp createdAt
        timestamp updatedAt
    }
```

### Review and Rating System

```mermaid
erDiagram
    CUSTOMER ||--o{ REVIEW : "writes"
    BUS_SCHEDULE ||--o{ REVIEW : "receives"
    BUS_BOOKING ||--o| REVIEW : "generates"
    REVIEW ||--o{ REVIEW_VOTE : "receives"
    CUSTOMER ||--o{ REVIEW_VOTE : "casts"

    REVIEW {
        int id PK
        int customerId FK
        int busScheduleId FK
        int bookingId FK
        int rating
        text comment
        int serviceRating
        int driverRating
        int vehicleRating
        int helpful
        int notHelpful
        timestamp createdAt
        timestamp updatedAt
    }

    REVIEW_VOTE {
        int id PK
        int reviewId FK
        int customerId FK
        string voteType
        timestamp createdAt
        timestamp updatedAt
    }
```

### Seat Locking Mechanism

```mermaid
erDiagram
    BUS_SCHEDULE ||--o{ SEAT_LOCK : "scheduleId"

    SEAT_LOCK {
        int id PK
        int scheduleId FK
        int seatNumber
        string sessionId
        string status
        timestamp expiresAt
        timestamp createdAt
        timestamp updatedAt
    }
```

## Database Indexes Visualization

### Critical Indexes for Performance

```mermaid
graph TD
    A[Bus Schedules] --> B[Composite Index]
    B --> C[departure_city + arrival_city + departure_date]
    
    A --> D[Single Indexes]
    D --> E[departure_city]
    D --> F[arrival_city]
    D --> G[departure_date]
    D --> H[price]
    D --> I[busType]
    
    J[Seat Locks] --> K[Composite Unique Index]
    K --> L[scheduleId + seatNumber]
    
    J --> M[Expiration Index]
    M --> N[expiresAt]
    
    O[Bookings] --> P[Status Index]
    P --> Q[status]
    
    O --> R[Reference Index]
    R --> S[bookingReference UNIQUE]
```

## Data Flow Diagrams

### Booking Creation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant R as Redis
    participant D as Database

    U->>F: Search Buses
    F->>A: GET /api/bus-schedules
    A->>D: Query schedules
    D-->>A: Return results
    A-->>F: Schedules list
    F-->>U: Display results

    U->>F: Select seats
    F->>A: POST /api/seats/lock
    A->>R: Lock seats (15 min)
    R-->>A: Lock confirmed
    A->>D: Insert seat_locks
    A-->>F: Seats locked
    F-->>U: Proceed to booking

    U->>F: Fill booking form
    F->>A: POST /api/bookings
    A->>D: Insert booking (pending)
    D-->>A: Booking created
    A-->>F: Booking reference
    F-->>U: Redirect to payment

    U->>F: Complete payment
    F->>A: POST /api/payments/process
    A->>D: Update booking (confirmed)
    A->>R: Release seat locks
    A->>D: Delete seat_locks
    A-->>F: Success
    F-->>U: E-ticket sent
```

### Seat Lock Expiration Flow

```mermaid
sequenceDiagram
    participant C as Cron Job
    participant D as Database
    participant R as Redis

    loop Every 1 minute
        C->>D: Find expired locks
        D-->>C: Expired lock records
        C->>R: Delete from Redis
        C->>D: Delete from seat_locks
        C->>D: Increment availableSeats
    end
```

## Table Size Estimates

### Estimated Data Growth (1 Year)

```mermaid
pie title Database Table Sizes (after 1 year)
    "bus_bookings" : 500000
    "seat_locks" : 50000
    "reviews" : 150000
    "chat_histories" : 1000000
    "customers" : 100000
    "bus_schedules" : 50000
    "review_votes" : 300000
    "Other tables" : 20000
```

## Storage Requirements

### Estimated Storage (1 Year Operation)

| Table | Rows | Avg Size | Total Size |
|-------|------|----------|------------|
| customers | 100,000 | 1 KB | ~100 MB |
| bus_bookings | 500,000 | 2 KB | ~1 GB |
| seat_locks | 50,000 | 200 B | ~10 MB |
| reviews | 150,000 | 1 KB | ~150 MB |
| review_votes | 300,000 | 100 B | ~30 MB |
| chat_histories | 1,000,000 | 500 B | ~500 MB |
| bus_schedules | 50,000 | 500 B | ~25 MB |
| **Total** | | | **~2 GB** |

**Note:** Add 50-100% for indexes and PostgreSQL overhead = **~4-6 GB total**

## Maintenance Queries

### Useful Database Queries

```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Find slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Find missing indexes
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / seq_scan AS avg
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 10;
```

---

**Note:** These diagrams are generated using Mermaid syntax and can be viewed in:
- GitHub (native support)
- VS Code with Mermaid extension
- Online Mermaid editors
- Documentation sites with Mermaid plugins

**Last Updated:** January 2, 2026
