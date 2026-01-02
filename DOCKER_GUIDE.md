# 🐳 Docker Setup Guide - Bus Ticket Booking Application

This guide explains how to run the Bus Ticket Booking application using Docker containers.

## 📋 Prerequisites

- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)
- At least 4GB of RAM available for Docker
- Ports 3000, 4000, and 5432 available on your machine

## 🏗️ Architecture

The application consists of 3 main services:

1. **PostgreSQL Database** (Port 5432) - Stores all application data
2. **Backend API** (Port 4000) - Node.js/Express server
3. **Frontend** (Port 3000/5173) - React/Vite application
4. **PgAdmin** (Port 5050) - Optional database management tool

## 🚀 Quick Start

### 1. Environment Setup

Copy the Docker environment template:

```bash
# Windows PowerShell
Copy-Item .env.docker .env

# Linux/Mac
cp .env.docker .env
```

Edit `.env` file and update the following **required** values:

```env
# Database password (change this!)
PG_PASSWORD=your_secure_password_here

# JWT & Session secrets (use long random strings)
JWT_SECRET=your-jwt-secret-minimum-32-characters-long-random-string
SESSION_SECRET=your-session-secret-minimum-32-characters-long-random-string

# Email configuration (for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# Google OAuth (optional, for social login)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# AI Chatbot (optional, get free key from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your-gemini-api-key-here
```

### 2. Start All Services (Development Mode)

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

This will:
- Build Docker images for frontend and backend
- Pull PostgreSQL image
- Create network and volumes
- Start all containers
- Initialize database with schema

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Documentation**: http://localhost:4000/api-docs
- **PgAdmin** (optional): http://localhost:5050

### 4. Initial Database Setup

The database will be automatically created, but you need to seed it with initial data:

```bash
# Seed the database with sample data
docker-compose exec backend npm run seed

# Or sync database schema
docker-compose exec backend npm run sync-db
```

## 🛠️ Docker Commands

### Basic Operations

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v

# Rebuild containers
docker-compose up --build

# View logs
docker-compose logs

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f
```

### Service Management

```bash
# Restart specific service
docker-compose restart backend

# Stop specific service
docker-compose stop frontend

# Start specific service
docker-compose start frontend

# Execute command in running container
docker-compose exec backend npm run seed
docker-compose exec backend npm test
```

### Database Operations

```bash
# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d bus_booking_db

# Create database backup
docker-compose exec postgres pg_dump -U postgres bus_booking_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres bus_booking_db < backup.sql

# View database logs
docker-compose logs postgres
```

### Debugging

```bash
# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh

# View container resource usage
docker stats

# Inspect container
docker-compose exec backend node -v
docker-compose exec backend npm list

# View environment variables
docker-compose exec backend env
```

## 🏭 Production Deployment

### 1. Update Environment for Production

Edit `.env`:

```env
NODE_ENV=production
PG_PASSWORD=very-strong-password-here
JWT_SECRET=long-random-string-at-least-64-characters
SESSION_SECRET=another-long-random-string-at-least-64-characters
CLIENT_URL=https://yourdomain.com
SERVER_URL=https://api.yourdomain.com
```

### 2. Start Production Services

```bash
# Use production compose file
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Production mode differences:
- ✅ Optimized builds with multi-stage Docker
- ✅ Frontend served by Nginx
- ✅ No source code mounted (volumes)
- ✅ Health checks enabled
- ✅ Resource limits configured
- ✅ Multiple backend replicas for load balancing

### 3. SSL/HTTPS Setup (Nginx)

For production with SSL certificates:

1. Place SSL certificates in `./certs` directory
2. Update `bus-booking-client/nginx.conf` to include SSL configuration
3. Uncomment SSL volume mount in `docker-compose.prod.yml`

## 🔧 Advanced Configuration

### Custom Ports

Edit `.env` to change ports:

```env
CLIENT_PORT=8080        # Frontend port
PORT=5000              # Backend port
PG_PORT=5433           # PostgreSQL port
PGADMIN_PORT=5051      # PgAdmin port
```

### Using PgAdmin (Database Management)

Start with PgAdmin:

```bash
docker-compose --profile tools up -d
```

Access PgAdmin at http://localhost:5050:
- Email: `admin@admin.com` (or value from .env)
- Password: `admin` (or value from .env)

Add server connection:
- Host: `postgres`
- Port: `5432`
- Username: `postgres` (or value from .env)
- Password: Your `PG_PASSWORD` from .env

### Scaling Services

```bash
# Run multiple backend instances
docker-compose up -d --scale backend=3

# View running instances
docker-compose ps
```

### Volume Management

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect bus-ticket-booking-app-main_postgres_data

# Backup volume
docker run --rm -v bus-ticket-booking-app-main_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore volume
docker run --rm -v bus-ticket-booking-app-main_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <process_id> /F

# Or change port in .env file
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify database credentials in .env
# Ensure PG_HOST=postgres (not localhost)
```

### Container Build Failures

```bash
# Clear Docker cache and rebuild
docker-compose down
docker system prune -a
docker-compose up --build
```

### Frontend Not Loading

```bash
# Check VITE_API_BASE_URL in .env
# Should be http://localhost:4000 for development

# Rebuild frontend
docker-compose up --build frontend
```

### Permission Issues (Linux/Mac)

```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./bus-booking-server/uploads
```

## 📊 Monitoring & Logs

### View All Logs

```bash
# All services
docker-compose logs -f

# Specific service with timestamp
docker-compose logs -f --timestamps backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Resource Monitoring

```bash
# Real-time stats
docker stats

# Disk usage
docker system df

# Clean up unused resources
docker system prune
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker images
        run: docker-compose build
      - name: Run tests
        run: docker-compose run backend npm test
```

## 📝 Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `PG_PASSWORD` | PostgreSQL password | `postgres` | **Yes** |
| `JWT_SECRET` | JWT signing secret | - | **Yes** |
| `SESSION_SECRET` | Session secret | - | **Yes** |
| `EMAIL_USER` | Email account | - | **Yes** |
| `EMAIL_PASSWORD` | Email password | - | **Yes** |
| `GEMINI_API_KEY` | AI chatbot key | - | No |
| `GOOGLE_CLIENT_ID` | OAuth client ID | - | No |

## 🎯 Best Practices

1. ✅ **Never commit `.env` file** - Contains sensitive data
2. ✅ **Use strong passwords** - Especially for production
3. ✅ **Regular backups** - Backup database volumes regularly
4. ✅ **Monitor logs** - Check for errors and warnings
5. ✅ **Update images** - Keep base images updated
6. ✅ **Resource limits** - Set appropriate limits in production
7. ✅ **Health checks** - Ensure services are healthy

## 🆘 Support

If you encounter issues:

1. Check logs: `docker-compose logs`
2. Verify `.env` configuration
3. Ensure ports are not in use
4. Check Docker Desktop is running
5. Review error messages in container logs

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Happy Dockerizing! 🐳**
