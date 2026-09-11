#!/bin/sh

# Setup Backup Cron Job for Shaubi Brothers
# Sets up daily automated backups

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  install    Install daily backup cron job"
    echo "  remove     Remove daily backup cron job"
    echo "  status     Show backup cron job status"
    echo "  manual     Run manual backup now"
    echo "  list       List available backups in S3"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 install    # Install daily backup at 2 AM"
    echo "  $0 manual     # Run backup now"
    echo "  $0 list       # List backups in S3"
}

# Check if running as root
check_root() {
    if [ "$(id -u)" != "0" ]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Install cron job
install_cron() {
    check_root
    
    log "Installing daily backup cron job..."
    
    # Create backup script wrapper
    cat > /usr/local/bin/shaubi-backup << 'EOF'
#!/bin/sh
cd /home/ubuntu/shaubi-landing
docker compose --profile backup run --rm backup
EOF
    
    chmod +x /usr/local/bin/shaubi-backup
    
    # Add cron job (daily at 2 AM)
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/shaubi-backup >> /var/log/shaubi-backup.log 2>&1") | crontab -
    
    log "Daily backup cron job installed successfully"
    log "Backups will run daily at 2:00 AM"
    log "Logs will be written to /var/log/shaubi-backup.log"
}

# Remove cron job
remove_cron() {
    check_root
    
    log "Removing daily backup cron job..."
    
    # Remove cron entry
    crontab -l 2>/dev/null | grep -v "shaubi-backup" | crontab -
    
    # Remove wrapper script
    rm -f /usr/local/bin/shaubi-backup
    
    log "Daily backup cron job removed successfully"
}

# Show status
show_status() {
    log "Checking backup cron job status..."
    
    if crontab -l 2>/dev/null | grep -q "shaubi-backup"; then
        log "✓ Daily backup cron job is installed"
        crontab -l | grep "shaubi-backup"
    else
        warn "✗ Daily backup cron job is not installed"
    fi
    
    # Check if wrapper script exists
    if [ -f "/usr/local/bin/shaubi-backup" ]; then
        log "✓ Backup wrapper script exists"
    else
        warn "✗ Backup wrapper script not found"
    fi
    
    # Check recent backup logs
    if [ -f "/var/log/shaubi-backup.log" ]; then
        log "Recent backup log entries:"
        tail -10 /var/log/shaubi-backup.log 2>/dev/null || warn "No recent log entries"
    else
        warn "No backup log file found"
    fi
}

# Run manual backup
run_manual_backup() {
    log "Running manual backup..."
    
    if [ ! -d "/home/ubuntu/shaubi-landing" ]; then
        error "Shaubi landing directory not found"
        exit 1
    fi
    
    cd /home/ubuntu/shaubi-landing
    
    # Check if docker compose is available
    if ! command -v docker compose >/dev/null 2>&1; then
        error "Docker Compose not found"
        exit 1
    fi
    
    # Run backup
    log "Starting backup container..."
    docker compose --profile backup run --rm backup
    
    log "Manual backup completed"
}

# List backups
list_backups() {
    log "Listing available backups in S3..."
    
    if [ ! -d "/home/ubuntu/shaubi-landing" ]; then
        error "Shaubi landing directory not found"
        exit 1
    fi
    
    cd /home/ubuntu/shaubi-landing
    
    # Source environment variables
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    fi
    
    # Check AWS credentials (either from env or from AWS CLI config)
    if [ -z "$AWS_ACCESS_KEY_ID" ] && [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        if ! aws sts get-caller-identity >/dev/null 2>&1; then
            error "AWS credentials not found in environment or AWS CLI configuration"
            exit 1
        fi
        log "Using AWS credentials from AWS CLI configuration"
    fi
    
    S3_BUCKET="${S3_BUCKET:-shaubi-lending-database-bk}"
    
    log "Backups in S3 bucket: $S3_BUCKET"
    aws s3 ls "s3://$S3_BUCKET/" --recursive | grep "shaubi_db_backup_" | sort -k4 | while read -r line; do
        echo "  $line"
    done
}

# Main script logic
case "${1:-help}" in
    install)
        install_cron
        ;;
    remove)
        remove_cron
        ;;
    status)
        show_status
        ;;
    manual)
        run_manual_backup
        ;;
    list)
        list_backups
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac
