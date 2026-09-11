import { FaCrown, FaTruck, FaUserTie, FaGift } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function Benefits({ id }) {
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

  const benefitItems = [
    {
      icon: <FaCrown size={32} style={{ color: '#d4af37' }} />,
      glowColor: 'rgba(212, 175, 55, 0.25)',
      titleKey: 'benefits.reliability.title',
      descKey: 'benefits.reliability.description'
    },
    {
      icon: <FaUserTie size={32} style={{ color: '#38bdf8' }} />,
      glowColor: 'rgba(56, 189, 248, 0.25)',
      titleKey: 'benefits.manufacturing.title',
      descKey: 'benefits.manufacturing.description'
    },
    {
      icon: <FaTruck size={32} style={{ color: '#10b981' }} />,
      glowColor: 'rgba(16, 185, 129, 0.25)',
      titleKey: 'benefits.speed.title',
      descKey: 'benefits.speed.description'
    },
    {
      icon: <FaGift size={32} style={{ color: '#e879f9' }} />,
      glowColor: 'rgba(232, 121, 249, 0.25)',
      titleKey: 'benefits.price.title',
      descKey: 'benefits.price.description'
    }
  ];

  return (
    <section className="benefits-section" id={id} dir={dir} ref={sectionRef}>
      {benefitItems.map((item, i) => (
        <div className="benefit center-text" key={i} dir={dir}>
          <div className="benefit-icon-wrapper" style={{ boxShadow: `0 8px 24px ${item.glowColor}` }}>
            {item.icon}
          </div>
          <h3>{t(item.titleKey)}</h3>
          <p>{t(item.descKey)}</p>
        </div>
      ))}
    </section>
  );
}

export default Benefits;