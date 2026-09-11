# אחים שאובי - אתר אינטרנט

אתר אינטרנט למחסן חלקי חילוף לטרקטורים וכלים חקלאיים.

## תכונות

- 🌐 תמיכה בשלוש שפות: עברית, אנגלית וערבית
- 📱 עיצוב רספונסיבי למובייל ודסקטופ
- 📧 טופס יצירת קשר עם שליחת אימייל
- 🖼️ גלריה של תמונות
- ⚡ ביצועים מהירים עם Vite
- 🗄️ PostgreSQL database עם pgAdmin
- 💾 מערכת גיבוי אוטומטית ל-S3
- 🔄 יכולות שחזור בסיס נתונים

## 🚀 עדכון האתר (Deployment)

### שלב 1: עדכון הקוד המקומי
```bash
# הוספת כל השינויים
git add .

# יצירת commit עם תיאור ברור
git commit -m "תיאור השינויים שבוצעו"

# דחיפה לגיט
git push origin master
```

### שלב 2: עדכון השרת
```bash
# התחברות לשרת ועדכון האתר
ssh ubuntu@63.178.162.116 'cd shaubi-landing && git pull && docker compose up -d --build'
```

### 📋 תהליך מלא לעדכון:
1. **ערוך את הקוד** במחשב המקומי
2. **בדוק שהכל עובד** עם `npm run dev`
3. **דחוף לגיט** עם הפקודות למעלה
5. **עדכן את השרת** עם הפקודה למעלה
6. **בדוק את האתר** ב: https://shaubi-brothers.co.il

## התקנה

### דרישות מקדימות
- Node.js 20+
- npm או yarn
- Git
- Docker (לפריסה)

### התקנה מקומית

1. שכפול הפרויקט:
```bash
git clone https://github.com/benzaked/shaubi-landing.git
cd shaubi-landing
```

2. התקנת תלויות:
```bash
npm install
```

3. יצירת קובץ `.env`:
```bash
cp .env.example .env
```

4. הגדרת משתני סביבה ב-`.env`:
```
# Email Configuration
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Database Configuration (Production)
POSTGRES_DB=shaubi
POSTGRES_USER=shaubi
POSTGRES_PASSWORD=your_secure_password

# AWS Configuration (Optional - uses server's AWS CLI config)
AWS_DEFAULT_REGION=us-east-1
S3_BUCKET=shaubi-lending-database-bk

# pgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=admin@shaubi.local
PGADMIN_DEFAULT_PASSWORD=your_admin_password
```

**הערות**:
- עבור Gmail, יש להשתמש ב-App Password ולא בסיסמה הרגילה
- AWS credentials can be configured via AWS CLI on the server (`aws configure`)
- Database credentials are required for production deployment

### הרצה בפיתוח

```bash
npm run dev
```

האתר יהיה זמין ב: http://localhost:5173

### בנייה לייצור

```bash
npm run build
```

## פריסה עם Docker

### דרישות
- Docker
- Docker Compose

### הרצה מקומית

1. הגדרת משתני סביבה:
```bash
export MAIL_USER=your-email@gmail.com
export MAIL_PASS=your-app-password
```

2. הרצת הפרויקט:
```bash
docker-compose up -d
```

האתר יהיה זמין ב: http://localhost

## מבנה הפרויקט

```
shaubi-landing/
├── src/
│   ├── components/     # קומפוננטים של React
│   ├── assets/        # קבצי מדיה
│   ├── App.jsx        # קומפוננט ראשי
│   ├── main.jsx       # נקודת כניסה
│   └── i18n.js        # הגדרות תרגום
├── api/               # שירות API
├── shop/              # Django backend עם PostgreSQL
├── scripts/           # סקריפטי גיבוי ושחזור
├── public/            # קבצים סטטיים
├── dist/              # קבצים מובנים
└── docker-compose.yml # הגדרות Docker
```

## פיתוח

### בדיקת קוד
```bash
npm run lint
```

### תצוגה מקדימה של בנייה
```bash
npm run preview
```

## 🗄️ Database & Backup System

### PostgreSQL Database
- **Database**: PostgreSQL 16
- **Admin Interface**: pgAdmin accessible at http://63.178.162.116:5050
- **Production**: Uses PostgreSQL when `DEBUG=False`
- **Development**: Uses SQLite for local development

### Backup System
- **Automated Backups**: Daily backups at 2:00 AM
- **Storage**: AWS S3 bucket `shaubi-lending-database-bk`
- **Retention**: Keeps last 30 days of backups
- **Compression**: Gzip compressed database backups, tar.gz compressed media backups
- **Scope**: Both database and media files are backed up automatically
- **Restore**: Separate scripts for database (`restore.sh`) and media (`restore_media.sh`) restoration

