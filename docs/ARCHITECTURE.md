# 🏗️ System Architecture - Bus Ticket Booking System

Complete system architecture and design documentation.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Pattern](#architecture-pattern)
- [Technology Stack](#technology-stack)
- [System Components](#system-components)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Scalability Design](#scalability-design)
- [Deployment Architecture](#deployment-architecture)
- [Performance Optimization](#performance-optimization)
- [Monitoring and Logging](#monitoring-and-logging)

## System Overview

The Bus Ticket Booking System is a full-stack web application built using modern technologies and design patterns. It follows a client-server architecture with clear separation of concerns.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Frontend (Vite)                                │   │
│  │  - Redux Toolkit (State Management)                   │   │
│  │  - React Router (Navigation)                          │   │
│  │  - Tailwind CSS (Styling)                             │   │
│  │  - Axios (HTTP Client)                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/HTTP
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express.js Server                                    │   │
│  │  - CORS Middleware                                    │   │
│  │  - Authentication Middleware                          │   │
│  │  - Rate Limiting (optional)                           │   │
│  │  - Request Validation                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
┌──────────────────┐ ┌─────────────┐ ┌──────────────────┐
│  BUSINESS LOGIC  │ │   SERVICES  │ │  MICROSERVICES   │
│                  │ │             │ │                  │
│  Controllers     │ │  Email      │ │  Payment Service │
│  - Customer      │ │  Service    │ │  Notification    │
│  - Booking       │ │             │ │  Service         │
│  - Schedule      │ │  PDF        │ │  Analytics       │
│  - Payment       │ │  Generator  │ │  Service         │
│  - Analytics     │ │             │ │                  │
│  - Chatbot       │ │  AI Chatbot │ │  Cache Service   │
│                  │ │  Service    │ │                  │
└──────────────────┘ └─────────────┘ └──────────────────┘
        │                   │                  │
        └───────────────────┼──────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   PostgreSQL   │  │    Redis     │  │  File Storage  │  │
│  │   (Primary DB) │  │  (Cache +    │  │  (Uploads)     │  │
│  │                │  │   Sessions)  │  │                │  │
│  └────────────────┘  └──────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
│  ┌────────────┐  ┌───────────┐  ┌──────────────────────┐   │
│  │  PayOS     │  │  Google   │  │  Email Service       │   │
│  │  Payment   │  │  OAuth    │  │  (SendGrid/Gmail)    │   │
│  │  Gateway   │  │           │  │                      │   │
│  └────────────┘  └───────────┘  └──────────────────────┘   │
│  ┌────────────┐                                             │
│  │  Google    │                                             │
│  │  Gemini AI │                                             │
│  └────────────┘                                             │
└─────────────────────────────────────────────────────────────┘
```

## Architecture Pattern

### 1. **MVC Pattern (Model-View-Controller)**

**Backend Structure:**
```
┌─────────────┐
│   Routes    │  → Defines API endpoints
└─────────────┘
       │
       ▼
┌─────────────┐
│ Controllers │  → Business logic & request handling
└─────────────┘
       │
       ▼
┌─────────────┐
│   Models    │  → Database schema & ORM
└─────────────┘
       │
       ▼
┌─────────────┐
│  Database   │  → PostgreSQL
└─────────────┘
```

**Frontend Structure (Flux/Redux):**
```
┌─────────────┐
│    View     │  → React Components
│  (React)    │
└─────────────┘
       │
       ▼
┌─────────────┐
│   Actions   │  → Redux Actions
└─────────────┘
       │
       ▼
┌─────────────┐
│  Reducers   │  → State Management
└─────────────┘
       │
       ▼
┌─────────────┐
│    Store    │  → Redux Store
└─────────────┘
```

### 2. **Service-Oriented Architecture (SOA)**

The system is designed with modular services:
- **Authentication Service** - User auth & session management
- **Booking Service** - Seat locking, booking creation
- **Payment Service** - Payment processing
- **Notification Service** - Email/SMS notifications
- **Analytics Service** - Data aggregation & reporting
- **Chatbot Service** - AI-powered assistance

### 3. **Microservices (Modular Design)**

Located in `bus-booking-server/microservices/`:
- Each service is self-contained
- Can be deployed independently
- Communicates via APIs
- Ready for containerization

## Technology Stack

### Frontend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **React** | UI Library | 18.3.1 |
| **Redux Toolkit** | State Management | 2.5.0 |
| **React Router** | Client-side Routing | 7.1.1 |
| **Tailwind CSS** | Styling Framework | 3.4.17 |
| **Vite** | Build Tool | 6.0.5 |
| **Axios** | HTTP Client | 1.7.9 |
| **Framer Motion** | Animations | 11.17.0 |
| **Recharts** | Data Visualization | 3.6.0 |

### Backend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime | 16+ |
| **Express.js** | Web Framework | 4.21.2 |
| **PostgreSQL** | Database | 12+ |
| **Sequelize** | ORM | 6.34.0 |
| **Redis** | Caching & Sessions | 5.3.2 |
| **JWT** | Authentication | 9.0.2 |
| **Passport.js** | OAuth | 0.7.0 |
| **PDFKit** | PDF Generation | 0.17.2 |
| **Nodemailer** | Email Service | 6.9.16 |

### External Services

| Service | Purpose |
|---------|---------|
| **Google Gemini AI** | Chatbot & NLP |
| **PayOS** | Payment Gateway |
| **Google OAuth** | Social Login |
| **SendGrid** | Email Delivery |

## System Components

### 1. Frontend Architecture

```
bus-booking-client/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── common/       # Generic components
│   │   ├── admin/        # Admin-specific components
│   │   └── booking/      # Booking-related components
│   │
│   ├── pages/            # Page components (routes)
│   │   ├── Home.jsx
│   │   ├── SearchBuses.jsx
│   │   ├── SeatSelection.jsx
│   │   ├── BookingPayment.jsx
│   │   └── AdminDashboard.jsx
│   │
│   ├── redux/            # State management
│   │   ├── store.js      # Redux store configuration
│   │   └── slices/       # Feature slices
│   │       ├── authSlice.js
│   │       ├── bookingSlice.js
│   │       └── scheduleSlice.js
│   │
│   ├── layouts/          # Layout components
│   │   └── Layout.jsx    # Main layout wrapper
│   │
│   ├── hooks/            # Custom React hooks
│   │   └── useAuth.js
│   │
│   ├── config/           # Configuration
│   │   └── api.js        # API endpoints
│   │
│   └── utils/            # Utility functions
│       └── helpers.js
```

**Key Frontend Patterns:**

1. **Component Composition**
   - Small, reusable components
   - Props-based communication
   - Container/Presentational pattern

2. **State Management**
   - Redux Toolkit for global state
   - Local state for component-specific data
   - Async operations with Redux Thunk

3. **Routing**
   - Protected routes for authenticated users
   - Admin routes for admin-only pages
   - Dynamic route parameters

### 2. Backend Architecture

```
bus-booking-server/
├── config/               # Configuration files
│   ├── postgres.js      # Database connection
│   ├── passport.js      # OAuth configuration
│   └── pricing.js       # Pricing calculations
│
├── models/              # Sequelize models
│   ├── Customer.js
│   ├── BusBooking.js
│   ├── BusSchedule.js
│   └── associations.js  # Model relationships
│
├── controllers/         # Request handlers
│   ├── customerController.js
│   ├── busBookingController.js
│   ├── busScheduleController.js
│   ├── paymentController.js
│   └── chatbotController.js
│
├── routes/             # API routes
│   ├── customerRoutes.js
│   ├── busBookingRoutes.js
│   ├── busScheduleRoutes.js
│   └── paymentRoutes.js
│
├── middleware/         # Custom middleware
│   ├── authMiddleware.js
│   ├── adminMiddleware.js
│   └── validation.js
│
├── services/           # Business logic services
│   ├── emailService.js
│   ├── pdfService.js
│   └── paymentService.js
│
├── utils/              # Utility functions
│   ├── seatLocking.js
│   ├── pricing.js
│   └── tripReminderScheduler.js
│
└── microservices/      # Modular services
    ├── paymentService/
    ├── notificationService/
    └── analyticsService/
```

**Key Backend Patterns:**

1. **Layered Architecture**
   ```
   Routes → Controllers → Services → Models → Database
   ```

2. **Middleware Chain**
   - Request validation
   - Authentication
   - Authorization
   - Error handling

3. **Dependency Injection**
   - Services injected into controllers
   - Models injected into services

## Data Flow

### 1. Booking Flow

```
┌──────────────┐
│    User      │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────┐
│  1. Search Buses             │
│     GET /api/bus-schedules   │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  2. Select Schedule          │
│     View seat availability   │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  3. Lock Seats               │
│     POST /api/seats/lock     │
│     (15-minute hold)         │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  4. Enter Passenger Details  │
│     Fill booking form        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  5. Create Booking           │
│     POST /api/bookings       │
│     Status: pending          │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  6. Create Payment Session   │
│     POST /api/payments/create│
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  7. Process Payment          │
│     PayOS Gateway            │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  8. Confirm Booking          │
│     POST /api/bookings/:id   │
│     /confirm                 │
│     Status: confirmed        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  9. Send Confirmation Email  │
│     + E-ticket PDF           │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  10. Release Seat Lock       │
│      Confirm seats in DB     │
└──────────────────────────────┘
```

### 2. Authentication Flow

**Local Authentication:**
```
Register → Email Verification → Login → JWT Token → Authenticated Requests
```

**OAuth Authentication (Google):**
```
Google Login → OAuth Callback → Create/Link Account → JWT Token → Authenticated
```

### 3. Real-time Seat Locking

```
┌─────────────┐
│  User A     │
└─────┬───────┘
      │
      ▼
┌──────────────────┐     ┌──────────────────┐
│  Lock Seats 1,2  │────▶│  Redis Cache     │
│  Session: ABC    │     │  SET seat:1:ABC  │
│  TTL: 15 min     │     │  EXPIRE 900      │
└──────────────────┘     └──────────────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │  PostgreSQL      │
                         │  seat_locks      │
                         │  status: locked  │
                         └──────────────────┘

┌─────────────┐
│  User B     │  (tries same seats)
└─────┬───────┘
      │
      ▼
┌──────────────────┐     ┌──────────────────┐
│  Lock Seats 1,2  │────▶│  Redis Cache     │
│  Session: XYZ    │     │  GET seat:1      │
└──────────────────┘     │  EXISTS → REJECT │
                         └──────────────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │  Return Error    │
                         │  Seats locked    │
                         └──────────────────┘
```

## Security Architecture

### 1. Authentication & Authorization

**JWT-Based Authentication:**
```javascript
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "payload": {
    "id": 1,
    "email": "user@example.com",
    "position": "customer",
    "iat": 1640000000,
    "exp": 1640604800  // 7 days
  }
}
```

**Authorization Levels:**
- **Public** - No authentication required
- **Authenticated** - Valid JWT token required
- **Admin** - Admin role required

**Middleware Chain:**
```
Request → CORS → Authentication → Authorization → Controller
```

### 2. Password Security

- **Hashing**: bcrypt with salt rounds (10)
- **Validation**: Minimum 8 characters
- **Reset**: Time-limited tokens (1 hour expiry)
- **Verification**: Email-based verification

### 3. Data Protection

**Encryption:**
- Passwords: bcrypt hashing
- JWT: HMAC SHA256 signing
- HTTPS: SSL/TLS in production

**Input Validation:**
- Server-side validation
- SQL injection prevention (ORM)
- XSS protection (sanitization)

**Session Security:**
- Secure cookies (httpOnly, secure)
- CSRF protection (potential)
- Session expiration

### 4. API Security

**Rate Limiting** (ready for implementation):
```javascript
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100                    // 100 requests per window
}
```

**CORS Configuration:**
```javascript
{
  origin: process.env.CLIENT_URL,
  credentials: true
}
```

## Scalability Design

### 1. Horizontal Scaling

**Stateless Architecture:**
- JWT tokens (no server-side session state)
- Redis for session storage
- Load balancer ready

**Database Scaling:**
- Read replicas for queries
- Write master for updates
- Connection pooling

### 2. Caching Strategy

**Redis Caching Layers:**

```
┌─────────────────────────────────────┐
│  Application Layer                  │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  L1 Cache (Redis)                   │
│  - Seat availability                │
│  - Bus schedules (15 min TTL)       │
│  - Route data (1 hour TTL)          │
│  - User sessions                    │
└─────────────┬───────────────────────┘
              │
              ▼ (Cache Miss)
┌─────────────────────────────────────┐
│  Database (PostgreSQL)              │
│  - Source of truth                  │
└─────────────────────────────────────┘
```

**Cache Invalidation:**
- Time-based expiration (TTL)
- Event-based invalidation
- Manual flush for critical updates

### 3. Database Optimization

**Indexing Strategy:**
- Primary keys (auto-indexed)
- Foreign keys (indexed)
- Search fields (composite indexes)
- Date fields (range queries)

**Query Optimization:**
- Eager loading (avoid N+1)
- Pagination (LIMIT/OFFSET)
- Select specific fields
- Avoid full table scans

### 4. Microservices Ready

**Service Decomposition:**
```
┌───────────────────┐
│  API Gateway      │
└─────────┬─────────┘
          │
    ┌─────┴─────┬──────────┬─────────┐
    ▼           ▼          ▼         ▼
┌────────┐ ┌─────────┐ ┌───────┐ ┌──────────┐
│Booking │ │Payment  │ │Email  │ │Analytics │
│Service │ │Service  │ │Service│ │Service   │
└────────┘ └─────────┘ └───────┘ └──────────┘
```

## Deployment Architecture

### Development Environment

```
┌──────────────────────────────────────┐
│  Developer Machine                   │
│  ┌────────────┐  ┌────────────────┐ │
│  │  Frontend  │  │    Backend     │ │
│  │ Port: 5173 │  │  Port: 4000    │ │
│  └────────────┘  └────────────────┘ │
│  ┌────────────┐  ┌────────────────┐ │
│  │ PostgreSQL │  │     Redis      │ │
│  │ Port: 5432 │  │  Port: 6379    │ │
│  └────────────┘  └────────────────┘ │
└──────────────────────────────────────┘
```

### Production Environment (Suggested)

```
┌─────────────────────────────────────────────────┐
│              Load Balancer (Nginx)              │
└────────────┬────────────────────────────────────┘
             │
    ┌────────┴────────┬────────────┐
    ▼                 ▼            ▼
┌─────────┐      ┌─────────┐  ┌─────────┐
│ App     │      │ App     │  │ App     │
│ Server 1│      │ Server 2│  │ Server 3│
└─────────┘      └─────────┘  └─────────┘
    │                 │            │
    └────────┬────────┴────────────┘
             ▼
┌─────────────────────────────────────┐
│     Database Cluster                │
│  ┌──────────┐    ┌──────────────┐  │
│  │  Master  │───▶│  Read Replica│  │
│  │  (Write) │    │   (Read)     │  │
│  └──────────┘    └──────────────┘  │
└─────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│       Redis Cluster                 │
│  ┌──────────┐    ┌──────────────┐  │
│  │  Master  │───▶│   Replica    │  │
│  └──────────┘    └──────────────┘  │
└─────────────────────────────────────┘
```

### Container Deployment (Docker)

```yaml
# docker-compose.yml example
services:
  frontend:
    build: ./bus-booking-client
    ports:
      - "80:80"
  
  backend:
    build: ./bus-booking-server
    ports:
      - "4000:4000"
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:15
    volumes:
      - pgdata:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
```

## Performance Optimization

### 1. Frontend Optimization

**Code Splitting:**
```javascript
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
```

**Asset Optimization:**
- Image lazy loading
- Code minification
- Tree shaking
- Gzip compression

### 2. Backend Optimization

**Database:**
- Connection pooling
- Query result caching
- Prepared statements
- Batch operations

**API Response:**
- Pagination
- Field selection
- Compression (gzip)
- ETags for caching

### 3. Network Optimization

- CDN for static assets
- HTTP/2 support
- Resource hints (preload, prefetch)
- Service workers (PWA)

## Monitoring and Logging

### Application Monitoring

**Metrics to Track:**
- API response times
- Error rates
- Request throughput
- Database query performance
- Cache hit/miss rates

**Tools (Suggested):**
- PM2 for process management
- Winston for logging
- Prometheus for metrics
- Grafana for visualization

### Error Handling

```javascript
// Centralized error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    msg: err.message || "Server Error"
  });
});
```

### Logging Strategy

**Log Levels:**
- ERROR - Critical errors
- WARN - Warning conditions
- INFO - Informational messages
- DEBUG - Debug information (dev only)

**Log Format:**
```json
{
  "timestamp": "2024-12-20T10:30:00Z",
  "level": "ERROR",
  "message": "Database connection failed",
  "context": {
    "userId": 123,
    "endpoint": "/api/bookings"
  }
}
```

## Future Enhancements

### Planned Improvements

1. **GraphQL API** - More efficient data fetching
2. **WebSocket** - Real-time updates
3. **Service Mesh** - Istio/Linkerd for microservices
4. **Kubernetes** - Container orchestration
5. **CI/CD Pipeline** - Automated deployment
6. **Mobile Apps** - React Native
7. **Advanced Analytics** - Machine learning for demand prediction
8. **Multi-language Support** - i18n implementation

---

**Last Updated:** January 2, 2026
