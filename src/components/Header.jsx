import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaWhatsapp, FaPhone, FaBars, FaTimes, FaChevronDown } from 'react-icons/fa';

function Header() {
  const { t } = useTranslation();
  const dir = 'rtl';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Constants
  const SUBMENU_DELAY = 250;
  const API_URL = import.meta.env.DEV ? 'http://localhost:8000' : '';
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const [isDesktopProductsOpen, setIsDesktopProductsOpen] = useState(false);
  const [hoveredSubmenu, setHoveredSubmenu] = useState(null);
  const [submenuTimeout, setSubmenuTimeout] = useState(null);
  const dropdownRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // סגירת התפריט ב-ESC
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        setIsMenuOpen(false);
      }
    };
    
    if (isMenuOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => clearSubmenuTimeout();
  }, [submenuTimeout]);

  // טעינת קטגוריות ותת-קטגוריות לתפריט
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load categories
        const categoriesRes = await fetch(`${API_URL}/api/categories/`);
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          const categoriesArray = categoriesData.results || categoriesData;
          setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
        }

        // Load sub-categories
        const subCategoriesRes = await fetch(`${API_URL}/api/subcategories/`);
        if (subCategoriesRes.ok) {
          const subCategoriesData = await subCategoriesRes.json();
          const subCategoriesArray = subCategoriesData.results || subCategoriesData;
          setSubCategories(Array.isArray(subCategoriesArray) ? subCategoriesArray : []);
        }
      } catch (e) {
        setCategories([]);
        setSubCategories([]);
      }
    };
    loadData();
  }, []);

  // Helper function to get sub-categories for a specific category
  const getSubCategoriesForCategory = (categoryId) => {
    return subCategories.filter(subCat => subCat.category === categoryId);
  };

  // Helper function to clear timeout (reusable)
  const clearSubmenuTimeout = () => {
    if (submenuTimeout) {
      clearTimeout(submenuTimeout);
      setSubmenuTimeout(null);
    }
  };

  // Helper functions for submenu hover with delay
  const handleSubmenuEnter = (categoryId) => {
    clearSubmenuTimeout();
    setHoveredSubmenu(categoryId);
  };

  const handleSubmenuLeave = () => {
    const timeout = setTimeout(() => {
      setHoveredSubmenu(null);
    }, SUBMENU_DELAY);
    setSubmenuTimeout(timeout);
  };

  // Helpers to guard mouseleave using relatedTarget containment
  const elementContains = (parent, node) => {
    if (!parent || !node) return false;
    try {
      return parent.contains(node);
    } catch {
      return false;
    }
  };

  const handleDropdownEnter = () => {
    clearSubmenuTimeout();
    setIsDesktopProductsOpen(true);
  };

  const handleDropdownLeave = (e) => {
    const next = e && (e.relatedTarget || e.toElement);
    if (elementContains(dropdownRef.current, next)) {
      return; // still inside dropdown; ignore
    }
    setIsDesktopProductsOpen(false);
    setHoveredSubmenu(null);
    clearSubmenuTimeout();
  };

  const handleSubmenuLeaveGuarded = (e) => {
    const next = e && (e.relatedTarget || e.toElement);
    if (elementContains(dropdownRef.current, next)) {
      return; // moving within dropdown; keep submenu
    }
    handleSubmenuLeave();
  };

  // Close all menus when clicking on a link
  const handleLinkClick = () => {
    setIsDesktopProductsOpen(false);
    setHoveredSubmenu(null);
    setIsMenuOpen(false); // Also close mobile menu
    clearSubmenuTimeout();
  };

  // Brand click: if already on home, just scroll to top; otherwise navigate as usual
  const handleBrandClick = (e) => {
    try {
      const isHome = window.location && window.location.pathname === '/';
      handleLinkClick();
      if (isHome) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (_) {
      // no-op
    }
  };

  return (
    <>
      <nav className="main-nav sticky-nav" style={{flexDirection: 'row-reverse', alignItems: 'center'}}>
        {/* כפתור המבורגר למובייל */}
        <button 
          className="hamburger-btn"
          onClick={toggleMenu}
          aria-label="תפריט"
        >
          {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

        {/* Overlay לסגירת התפריט */}
        {isMenuOpen && (
          <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}></div>
        )}

        {/* תפריט מגירה למובייל */
        }
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-content" dir={dir}>
            <ul>
              <li>
                <Link to="/" className="brand-btn no-bg" onClick={handleBrandClick}>
                  {t('brand') || 'DIG'}
                </Link>
              </li>
              <li>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <Link to="/shop#products" onClick={handleLinkClick}>{t('nav.products')}</Link>
                  <button
                    className="mobile-submenu-toggle"
                    aria-label="toggle categories"
                    onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                  >
                    <FaChevronDown size={16} style={{transform: isMobileProductsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s'}} />
                  </button>
                </div>
                {isMobileProductsOpen && categories.length > 0 && (
                  <ul className="mobile-submenu">
                    {categories.map((cat) => {
                      const categorySubCategories = getSubCategoriesForCategory(cat.id);
                      return (
                        <li key={cat.id} className="mobile-category-item">
                          <div className="mobile-category-header">
                            <Link 
                              to={`/shop?category=${cat.id}#products`} 
                              onClick={handleLinkClick}
                              className="mobile-category-link"
                            >
                              {cat.name}
                            </Link>
                            {categorySubCategories.length > 0 && (
                              <button
                                className="mobile-expand-btn"
                                onClick={(e) => {
                                  e.preventDefault();
                                  const submenu = e.currentTarget.nextElementSibling;
                                  const isExpanded = submenu.style.display === 'block';
                                  submenu.style.display = isExpanded ? 'none' : 'block';
                                  e.currentTarget.innerHTML = isExpanded ? '▼' : '▲';
                                }}
                              >
                                ▼
                              </button>
                            )}
                          </div>
                          {categorySubCategories.length > 0 && (
                            <ul className="mobile-sub-submenu" style={{ display: 'none' }}>
                              {categorySubCategories.map((subCat) => (
                                <li key={subCat.id} className="mobile-subcategory-item">
                                  <Link 
                                    to={`/shop?category=${cat.id}&sub_category=${subCat.id}#products`} 
                                    onClick={handleLinkClick}
                                    className="mobile-subcategory-link"
                                  >
                                    {subCat.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
              <li><a href="#contact" onClick={handleLinkClick}>{t('nav.contact')}</a></li>
              <li><a href="#carousel" onClick={handleLinkClick}>{t('nav.gallery')}</a></li>
              <li><a href="#about" onClick={handleLinkClick}>{t('nav.about')}</a></li>
            </ul>
          </div>
        </div>

        {/* תפריט דסקטופ */
        }
        <ul className="desktop-menu" style={{flex: 1, display: 'flex', flexDirection: 'row-reverse', alignItems: 'center', margin: 0, padding: 0}}>
          <li>
            <Link to="/" className="brand-btn no-bg" onClick={handleBrandClick} style={{fontWeight: 900, letterSpacing: '2px', color: '#c59b27'}}>
              {t('brand') || 'DIG'}
            </Link>
          </li>
          <li 
            className="dropdown"
            ref={dropdownRef}
            onMouseEnter={handleDropdownEnter}
            onMouseLeave={handleDropdownLeave}
          >
            <Link to="/shop#products" onClick={handleLinkClick} style={{display: 'flex', alignItems: 'center', gap: 6}}>
              {t('nav.products')}
              <FaChevronDown size={12} />
            </Link>
            {isDesktopProductsOpen && categories.length > 0 && (
              <div 
                className="dropdown-menu" 
                dir={dir}
                onMouseEnter={handleDropdownEnter}
                onMouseLeave={handleDropdownLeave}
              >
                <ul>
                  {categories.map((cat) => {
                    const categorySubCategories = getSubCategoriesForCategory(cat.id);
                    return (
                      <li 
                        key={cat.id} 
                        className={categorySubCategories.length > 0 ? 'has-submenu' : ''}
                        onMouseEnter={() => handleSubmenuEnter(cat.id)}
                        onMouseLeave={handleSubmenuLeaveGuarded}
                      >
                        <Link to={`/shop?category=${cat.id}#products`} onClick={handleLinkClick}>
                          {cat.name}
                          {categorySubCategories.length > 0 && (
                            <span style={{ 
                              marginLeft: dir === 'rtl' ? '0' : '8px',
                              marginRight: dir === 'rtl' ? '8px' : '0', 
                              fontSize: '12px', 
                              color: '#999',
                              fontWeight: 'normal'
                            }}>
                              {dir === 'rtl' ? '◄' : '►'}
                            </span>
                          )}
                        </Link>
                        {categorySubCategories.length > 0 && hoveredSubmenu === cat.id && (
                          <ul 
                            className="submenu"
                            onMouseEnter={() => handleSubmenuEnter(cat.id)}
                            onMouseLeave={handleSubmenuLeaveGuarded}
                            style={{ display: 'block' }}
                          >
                            <li style={{ listStyle: 'none' }}>
                              <Link 
                                to={`/shop?category=${cat.id}#products`}
                                onClick={handleLinkClick}
                                style={{
                                  padding: '10px 16px',
                                  fontSize: '14px',
                                  color: '#c59b27',
                                  display: 'block',
                                  textDecoration: 'none',
                                  borderRadius: '8px',
                                  margin: '2px 0',
                                  fontWeight: 'bold',
                                  borderBottom: '1px solid #e0e0e0',
                                  marginBottom: '8px'
                                }}
                              >
                                {cat.name} - כל התת-קטגוריות
                              </Link>
                            </li>
                            {categorySubCategories.map((subCat) => (
                              <li key={subCat.id} style={{ listStyle: 'none' }}>
                                <Link 
                                  to={`/shop?category=${cat.id}&sub_category=${subCat.id}#products`}
                                  onClick={handleLinkClick}
                                >
                                  {subCat.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
          <li><a href="#contact">{t('nav.contact')}</a></li>
          <li><a href="#carousel">{t('nav.gallery')}</a></li>
          <li><a href="#about">{t('nav.about')}</a></li>
        </ul>

        {/* כפתורי קשר - תמיד גלויים */}
        <div style={{display: 'flex', gap: '8px', margin: '0 12px 0 0', alignItems: 'center'}}>
          <a
            href="https://wa.me/972505242857?text=שלום,%20אני%20מעוניין%20בייעוץ%20סטיילינג%20לאקססוריז%20של%20DIG%20לחתונה%20או%20לאירוע"
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-btn"
            title="ייעוץ סטיילינג בוואטסאפ"
          >
            <FaWhatsapp size={20} style={{ color: '#25D366', verticalAlign: 'middle' }} />
          </a>
          <a 
            href="tel:0505242857" 
            className="phone-btn"
            title="חייג לסטייליסט של DIG"
          >
            <FaPhone size={20} style={{ color: '#c59b27', verticalAlign: 'middle' }} />
          </a>
        </div>
      </nav>
      <div className="banner-container">
        <img src="/dig_banner.svg" alt="DIG - אקססוריז יוקרתיים לגבר" className="banner-img" />
      </div>
    </>
  );
}

export default Header; 