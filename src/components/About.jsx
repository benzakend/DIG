import { useTranslation } from 'react-i18next';
import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function About({ id }) {
  const { t, i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : (i18n.language === 'he' ? 'rtl' : 'ltr');
  const sectionRef = useRef(null);
  const location = useLocation();

  // Scroll to section if hash matches
  useLayoutEffect(() => {
    if (location.hash === `#${id}` && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.hash, id]);

  const description = t('about.description') || '';
  const paragraphs = description.split('\n\n').filter(Boolean);

  return (
    <section className="about-section" id={id} dir={dir} ref={sectionRef}>
      <div className="about-header-wrapper">
        <span className="luxury-badge">HAUTE COUTURE</span>
        <h2>{t('about.title')}</h2>
        <div className="gold-divider"></div>
      </div>
      <div className="about-content">
        {paragraphs.map((p, index) => (
          <p key={index}>{p}</p>
        ))}
      </div>
    </section>
  );
}

export default About;