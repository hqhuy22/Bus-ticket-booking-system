# 🐳 Docker Quick Reference - Bus Ticket Booking App

Quick reference for common Docker commands and operations.

## 🚀 Essential Commands

### Start/Stop Services

```bash
# Start all services (detached mode)
docker-compose up -d

# Start with logs visible
docker-compose up

# Start and rebuild containers
docker-compose up --build

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ DELETES DATA)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Last 100 lines
docker-compose logs --tail=100 backend

# Logs with timestamps
docker-compose logs -f --timestamps
```

### Service Management

```bash
# List running containers
docker-compose ps

# Restart specific service
docker-compose restart backend

# Stop specific service
docker-compose stop frontend

# Start stopped service
docker-compose start frontend

# Remove specific service
docker-compose rm backend
```

## 🔧 Database Operations

### Database Management

```bash
# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d bus_booking_db

# Run SQL file
docker-compose exec -T postgres psql -U postgres -d bus_booking_db < script.sql

# Create backup
docker-compose exec postgres pg_dump -U postgres bus_booking_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres -d bus_booking_db < backup.sql

# Seed database
docker-compose exec backend npm run seed

# Sync database schema
docker-compose exec backend npm run sync-db
```

### Database Queries

```sql
-- Inside PostgreSQL CLI

-- List all tables
\dt

-- Describe table structure
\d customers
\d bookings

-- View table data
SELECT * FROM customers LIMIT 10;
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 20;

-- Exit PostgreSQL
\q
```

## 🛠️ Development Operations

### Backend Operations

```bash
# Access backend shell
docker-compose exec backend sh

# Run backend commands
docker-compose exec backend npm run dev
docker-compose exec backend npm test
docker-compose exec backend npm run lint

# View environment variables
docker-compose exec backend env

# Check Node.js version
docker-compose exec backend node -v

# View installed packages
docker-compose exec backend npm list
```

### Frontend Operations

```bash
# Access frontend shell
docker-compose exec frontend sh

# Run frontend commands (development mode)
docker-compose exec frontend npm run dev
docker-compose exec frontend npm run build
docker-compose exec frontend npm run lint

# Clear Vite cache
docker-compose exec frontend rm -rf node_modules/.vite
```

## 🏗️ Building & Rebuilding

### Build Commands

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build without cache
docker-compose build --no-cache

# Pull latest images
docker-compose pull
```

### Rebuild After Changes

```bash
# Rebuild and restart (recommended after code changes)
docker-compose up -d --build

# Force recreate containers
docker-compose up -d --force-recreate

# Rebuild specific service
docker-compose up -d --build backend
```

## 📊 Monitoring & Debugging

### Container Information

```bash
# View container stats (CPU, memory, etc.)
docker stats

# List all containers
docker ps -a

# Inspect container
docker inspect bus-booking-backend

# View container logs
docker logs bus-booking-backend

# View running processes in container
docker-compose exec backend ps aux
```

### Network Information

```bash
# List networks
docker network ls

# Inspect network
docker network inspect bus-ticket-booking-app-main_bus-booking-network

# Test connectivity between containers
docker-compose exec backend ping postgres
docker-compose exec frontend ping backend
```

### Volume Information

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect bus-ticket-booking-app-main_postgres_data

# Check volume size
docker system df

# Remove unused volumes
docker volume prune
```

## 🧹 Cleanup Operations

### Remove Resources

```bash
# Stop and remove containers
docker-compose down

# Remove containers and networks (keep volumes)
docker-compose down --remove-orphans

# Remove containers, networks, and volumes
docker-compose down -v

# Remove all unused containers, networks, images
docker system prune

# Remove all unused volumes
docker volume prune

# Remove all unused images
docker image prune -a

# Complete cleanup (⚠️ DELETES EVERYTHING)
docker system prune -a --volumes
```

## 🔄 Data Management

### Backup Data

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres bus_booking_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup volume (database data)
docker run --rm \
  -v bus-ticket-booking-app-main_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data

