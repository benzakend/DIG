FROM python:3.11-slim

WORKDIR /app

# התקנת תלויות מערכת
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# העתקת קבצי תלויות
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# העתקת הקוד
COPY . .

# יצירת תיקיית מדיה ב-tmp
RUN mkdir -p /tmp/media /tmp/static

# הגדרת משתנה סביבה
ENV DOCKER_ENV=1

# איסוף קבצים סטטיים
RUN python manage.py collectstatic --noinput

# חשיפת פורט
EXPOSE 8000

# הפעלת השרת
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"] 