# PowerShell Helper Functions for Docker Management
# Usage: . .\docker-helpers.ps1  (dot-source to load functions)

function Start-BusBooking {
    <#
    .SYNOPSIS
        Start all Bus Booking services
    #>
    Write-Host "Starting Bus Booking services..." -ForegroundColor Green
    docker-compose up -d
    Write-Host "`nServices started!" -ForegroundColor Green
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Backend:  http://localhost:4000" -ForegroundColor Cyan
    Write-Host "API Docs: http://localhost:4000/api-docs" -ForegroundColor Cyan
}

function Stop-BusBooking {
    <#
    .SYNOPSIS
        Stop all Bus Booking services
    #>
    Write-Host "Stopping Bus Booking services..." -ForegroundColor Yellow
    docker-compose down
    Write-Host "Services stopped!" -ForegroundColor Green
}

function Restart-BusBooking {
    <#
    .SYNOPSIS
        Restart all Bus Booking services
    #>
    Write-Host "Restarting Bus Booking services..." -ForegroundColor Yellow
    docker-compose restart
    Write-Host "Services restarted!" -ForegroundColor Green
}

function Show-BusBookingLogs {
    <#
    .SYNOPSIS
        Show logs from all services
    .PARAMETER Follow
        Follow log output
    .PARAMETER Service
        Show logs for specific service (backend, frontend, postgres)
    #>
    param(
        [switch]$Follow,
        [string]$Service = ""
    )
    
    if ($Follow) {
        if ($Service) {
            docker-compose logs -f $Service
        } else {
            docker-compose logs -f
        }
    } else {
        if ($Service) {
            docker-compose logs $Service
        } else {
            docker-compose logs
        }
    }
}

function Invoke-DatabaseSeed {
    <#
    .SYNOPSIS
        Seed the database with sample data
    #>
    Write-Host "Seeding database..." -ForegroundColor Green
    docker-compose exec backend npm run seed
    Write-Host "Database seeded!" -ForegroundColor Green
}

function Invoke-DatabaseSync {
    <#
    .SYNOPSIS
        Sync database schema
    #>
    Write-Host "Syncing database schema..." -ForegroundColor Green
    docker-compose exec backend npm run sync-db
    Write-Host "Database synced!" -ForegroundColor Green
}

function Enter-BackendShell {
    <#
    .SYNOPSIS
        Access backend container shell
    #>
    docker-compose exec backend sh
}

function Enter-DatabaseShell {
    <#
    .SYNOPSIS
        Access PostgreSQL CLI
    #>
    docker-compose exec postgres psql -U postgres -d bus_booking_db
}

function Backup-Database {
    <#
    .SYNOPSIS
        Create database backup
    #>
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $filename = "backup_$timestamp.sql"
    Write-Host "Creating database backup: $filename" -ForegroundColor Green
    docker-compose exec -T postgres pg_dump -U postgres bus_booking_db > $filename
    Write-Host "Backup created successfully!" -ForegroundColor Green
}

function Remove-BusBooking {
    <#
    .SYNOPSIS
        Remove all containers, networks, and volumes (WARNING: Deletes all data)
    #>
    $confirmation = Read-Host "This will delete ALL data. Are you sure? (yes/no)"
    if ($confirmation -eq "yes") {
        Write-Host "Removing all containers, networks, and volumes..." -ForegroundColor Red
        docker-compose down -v
        Write-Host "Cleanup complete!" -ForegroundColor Green
    } else {
        Write-Host "Cancelled." -ForegroundColor Yellow
    }
}

function Show-BusBookingStatus {
    <#
    .SYNOPSIS
        Show status of all services
    #>
    docker-compose ps
}

function Rebuild-BusBooking {
    <#
    .SYNOPSIS
        Rebuild all containers
    #>
    Write-Host "Rebuilding containers..." -ForegroundColor Yellow
    docker-compose up -d --build
    Write-Host "Rebuild complete!" -ForegroundColor Green
}

function Test-Backend {
    <#
    .SYNOPSIS
        Run backend tests
    #>
    Write-Host "Running backend tests..." -ForegroundColor Green
    docker-compose exec backend npm test
}

# Display available commands
Write-Host "`nBus Booking Docker Helper Functions Loaded!" -ForegroundColor Green
Write-Host "Available commands:" -ForegroundColor Cyan
Write-Host "  Start-BusBooking       - Start all services"
Write-Host "  Stop-BusBooking        - Stop all services"
Write-Host "  Restart-BusBooking     - Restart all services"
Write-Host "  Show-BusBookingLogs    - Show logs (use -Follow for live logs)"
Write-Host "  Show-BusBookingStatus  - Show service status"
Write-Host "  Invoke-DatabaseSeed    - Seed database with sample data"
Write-Host "  Invoke-DatabaseSync    - Sync database schema"
Write-Host "  Enter-BackendShell     - Access backend container shell"
Write-Host "  Enter-DatabaseShell    - Access PostgreSQL CLI"
Write-Host "  Backup-Database        - Create database backup"
Write-Host "  Rebuild-BusBooking     - Rebuild all containers"
Write-Host "  Test-Backend           - Run backend tests"
Write-Host "  Remove-BusBooking      - Remove everything (deletes data!)"
Write-Host "`nExample: Start-BusBooking" -ForegroundColor Yellow
Write-Host ""
