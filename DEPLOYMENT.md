# 🚀 מדריך עדכון האתר - אחים שאובי

מדריך מפורט לעדכון האתר באמצעות Git ו-Docker.

## 📋 תהליך עדכון מהיר

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

## 🔄 תהליך מלא לעדכון

### 1. עריכת הקוד
- ערוך את הקבצים במחשב המקומי
- השתמש ב-`npm run dev` לבדיקה מקומית

### 2. בדיקת הקוד
```bash
# בדיקת Linting
npm run lint

# בנייה לבדיקה
npm run build
```

### 3. דחיפה לגיט
```bash
# הוספת שינויים
git add .

# יצירת commit
git commit -m "תיאור מפורט של השינויים"

# דחיפה
git push origin master
```

### 4. עדכון השרת
```bash
# התחברות לשרת
ssh ubuntu@63.178.162.116

# מעבר לתיקייה
cd shaubi-landing

# משיכת השינויים
git pull

# בנייה והפעלה מחדש של הקונטיינרים
docker compose up -d --build
```

### 5. בדיקת האתר
- בדוק את האתר ב: https://shaubi-brothers.co.il
- וודא שהשינויים מופיעים כראוי

## 🛠️ פקודות שימושיות

### בדיקת סטטוס הקונטיינרים
```bash
ssh ubuntu@63.178.162.116 'cd shaubi-landing && docker compose ps'
```

### צפייה בלוגים
```bash
ssh ubuntu@63.178.162.116 'cd shaubi-landing && docker compose logs -f'
```

### עצירת השירות
```bash
ssh ubuntu@63.178.162.116 'cd shaubi-landing && docker compose down'
```

### הפעלת השירות מחדש
```bash
ssh ubuntu@63.178.162.116 'cd shaubi-landing && docker compose up -d'
```

## 🔧 פתרון בעיות

### אם הקונטיינר לא עולה
```bash
# בדיקת לוגים
ssh ubuntu@63.178.162.116 'cd shaubi-landing && docker compose logs'

# בנייה מחדש ללא cache
ssh ubuntu@63.178.162.116 'cd shaubi-landing && docker compose build --no-cache && docker compose up -d'
```

### אם האתר לא נטען
```bash
# בדיקת סטטוס הקונטיינרים
ssh ubuntu@63.178.162.116 'cd shaubi-landing && docker compose ps'

# הפעלה מחדש של Caddy
ssh ubuntu@63.178.162.116 'cd shaubi-landing && docker compose restart caddy'
```

## 📞 פרטי התחברות לשרת

- **IP**: 63.178.162.116
- **User**: ubuntu
- **Directory**: /home/ubuntu/shaubi-landing
- **Website**: https://shaubi-brothers.co.il

## ⚠️ הערות חשובות

1. **תמיד בדוק מקומית** לפני דחיפה לשרת
2. **שמור על commit messages ברורים** 
3. **בדוק את האתר** אחרי כל עדכון
4. **שמור על גיבוי** של הקוד
5. **בדוק לוגים** אם יש בעיות

## 🎯 תהליך מהיר לעדכון קטן

```bash
# 1. ערוך את הקוד
# 2. בדוק עם npm run dev
# 3. דחוף לגיט
git add . && git commit -m "עדכון קטן" && git push

# 4. עדכן את השרת
ssh ubuntu@63.178.162.116 'cd shaubi-landing && git pull && docker compose up -d --build'
``` 