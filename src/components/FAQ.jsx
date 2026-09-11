import { useTranslation } from 'react-i18next';
import { useState, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

function FAQ({ id }) {
  const { t, i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : (i18n.language === 'he' ? 'rtl' : 'ltr');
  const sectionRef = useRef(null);
  const location = useLocation();
  const [openIndex, setOpenIndex] = useState(null);

  // גלול לסקשן אם יש hash
  useLayoutEffect(() => {
    if (location.hash === `#${id}` && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.hash, id]);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // FAQ data structure - these are common questions for tractors and agricultural parts
  const faqItems = t('faq.items', { returnObjects: true });

  // Generate FAQ Schema for AEO
  const generateFAQSchema = () => {
    if (!Array.isArray(faqItems)) return null;
    
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqItems.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    };
  };

  if (!Array.isArray(faqItems) || faqItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* Add FAQ Schema to head */}
      <script type="application/ld+json">
        {JSON.stringify(generateFAQSchema())}
      </script>
      
      <section className="faq-section" id={id} dir={dir} ref={sectionRef}>
        <h2>{t('faq.title')}</h2>
        <p className="faq-subtitle">{t('faq.subtitle')}</p>
        
        <div className="faq-container">
          {faqItems.map((item, index) => (
            <div 
              key={index} 
              className={`faq-item ${openIndex === index ? 'open' : ''}`}
              dir={dir}
            >
              <button 
                className="faq-question"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
              >
                <span>{item.question}</span>
                {openIndex === index ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              
              {openIndex === index && (
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default FAQ;

