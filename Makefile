# Makefile for Bus Ticket Booking Application
# Easy commands for Docker management

.PHONY: help build up down restart logs clean seed test

# Default target
help:
	@echo "Bus Ticket Booking Application - Docker Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  help          Show this help message"
	@echo "  setup         Initial setup (copy env and build)"
	@echo "  build         Build all Docker containers"
	@echo "  up            Start all services"
	@echo "  down          Stop all services"
	@echo "  restart       Restart all services"
	@echo "  logs          View logs from all services"
	@echo "  logs-f        Follow logs in real-time"
	@echo "  clean         Stop and remove all containers, networks, and volumes"
	@echo "  seed          Seed database with sample data"
	@echo "  test          Run backend tests"
	@echo "  shell-backend Access backend container shell"
	@echo "  shell-db      Access PostgreSQL CLI"
	@echo "  backup-db     Backup database"
	@echo "  prod          Start in production mode"

# Initial setup
setup:
	@echo "Setting up environment..."
	@if not exist .env (copy .env.docker .env) else (echo .env already exists)
	@echo "Building containers..."
	docker-compose build
	@echo "Setup complete! Edit .env file with your configuration, then run 'make up'"

# Build containers
build:
	@echo "Building Docker containers..."
	docker-compose build

# Start services
up:
	@echo "Starting services..."
	docker-compose up -d
	@echo "Services started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:4000"
	@echo "API Docs: http://localhost:4000/api-docs"

# Stop services
down:
	@echo "Stopping services..."
	docker-compose down

# Restart services
restart:
	@echo "Restarting services..."
	docker-compose restart

# View logs
logs:
	docker-compose logs

# Follow logs
logs-f:
	docker-compose logs -f

# Clean everything
clean:
	@echo "Cleaning up..."
	docker-compose down -v
	@echo "Cleanup complete!"

# Seed database
seed:
	@echo "Seeding database..."
	docker-compose exec backend npm run seed

# Run tests
test:
	@echo "Running tests..."
	docker-compose exec backend npm test

# Backend shell
shell-backend:
	docker-compose exec backend sh

# Database CLI
shell-db:
	docker-compose exec postgres psql -U postgres -d bus_booking_db

# Backup database
backup-db:
	@echo "Creating database backup..."
	docker-compose exec postgres pg_dump -U postgres bus_booking_db > backup_$(shell powershell -Command "Get-Date -Format 'yyyyMMdd_HHmmss'").sql
	@echo "Backup complete!"

# Production mode
prod:
	@echo "Starting in production mode..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
	@echo "Production services started!"
