#!/bin/bash
# Quick Docker Setup Script for Linux/Mac
# This script helps you get started with Docker quickly

set -e

echo "===================================="
echo "Bus Ticket Booking - Docker Setup"
echo "===================================="
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "ERROR: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

echo "[1/5] Docker is running..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "[2/5] Creating .env file from template..."
    cp .env.docker .env
    echo ""
    echo "IMPORTANT: Please edit .env file and update these values:"
    echo "  - PG_PASSWORD"
    echo "  - JWT_SECRET"
    echo "  - SESSION_SECRET"
    echo "  - EMAIL_USER and EMAIL_PASSWORD"
    echo ""
    read -p "Press Enter after updating .env file..."
else
    echo "[2/5] .env file already exists"
fi
echo ""

echo "[3/5] Building Docker containers (this may take a few minutes)..."
docker-compose build
echo ""

echo "[4/5] Starting services..."
docker-compose up -d
echo ""

echo "[5/5] Waiting for services to be ready..."
sleep 10

echo ""
echo "===================================="
echo "Setup Complete!"
echo "===================================="
echo ""
echo "Your application is running:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:4000"
echo "  API Docs: http://localhost:4000/api-docs"
echo ""
echo "Next steps:"
echo "  1. Seed the database: docker-compose exec backend npm run seed"
echo "  2. View logs:         docker-compose logs -f"
echo "  3. Stop services:     docker-compose down"
echo ""
echo "For more commands, see DOCKER_GUIDE.md"
echo ""
