# 🐳 Docker Setup - Bus Ticket Booking Application

<div align="center">

[![Docker](https://img.shields.io/badge/Docker-20.10+-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-2.0+-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)

**Complete Docker containerization with development & production configurations**

[Quick Start](#-quick-start-30-seconds) • [Documentation](#-documentation) • [Features](#-features) • [Commands](#-essential-commands) • [Troubleshooting](#-troubleshooting)

</div>

---

## 🎯 What's Included

```
✅ Complete Docker Compose setup
✅ Multi-stage optimized Dockerfiles
✅ Development & Production configs
✅ PostgreSQL database container
✅ PgAdmin management interface
✅ Automated setup scripts
✅ 2500+ lines of documentation
✅ CI/CD GitHub Actions pipeline
✅ Health checks & monitoring
✅ Volume persistence strategy
✅ Security best practices
```

## 🚀 Quick Start (30 seconds)

### Windows (PowerShell)
```powershell
# 1. Copy environment template
Copy-Item .env.docker .env

# 2. Edit .env (update passwords and API keys)
notepad .env

# 3. Start everything!
.\docker-setup.bat
```

### Linux/Mac (Bash)
```bash
# 1. Copy environment template
cp .env.docker .env

# 2. Edit .env (update passwords and API keys)
nano .env

# 3. Start everything!
chmod +x docker-setup.sh && ./docker-setup.sh
```

### Manual Setup
```bash
# 1. Configure environment
cp .env.docker .env
nano .env  # Edit configuration

# 2. Build and start
docker-compose up -d --build

# 3. Seed database
docker-compose exec backend npm run seed
```

**That's it!** 🎉 

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- API Docs: http://localhost:4000/api-docs

## 📚 Documentation

| Document | Purpose | Lines |
|----------|---------|-------|
| [DOCKER_SETUP_CHECKLIST.md](DOCKER_SETUP_CHECKLIST.md) | ✅ Step-by-step setup guide | 400+ |
| [DOCKER_GUIDE.md](DOCKER_GUIDE.md) | 📖 Complete usage guide | 400+ |
| [DOCKER_CHEATSHEET.md](DOCKER_CHEATSHEET.md) | 📋 Command reference | 600+ |
| [DOCKER_ARCHITECTURE.md](DOCKER_ARCHITECTURE.md) | 🏗️ Technical deep dive | 400+ |
| [DOCKER_IMPLEMENTATION_SUMMARY.md](DOCKER_IMPLEMENTATION_SUMMARY.md) | 📊 Implementation overview | 400+ |
| [DOCKER_FILES_OVERVIEW.md](DOCKER_FILES_OVERVIEW.md) | 📁 File structure guide | 200+ |

**Total: 2500+ lines of comprehensive documentation!**

## ✨ Features

### 🔧 Development Experience
- ✅ Hot-reload for frontend and backend
- ✅ Source code mounted as volumes
- ✅ Fast iteration cycle
- ✅ Easy debugging with shell access
- ✅ Comprehensive logging

### 🚀 Production Ready
- ✅ Multi-stage optimized builds
- ✅ Nginx static file serving
- ✅ Multiple backend replicas
- ✅ Resource limits configured
- ✅ Health checks enabled

### 🔒 Security
- ✅ Alpine Linux base images
- ✅ Non-root users
- ✅ Network isolation
- ✅ Secret management
- ✅ Security scanning in CI/CD

### 📊 Monitoring & Management
- ✅ Health checks for all services
- ✅ PgAdmin database interface
- ✅ Comprehensive logging
- ✅ Resource monitoring
- ✅ Backup scripts

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Compose Network                        │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Frontend   │───▶│   Backend    │───▶│  PostgreSQL  │     │
│  │              │    │              │    │              │     │
│  │ React/Vite   │    │ Node.js/     │    │  Database    │     │
│  │ or Nginx     │    │ Express      │    │              │     │
│  │ Port 3000/80 │    │ Port 4000    │    │ Port 5432    │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                   │              │
│                                                   ▼              │
│                                           ┌──────────────┐      │
│                                           │   PgAdmin    │      │
│                                           │ (Optional)   │      │
│                                           │ Port 5050    │      │
│                                           └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Services

### Frontend Container
- **Image**: Node.js 20 Alpine (dev) / Nginx Alpine (prod)
- **Port**: 3000 (dev: 5173)
- **Features**: Hot-reload, optimized builds, gzip compression

### Backend Container  
- **Image**: Node.js 20 Alpine
- **Port**: 4000
- **Features**: Hot-reload, health checks, auto-restart

### PostgreSQL Container
- **Image**: PostgreSQL 16 Alpine
- **Port**: 5432
- **Features**: Persistent volumes, health checks, backups

### PgAdmin Container (Optional)
- **Image**: PgAdmin 4
- **Port**: 5050
- **Features**: Web-based database management

## 🎮 Essential Commands

### Start/Stop
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Database Operations
```bash
# Seed database
docker-compose exec backend npm run seed

# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d bus_booking_db

# Create backup
docker-compose exec postgres pg_dump -U postgres bus_booking_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres bus_booking_db < backup.sql
```

### Development
```bash
# Access backend shell
docker-compose exec backend sh

# Run backend tests
docker-compose exec backend npm test

# Access frontend shell
docker-compose exec frontend sh

# View service status
docker-compose ps
```

### Cleanup
```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes (⚠️ deletes data)
docker-compose down -v

# Clean up unused Docker resources
docker system prune
```

## ⚙️ Configuration

### Required Environment Variables

Edit `.env` file:

```env
# Database (Required)
PG_PASSWORD=your_secure_password_here

# Security (Required)
JWT_SECRET=long_random_string_at_least_32_chars
SESSION_SECRET=long_random_string_at_least_32_chars

# Email (Required for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
```

### Optional Configurations

```env
# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# AI Chatbot (Optional - Free)
GEMINI_API_KEY=your-gemini-api-key
```

## 🏭 Production Deployment

```bash
# 1. Configure production environment
cp .env.docker .env.production
nano .env.production

# 2. Deploy with production config
docker-compose -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d --build

# 3. Scale backend instances
docker-compose up -d --scale backend=3

# 4. Monitor
docker-compose logs -f
docker stats
```

## 🆘 Troubleshooting

### Services won't start?
```bash
# Check Docker is running
docker info

# Check logs
docker-compose logs

# Verify .env file
cat .env
```

### Database connection fails?
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Verify PG_HOST=postgres (not localhost)
```

### Port already in use?
```bash
# Find process using port (Windows)
netstat -ano | findstr :3000

# Change port in .env
CLIENT_PORT=8080
```

### Need to reset everything?
```bash
# ⚠️ Nuclear option - deletes all data
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

**For detailed troubleshooting, see [DOCKER_GUIDE.md](DOCKER_GUIDE.md)**

## 🔄 Development Workflow

```bash
# 1. Start services (first time)
docker-compose up -d --build

# 2. Seed database
docker-compose exec backend npm run seed

# 3. Watch logs
docker-compose logs -f

# 4. Make code changes (auto-reload works!)

# 5. Run tests
docker-compose exec backend npm test

# 6. Access database (if needed)
docker-compose exec postgres psql -U postgres -d bus_booking_db

# 7. Stop when done
docker-compose down
```

## 🎯 Helper Tools

### PowerShell Functions (Windows)
```powershell
# Load helpers
. .\docker-helpers.ps1

# Use commands
Start-BusBooking
Stop-BusBooking
Show-BusBookingLogs -Follow
Invoke-DatabaseSeed
```

### Makefile Commands
```bash
# Setup
make setup

# Start/stop
make up
make down

# Logs
make logs

# Database
make seed
make shell-db

# Cleanup
make clean
```

## 📊 Resource Usage

### Image Sizes
- Backend: ~200MB (Alpine-based)
- Frontend (dev): ~400MB
- Frontend (prod): ~50MB (Nginx)
- PostgreSQL: ~230MB (Alpine)

### Typical RAM Usage
- Backend: 200-500MB
- Frontend (dev): 100-200MB
- Frontend (prod): 10-50MB
- PostgreSQL: 500MB-1GB

## 🎓 Learning Resources

### For Beginners
1. Start with [DOCKER_SETUP_CHECKLIST.md](DOCKER_SETUP_CHECKLIST.md)
2. Follow step-by-step instructions
3. Use automated setup scripts

### For Developers  
1. Read [DOCKER_GUIDE.md](DOCKER_GUIDE.md)
2. Keep [DOCKER_CHEATSHEET.md](DOCKER_CHEATSHEET.md) handy
3. Explore [DOCKER_ARCHITECTURE.md](DOCKER_ARCHITECTURE.md)

### For DevOps
1. Review architecture diagrams
2. Check production configurations
3. Examine CI/CD pipeline

## 🔐 Security Best Practices

✅ **Never commit `.env` files** - Contains secrets  
✅ **Use strong passwords** - Minimum 12 characters  
✅ **Rotate secrets regularly** - Especially in production  
✅ **Keep images updated** - Run `docker-compose pull`  
✅ **Review logs regularly** - Check for suspicious activity  
✅ **Use HTTPS in production** - Configure reverse proxy  
✅ **Backup regularly** - Automate database backups  

## 🚀 CI/CD Pipeline

GitHub Actions workflow included:
- ✅ Automated testing
- ✅ Docker image building
- ✅ Security scanning (Trivy)
- ✅ Push to Docker Hub
- ✅ Deploy to staging/production

See [.github/workflows/docker-ci-cd.yml](.github/workflows/docker-ci-cd.yml)

## 💡 Tips & Tricks

### Speed up builds
```bash
# Use BuildKit
DOCKER_BUILDKIT=1 docker-compose build
```

### View disk usage
```bash
docker system df
```

### Copy files from container
```bash
docker cp bus-booking-backend:/app/uploads ./local-uploads
```

### Execute one-off commands
```bash
docker-compose exec backend node -e "console.log('Hello')"
```

### Use different .env file
```bash
docker-compose --env-file .env.staging up -d
```

## 🎉 What's Next?

After successful setup:

1. ✅ Explore the application
2. ✅ Read API documentation
3. ✅ Review database schema
4. ✅ Test all features
5. ✅ Configure production settings
6. ✅ Set up monitoring
7. ✅ Plan backup strategy
8. ✅ Deploy to production

## 📞 Support

Need help?

1. Check [DOCKER_CHEATSHEET.md](DOCKER_CHEATSHEET.md) for quick commands
2. Review [DOCKER_GUIDE.md](DOCKER_GUIDE.md) troubleshooting section
3. Check service logs: `docker-compose logs [service]`
4. Verify `.env` configuration
5. Search GitHub issues

## 📄 License

This Docker setup is part of the Bus Ticket Booking Application project.

---

<div align="center">

**Made with ❤️ and 🐳**

[⬆ Back to Top](#-docker-setup---bus-ticket-booking-application)

</div>
