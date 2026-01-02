@echo off
REM Quick Docker Setup Script for Windows
REM This script helps you get started with Docker quickly

echo ====================================
echo Bus Ticket Booking - Docker Setup
echo ====================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/5] Docker is running...
echo.

REM Check if .env exists
if not exist .env (
    echo [2/5] Creating .env file from template...
    copy .env.docker .env
    echo.
    echo IMPORTANT: Please edit .env file and update these values:
    echo   - PG_PASSWORD
    echo   - JWT_SECRET
    echo   - SESSION_SECRET
    echo   - EMAIL_USER and EMAIL_PASSWORD
    echo.
    echo Press any key after updating .env file...
    pause >nul
) else (
    echo [2/5] .env file already exists
)
echo.

echo [3/5] Building Docker containers (this may take a few minutes)...
docker-compose build
if errorlevel 1 (
    echo ERROR: Failed to build containers
    pause
    exit /b 1
)
echo.

echo [4/5] Starting services...
docker-compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start services
    pause
    exit /b 1
)
echo.

echo [5/5] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo Your application is running:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:4000
echo   API Docs: http://localhost:4000/api-docs
echo.
echo Next steps:
echo   1. Seed the database: docker-compose exec backend npm run seed
echo   2. View logs:         docker-compose logs -f
echo   3. Stop services:     docker-compose down
echo.
echo For more commands, see DOCKER_GUIDE.md
echo.
pause
