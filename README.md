# 🚌 Bus Ticket Booking System

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy](https://img.shields.io/badge/Deploy-Ready-success.svg)](./START_HERE.md)

**A comprehensive full-stack bus ticket booking platform with advanced features**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [🚀 Deploy Now](./START_HERE.md) • [Architecture](#-architecture)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [🚀 Quick Deploy](#-quick-deploy-to-production)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [Quick Start](#-quick-start)
- [Database Setup](#-database-setup)
- [Documentation](#-documentation)
- [Development](#-development)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Overview

A modern, scalable bus ticket booking system built with React, Node.js, and PostgreSQL. The platform provides comprehensive features for customers, administrators, and includes advanced capabilities like real-time seat selection, AI chatbot assistance, payment processing, and analytics.

## 🚀 Quick Deploy to Production

**Deploy your app to public hosting in 30 minutes!**

```bash
# 1. Run pre-deployment check
node scripts/pre-deploy-check.mjs

# 2. Follow deployment guide
# See: START_HERE.md

# 3. Or use GitHub Actions (automated)
git push origin main
```

📚 **Deployment Documentation:**
- **[🎯 Start Here](./START_HERE.md)** ⭐ - Choose your deployment guide
- **[📖 Step-by-Step](./STEP_BY_STEP_DEPLOY.md)** - Detailed guide with visual diagrams
- **[🇻🇳 Tiếng Việt](./DEPLOY_VI.md)** - Vietnamese quick guide
- **[📚 Complete Index](./DEPLOYMENT_INDEX.md)** - All documentation

**Stack (100% Free):**
- **Frontend:** Vercel
- **Backend:** Render (750 hours/month)
- **Database:** Neon PostgreSQL (3GB)
- **CI/CD:** GitHub Actions

**Live URLs after deployment:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.onrender.com`

## ✨ Features

### 🎫 For Customers
- **Smart Search** - Search buses by route, date, and preferences
- **Real-time Seat Selection** - Interactive seat map with live availability
- **Secure Payment** - Multiple payment methods (Stripe, VNPay, PayPal)
- **Guest Booking** - Book without registration with email confirmation
- **Review & Rating** - Rate trips and help other travelers
- **AI Chatbot** - 24/7 intelligent customer support
- **Notifications** - Email and SMS alerts for bookings
- **Booking History** - Track and manage all bookings

### 👨‍💼 For Administrators
- **Dashboard Analytics** - Real-time insights and reports
- **Bus Management** - Complete CRUD for bus fleet
- **Route Management** - Create and manage routes with multiple stops
- **Schedule Management** - Dynamic pricing and availability
- **Booking Management** - View and manage all bookings
- **Customer Management** - User administration
- **Revenue Reports** - Financial analytics and trends

### 🔧 Technical Features
- **OAuth 2.0** - Google authentication
- **JWT Auth** - Secure token-based authentication
- **Email Service** - Automated notifications via Nodemailer
- **File Upload** - Cloudinary integration for images
- **Real-time Updates** - WebSocket for seat locking
- **API Documentation** - Interactive OpenAPI/Swagger docs
- **Responsive Design** - Mobile-first UI with Tailwind CSS
- **Global Theme System** - Consistent design system
- **Microservices Ready** - Modular architecture

## 📁 Project Structure

```
bus-ticket-booking-app-main/
│
├── 📂 bus-booking-client/          # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Page components
│   │   ├── redux/                  # State management
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── utils/                  # Utility functions
│   │   ├── theme/                  # Design system & tokens
│   │   └── config/                 # App configuration
│   ├── public/                     # Static assets
│   └── package.json
│
├── 📂 bus-booking-server/          # Backend Application (Node.js + Express)
│   ├── controllers/                # Request handlers
│   ├── models/                     # Database models (Sequelize)
│   ├── routes/                     # API routes
│   ├── middleware/                 # Custom middleware
│   ├── services/                   # Business logic
│   ├── utils/                      # Helper functions
│   ├── config/                     # Server configuration
│   ├── migrations/                 # Database migrations
│   ├── microservices/              # Microservices modules
│   ├── __tests__/                  # Unit & integration tests
│   └── package.json
│
├── 📂 docs/                        # Documentation
│   ├── SETUP_GUIDE.md              # Development setup
│   ├── DEPLOYMENT_GUIDE.md         # Production deployment
│   ├── API_DOCUMENTATION.md        # API reference
│   ├── DATABASE_DESIGN.md          # Database schema
│   ├── DATABASE_ERD.md             # Entity relationships
│   ├── ARCHITECTURE.md             # System architecture
│   ├── USER_GUIDE.md               # User manual
│   └── QUICK_REFERENCE.md          # Quick reference
│
├── 📂 design/                      # Design Assets
│   ├── UI_WIREFRAMES.md            # UI wireframes
│   ├── UI_COMPONENTS.md            # Component library
│   └── USER_FLOWS.md               # User flow diagrams
│
├── 📂 infrastructure/              # Infrastructure as Code
│   ├── kubernetes/                 # K8s configurations
│   └── service-discovery/          # Service mesh configs
│
├── 📂 database/                    # Database Resources (see below)
│   ├── migrations/                 # Migration scripts
│   ├── seeds/                      # Seed data
│   ├── backups/                    # Backup scripts
│   └── README.md                   # Database documentation
│
├── package.json                    # Root dependencies
└── README.md                       # This file
```

### 🗄️ Database Folder Structure

The `database/` folder is organized as follows:

```
database/
├── migrations/                     # Database migration scripts
│   ├── 20260101-bus-management-updates.sql
│   ├── add_fullname_to_customers.sql
│   ├── add_schedule_status.sql
│   └── README.md                   # How to run migrations
│
├── seeds/                          # Seed data for development
│   ├── admin-user.sql
│   ├── sample-routes.sql
│   └── README.md
│
├── backups/                        # Backup scripts
│   ├── backup.sh
│   ├── restore.sh
│   └── README.md
│
└── README.md                       # Database overview
```

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18.x
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Redux Toolkit
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Forms:** React Hook Form
- **UI Components:** Custom design system

### Backend
- **Runtime:** Node.js 18.x
- **Framework:** Express.js
- **Database:** PostgreSQL 15.x
- **ORM:** Sequelize
- **Authentication:** Passport.js (JWT + OAuth2)
- **Email:** Nodemailer
- **File Upload:** Cloudinary
- **Payment:** Stripe, VNPay, PayPal
- **API Docs:** Swagger/OpenAPI

### DevOps
- **Containerization:** Docker
- **Orchestration:** Kubernetes
- **CI/CD:** GitHub Actions
- **Testing:** Jest, Supertest
- **Linting:** ESLint
- **Formatting:** Prettier

## 🚀 Quick Start

### Option 1: 🐳 Docker (Recommended)

The easiest way to get started! Requires only Docker Desktop.

**Prerequisites:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- At least 4GB RAM available

**Quick Setup (Windows):**
```powershell
# 1. Copy environment file
Copy-Item .env.docker .env

# 2. Edit .env file (update passwords and API keys)
notepad .env

# 3. Run setup script
.\docker-setup.bat
```

**Quick Setup (Linux/Mac):**
```bash
# 1. Copy environment file
cp .env.docker .env

# 2. Edit .env file (update passwords and API keys)
nano .env

# 3. Run setup script
chmod +x docker-setup.sh
./docker-setup.sh
```

**Manual Docker Setup:**
```bash
# 1. Copy and edit environment
cp .env.docker .env

# 2. Build and start all services
docker-compose up --build

# 3. Seed database (in new terminal)
docker-compose exec backend npm run seed
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Documentation: http://localhost:4000/api-docs
- PgAdmin: http://localhost:5050 (optional)

**Useful Docker Commands:**
```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Access backend shell
docker-compose exec backend sh

# Access database
docker-compose exec postgres psql -U postgres -d bus_booking_db
```

📖 **For detailed Docker instructions, see [DOCKER_GUIDE.md](DOCKER_GUIDE.md)**

---

### Option 2: 💻 Local Development

For traditional local development without Docker.

**Prerequisites:**
- Node.js 18.x or higher
- PostgreSQL 15.x or higher
- npm or yarn
- Git

**Installation:**

1. **Clone the repository**
```bash
git clone <repository-url>
cd bus-ticket-booking-app-main
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd bus-booking-server
npm install

# Install frontend dependencies
cd ../bus-booking-client
npm install
cd ..
```

3. **Setup Database**
```bash
# Create PostgreSQL database
psql -U postgres

# In PostgreSQL:
CREATE DATABASE bus_booking_db;
CREATE USER bus_booking_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE bus_booking_db TO bus_booking_user;
\c bus_booking_db
GRANT ALL ON SCHEMA public TO bus_booking_user;
\q
```

4. **Configure Environment Variables**
```bash
# Backend
cd bus-booking-server
cp .env.example .env
# Edit .env with your database credentials and API keys
```

5. **Run Database Migrations**
```bash
# From bus-booking-server directory
npm run sync-db

# Or seed with sample data
npm run seed
```

6. **Start Development Servers**
```bash
# Terminal 1 - Backend (from bus-booking-server/)
npm run dev

# Terminal 2 - Frontend (from bus-booking-client/)
npm run dev
```

7. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- API Docs: http://localhost:4000/api-docs

## 🗄️ Database Setup

### Initial Setup

See detailed instructions in [`database/README.md`](./database/README.md)

### Quick Migration Guide

```bash
# Navigate to server directory
cd bus-booking-server

# Option 1: Automatic sync (development)
npm run sync-db

# Option 2: Manual migration (production)
psql -U bus_booking_user -d bus_booking -f migrations/20260101-bus-management-updates.sql
psql -U bus_booking_user -d bus_booking -f migrations/add_fullname_to_customers.sql
psql -U bus_booking_user -d bus_booking -f migrations/add_schedule_status.sql
```

### Seed Data (Optional)

```bash
# Seed admin user
npm run seed-admin

# Seed sample data
npm run seed-data
```

## 📚 Documentation

### Complete Guides
- **[Setup Guide](./docs/SETUP_GUIDE.md)** - Complete development environment setup
- **[Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Database Guide](./database/README.md)** - Database schema and migrations
- **[API Documentation](./docs/API_DOCUMENTATION.md)** - REST API reference
- **[User Guide](./docs/USER_GUIDE.md)** - End-user manual

### Technical Documentation
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture overview
- **[Database Design](./docs/DATABASE_DESIGN.md)** - Database schema details
- **[Database ERD](./docs/DATABASE_ERD.md)** - Entity relationship diagrams

### Design Documentation
- **[UI Wireframes](./design/UI_WIREFRAMES.md)** - Page wireframes
- **[UI Components](./design/UI_COMPONENTS.md)** - Component library
- **[User Flows](./design/USER_FLOWS.md)** - User journey maps

## 💻 Development

### Running Tests

```bash
# Backend tests
cd bus-booking-server
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:coverage      # With coverage report

# Frontend tests
cd bus-booking-client
npm test
```

### Code Quality

```bash
# Linting
npm run lint               # Check for issues
npm run lint:fix          # Auto-fix issues

# Formatting
npm run format            # Format code with Prettier
```

### Building for Production

```bash
# Backend
cd bus-booking-server
npm run build

# Frontend
cd bus-booking-client
npm run build
```

## 🚢 Deployment

### 🚀 Quick Deploy to Public Hosting (45-60 minutes)

**Recommended Stack (100% Free):**
- **Frontend:** Vercel (Free, Unlimited)
- **Backend:** Render (Free 750 hours/month)
- **Database:** Neon PostgreSQL (Free 3GB)
- **CI/CD:** GitHub Actions (Automated)

📖 **[🎯 Start Here](./START_HERE.md)** - Choose your deployment guide

📚 **[Step-by-Step Guide](./STEP_BY_STEP_DEPLOY.md)** - Complete guide with visual diagrams

🇻🇳 **[Tiếng Việt](./DEPLOY_VI.md)** - Hướng dẫn nhanh 45 phút

### Deployment Options

| Method | Difficulty | Cost | Best For |
|--------|-----------|------|----------|
| **Vercel + Render** | ⭐ Easy | Free | Quick start, testing |
| **Netlify + Render** | ⭐ Easy | Free | Alternative to Vercel |
| **Docker** | ⭐⭐ Medium | Variable | Custom infrastructure |
| **Kubernetes** | ⭐⭐⭐ Hard | Variable | Enterprise scale |

### Method 1: Vercel + Render (Recommended)

```bash
# 1. Deploy Database to Neon
# Visit: https://neon.tech → Create Project

# 2. Deploy Backend to Render
# Visit: https://render.com → Deploy from GitHub

# 3. Deploy Frontend to Vercel
# Visit: https://vercel.com → Import Project

# 4. Setup CI/CD
git push origin main  # GitHub Actions auto-deploys
```

**Live URLs after deployment:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.onrender.com`

### Method 2: Docker Compose

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Method 3: Kubernetes

```bash
# Apply Kubernetes configurations
kubectl apply -f infrastructure/kubernetes/

# Check deployment status
kubectl get pods

# Access services
kubectl get svc
```

### Pre-Deployment Checklist

```bash
# Run health check before deploying
node scripts/pre-deploy-check.mjs
```

This will verify:
- ✅ Environment files exist
- ✅ Package.json configured correctly
- ✅ No hardcoded secrets
- ✅ Build process works
- ✅ Tests passing

### Environment Variables

Required environment variables for production:

**Backend:**
- `NODE_ENV=production`
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `SESSION_SECRET` - Session secret (min 32 chars)
- `CLIENT_URL` - Frontend URL
- `EMAIL_*` - Email service credentials
- `GOOGLE_*` - Google OAuth credentials (optional)
- `GEMINI_API_KEY` - AI chatbot key (optional)

**Frontend:**
- `VITE_API_BASE_URL` - Backend API URL

See `.env.production.example` for complete list with detailed comments.

### Monitoring After Deployment

- **Render:** https://dashboard.render.com → Services → Logs
- **Vercel:** https://vercel.com/dashboard → Deployments → Logs
- **Neon:** https://console.neon.tech → Monitoring

### Production Checklist

- [ ] Database deployed and accessible
- [ ] Backend health check returns 200
- [ ] Frontend loads without errors
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] SSL/HTTPS enabled (automatic on Vercel/Render)
- [ ] GitHub Actions workflow passing
- [ ] Email service working
- [ ] Payment gateway configured (if applicable)

## 🧪 Testing

### Backend Testing

```bash
cd bus-booking-server

# Run all tests
npm test

# Run specific test suite
npm test -- controllers/busBookingController.test.js

# Watch mode
npm test -- --watch

# Coverage report
npm run test:coverage
```

### Frontend Testing

```bash
cd bus-booking-client

# Run tests
npm test

# E2E tests (if configured)
npm run test:e2e
```

### Load Testing

```bash
# Using Artillery
cd bus-booking-server
npm run load-test

# Using Autocannon
npm run benchmark
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- Follow ESLint rules
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Lead:** [Your Name]
- **Backend Team:** [Names]
- **Frontend Team:** [Names]
- **DevOps:** [Names]

## 📞 Support

- **Email:** support@busbooking.com
- **Documentation:** [docs/](./docs/)
- **Issues:** [GitHub Issues](https://github.com/your-org/bus-ticket-booking/issues)

## 🙏 Acknowledgments

- Thanks to all contributors
- Built with open-source technologies
- Inspired by modern booking platforms

---

<div align="center">

**[⬆ back to top](#-bus-ticket-booking-system)**

Made with ❤️ by the Bus Booking Team

</div>
