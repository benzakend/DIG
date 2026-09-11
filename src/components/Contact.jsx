import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPhone, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function Contact({ id }) {
  const { t, i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : (i18n.language === 'he' ? 'rtl' : 'ltr');
  const sectionRef = useRef(null);
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // גלול לסקשן אם יש hash
  useLayoutEffect(() => {
    if (location.hash === `#${id}` && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.hash, id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitMessage(t('contact.success'));
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setSubmitMessage(t('contact.error'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setSubmitMessage(t('contact.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id={id} className="contact-section" dir={dir} ref={sectionRef}>
      <h2>{t('contact.title')}</h2>
      
      <div className="contact-main-container">
        {/* Contact Form */}
        <div className="contact-form-container">
          <h3>{t('contact.formTitle')}</h3>
          <form onSubmit={handleSubmit} className="contact-form" dir={dir}>
            <div className="form-group">
              <label htmlFor="name">{t('contact.name')}:</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                dir={dir}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">{t('contact.emailLabel')}:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                dir={dir}
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">{t('contact.phoneLabel')}:</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                dir={dir}
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">{t('contact.message')}:</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="4"
                required
                dir={dir}
              ></textarea>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="submit-btn"
            >
              {isSubmitting ? t('contact.sending') : t('contact.send')}
            </button>
            {submitMessage && (
              <div className={`submit-message ${submitMessage.includes('error') ? 'error' : 'success'}`}>
                {submitMessage}
              </div>
            )}
          </form>
        </div>

        {/* Contact Cards */}
        <div className="contact-cards">
          {/* Phone Card */}
          <div className="contact-card">
            <div className="contact-card-icon">
              <FaPhone />
            </div>
            <h3>{t('contact.phone')}</h3>
            <a href="tel:0505242857" className="contact-link">
              0505242857
            </a>
            <button className="contact-btn">
              <FaPhone />
              {t('contact.call')}
            </button>
          </div>

          {/* WhatsApp Card */}
          <div className="contact-card">
            <div className="contact-card-icon">
              <FaWhatsapp />
            </div>
            <h3>{t('contact.whatsapp')}</h3>
            <span className="contact-number">050-524-2857</span>
            <a 
              href="https://wa.me/972505242857?text=שלום,%20אני%20מעוניין%20בייעוץ%20סטיילינג%20לאקססוריז%20של%20DIG%20לחתונה%20או%20לאירוע" 
              target="_blank" 
              rel="noopener noreferrer"
              className="contact-btn whatsapp-action"
            >
              <FaWhatsapp />
              {t('contact.chat')}
            </a>
          </div>

          {/* Email Card */}
          <div className="contact-card">
            <div className="contact-card-icon email">
              <FaEnvelope />
            </div>
            <h3>{t('contact.email')}</h3>
            <a href="mailto:vip@dig-shop.co.il" className="contact-link">
              vip@dig-shop.co.il 
            </a>
            <a href="mailto:vip@dig-shop.co.il" className="contact-btn email-btn">
              <FaEnvelope />
              {t('contact.sendEmail')}
            </a>
          </div>

          {/* Address Card */}
          <div className="contact-card">
            <div className="contact-card-icon address">
              <FaMapMarkerAlt />
            </div>
            <h3>{t('contact.address')}</h3>
            <span className="contact-address">
              {t('contact.addressDetails')}
            </span>
            <button className="contact-btn address-btn">
              <FaMapMarkerAlt />
              {t('contact.directions')}
            </button>
          </div>

          {/* Working Hours Card */}
          <div className="contact-card">
            <div className="contact-card-icon hours">
              <FaClock />
            </div>
            <h3>{t('contact.hours')}</h3>
            <div className="working-hours">
              <div>{t('contact.weekdays')}</div>
              <div>{t('contact.weekdaysTime')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact; 