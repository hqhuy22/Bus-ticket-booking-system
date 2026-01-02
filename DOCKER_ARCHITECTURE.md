# 🏗️ Docker Architecture - Bus Ticket Booking Application

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Docker Compose Network                              │
│                        (bus-booking-network)                                 │
│                                                                              │
│  ┌────────────────┐      ┌────────────────┐      ┌────────────────┐       │
│  │   Frontend     │      │    Backend     │      │   PostgreSQL   │       │
│  │   Container    │─────▶│   Container    │─────▶│   Container    │       │
│  │                │      │                │      │                │       │
│  │  React + Vite  │      │  Node.js +     │      │   Database     │       │
│  │  (Dev: 5173)   │      │  Express       │      │   (Port 5432)  │       │
│  │  Nginx (Prod)  │      │  (Port 4000)   │      │                │       │
│  │  Port: 3000/80 │      │                │      │                │       │
│  └────────────────┘      └────────────────┘      └────────────────┘       │
│         │                        │                        │                 │
│         │                        │                        │                 │
│    [Volume Mount]          [Volume Mount]           [Volume Mount]          │
│         ↓                        ↓                        ↓                 │
│  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐         │
│  │ Source Code  │        │   Uploads    │        │  DB Data     │         │
│  │ (Dev only)   │        │   Folder     │        │ (postgres_   │         │
│  │              │        │              │        │  data)       │         │
│  └──────────────┘        └──────────────┘        └──────────────┘         │
│                                                                              │
│  ┌────────────────┐                                                         │
│  │    PgAdmin     │                                                         │
│  │   (Optional)   │───────────────────────────────────┘                    │
│  │                │                                                         │
│  │  Port: 5050    │                                                         │
│  └────────────────┘                                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
           │                         │                        │
           ↓                         ↓                        ↓
    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
    │   Browser   │         │  API Calls  │         │  Database   │
    │ localhost:  │         │ localhost:  │         │  Queries    │
    │    3000     │         │    4000     │         │             │
    └─────────────┘         └─────────────┘         └─────────────┘
```

## 📊 Container Details

### Frontend Container
- **Base Image**: `node:20-alpine` (dev), `nginx:alpine` (prod)
- **Port Mapping**: 3000:5173 (dev), 80:80 (prod)
- **Build**: Multi-stage Dockerfile
  - Stage 1: Build React app with Vite
  - Stage 2: Serve with Nginx (production)
- **Volumes**: 
  - Source code (development only)
  - Node modules (excluded)
- **Environment Variables**:
  - `VITE_API_BASE_URL`: Backend API URL

### Backend Container
- **Base Image**: `node:20-alpine`
- **Port Mapping**: 4000:4000
- **Build**: Multi-stage Dockerfile
  - Development: Hot-reload with nodemon
  - Production: Optimized production build
- **Volumes**:
  - Source code (development only)
  - Uploads folder (persistent)
  - Node modules (excluded)
- **Environment Variables**:
  - Database connection
  - JWT secrets
  - Email configuration
  - OAuth credentials
  - AI API keys
- **Health Check**: HTTP GET on port 4000

### PostgreSQL Container
- **Base Image**: `postgres:16-alpine`
- **Port Mapping**: 5432:5432
- **Volumes**:
  - Database data (persistent)
  - Backups folder
  - Init scripts (optional)
- **Environment Variables**:
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DB`
- **Health Check**: `pg_isready` command

### PgAdmin Container (Optional)
- **Base Image**: `dpage/pgadmin4:latest`
- **Port Mapping**: 5050:80
- **Profile**: `tools` (optional service)
- **Volumes**: PgAdmin configuration data

## 🔄 Data Flow

### Development Mode
```
User Browser (localhost:3000)
    ↓
Frontend Container (Vite Dev Server)
    ↓ API Request
Backend Container (Express + Nodemon)
    ↓ SQL Query
PostgreSQL Container
    ↓ Data
Backend Container
    ↓ JSON Response
Frontend Container
    ↓
User Browser
```

### Production Mode
```
User Browser (domain.com)
    ↓
Nginx Container (Static React Build)
    ↓ API Request
Backend Container (Express - Multiple Replicas)
    ↓ SQL Query
PostgreSQL Container
    ↓ Data
Backend Container
    ↓ JSON Response
Nginx Container
    ↓
User Browser
```

## 🌐 Network Configuration

### Docker Network
- **Type**: Bridge network
- **Name**: `bus-booking-network`
- **DNS Resolution**: Container names automatically resolve
  - `postgres` → PostgreSQL container
  - `backend` → Backend container
  - `frontend` → Frontend container

