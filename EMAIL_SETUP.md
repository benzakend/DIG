# 📧 מדריך הגדרת שליחת אימיילים - אחים שאובי

מדריך מפורט להגדרת שליחת אימיילים מהטופס "צור קשר".

## 🔐 שיטות אימות נתמכות

### 1. **App Password (פשוט ומומלץ)**
- קל להגדרה
- בטוח יותר מסיסמה רגילה
- מתאים לרוב השימושים

### 2. **OAuth2 Token (הכי בטוח)**
- אבטחה מקסימלית
- דורש הגדרה מורכבת יותר
- מתאים לאפליקציות גדולות

## 🚀 הגדרה מהירה עם App Password

### שלב 1: יצירת App Password ב-Gmail

1. **היכנס לחשבון Google שלך**
2. **לך ל-Security > 2-Step Verification**
3. **לחץ על "App passwords"**
4. **בחר "Mail" ו-"Other"**
5. **הכנס שם כמו "Shaubi Website"**
6. **שמור את הסיסמה שנוצרה (16 תווים)**

### שלב 2: הגדרת משתני סביבה

**בשרת:**
```bash
ssh ubuntu@63.178.162.116
cd shaubi-landing
nano .env
```

**תוכן הקובץ .env:**
```bash
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-16-character-app-password
```

### שלב 3: הפעלה מחדש
```bash
docker compose up -d --build
```

## 🔒 הגדרה מתקדמת עם OAuth2

### שלב 1: יצירת Google Cloud Project

1. **לך ל-Google Cloud Console**
2. **צור פרויקט חדש**
3. **הפעל את Gmail API**
4. **צור OAuth 2.0 credentials**

### שלב 2: הגדרת OAuth Consent Screen

1. **לך ל-OAuth consent screen**
2. **בחר "External"**
3. **מלא את הפרטים הבסיסיים**
4. **הוסף את האימייל שלך כ-test user**

### שלב 3: יצירת OAuth Credentials

1. **לך ל-Credentials**
2. **צור OAuth 2.0 Client ID**
3. **בחר "Web application"**
4. **הוסף Authorized redirect URIs:**
   - `http://localhost:3001/oauth2callback`
   - `https://shaubi-brothers.co.il/oauth2callback`

### שלב 4: קבלת Tokens

**הרץ את הסקריפט הבא:**
```javascript
// get-tokens.js
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'http://localhost:3001/oauth2callback'
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://mail.google.com/']
});

console.log('Authorize this app by visiting this url:', authUrl);
```

### שלב 5: הגדרת משתני סביבה

**תוכן הקובץ .env:**
```bash
MAIL_USER=your-email@gmail.com
MAIL_CLIENT_ID=your-client-id
MAIL_CLIENT_SECRET=your-client-secret
MAIL_REFRESH_TOKEN=your-refresh-token
MAIL_OAUTH_TOKEN=your-access-token
```

## 📋 בדיקת ההגדרה

### בדיקה מקומית:
```bash
# בדוק שהקונטיינר עולה
docker compose ps

# בדוק לוגים
docker compose logs api

# בדוק שהאימות עובד
docker compose exec api node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});
transporter.verify((err, success) => {
  console.log(err || 'Email configuration is valid!');
});
"
```

### בדיקה באתר:
1. **לך לאתר:** https://shaubi-brothers.co.il
2. **מלא את טופס "צור קשר"**
3. **שלח הודעה**
4. **בדוק שהאימייל התקבל**

## 🚨 פתרון בעיות

### בעיה: "Invalid login"
- **פתרון:** וודא שהשתמשת ב-App Password ולא בסיסמה רגילה

### בעיה: "Less secure app access"
- **פתרון:** השתמש ב-App Password או OAuth2

### בעיה: "Quota exceeded"
- **פתרון:** Gmail מגביל ל-500 אימיילים ביום לחשבון רגיל

### בעיה: "Authentication failed"
- **פתרון:** בדוק שהמשתנים נכונים ונסה להפעיל מחדש

## 📞 תמיכה

אם יש בעיות, בדוק:
1. **לוגים של הקונטיינר:** `docker compose logs api`
2. **סטטוס הקונטיינרים:** `docker compose ps`
3. **הגדרות משתני סביבה:** `docker compose exec api env | grep MAIL`

## ⚡ פקודות מהירות

```bash
# בדיקת סטטוס
docker compose ps

# הפעלה מחדש של API
docker compose restart api

# בדיקת לוגים
docker compose logs -f api

# עדכון מלא
git pull && docker compose up -d --build
``` 