# Backup uploads folder
docker-compose exec backend tar czf /tmp/uploads.tar.gz /app/uploads
docker cp bus-booking-backend:/tmp/uploads.tar.gz ./uploads_backup.tar.gz
```

### Restore Data

```bash
# Restore database from SQL
docker-compose exec -T postgres psql -U postgres bus_booking_db < backup.sql

# Restore volume
docker run --rm \
  -v bus-ticket-booking-app-main_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_backup.tar.gz -C /

# Restore uploads folder
docker cp ./uploads_backup.tar.gz bus-booking-backend:/tmp/
docker-compose exec backend tar xzf /tmp/uploads.tar.gz -C /app/
```

## 🐛 Troubleshooting

### Common Issues

```bash
# Port already in use
# Solution 1: Change port in .env
CLIENT_PORT=8080

# Solution 2: Find and kill process
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Container won't start
# Check logs
docker-compose logs backend

# Remove and recreate
docker-compose down
docker-compose up -d --force-recreate

# Database connection issues
# Verify database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec backend node -e "const {Pool} = require('pg'); const pool = new Pool({connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/bus_booking_db'}); pool.query('SELECT NOW()', (err, res) => {console.log(err ? err : res.rows); pool.end();});"

# Permission issues (Linux/Mac)
sudo chown -R $USER:$USER ./bus-booking-server/uploads
sudo chown -R $USER:$USER ./database/backups

# Out of disk space
docker system df
docker system prune -a --volumes

# Reset everything (⚠️ NUCLEAR OPTION)
docker-compose down -v
docker system prune -a --volumes
docker-compose up -d --build
```

### Health Checks

```bash
# Check service health
docker-compose ps

# Check backend health
curl http://localhost:4000/

# Check frontend health
curl http://localhost:3000/

# Check database health
docker-compose exec postgres pg_isready -U postgres

# View detailed health status
docker inspect --format='{{json .State.Health}}' bus-booking-backend | jq
```

## 🎯 Production Operations

### Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Scale backend instances
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale backend=3

# View production logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### Update Production

```bash
# Pull latest code
git pull origin main

# Rebuild and restart (zero-downtime)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --no-deps backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build --no-deps frontend

# Verify deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

## 💡 Tips & Tricks

### Useful Aliases (Add to ~/.bashrc or ~/.zshrc)

```bash
# Docker Compose shortcuts
alias dc='docker-compose'
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dclogs='docker-compose logs -f'
alias dcps='docker-compose ps'
alias dcrestart='docker-compose restart'

# Bus Booking specific
alias bb-start='docker-compose up -d'
alias bb-stop='docker-compose down'
alias bb-logs='docker-compose logs -f'
alias bb-backend='docker-compose exec backend sh'
alias bb-db='docker-compose exec postgres psql -U postgres -d bus_booking_db'
alias bb-seed='docker-compose exec backend npm run seed'
```

### Environment Variables

```bash
# Override environment variables
docker-compose up -d -e NODE_ENV=production

# Use different .env file
docker-compose --env-file .env.staging up -d
```

### Copy Files

```bash
# Copy from container to host
docker cp bus-booking-backend:/app/uploads ./local-uploads

# Copy from host to container
docker cp ./local-file.txt bus-booking-backend:/app/

# Copy between containers
docker cp bus-booking-backend:/app/file.txt bus-booking-frontend:/app/
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Project Docker Guide](./DOCKER_GUIDE.md)

## 🆘 Getting Help

If you encounter issues:

1. Check service logs: `docker-compose logs [service]`
2. Verify .env configuration
3. Ensure required ports are available
4. Check Docker Desktop is running
5. Review error messages carefully
6. Try rebuilding: `docker-compose up --build`
7. Last resort: `docker-compose down -v && docker-compose up --build`

---

**Quick Start: Ready to go? Run `docker-compose up -d` and visit http://localhost:3000**
