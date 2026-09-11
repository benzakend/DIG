#!/bin/sh

# Media Files Backup Script for Shaubi Brothers
# Creates daily backups of media files and uploads to S3

set -e

# Configuration
S3_BUCKET="${S3_BUCKET:-shaubi-lending-database-bk}"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
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

# Check if AWS credentials are available
if [ -z "$AWS_ACCESS_KEY_ID" ] && [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    if [ ! -f "/root/.aws/credentials" ]; then
        error "AWS credentials not found in environment or /root/.aws/credentials"
        exit 1
    fi
    log "Using AWS credentials from /root/.aws/credentials"
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log "Starting media files backup..."

# Check if media directory exists
if [ ! -d "/tmp/media" ]; then
    error "Media directory /tmp/media not found"
    exit 1
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
        
        # List recent media backups in S3
        log "Recent media backups in S3:"
        aws s3 ls "s3://$S3_BUCKET/" --recursive | grep "shaubi_media_backup_" | tail -5 | while read -r line; do
            echo "  $line"
        done
        
    else
        error "Failed to upload media backup to S3"
        exit 1
    fi
else
    error "Failed to create media backup"
    exit 1
fi

log "Media backup process completed successfully"

# Keep only last 30 days of media backups in S3
log "Cleaning up old media backups (keeping last 30 days)..."
aws s3 ls "s3://$S3_BUCKET/" --recursive | grep "shaubi_media_backup_" | awk '{print $4}' | sort | head -n -30 | while read -r old_backup; do
    if [ -n "$old_backup" ]; then
        aws s3 rm "s3://$S3_BUCKET/$old_backup"
        log "Deleted old media backup: $old_backup"
    fi
done

log "Media backup cleanup completed"
