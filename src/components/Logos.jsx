import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaInstagram, FaWhatsapp, FaEnvelope } from 'react-icons/fa';

function Logos({ id }) {
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

  return (
    <footer id={id} className="logos-section dig-footer" ref={sectionRef}>
      <div className="footer-content">
        <div className="footer-brand">
          <div className="footer-logo">DIG</div>
          <p className="footer-tagline">HAUTE MEN'S ACCESSORIES • WEDDINGS &amp; CELEBRATIONS</p>
          <div className="footer-gold-line"></div>
        </div>

        <div className="footer-social-links">
          <a href="https://wa.me/972505242857" target="_blank" rel="noopener noreferrer" className="footer-icon-link" title="וואטסאפ">
            <FaWhatsapp size={20} />
          </a>
          <a href="mailto:vip@dig-shop.co.il" className="footer-icon-link" title="אימייל">
            <FaEnvelope size={18} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="footer-icon-link" title="אינסטגרם">
            <FaInstagram size={20} />
          </a>
        </div>

        <div className="footer-copy">
          כל הזכויות שמורות &copy; 2026 DIG | אקססוריז יוקרתיים לגבר, חתונות, שושבינים ומסיבות.
        </div>
      </div>
    </footer>
  );
}

export default Logos;