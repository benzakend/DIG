#!/bin/sh

# PostgreSQL and Media Backup Script for Shaubi Brothers
# Creates daily backups of database and media files and uploads to S3

set -e

# Configuration
DB_NAME="${POSTGRES_DB:-shaubi}"
DB_USER="${POSTGRES_USER:-shaubi}"
DB_HOST="${POSTGRES_HOST:-db}"
DB_PORT="${POSTGRES_PORT:-5432}"
S3_BUCKET="${S3_BUCKET:-shaubi-lending-database-bk}"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="shaubi_db_backup_${DATE}.sql.gz"
MEDIA_BACKUP_FILE="shaubi_media_backup_${DATE}.tar.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check required environment variables
if [ -z "$POSTGRES_PASSWORD" ]; then
    error "POSTGRES_PASSWORD environment variable is required"
    exit 1
fi

# Check if AWS credentials are available (either from env or from mounted config)
if [ -z "$AWS_ACCESS_KEY_ID" ] && [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    if [ ! -f "/root/.aws/credentials" ]; then
        error "AWS credentials not found in environment or /root/.aws/credentials"
        exit 1
    fi
    log "Using AWS credentials from /root/.aws/credentials"
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to backup database
backup_database() {
    log "Starting PostgreSQL backup..."

    # Wait for database to be ready
    log "Waiting for database to be ready..."
    until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; do
        warn "Database not ready, waiting..."
        sleep 5
    done

    log "Database is ready, creating backup..."

    # Create backup
    if PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_DIR/$DB_BACKUP_FILE"; then
        log "Database backup created successfully: $DB_BACKUP_FILE"
        
        # Get file size
        FILE_SIZE=$(du -h "$BACKUP_DIR/$DB_BACKUP_FILE" | cut -f1)
        log "Database backup size: $FILE_SIZE"
        
        # Upload to S3
        log "Uploading database backup to S3 bucket: $S3_BUCKET"
        if aws s3 cp "$BACKUP_DIR/$DB_BACKUP_FILE" "s3://$S3_BUCKET/$DB_BACKUP_FILE"; then
            log "Database backup uploaded successfully to S3"
            
            # Clean up local backup file
            rm -f "$BACKUP_DIR/$DB_BACKUP_FILE"
            log "Local database backup file cleaned up"
            
        else
            error "Failed to upload database backup to S3"
            return 1
        fi
    else
        error "Failed to create database backup"
        return 1
    fi
}

# Function to backup media files
backup_media() {
    log "Starting media files backup..."

    # Check if media directory exists
    if [ ! -d "/tmp/media" ]; then
        warn "Media directory /tmp/media not found, skipping media backup"
        return 0
    fi

    # Create media backup
    log "Creating media backup archive..."
    if tar -czf "$BACKUP_DIR/$MEDIA_BACKUP_FILE" -C /tmp media; then
        log "Media backup created successfully: $MEDIA_BACKUP_FILE"
        
        # Get file size
        FILE_SIZE=$(du -h "$BACKUP_DIR/$MEDIA_BACKUP_FILE" | cut -f1)
        log "Media backup size: $FILE_SIZE"
        
        # Upload to S3
        log "Uploading media backup to S3 bucket: $S3_BUCKET"
        if aws s3 cp "$BACKUP_DIR/$MEDIA_BACKUP_FILE" "s3://$S3_BUCKET/$MEDIA_BACKUP_FILE"; then
            log "Media backup uploaded successfully to S3"
            
            # Clean up local backup file
            rm -f "$BACKUP_DIR/$MEDIA_BACKUP_FILE"
            log "Local media backup file cleaned up"
            
        else
            error "Failed to upload media backup to S3"
            return 1
        fi
    else
        error "Failed to create media backup"
        return 1
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups (keeping last 30 days)..."
    
    # Clean up old database backups
    aws s3 ls "s3://$S3_BUCKET/" --recursive | grep "shaubi_db_backup_" | awk '{print $4}' | sort | head -n -30 | while read -r old_backup; do
        if [ -n "$old_backup" ]; then
            aws s3 rm "s3://$S3_BUCKET/$old_backup"
            log "Deleted old database backup: $old_backup"
        fi
    done
    
    # Clean up old media backups
    aws s3 ls "s3://$S3_BUCKET/" --recursive | grep "shaubi_media_backup_" | awk '{print $4}' | sort | head -n -30 | while read -r old_backup; do
        if [ -n "$old_backup" ]; then
            aws s3 rm "s3://$S3_BUCKET/$old_backup"
            log "Deleted old media backup: $old_backup"
        fi
    done
    
    log "Backup cleanup completed"
}

# Function to list recent backups
list_recent_backups() {
    log "Recent backups in S3:"
    log "Database backups:"
    aws s3 ls "s3://$S3_BUCKET/" --recursive | grep "shaubi_db_backup_" | tail -5 | while read -r line; do
        echo "  $line"
    done
    
    log "Media backups:"
    aws s3 ls "s3://$S3_BUCKET/" --recursive | grep "shaubi_media_backup_" | tail -5 | while read -r line; do
        echo "  $line"
    done
}

# Main backup process
log "Starting backup process..."

# Backup database
if backup_database; then
    log "Database backup completed successfully"
else
    error "Database backup failed"
    exit 1
fi

# Backup media files
if backup_media; then
    log "Media backup completed successfully"
else
    warn "Media backup failed, but continuing..."
fi

# List recent backups
list_recent_backups

# Cleanup old backups
cleanup_old_backups

log "Backup process completed successfully"
