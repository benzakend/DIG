import express from 'express';
import nodemailer from 'nodemailer';

const app = express();
app.use(express.json());

// בדיקה שמשתני הסביבה קיימים
if (!process.env.MAIL_USER) {
  console.error('Missing required environment variable: MAIL_USER');
  process.exit(1);
}

// הגדרת transporter עם תמיכה ב-App Password או OAuth2
let transporter;

if (process.env.MAIL_OAUTH_TOKEN) {
  // שימוש ב-OAuth2 Token (הכי בטוח)
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.MAIL_USER,
      clientId: process.env.MAIL_CLIENT_ID,
      clientSecret: process.env.MAIL_CLIENT_SECRET,
      refreshToken: process.env.MAIL_REFRESH_TOKEN,
      accessToken: process.env.MAIL_OAUTH_TOKEN
    }
  });
} else if (process.env.MAIL_PASS) {
  // שימוש ב-App Password
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });
} else {
  console.error('Missing authentication: Either MAIL_PASS (App Password) or MAIL_OAUTH_TOKEN required');
  process.exit(1);
}

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;
  
  try {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER, // שולח לעצמו
      subject: `פנייה חדשה מאתר DIG - ${name}`,
      html: `
        <h2>פנייה חדשה מאתר DIG - אקססוריז יוקרתיים לגבר</h2>
        <p><strong>שם:</strong> ${name}</p>
        <p><strong>אימייל:</strong> ${email}</p>
        <p><strong>טלפון:</strong> ${phone}</p>
        <p><strong>הודעה:</strong></p>
        <p>${message}</p>
      `,
      text: `שם: ${name}\nאימייל: ${email}\nטלפון: ${phone}\nהודעה: ${message}`
    });
    
    res.status(200).json({ success: true, message: 'ההודעה נשלחה בהצלחה' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בשליחת ההודעה' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Contact API listening on port ${PORT}`);
  console.log(`Using authentication: ${process.env.MAIL_OAUTH_TOKEN ? 'OAuth2' : 'App Password'}`);
}); 