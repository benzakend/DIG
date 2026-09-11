import express from 'express';
import nodemailer from 'nodemailer';

const app = express();
app.use(express.json());

// הגדרת transporter עם תמיכה ב-App Password או OAuth2
let transporter = null;

if (process.env.MAIL_USER && (process.env.MAIL_PASS || process.env.MAIL_OAUTH_TOKEN)) {
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
  } else {
    // שימוש ב-App Password
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });
  }
} else {
  console.warn('Notice: MAIL_USER or MAIL_PASS not configured. Contact inquiries will be logged to console.');
}

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;
  
  if (!transporter) {
    console.log('Contact inquiry received (mail not configured):', { name, email, phone, message });
    return res.status(200).json({ success: true, message: 'ההודעה התקבלה בהצלחה' });
  }

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