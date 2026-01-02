# 💾 Database Backups

This folder contains backup and restore scripts for the Bus Ticket Booking database.

## 📋 Overview

Regular backups are essential for:
- **Data recovery** after hardware failure or corruption
- **Disaster recovery** planning
- **Testing migrations** and upgrades safely
- **Development/staging** environment setup
- **Compliance** requirements

## 🗂️ Backup Files Structure

```
backups/
├── backup.sh              # Automated backup script (Linux/macOS)
├── backup.ps1             # Automated backup script (Windows)
├── restore.sh             # Restore script (Linux/macOS)
├── restore.ps1            # Restore script (Windows)
├── daily/                 # Daily backups (kept for 7 days)
├── weekly/                # Weekly backups (kept for 4 weeks)
├── monthly/               # Monthly backups (kept for 12 months)
└── README.md              # This file
```

## 🚀 Quick Start

### Create a Backup

**Linux/macOS:**
```bash
cd database/backups
./backup.sh
```

**Windows PowerShell:**
```powershell
cd database\backups
.\backup.ps1
```

**Manual backup:**
```bash
# Full database backup
pg_dump -U bus_booking_user -d bus_booking -F c -f backup_$(date +%Y%m%d_%H%M%S).dump

# SQL format (human-readable)
pg_dump -U bus_booking_user -d bus_booking -f backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore from Backup

**Linux/macOS:**
```bash
cd database/backups
./restore.sh backup_20260102_120000.dump
```

**Windows PowerShell:**
```powershell
cd database\backups
.\restore.ps1 backup_20260102_120000.dump
```

**Manual restore:**
```bash
# From custom format (.dump)
pg_restore -U bus_booking_user -d bus_booking -c backup_20260102_120000.dump

# From SQL format (.sql)
psql -U bus_booking_user -d bus_booking < backup_20260102_120000.sql
```

## 📝 Backup Scripts

### backup.sh (Linux/macOS)

```bash
#!/bin/bash

# Database Backup Script
# Usage: ./backup.sh [daily|weekly|monthly]

# Configuration
DB_USER="bus_booking_user"
DB_NAME="bus_booking"
DB_HOST="localhost"
BACKUP_DIR="$(dirname "$0")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_TYPE=${1:-daily}

# Create backup directory
mkdir -p "$BACKUP_DIR/$BACKUP_TYPE"

# Backup filename
BACKUP_FILE="$BACKUP_DIR/$BACKUP_TYPE/backup_${TIMESTAMP}.dump"

# Create backup
echo "Creating backup: $BACKUP_FILE"
pg_dump -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -F c -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup successful: $BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    echo "✅ Compressed: ${BACKUP_FILE}.gz"
    
    # Cleanup old backups
    if [ "$BACKUP_TYPE" = "daily" ]; then
        # Keep last 7 daily backups
        find "$BACKUP_DIR/daily" -name "*.gz" -mtime +7 -delete
    elif [ "$BACKUP_TYPE" = "weekly" ]; then
        # Keep last 4 weekly backups
        find "$BACKUP_DIR/weekly" -name "*.gz" -mtime +28 -delete
    elif [ "$BACKUP_TYPE" = "monthly" ]; then
        # Keep last 12 monthly backups
        find "$BACKUP_DIR/monthly" -name "*.gz" -mtime +365 -delete
    fi
    
    echo "✅ Old backups cleaned up"
else
    echo "❌ Backup failed!"
    exit 1
fi
```

### backup.ps1 (Windows PowerShell)

```powershell
# Database Backup Script for Windows
# Usage: .\backup.ps1 [-Type daily|weekly|monthly]

param(
    [string]$Type = "daily"
)

# Configuration
$DB_USER = "bus_booking_user"
$DB_NAME = "bus_booking"
$DB_HOST = "localhost"
$BACKUP_DIR = $PSScriptRoot
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

# Create backup directory
$BackupPath = Join-Path $BACKUP_DIR $Type
New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null

# Backup filename
$BACKUP_FILE = Join-Path $BackupPath "backup_${TIMESTAMP}.dump"

