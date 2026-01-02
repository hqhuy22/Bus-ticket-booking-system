# 📚 Documentation Index - Bus Ticket Booking System

Complete documentation hub for developers, administrators, and end-users.

## 📖 Available Documentation

### 1. [README.md](../README.md)
**Main project overview and quick start guide**
- Project features and highlights
- Technology stack overview
- Quick installation steps
- Project structure
- Testing information

👉 **Start here** if you're new to the project!

---

### 2. [SETUP_GUIDE.md](./SETUP_GUIDE.md)
**Comprehensive installation and configuration guide**

**Contents:**
- System requirements
- Step-by-step installation for:
  - Node.js and dependencies
  - PostgreSQL database
  - Redis cache
  - Email services (Gmail/SendGrid)
  - Google OAuth
  - PayOS payment gateway
  - Google Gemini AI chatbot
- Environment variable configuration
- Troubleshooting common issues
- Development tips

👉 **Use this** for setting up development or production environments.

---

### 3. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
**Complete REST API reference**

**Contents:**
- Base URL and authentication
- Customer APIs (registration, login, profile)
- Bus Schedule APIs (search, filtering)
- Booking APIs (create, manage, cancel)
- Seat Lock APIs (real-time seat management)
- Payment APIs (PayOS integration)
- Review APIs (rating and feedback)
- Analytics APIs (admin dashboard)
- Chatbot APIs (AI assistance)
- Error responses and status codes

👉 **Essential for** frontend developers and API consumers.

---

### 4. [DATABASE_DESIGN.md](./DATABASE_DESIGN.md)
**Database schema and architecture**

**Contents:**
- Entity Relationship Diagrams (ERD)
- Detailed table schemas:
  - customers (users and guests)
  - buses (fleet management)
  - routes (route information)
  - bus_schedules (trip schedules)
  - bus_bookings (booking records)
  - seat_locks (real-time seat locking)
  - reviews (customer feedback)
  - notification_preferences
  - chat_histories
- Relationships and foreign keys
- Indexes and performance optimization
- Constraints and validation rules
- Migration strategy

👉 **Important for** database administrators and backend developers.

---

### 5. [ARCHITECTURE.md](./ARCHITECTURE.md)
**System architecture and design patterns**

**Contents:**
- High-level architecture overview
- Architecture patterns (MVC, SOA, Microservices)
- Technology stack details
- Frontend architecture (React + Redux)
- Backend architecture (Express + Sequelize)
- Data flow diagrams:
  - Booking flow
  - Authentication flow
  - Seat locking mechanism
- Security architecture
- Scalability design
- Caching strategy
- Deployment architecture
- Performance optimization
- Monitoring and logging

👉 **Critical for** understanding system design and making architectural decisions.

---

### 6. [USER_GUIDE.md](./USER_GUIDE.md)
**End-user documentation and help guide**

**Contents:**
- Getting started
- Account management (registration, login, profile)
- Searching for buses
- Booking tickets (step-by-step)
- Payment process
- Managing bookings
- Guest booking without account
- Writing reviews and ratings
- Using AI chatbot assistant
- Admin dashboard guide
- Troubleshooting common issues
- Safety and security tips

👉 **Perfect for** end-users, customer support, and training materials.

---

### 7. [openapi.yaml](./openapi.yaml)
**OpenAPI 3.0 specification for API**

**Contents:**
- Machine-readable API specification
- Request/response schemas
- Authentication methods
- Endpoint definitions
- Example requests and responses

👉 **Use with** Swagger UI, Postman, or other API tools for interactive documentation.

**View in Swagger UI:**
```bash
# Install swagger-ui-express in backend
npm install swagger-ui-express swagger-jsdoc

# Access at: http://localhost:4000/api-docs
```

---

## 📊 Additional Technical Documentation

### Testing Documentation

Located in `bus-booking-server/`:

- **[TESTING_README.md](../bus-booking-server/TESTING_README.md)** - Complete testing guide
- **[UNIT_TEST_SUMMARY.md](../bus-booking-server/UNIT_TEST_SUMMARY.md)** - Unit test coverage
- **[INTEGRATION_TEST_SUMMARY.md](../bus-booking-server/INTEGRATION_TEST_SUMMARY.md)** - Integration tests
- **[TESTING_QUICK_START.md](../bus-booking-server/TESTING_QUICK_START.md)** - Quick start for testing

**Test Coverage:** 70%+ achieved

---

## 🎯 Documentation by Role

### For Developers

