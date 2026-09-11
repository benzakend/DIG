import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header';
import Benefits from './components/Benefits';
import Carousel from './components/Carousel';
import About from './components/About';
import Contact from './components/Contact';
import Logos from './components/Logos';
import FAQ from './components/FAQ';
import Shop from './components/Shop';
import ProductDetail from './components/ProductDetail';
import './App.css';

function App() {
  // טיפול בניווט hash מכל דף
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const id = hash.replace('#', '');
      // עוגנים שרלוונטיים רק לדף הראשי
      const homeAnchors = new Set(['about', 'benefits', 'carousel', 'contact', 'logos']);
      // נבצע ניתוב לדף הראשי רק עבור עוגנים המוגדרים בו
      if (homeAnchors.has(id) && window.location.pathname !== '/') {
        window.location.href = `/${hash}`;
      }
    };

    // בדיקה ראשונית
    handleHashChange();

    // האזנה לשינויים ב-URL
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <Router>
      <div className="main-container" dir="rtl">
        <Header />
        
        <Routes>
          {/* דף ראשי */}
          <Route path="/" element={
            <div className="site-center-wrapper">
              <About id="about" />
              <Carousel id="carousel" />
              <Benefits id="benefits" />
              <Contact id="contact" />
              <FAQ id="faq" />
              <Logos id="logos" />
            </div>
          } />
          
          {/* דף חנות - רק להצגת מוצרים */}
          <Route path="/shop" element={<Shop />} />
          
          {/* דף מוצר בודד - רק להצגת פרטי מוצר */}
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