# Create backup
Write-Host "Creating backup: $BACKUP_FILE"
& pg_dump -U $DB_USER -d $DB_NAME -h $DB_HOST -F c -f $BACKUP_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup successful: $BACKUP_FILE" -ForegroundColor Green
    
    # Compress backup (requires 7-Zip or similar)
    # Compress-Archive -Path $BACKUP_FILE -DestinationPath "${BACKUP_FILE}.zip"
    
    # Cleanup old backups
    $DaysToKeep = switch ($Type) {
        "daily"   { 7 }
        "weekly"  { 28 }
        "monthly" { 365 }
        default   { 7 }
    }
    
    $OldDate = (Get-Date).AddDays(-$DaysToKeep)
    Get-ChildItem -Path $BackupPath -Filter "*.dump" | 
        Where-Object { $_.LastWriteTime -lt $OldDate } | 
        Remove-Item -Force
    
    Write-Host "✅ Old backups cleaned up" -ForegroundColor Green
} else {
    Write-Host "❌ Backup failed!" -ForegroundColor Red
    exit 1
}
```

### restore.sh (Linux/macOS)

```bash
#!/bin/bash

# Database Restore Script
# Usage: ./restore.sh <backup_file>

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    exit 1
fi

BACKUP_FILE="$1"
DB_USER="bus_booking_user"
DB_NAME="bus_booking"
DB_HOST="localhost"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    # Try with .gz extension
    if [ -f "${BACKUP_FILE}.gz" ]; then
        echo "Decompressing ${BACKUP_FILE}.gz..."
        gunzip -k "${BACKUP_FILE}.gz"
    else
        echo "❌ Backup file not found: $BACKUP_FILE"
        exit 1
    fi
fi

# Confirm restore
echo "⚠️  WARNING: This will overwrite the database: $DB_NAME"
read -p "Are you sure? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Restore cancelled"
    exit 0
fi

# Restore database
echo "Restoring from: $BACKUP_FILE"
pg_restore -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -c "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Restore successful!"
else
    echo "❌ Restore failed!"
    exit 1
fi
```

### restore.ps1 (Windows PowerShell)

```powershell
# Database Restore Script for Windows
# Usage: .\restore.ps1 <backup_file>

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

$DB_USER = "bus_booking_user"
$DB_NAME = "bus_booking"
$DB_HOST = "localhost"

# Check if backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Host "❌ Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

# Confirm restore
Write-Host "⚠️  WARNING: This will overwrite the database: $DB_NAME" -ForegroundColor Yellow
$confirmation = Read-Host "Are you sure? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "Restore cancelled"
    exit 0
}

# Restore database
Write-Host "Restoring from: $BackupFile"
& pg_restore -U $DB_USER -d $DB_NAME -h $DB_HOST -c $BackupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Restore successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Restore failed!" -ForegroundColor Red
    exit 1
}
```

## 🕒 Automated Backup Schedule

### Using Cron (Linux/macOS)

Edit crontab:
```bash
crontab -e
```

Add backup schedules:
```cron
# Daily backup at 2 AM
0 2 * * * /path/to/database/backups/backup.sh daily

# Weekly backup on Sunday at 3 AM
0 3 * * 0 /path/to/database/backups/backup.sh weekly

# Monthly backup on 1st day at 4 AM
0 4 1 * * /path/to/database/backups/backup.sh monthly
```

### Using Task Scheduler (Windows)

**Create Daily Backup Task:**

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Database Daily Backup"
4. Trigger: Daily at 2:00 AM
5. Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-File "C:\path\to\database\backups\backup.ps1" -Type daily`

**Create Weekly Backup Task:**

1. Same as above but:
2. Name: "Database Weekly Backup"
3. Trigger: Weekly on Sunday at 3:00 AM
4. Arguments: `-File "C:\path\to\database\backups\backup.ps1" -Type weekly`

**Create Monthly Backup Task:**

1. Same as above but:
2. Name: "Database Monthly Backup"
3. Trigger: Monthly on day 1 at 4:00 AM
4. Arguments: `-File "C:\path\to\database\backups\backup.ps1" -Type monthly`

