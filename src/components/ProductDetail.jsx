import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

function ProductDetail() {
  const { t, i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : (i18n.language === 'he' ? 'rtl' : 'ltr');
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // בחירת URL לפי סביבה
  const apiUrl = import.meta.env.DEV 
    ? `http://localhost:8000/api/products/${id}/` 
    : `https://shaubi-brothers.co.il/api/products/${id}/`;

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Product not found');
      }
      const data = await response.json();
      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  if (loading) {
    return (
      <div className="product-detail-section" dir={dir}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>טוען פרטי מוצר...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-section" dir={dir}>
        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
          שגיאה: {error}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-section" dir={dir}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>מוצר לא נמצא</div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-section" dir={dir}>
      <div style={{ 
        maxWidth: '950px', 
        margin: '0 auto', 
        padding: '0 20px',
        paddingTop: '20px',
        paddingBottom: '50px'
      }}>
        {/* כפתור חזרה */}
        <div style={{ marginBottom: '20px' }}>
          <Link 
            to="/shop" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: '#388e3c',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            ← חזרה לחנות
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          alignItems: 'start'
        }}>
          {/* תמונה */}
          <div>
            <img 
              src={product.image_url} 
              alt={product.name}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
          </div>

          {/* פרטי מוצר */}
          <div>
            <h1 style={{ 
              margin: '0 0 15px 0',
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#333'
            }}>
              {product.name}
            </h1>

            <p style={{ 
              margin: '0 0 20px 0',
              color: '#555',
              fontSize: '16px',
              lineHeight: '1.6'
            }}>
              {product.description}
            </p>

            {/* מחיר מוצר */}
            {product.price && (
              <div style={{
                marginBottom: '24px',
                fontSize: '28px',
                fontWeight: '900',
                color: '#c59b27',
                fontFamily: "'Heebo', sans-serif"
              }}>
                ₪{product.price}
              </div>
            )}

            {/* פרטים נוספים */}
            <div style={{ marginBottom: '30px' }}>
              {product.category_name && (
                <div style={{ marginBottom: '10px' }}>
                  <strong>קולקציה:</strong> {product.category_name}
                </div>
              )}
              
              {product.sub_category_name && (
                <div style={{ marginBottom: '10px' }}>
                  <strong>סוג פריט:</strong> {product.sub_category_name}
                </div>
              )}
              
              {product.sku && (
                <div style={{ marginBottom: '10px' }}>
                  <strong>קוד מוצר:</strong> {product.sku}
                </div>
              )}
            </div>

            {/* תגיות */}
            <div style={{ marginBottom: '30px' }}>
              {product.featured && (
                <div style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #c59b27, #f6e07b)',
                  color: '#071224',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(197, 155, 39, 0.3)'
                }}>
                  ✦ פריט נבחר לחתן ולאירועים
                </div>
              )}
            </div>

            {/* כפתור יצירת קשר */}
            <div style={{ 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              alignItems: 'center'
            }}>
              <a 
                href={`https://wa.me/972505242857?text=${encodeURIComponent(`שלום, אני מעוניין בפריט של DIG לחתונה / לאירוע:\n\n${product.name}\nמחיר: ₪${product.price || ''}\n\n${window.location.href}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#25d366',
                  color: 'white',
                  padding: '14px 28px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  width: '240px',
                  textAlign: 'center',
                  boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
                }}
              >
                הזמנה וייעוץ בוואטסאפ
              </a>
              
              <a 
                href="tel:0505242857"
                style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #c59b27, #aa7c11)',
                  color: 'white',
                  padding: '14px 28px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  width: '240px',
                  textAlign: 'center',
                  boxShadow: '0 4px 14px rgba(197, 155, 39, 0.3)'
                }}
              >
                שיחה עם סטייליסט DIG
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail; 