### Internal Communication
```
Frontend → Backend:    http://backend:4000
Backend → Database:    postgres://postgres:5432
PgAdmin → Database:    postgres:5432
```

### External Access
```
Frontend:      http://localhost:3000
Backend API:   http://localhost:4000
API Docs:      http://localhost:4000/api-docs
PgAdmin:       http://localhost:5050
PostgreSQL:    localhost:5432 (if port mapped)
```

## 💾 Volume Strategy

### Named Volumes (Persistent Data)
```yaml
postgres_data:      # Database files - NEVER delete in production
  - Location: /var/lib/postgresql/data
  - Managed by Docker
  - Survives container recreation

uploads_data:       # User uploaded files
  - Location: /app/uploads
  - Managed by Docker
  - Survives container recreation

pgadmin_data:       # PgAdmin settings
  - Location: /var/lib/pgadmin
  - Managed by Docker
```

### Bind Mounts (Development)
```yaml
./bus-booking-client:/app       # Frontend source (dev only)
./bus-booking-server:/app       # Backend source (dev only)
./database/backups:/backups     # Database backups
```

## 🔐 Security Considerations

### Network Isolation
- All containers in private network
- Only necessary ports exposed to host
- Database not exposed to public (only via backend)

### Environment Variables
- Secrets stored in `.env` file (not committed)
- Different .env for dev/staging/prod
- Use Docker secrets in production

### Image Security
- Alpine Linux base (minimal attack surface)
- Multi-stage builds (smaller images)
- Non-root users in containers
- Regular image updates

## 📈 Scaling Strategy

### Horizontal Scaling (Multiple Instances)
```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Load balancing handled by Docker
# Each instance connects to same database
```

### Vertical Scaling (Resource Limits)
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 1G
```

## 🚀 Deployment Modes

### Development
- Source code mounted as volumes
- Hot-reload enabled
- Verbose logging
- Single instance per service
- No resource limits

### Production
- No source code mounts
- Optimized builds
- Multiple backend replicas
- Resource limits configured
- Health checks enabled
- Nginx for frontend

## 🔄 CI/CD Pipeline

```
┌─────────────┐
│ Git Push    │
└──────┬──────┘
       ↓
┌─────────────┐
│ GitHub      │
│ Actions     │
└──────┬──────┘
       ↓
┌─────────────┐
│ Build       │
│ Docker      │
│ Images      │
└──────┬──────┘
       ↓
┌─────────────┐
│ Run Tests   │
│ in          │
│ Containers  │
└──────┬──────┘
       ↓
┌─────────────┐
│ Push to     │
│ Registry    │
│ (Docker Hub)│
└──────┬──────┘
       ↓
┌─────────────┐
│ Deploy to   │
│ Server      │
│ (docker-    │
│  compose)   │
└─────────────┘
```

## 🎯 Best Practices Implemented

✅ Multi-stage builds for optimization
✅ Layer caching for faster builds
✅ Health checks for reliability
✅ Named volumes for data persistence
✅ Environment-based configuration
✅ Network isolation
✅ Resource limits (production)
✅ Non-root users
✅ Minimal base images (Alpine)
✅ .dockerignore for efficient builds
✅ Comprehensive logging
✅ Development/Production parity

## 📝 Configuration Files

```
docker-compose.yml          # Main compose file (dev + prod base)
docker-compose.prod.yml     # Production overrides
.env.docker                 # Environment template
.dockerignore               # Build optimization
bus-booking-server/
  ├── Dockerfile            # Backend image definition
  └── .dockerignore         # Backend build optimization
bus-booking-client/
  ├── Dockerfile            # Frontend image definition
  ├── .dockerignore         # Frontend build optimization
  └── nginx.conf            # Production web server config
```

## 🆘 Troubleshooting Reference

| Issue | Check | Solution |
|-------|-------|----------|
| Containers won't start | `docker-compose logs` | Check .env configuration |
| Database connection fails | `docker-compose ps postgres` | Ensure postgres is healthy |
| Port conflict | `netstat -ano \| findstr :3000` | Change port or stop process |
| Out of disk space | `docker system df` | Run `docker system prune` |
| Build fails | `.dockerignore` | Ensure node_modules excluded |
| Frontend can't reach backend | Network logs | Check VITE_API_BASE_URL |

---

**For detailed commands and operations, see [DOCKER_CHEATSHEET.md](./DOCKER_CHEATSHEET.md)**