### Data Loss Prevention
- **Before major changes**: Always run backup first
- **Before rebuilding containers**: Backup database and media files
- **Never use `docker system prune -f`**: This deletes all volumes including media files
- **Media files location**: Stored in Docker volume `shop_media` mounted at `/tmp/media/`
- **Image restoration**: Use `restore_media.sh` to restore product images from S3 backup

#### Backup Commands
```bash
# Manual backup (database + media)
docker compose --profile backup run --rm backup

# List available backups
./scripts/setup_backup_cron.sh list

# Restore database from latest backup (dry run)
docker compose --profile backup run --rm backup /scripts/restore.sh --dry-run

# Restore database from latest backup (auto-confirm)
echo "yes" | docker compose --profile backup run --rm backup /scripts/restore.sh

# Restore database from specific backup (auto-confirm)
echo "yes" | docker compose --profile backup run --rm backup /scripts/restore.sh --file backup_filename.sql.gz

# Restore media files from latest backup (auto-confirm)
echo "yes" | docker compose --profile backup run --rm backup /scripts/restore_media.sh

# Restore media files from specific backup (auto-confirm)
echo "yes" | docker compose --profile backup run --rm backup /scripts/restore_media.sh --file backup_filename.tar.gz

# Check backup system status
./scripts/setup_backup_cron.sh status

## 🚨 Troubleshooting

### Common Issues
1. **Product images missing (404 errors)**: 
   - Check if media files exist in Docker container: `docker compose exec shop ls -la /tmp/media/products/`
   - Restore from backup: `echo "yes" | docker compose --profile backup run --rm backup /scripts/restore_media.sh`
   - Verify images are accessible: `curl -I https://shaubi-brothers.co.il/media/products/FILENAME.jpg`

2. **Category filtering not working in production**:
   - Check if `urlParamsRead` fix is deployed
   - Rebuild frontend without cache: `docker compose build --no-cache app && docker compose up -d`

3. **Backup not including media files**:
   - Ensure `shop_media` volume is mounted in backup service
   - Check docker-compose.yml has: `- shop_media:/tmp/media`

4. **Database connection issues**:
   - Check PostgreSQL container is running: `docker compose ps db`
   - Verify environment variables are set correctly

#### pgAdmin Access
- **URL**: http://63.178.162.116:5050
- **Email**: `admin@shaubi.local` (from .env)
- **Password**: Set in .env file
- **Database Connection**:
  - Host: `db`
  - Port: `5432`
  - Database: `shaubi`
  - Username: `shaubi`

## תמיכה טכנית

- **Frontend**: React 19 + Vite
- **Backend**: Node.js + Express (API) + Django (Shop)
- **Database**: PostgreSQL (production) / SQLite (development)
- **Email**: Nodemailer
- **Styling**: CSS
- **Deployment**: Docker + Caddy
- **Backup**: AWS S3 + Automated scripts

## 🔧 Troubleshooting

### Database Issues
```bash
# Check database status
docker compose ps db

# View database logs
docker compose logs db

# Connect to database
docker compose exec db psql -U shaubi -d shaubi
```

### Backup Issues
```bash
# Check backup logs
tail -f /var/log/shaubi-backup.log

# Test AWS credentials
aws sts get-caller-identity

# List S3 backups
aws s3 ls s3://shaubi-lending-database-bk/

# If restore hangs, use auto-confirm:
echo "yes" | docker compose --profile backup run --rm backup /scripts/restore.sh
```

### Preventing Data Loss
To prevent losing media files when rebuilding containers:

1. **Never run `docker system prune -f`** without first ensuring backups are up to date
2. **Always backup before major changes**:
   ```bash
   # Create manual backup before changes
   docker compose --profile backup run --rm backup
   ```
3. **Use the enhanced backup system** that backs up both database and media files
4. **Test restore process regularly** to ensure backups are working
5. **Monitor backup logs** to ensure daily backups are successful

**Important**: The enhanced backup system now automatically backs up media files to S3, preventing the loss of uploaded product images and other media content.

### pgAdmin Issues
```bash
# Check pgAdmin container
docker compose ps pgadmin

# View pgAdmin logs
docker compose logs pgadmin

# Restart pgAdmin
docker compose restart pgadmin
```

### General Issues
```bash
# Check all containers
docker compose ps

# View all logs
docker compose logs

# Rebuild containers
docker compose up -d --build

# Reset everything
docker compose down -v && docker compose up -d --build
```

## רישיון

כל הזכויות שמורות לאחים שאובי.
