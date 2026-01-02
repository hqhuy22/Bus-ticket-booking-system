# 🚀 Production Deployment Guide

Complete guide for deploying the Bus Ticket Booking System to production.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Server Requirements](#server-requirements)
- [Deployment Methods](#deployment-methods)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [Process Management](#process-management)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup Strategy](#backup-strategy)
- [Security Hardening](#security-hardening)
- [Performance Optimization](#performance-optimization)

## Pre-Deployment Checklist

### Code Review
- [ ] All features tested in staging
- [ ] Code reviewed and approved
- [ ] Security vulnerabilities checked
- [ ] Performance benchmarks met
- [ ] Test coverage ≥ 70%

### Configuration
- [ ] Environment variables set
- [ ] Database migrations ready
- [ ] Seed data prepared (if needed)
- [ ] Email service configured
- [ ] Payment gateway (production keys)
- [ ] OAuth credentials (production)
- [ ] Domain name configured
- [ ] SSL certificates obtained

### Documentation
- [ ] API documentation updated
- [ ] Deployment procedures documented
- [ ] Rollback plan prepared
- [ ] Team notified of deployment

## Server Requirements

### Minimum Production Specifications

**Application Server:**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 50 GB SSD
- OS: Ubuntu 20.04 LTS or higher

**Database Server:**
- CPU: 2 cores
- RAM: 8 GB
- Storage: 100 GB SSD
- OS: Ubuntu 20.04 LTS or higher

**Recommended for High Traffic:**
- Load Balancer: 2 cores, 2 GB RAM
- App Server (x2): 4 cores, 8 GB RAM each
- Database: 4 cores, 16 GB RAM
- Redis: 2 cores, 4 GB RAM
- Storage: 200 GB SSD (with backups)

### Software Requirements
- Node.js 18.x LTS
- PostgreSQL 15.x
- Redis 7.x
- Nginx 1.18+
- PM2 for process management
- Certbot for SSL

## Deployment Methods

### Method 1: Traditional VPS Deployment

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2
```

#### 2. Application Deployment

```bash
# Create application user
sudo useradd -m -s /bin/bash busapp
sudo usermod -aG sudo busapp

# Switch to app user
sudo su - busapp

# Clone repository
cd /home/busapp
git clone https://github.com/your-org/bus-ticket-booking.git
cd bus-ticket-booking

# Install dependencies
npm install
cd bus-booking-server && npm install
cd ../bus-booking-client && npm install
cd ..

# Build frontend
cd bus-booking-client
npm run build
cd ..

# Copy .env file
cp bus-booking-server/.env.example bus-booking-server/.env
# Edit .env with production values
nano bus-booking-server/.env
```

#### 3. Database Setup

```bash
# Create database and user
sudo -u postgres psql

# In PostgreSQL:
CREATE DATABASE bus_booking_prod;
CREATE USER bus_booking_user WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE bus_booking_prod TO bus_booking_user;
\c bus_booking_prod
GRANT ALL ON SCHEMA public TO bus_booking_user;
\q

# Run migrations
cd /home/busapp/bus-ticket-booking/bus-booking-server
npm run sync-db

# Seed admin user
npm run seed-admin
```

#### 4. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'bus-booking-api',
    script: './bus-booking-server/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Start application:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Method 2: Docker Deployment

#### Docker Compose Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: bus-booking-db
    environment:
      POSTGRES_DB: bus_booking
      POSTGRES_USER: bus_booking_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: always
    networks:
      - bus-booking-network

  redis:
    image: redis:7-alpine
    container_name: bus-booking-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: always
    networks:
      - bus-booking-network

  backend:
    build:
      context: ./bus-booking-server
      dockerfile: Dockerfile
    container_name: bus-booking-api
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://bus_booking_user:${DB_PASSWORD}@postgres:5432/bus_booking
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
    depends_on:
      - postgres
      - redis
    restart: always
    networks:
      - bus-booking-network
    ports:
      - "4000:4000"

  frontend:
    build:
      context: ./bus-booking-client
      dockerfile: Dockerfile
    container_name: bus-booking-web
    restart: always
    networks:
      - bus-booking-network
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro

volumes:
  postgres_data:
  redis_data:

networks:
  bus-booking-network:
    driver: bridge
```

#### Backend Dockerfile

Create `bus-booking-server/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 4000

# Start application
CMD ["node", "index.js"]
```

#### Frontend Dockerfile

Create `bus-booking-client/Dockerfile`:

```dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

Deploy with Docker:

```bash
# Set environment variables
export DB_PASSWORD="secure_db_password"
export REDIS_PASSWORD="secure_redis_password"

# Build and start
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

### Method 3: Cloud Platform Deployment

#### Heroku Deployment

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Create app
heroku create bus-booking-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis
heroku addons:create heroku-redis:premium-0

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
# ... set all other env vars

# Deploy
git push heroku main

# Run migrations
heroku run npm run sync-db

# View logs
heroku logs --tail
```

#### AWS Deployment (Elastic Beanstalk)

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js bus-booking-app

# Create environment
eb create bus-booking-prod

# Deploy
eb deploy

# Configure database
# Use AWS RDS for PostgreSQL
# Use AWS ElastiCache for Redis

# Set environment variables
eb setenv NODE_ENV=production JWT_SECRET=xxx ...

# Open app
eb open
```

## Environment Configuration

### Production .env Template

```env
# ===================================
# PRODUCTION ENVIRONMENT VARIABLES
# ===================================

# Application
NODE_ENV=production
PORT=4000
CLIENT_URL=https://www.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@db-host:5432/bus_booking
PG_USER=bus_booking_user
PG_PASSWORD=secure_password_here
PG_HOST=db.yourdomain.com
PG_PORT=5432
PG_DATABASE=bus_booking
SQL_LOGGING=false

# Redis
REDIS_HOST=redis.yourdomain.com
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password

# Security
JWT_SECRET=generate-64-character-random-string-here
SESSION_SECRET=generate-64-character-random-string-here
JWT_EXPIRES_IN=7d

# Email (Production)
SENDGRID_API_KEY=SG.your-production-key
FROM_EMAIL=noreply@yourdomain.com

# OAuth (Production)
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback

# AI Chatbot
GEMINI_API_KEY=your-production-api-key

# Payment Gateway (Production)
PAYOS_CLIENT_ID=your-production-client-id
PAYOS_API_KEY=your-production-api-key
PAYOS_CHECKSUM_KEY=your-production-checksum-key
PAYMENT_RETURN_URL=https://www.yourdomain.com/payment/success
PAYMENT_CANCEL_URL=https://www.yourdomain.com/payment/failed

# Logging
LOG_LEVEL=info
QUIET_LOGS=false

# Monitoring
ENABLE_MONITORING=true
SENTRY_DSN=your-sentry-dsn  # Optional
```

## SSL/TLS Configuration

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (already setup)
sudo certbot renew --dry-run

# Certificate locations:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

## Reverse Proxy Setup

### Nginx Configuration

Create `/etc/nginx/sites-available/bus-booking`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=100r/s;

# Upstream backend
upstream backend {
    least_conn;
    server 127.0.0.1:4000;
    # Add more servers for load balancing
    # server 127.0.0.1:4001;
    # server 127.0.0.1:4002;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Frontend (static files)
    location / {
        root /home/busapp/bus-ticket-booking/bus-booking-client/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # API endpoints
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploads
    location /uploads/ {
        alias /home/busapp/bus-ticket-booking/bus-booking-server/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Static assets with cache
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/bus-booking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Process Management

### PM2 Commands

```bash
# Start application
pm2 start ecosystem.config.js

# View status
pm2 status

# View logs
pm2 logs bus-booking-api

# Monitor
pm2 monit

# Restart
pm2 restart bus-booking-api

# Reload (zero-downtime)
pm2 reload bus-booking-api

# Stop
pm2 stop bus-booking-api

# Delete
pm2 delete bus-booking-api

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

### PM2 Ecosystem Advanced

```javascript
module.exports = {
  apps: [{
    name: 'bus-booking-api',
    script: './bus-booking-server/index.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    merge_logs: true,
    // Auto restart at 3 AM daily
    cron_restart: '0 3 * * *'
  }]
};
```

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd bus-booking-server
          npm ci
      
      - name: Run tests
        run: |
          cd bus-booking-server
          npm test
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/busapp/bus-ticket-booking
            git pull origin main
            cd bus-booking-server && npm install --production
            cd ../bus-booking-client && npm install && npm run build
            pm2 reload ecosystem.config.js
```

## Monitoring and Logging

### Application Monitoring

Install monitoring tools:

```bash
# PM2 Plus (optional, paid)
pm2 install pm2-server-monit

# Or use free alternatives
```

### Log Management

```bash
# View PM2 logs
pm2 logs

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View system logs
sudo journalctl -u nginx -f
```

### Setup Log Rotation

Create `/etc/logrotate.d/bus-booking`:

```
/home/busapp/bus-ticket-booking/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 busapp busapp
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Backup Strategy

### Database Backup Script

Create `/home/busapp/scripts/backup-db.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/home/busapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="bus_booking_$DATE.dump"

# Create backup
pg_dump -U bus_booking_user -d bus_booking -F c -f "$BACKUP_DIR/$FILENAME"

# Compress
gzip "$BACKUP_DIR/$FILENAME"

# Delete backups older than 30 days
find "$BACKUP_DIR" -name "*.dump.gz" -mtime +30 -delete

echo "Backup completed: $FILENAME.gz"
```

### Automated Backups

```bash
# Make executable
chmod +x /home/busapp/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add:
0 2 * * * /home/busapp/scripts/backup-db.sh >> /home/busapp/logs/backup.log 2>&1
```

### Upload Backups to Cloud

```bash
# Install AWS CLI
sudo apt install awscli

# Configure
aws configure

# Backup script with S3 upload
#!/bin/bash
BACKUP_FILE="backup_$(date +%Y%m%d).dump"
pg_dump -U bus_booking_user -d bus_booking -F c -f "$BACKUP_FILE"
gzip "$BACKUP_FILE"
aws s3 cp "$BACKUP_FILE.gz" s3://your-bucket/backups/
rm "$BACKUP_FILE.gz"
```

## Security Hardening

### Firewall Configuration

```bash
# Install UFW
sudo apt install ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Fail2Ban (Prevent brute force)

```bash
# Install
sudo apt install fail2ban

# Configure
sudo nano /etc/fail2ban/jail.local

# Add:
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https"]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10

# Restart
sudo systemctl restart fail2ban
```

### Regular Security Updates

```bash
# Enable automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Performance Optimization

### Database Optimization

```sql
-- Create indexes (if not already)
CREATE INDEX idx_schedules_search ON bus_schedules(departure_city, arrival_city, departure_date);
CREATE INDEX idx_bookings_customer ON bus_bookings(customerId, status);

-- Analyze tables
ANALYZE bus_schedules;
ANALYZE bus_bookings;

-- Vacuum
VACUUM ANALYZE;
```

### Redis Configuration

Edit `/etc/redis/redis.conf`:

```conf
# Memory management
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# AOF
appendonly yes
appendfsync everysec
```

### Node.js Optimization

```javascript
// In production
process.env.NODE_ENV = 'production';
process.env.UV_THREADPOOL_SIZE = 128;  // Increase thread pool
```

## Post-Deployment

### Health Checks

```bash
# Check application
curl https://yourdomain.com/api/
curl https://yourdomain.com/api/cache/health

# Check SSL
curl -I https://yourdomain.com

# Check database connection
sudo -u busapp psql -d bus_booking -c "SELECT 1"

# Check Redis
redis-cli -a your_password ping
```

### Performance Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API
ab -n 1000 -c 10 https://yourdomain.com/api/bus-schedules?departure_city=HCM&arrival_city=Hanoi&departure_date=2024-12-25
```

---

## Troubleshooting

### Common Issues

**Application won't start:**
```bash
pm2 logs --err
pm2 restart all
```

**Database connection issues:**
```bash
sudo systemctl status postgresql
sudo -u postgres psql
```

**Nginx errors:**
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

---

**Congratulations!** Your application is now deployed to production! 🎉

**Last Updated:** January 2, 2026
