# ✅ Docker Setup Checklist

Use this checklist to ensure a successful Docker setup for the Bus Ticket Booking Application.

## 📋 Pre-Setup Checklist

### System Requirements
- [ ] Docker Desktop installed and running
  - Download: https://www.docker.com/products/docker-desktop
  - Version: 20.10+ recommended
- [ ] At least 4GB RAM available for Docker
- [ ] At least 10GB free disk space
- [ ] Ports available: 3000, 4000, 5432, 5050
- [ ] Internet connection for pulling images

### Verify Docker Installation

```bash
# Check Docker version
docker --version
# Should show: Docker version 20.10.0 or higher

# Check Docker Compose version  
docker-compose --version
# Should show: Docker Compose version 2.0.0 or higher

# Verify Docker is running
docker info
# Should show system information without errors
```

## 🔧 Initial Setup

### Step 1: Clone Repository
- [ ] Repository cloned successfully
- [ ] Navigate to project root directory

```bash
cd bus-ticket-booking-app-main
```

### Step 2: Environment Configuration
- [ ] Copy environment template
  ```bash
  # Windows
  Copy-Item .env.docker .env
  
  # Linux/Mac
  cp .env.docker .env
  ```

- [ ] Open `.env` file for editing
  ```bash
  # Windows
  notepad .env
  
  # Linux/Mac
  nano .env
  # or
  vim .env
  ```

### Step 3: Configure Required Variables

#### Database Configuration
- [ ] `PG_PASSWORD` - Set a strong password (minimum 12 characters)
  ```env
  PG_PASSWORD=YourSecurePasswordHere123!@#
  ```