**Getting Started:**
1. Read [README.md](../README.md) - Project overview
2. Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Environment setup
3. Review [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
4. Study [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) - Data model
5. Reference [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API specs

**Development Workflow:**
```bash
# 1. Clone and setup
git clone <repo>
cd bus-ticket-booking-app-main
npm install

# 2. Setup database (see SETUP_GUIDE.md)
createdb bus_booking

# 3. Configure environment
cp bus-booking-server/.env.example bus-booking-server/.env
# Edit .env file

# 4. Run development servers
cd bus-booking-server && npm run dev  # Terminal 1
cd bus-booking-client && npm run dev   # Terminal 2

# 5. Run tests
cd bus-booking-server && npm test
```

---

### For System Administrators

**Deployment:**
1. [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Production setup
2. [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) - Database optimization
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - Scaling strategies

**Monitoring:**
- Check server logs
- Monitor database performance
- Review cache statistics at `/api/cache/stats`
- Analytics dashboard for business metrics

**Backup Strategy:**
```bash
# Daily database backup
pg_dump -U bus_booking_user -d bus_booking -F c -f backup_$(date +%Y%m%d).dump

# Backup uploads folder
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz bus-booking-server/uploads/
```

---

### For End-Users

**Customer Guide:**
- [USER_GUIDE.md](./USER_GUIDE.md) - Complete user manual

**Quick Help:**
- Search buses → Select seats → Enter details → Pay → Receive ticket
- Guest booking available (no account needed)
- AI chatbot for assistance
- Email support: support@busticketbooking.com

---

### For API Consumers

**API Integration:**
1. Review [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. Import [openapi.yaml](./openapi.yaml) into Postman
3. Obtain API credentials (contact admin)
4. Test in sandbox environment

**Authentication:**
```javascript
// 1. Register/Login
POST /api/customer/login
{
  "email": "user@example.com",
  "password": "password123"
}

// 2. Store JWT token
// Response: { "token": "eyJhbGc..." }

// 3. Include in requests
Headers: {
  "Authorization": "Bearer eyJhbGc..."
}
```

---

## 🔄 Documentation Updates

**Last Updated:** January 2, 2026

**Versioning:**
- Documentation version matches API version (v1.0.0)
- Breaking changes will be documented
- Deprecated features marked clearly

**Contributing to Documentation:**
1. Fork repository
2. Update relevant .md files
3. Submit pull request
4. Documentation team will review

---

## 📞 Support and Resources

### Getting Help

**Developer Support:**
- GitHub Issues: Report bugs or request features
- Developer Slack: [Join here](#) (internal)
- Stack Overflow: Tag `bus-booking-system`

**User Support:**
- Help Center: [FAQ](#)
- Email: support@busticketbooking.com
- Phone: 1900-xxxx (8 AM - 10 PM)
- Live Chat: Available on website

### External Resources

**Technologies Used:**
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Manual](https://www.postgresql.org/docs/)
- [Sequelize Docs](https://sequelize.org/)
- [Redis Documentation](https://redis.io/docs/)
- [JWT.io](https://jwt.io/)

**Best Practices:**
- [REST API Best Practices](https://restfulapi.net/)
- [Database Design Principles](https://www.postgresql.org/docs/current/tutorial.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 📝 Documentation Checklist

Before deployment, ensure:

- [ ] All environment variables documented
- [ ] API endpoints tested and documented
- [ ] Database schema up to date
- [ ] User guide covers all features
- [ ] Setup guide tested on clean environment
- [ ] Architecture diagrams current
- [ ] Error codes documented
- [ ] Security practices documented
- [ ] Backup procedures documented
- [ ] Monitoring setup documented

---

## 🗺️ Quick Navigation

| Document | Purpose | Audience |
|----------|---------|----------|
| [README.md](../README.md) | Project overview | Everyone |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Installation | Developers, Admins |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | API reference | Developers |
| [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) | Database schema | Developers, DBAs |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design | Architects, Developers |
| [USER_GUIDE.md](./USER_GUIDE.md) | User manual | End-users, Support |
| [openapi.yaml](./openapi.yaml) | API spec | Developers, Integrators |

---

## 🎓 Learning Path

**For New Developers:**

1. **Week 1: Understanding the System**
   - Read README and USER_GUIDE
   - Understand user workflows
   - Explore the UI

2. **Week 2: Setup and Architecture**
   - Complete SETUP_GUIDE
   - Study ARCHITECTURE
   - Review DATABASE_DESIGN

3. **Week 3: Development**
   - Read API_DOCUMENTATION
   - Run tests
   - Make small changes
   - Review code

4. **Week 4: Contribution**
   - Pick a feature/bug
   - Implement solution
   - Write tests
   - Submit PR

---

**Happy coding! 🚀**

For questions or suggestions about documentation, please create an issue on GitHub or contact the documentation team.
