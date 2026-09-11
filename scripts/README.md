# Database Backup System - Shaubi Brothers

This directory contains scripts for automated PostgreSQL database backups and restoration using AWS S3.

## Overview

The backup system consists of:
- **Daily automated backups** to S3 bucket `shaubi-lending-database-bk`
- **Manual backup/restore** capabilities
- **Cron job management** for automated daily backups
- **Backup retention** (keeps last 30 days)

## Files

- `backup.sh` - Main backup script (runs in Docker container)
- `restore.sh` - Database restoration script
- `setup_backup_cron.sh` - Cron job management script
- `README.md` - This documentation

## Prerequisites

1. **AWS CLI configured** on the server with access to S3 bucket `shaubi-lending-database-bk`
2. **Environment variables** set in `.env` file:
   ```
   POSTGRES_DB=shaubi
   POSTGRES_USER=shaubi
   POSTGRES_PASSWORD=your_password
   AWS_DEFAULT_REGION=us-east-1
   S3_BUCKET=shaubi-lending-database-bk
   ```
   
   **Note**: AWS credentials can be configured either:
   - In the `.env` file as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
   - Or using AWS CLI configuration on the server (`aws configure`)

## Quick Start

### 1. Set up environment variables

Add basic configuration to your `.env` file:

```bash
# Add these to your .env file (AWS credentials are optional if already configured on server)
AWS_DEFAULT_REGION=us-east-1
S3_BUCKET=shaubi-lending-database-bk
```

### 2. Install daily backup cron job

```bash
sudo ./scripts/setup_backup_cron.sh install
```

This will:
- Create a daily backup at 2:00 AM
- Log to `/var/log/shaubi-backup.log`

### 3. Run manual backup

```bash
# Run backup now
docker compose --profile backup run --rm backup

# Or use the helper script
./scripts/setup_backup_cron.sh manual
```

### 4. List available backups

```bash
./scripts/setup_backup_cron.sh list
```

## Usage

### Manual Backup

```bash
# Run backup immediately
docker compose --profile backup run --rm backup
```

### Manual Restore

```bash
# Restore from latest backup
docker compose --profile backup run --rm backup /scripts/restore.sh

# Restore from specific backup
docker compose --profile backup run --rm backup /scripts/restore.sh --file shaubi_db_backup_20241201_143022.sql.gz

# Dry run (show what would be restored)
docker compose --profile backup run --rm backup /scripts/restore.sh --dry-run
```

### Cron Job Management

```bash
# Install daily backup at 2 AM
sudo ./scripts/setup_backup_cron.sh install

# Check status
./scripts/setup_backup_cron.sh status

# Remove cron job
sudo ./scripts/setup_backup_cron.sh remove

# Run manual backup
./scripts/setup_backup_cron.sh manual

# List backups in S3
./scripts/setup_backup_cron.sh list
```

## Backup Details

### Backup Format
- **Filename**: `shaubi_db_backup_YYYYMMDD_HHMMSS.sql.gz`
- **Compression**: Gzip compressed
- **Location**: S3 bucket `shaubi-lending-database-bk`

### Backup Process
1. Wait for database to be ready
2. Create PostgreSQL dump with `pg_dump`
3. Compress with gzip
4. Upload to S3
5. Clean up local files
6. Remove backups older than 30 days

### Restore Process
1. Download backup from S3
2. Terminate existing connections
3. Drop and recreate database
4. Restore from backup
5. Verify restoration
6. Clean up downloaded files

## Monitoring

### Check Backup Logs

```bash
# View recent backup logs
tail -f /var/log/shaubi-backup.log

# Check cron job status
./scripts/setup_backup_cron.sh status
```

### Verify Backups

```bash
# List all backups in S3
./scripts/setup_backup_cron.sh list

# Check backup size and date
aws s3 ls s3://shaubi-lending-database-bk/ --recursive | grep shaubi_db_backup_
```

## Troubleshooting

### Common Issues

1. **AWS credentials not found**
   - Ensure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are in `.env`
   - Verify AWS CLI is configured

2. **Database connection failed**
   - Check if PostgreSQL container is running
   - Verify database credentials in `.env`

3. **S3 upload failed**
   - Check AWS credentials and permissions
   - Verify S3 bucket exists and is accessible

4. **Cron job not running**
   - Check if cron service is running: `sudo systemctl status cron`
   - Verify cron job is installed: `crontab -l`

### Debug Commands

```bash
# Check environment variables
docker compose --profile backup run --rm backup env | grep -E "(POSTGRES|AWS)"

# Test database connection
docker compose exec db pg_isready -U shaubi

# Test S3 access
docker compose --profile backup run --rm backup aws s3 ls s3://shaubi-lending-database-bk/
```

## Security Notes

- AWS credentials are stored in `.env` file
- Backup files are compressed and encrypted in transit
- Old backups are automatically cleaned up (30-day retention)
- Restore requires explicit confirmation

## Backup Retention

- **Local**: No local backups (cleaned up after upload)
- **S3**: Last 30 days of backups
- **Manual**: Can be downloaded and stored elsewhere

## Example Workflow

```bash
# 1. Set up daily backups
sudo ./scripts/setup_backup_cron.sh install

# 2. Run initial backup
./scripts/setup_backup_cron.sh manual

# 3. Verify backup was created
./scripts/setup_backup_cron.sh list

# 4. Test restore (dry run)
docker compose --profile backup run --rm backup /scripts/restore.sh --dry-run

# 5. Monitor daily backups
tail -f /var/log/shaubi-backup.log
```

## Support

For issues with the backup system:
1. Check logs: `/var/log/shaubi-backup.log`
2. Verify environment variables
3. Test manual backup/restore
4. Check AWS S3 bucket access