#### Security Configuration
- [ ] `JWT_SECRET` - Generate random string (minimum 32 characters)
  ```bash
  # Generate with Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  ```env
  JWT_SECRET=your-generated-secret-here
  ```

- [ ] `SESSION_SECRET` - Generate random string (minimum 32 characters)
  ```env
  SESSION_SECRET=your-generated-secret-here
  ```

#### Email Configuration (Required for Notifications)
- [ ] `EMAIL_USER` - Your Gmail address
  ```env
  EMAIL_USER=your-email@gmail.com
  ```

- [ ] `EMAIL_PASSWORD` - Gmail app password
  - Go to: https://myaccount.google.com/apppasswords
  - Generate new app password
  - Copy and paste into .env
  ```env
  EMAIL_PASSWORD=your-16-character-app-password
  ```

#### Optional Configurations

- [ ] **Google OAuth** (for social login)
  - Get credentials: https://console.cloud.google.com/
  ```env
  GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=your-client-secret
  ```

- [ ] **AI Chatbot** (for customer support)
  - Get free API key: https://aistudio.google.com/app/apikey
  ```env
  GEMINI_API_KEY=your-gemini-api-key
  ```

### Step 4: Review Configuration

- [ ] All required fields filled
- [ ] No placeholder values remaining
- [ ] Passwords are strong and secure
- [ ] Email credentials are correct
- [ ] File saved

## 🚀 Build and Start Services

### Option A: Using Helper Script (Recommended)

#### Windows
- [ ] Run setup script
  ```bash
  .\docker-setup.bat
  ```
- [ ] Wait for completion (3-5 minutes)
- [ ] Verify no errors in output

#### Linux/Mac
- [ ] Make script executable
  ```bash
  chmod +x docker-setup.sh
  ```
- [ ] Run setup script
  ```bash
  ./docker-setup.sh
  ```
- [ ] Wait for completion (3-5 minutes)
- [ ] Verify no errors in output

### Option B: Manual Setup

- [ ] Build Docker images
  ```bash
  docker-compose build
  ```
  - Expected time: 3-5 minutes on first run
  - Watch for "Successfully built" messages

- [ ] Start all services
  ```bash
  docker-compose up -d
  ```
  - Services should start in order: postgres → backend → frontend

- [ ] Wait for services to be ready (30 seconds)
  ```bash
  # Windows PowerShell
  Start-Sleep -Seconds 30
  
  # Linux/Mac
  sleep 30
  ```

## ✔️ Verification

### Step 5: Verify Services Running

- [ ] Check service status
  ```bash
  docker-compose ps
  ```
  - All services should show "Up" status
  - Health should be "healthy" for backend and postgres

- [ ] Check service logs
  ```bash
  docker-compose logs
  ```
  - No error messages
  - Backend shows "Server running on http://localhost:4000"
  - PostgreSQL shows "database system is ready to accept connections"

### Step 6: Test Service Connectivity

- [ ] **Frontend accessible**
  - Open browser: http://localhost:3000
  - Page loads without errors
  - No console errors in browser DevTools

- [ ] **Backend API accessible**
  - Open browser: http://localhost:4000
  - Shows API response or welcome message

- [ ] **API Documentation accessible**
  - Open browser: http://localhost:4000/api-docs
  - Swagger UI loads successfully

- [ ] **Database accessible** (Optional)
  ```bash
  docker-compose exec postgres psql -U postgres -d bus_booking_db -c "SELECT version();"
  ```
  - Shows PostgreSQL version

### Step 7: Initialize Database

- [ ] Seed database with sample data
  ```bash
  docker-compose exec backend npm run seed
  ```
  - Shows "Seeding complete" or similar message
  - No errors during seeding

- [ ] Verify data was created
  ```bash
  docker-compose exec postgres psql -U postgres -d bus_booking_db -c "SELECT COUNT(*) FROM customers;"
  ```
  - Shows count > 0

## 🧪 Functional Testing

### Step 8: Test Application Features

- [ ] **User Registration**
  - Navigate to registration page
  - Create test account
  - Receive confirmation email

- [ ] **User Login**
  - Login with test credentials
  - Successfully authenticated
  - Redirected to dashboard

- [ ] **Search Buses**
  - Search for available routes
  - Results display correctly
  - Filters work properly

- [ ] **View Bus Details**
  - Click on a bus
  - Details page loads
  - Seat map displays

- [ ] **Test Booking Flow** (Optional)
  - Select seats
  - Proceed to checkout
  - Fill passenger details

## 🛠️ Optional Setup

### Step 9: PgAdmin (Database Management Tool)

- [ ] Start PgAdmin
  ```bash
  docker-compose --profile tools up -d
  ```

- [ ] Access PgAdmin
  - Open: http://localhost:5050
  - Login with credentials from .env
    - Email: admin@admin.com (default)
    - Password: admin (default)

- [ ] Add database server
  - Right-click Servers → Register → Server
  - Name: Bus Booking DB
  - Host: postgres
  - Port: 5432
  - Username: postgres
  - Password: (from .env PG_PASSWORD)

## 📊 Performance Check

### Step 10: Verify Performance

- [ ] Check resource usage
  ```bash
  docker stats
  ```
  - Backend: < 500MB RAM
  - Frontend: < 200MB RAM
  - PostgreSQL: < 1GB RAM

- [ ] Check disk usage
  ```bash
  docker system df
  ```
  - Reasonable disk usage
  - No warnings about low space

## 🔍 Troubleshooting

### If Services Fail to Start

- [ ] Check Docker is running
  ```bash
  docker info
  ```

- [ ] Check .env file exists and is configured
  ```bash
  # Windows
  Get-Content .env | Select-String "PG_PASSWORD"
  
  # Linux/Mac
  grep "PG_PASSWORD" .env
  ```

- [ ] Check port conflicts
  ```bash
  # Windows
  netstat -ano | findstr ":3000 :4000 :5432"
  
  # Linux/Mac
  lsof -i :3000,4000,5432
  ```

- [ ] View detailed logs
  ```bash
  docker-compose logs backend
  docker-compose logs postgres
  ```

- [ ] Restart services
  ```bash
  docker-compose down
  docker-compose up -d
  ```

### If Database Connection Fails

- [ ] Verify PostgreSQL is running
  ```bash
  docker-compose ps postgres
  ```

- [ ] Check PostgreSQL logs
  ```bash
  docker-compose logs postgres
  ```

- [ ] Verify connection string in .env
  ```env
  PG_HOST=postgres  # Should be 'postgres', not 'localhost'
  ```

- [ ] Restart backend
  ```bash
  docker-compose restart backend
  ```

## 📚 Next Steps

### Step 11: Explore Documentation

- [ ] Read `DOCKER_GUIDE.md` for detailed usage
- [ ] Review `DOCKER_CHEATSHEET.md` for quick commands
- [ ] Check `DOCKER_ARCHITECTURE.md` for technical details
- [ ] Browse `README.md` for application features

### Step 12: Development Setup

- [ ] Install VS Code extensions (optional)
  - Docker
  - PostgreSQL
  - ESLint
  - Prettier

- [ ] Configure git hooks (optional)
  ```bash
  cd bus-booking-server
  npm run prepare
  ```

### Step 13: Production Planning

- [ ] Review `docker-compose.prod.yml`
- [ ] Plan SSL certificate setup
- [ ] Configure domain names
- [ ] Set up monitoring
- [ ] Plan backup strategy

## 🎉 Setup Complete!

### Congratulations! Your Docker environment is ready.

#### Quick Reference

**Start Services:**
```bash
docker-compose up -d
```

**Stop Services:**
```bash
docker-compose down
```

**View Logs:**
```bash
docker-compose logs -f
```

**Access Application:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- API Docs: http://localhost:4000/api-docs

#### Important Files

- `.env` - Your configuration (don't commit!)
- `docker-compose.yml` - Service definitions
- `DOCKER_GUIDE.md` - Complete guide
- `DOCKER_CHEATSHEET.md` - Quick commands

#### Common Commands

```bash
# Restart all services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build

# Access backend shell
docker-compose exec backend sh

# Access database
docker-compose exec postgres psql -U postgres -d bus_booking_db

# View service status
docker-compose ps

# Create database backup
docker-compose exec postgres pg_dump -U postgres bus_booking_db > backup.sql
```

#### Getting Help

1. Check logs: `docker-compose logs [service]`
2. Review documentation in DOCKER_GUIDE.md
3. Check troubleshooting section in DOCKER_CHEATSHEET.md
4. Search for error messages online

---

**Happy coding! 🚀**

If everything is checked off, you're ready to start developing!