## 📊 Backup Types

### 1. Full Backup

Backs up entire database including structure and data.

```bash
# Custom format (recommended)
pg_dump -U bus_booking_user -d bus_booking -F c -f full_backup.dump

# SQL format (readable)
pg_dump -U bus_booking_user -d bus_booking -f full_backup.sql
```

### 2. Schema Only

Backs up only database structure (tables, indexes, etc.)

```bash
pg_dump -U bus_booking_user -d bus_booking --schema-only -f schema_backup.sql
```

### 3. Data Only

Backs up only data without structure.

```bash
pg_dump -U bus_booking_user -d bus_booking --data-only -f data_backup.sql
```

### 4. Specific Tables

Backs up specific tables only.

```bash
# Single table
pg_dump -U bus_booking_user -d bus_booking -t customers -f customers_backup.sql

# Multiple tables
pg_dump -U bus_booking_user -d bus_booking -t customers -t bus_bookings -f partial_backup.sql
```

## 🔄 Backup Best Practices

### Retention Policy

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| **Daily** | Every day at 2 AM | 7 days | Local disk |
| **Weekly** | Sunday at 3 AM | 4 weeks | Local + External |
| **Monthly** | 1st of month at 4 AM | 12 months | External/Cloud |

### Storage Recommendations

1. **Local Storage** - Fast access, daily/weekly backups
2. **External Drive** - Weekly/monthly backups
3. **Cloud Storage** - Monthly backups (S3, Google Cloud, Azure)
4. **Off-site** - Critical monthly backups

### Verification

Always verify backups work:

```bash
# Test restore to a separate database
createdb test_restore
pg_restore -U bus_booking_user -d test_restore backup_20260102_120000.dump

# Verify data
psql -U bus_booking_user -d test_restore -c "SELECT COUNT(*) FROM customers;"

# Cleanup
dropdb test_restore
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Permission Denied

**Error:** `permission denied for database bus_booking`

**Solution:**
```bash
# Grant necessary privileges
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE bus_booking TO bus_booking_user;
```

#### 2. Disk Space Full

**Error:** `No space left on device`

**Solution:**
```bash
# Check disk space
df -h

# Clean old backups
find ./daily -name "*.gz" -mtime +7 -delete

# Move to external storage
mv ./monthly/*.gz /mnt/external/backups/
```

#### 3. pg_dump Not Found

**Error:** `pg_dump: command not found`

**Solution:**
```bash
# Add PostgreSQL bin to PATH
export PATH=$PATH:/usr/lib/postgresql/15/bin

# Or use full path
/usr/lib/postgresql/15/bin/pg_dump -U bus_booking_user -d bus_booking -f backup.sql
```

#### 4. Restore Conflicts

**Error:** `ERROR: relation already exists`

**Solution:**
```bash
# Use -c flag to clean (drop) existing objects
pg_restore -U bus_booking_user -d bus_booking -c backup.dump

# Or restore to a new database
createdb bus_booking_restored
pg_restore -U bus_booking_user -d bus_booking_restored backup.dump
```

## 🔐 Security

### Encrypt Backups

```bash
# Encrypt backup file
gpg --symmetric --cipher-algo AES256 backup_20260102_120000.dump

# Decrypt
gpg --decrypt backup_20260102_120000.dump.gpg > backup_20260102_120000.dump
```

### Secure Storage

- **Encrypt** backups at rest
- **Restrict access** to backup files (chmod 600)
- **Use SSH/SFTP** for remote transfers
- **Verify integrity** with checksums

```bash
# Create checksum
sha256sum backup_20260102_120000.dump > backup_20260102_120000.sha256

# Verify checksum
sha256sum -c backup_20260102_120000.sha256
```

## 📞 Support

For backup issues:
1. Check disk space
2. Verify PostgreSQL is running
3. Check user permissions
4. Review error logs
5. Contact database administrator

## 🔗 Related Documentation

- **[Database README](../README.md)** - Main database documentation
- **[PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)**

---

**Last Updated:** January 2, 2026  
**Maintained By:** Database Team
