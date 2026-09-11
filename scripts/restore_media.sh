#!/bin/sh

# Media Files Restore Script for Shaubi Brothers
# Restores media files from S3 backup

set -e

# Configuration
S3_BUCKET="${S3_BUCKET:-shaubi-lending-database-bk}"
BACKUP_DIR="/backups"

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

# Function to list available backups
list_backups() {
    log "Available media backups in S3:"
    aws s3 ls "s3://$S3_BUCKET/" --recursive | grep "shaubi_media_backup_" | sort | while read -r line; do
        echo "  $line"
    done
}

# Function to get latest backup
get_latest_backup() {
    aws s3 ls "s3://$S3_BUCKET/" --recursive | grep "shaubi_media_backup_" | awk '{print $4}' | sort | tail -1
}

# Parse command line arguments
BACKUP_FILE=""
DRY_RUN=false

while [ $# -gt 0 ]; do
    case $1 in
        --file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --list)
            list_backups
            exit 0
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --file FILENAME    Restore from specific backup file"
            echo "  --dry-run         Show what would be restored without doing it"
            echo "  --list            List available backups"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# If no backup file specified, use latest
if [ -z "$BACKUP_FILE" ]; then
    BACKUP_FILE=$(get_latest_backup)
    if [ -z "$BACKUP_FILE" ]; then
        error "No media backups found in S3"
        exit 1
    fi
    log "Using latest backup: $BACKUP_FILE"
else
    log "Using specified backup: $BACKUP_FILE"
fi

# Verify backup file exists in S3
if ! aws s3 ls "s3://$S3_BUCKET/$BACKUP_FILE" > /dev/null 2>&1; then
    error "Backup file $BACKUP_FILE not found in S3"
    list_backups
    exit 1
fi

# Get backup details
BACKUP_SIZE=$(aws s3 ls "s3://$S3_BUCKET/$BACKUP_FILE" | awk '{print $3}')
BACKUP_DATE=$(echo "$BACKUP_FILE" | sed 's/shaubi_media_backup_\(.*\)\.tar\.gz/\1/')

log "Backup details:"
log "  File: $BACKUP_FILE"
log "  Size: $BACKUP_SIZE bytes"
log "  Date: $BACKUP_DATE"

if [ "$DRY_RUN" = true ]; then
    log "DRY RUN: Would restore media files from $BACKUP_FILE"
    exit 0
fi

# Warning
warn "WARNING: This will completely replace the current media files!"
warn "Make sure you have a backup of any important data!"
echo
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log "Restore cancelled"
    exit 0
fi

log "Starting media files restore..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Download backup from S3
log "Downloading backup from S3..."
if aws s3 cp "s3://$S3_BUCKET/$BACKUP_FILE" "$BACKUP_DIR/$BACKUP_FILE"; then
    log "Backup downloaded successfully"
else
    error "Failed to download backup from S3"
    exit 1
fi

# Restore media files
log "Restoring media files..."
if tar -xzf "$BACKUP_DIR/$BACKUP_FILE" -C /tmp; then
    log "Media files restored successfully"
    
    # Verify restore
    log "Verifying restore..."
    if [ -d "/tmp/media" ]; then
        FILE_COUNT=$(find /tmp/media -type f | wc -l)
        log "Restored media directory contains $FILE_COUNT files"
        
        # List some files
        log "Sample restored files:"
        find /tmp/media -type f | head -5 | while read -r file; do
            echo "  $file"
        done
    else
        error "Media directory not found after restore"
        exit 1
    fi
else
    error "Failed to restore media files"
    exit 1
fi

# Clean up local backup file
rm -f "$BACKUP_DIR/$BACKUP_FILE"
log "Local backup file cleaned up"

log "Media files restore completed successfully"
