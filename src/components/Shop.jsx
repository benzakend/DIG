import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Shop() {
  const { t, i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : (i18n.language === 'he' ? 'rtl' : 'ltr');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const productsAbortRef = useRef(null);
  const hasScrolledOnceRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const location = useLocation();
  const productsStartRef = useRef(null);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // בחירת URL לפי סביבה
  const apiUrl = import.meta.env.DEV 
    ? 'http://localhost:8000' 
    : '';

  // Fetch categories once on mount
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch subcategories when category filter changes
  useEffect(() => {
    fetchSubCategories();
    // If categories are cleared or more than one selected, clear subcategory filters to avoid sticky URL params
    if (selectedCategories.length === 0 && selectedSubCategories.length > 0) {
      setSelectedSubCategories([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories]);

  // After subcategories load for the selected category, prune invalid subcategory selections
  useEffect(() => {
    if (selectedCategories.length === 1 && selectedSubCategories.length > 0) {
      const allowed = new Set(
        subCategories
          .filter(sc => sc.category === Number(selectedCategories[0]))
          .map(sc => sc.id.toString())
      );
      const filtered = selectedSubCategories.filter(id => allowed.has(id));
      if (filtered.length !== selectedSubCategories.length) {
        setSelectedSubCategories(filtered);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subCategories]);

  // Fetch products when any filter/search/page changes
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedSubCategories, searchQuery, page]);

  // Parse URL on navigation once and initialize filters (legacy behavior)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParams = params.getAll('category');
    const subCategoryParams = params.getAll('sub_category');
    const q = params.get('search') || '';
    const p = parseInt(params.get('page') || '1', 10);
    if (categoryParams.length > 0) {
      setSelectedCategories(categoryParams);
    } else {
      setSelectedCategories([]);
    }
    if (subCategoryParams.length > 0) {
      setSelectedSubCategories(subCategoryParams);
    } else {
      setSelectedSubCategories([]);
    }
    if (q) setSearchQuery(q);
    if (!Number.isNaN(p) && p > 0) setPage(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Legacy fetchers
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/categories/`);
      if (response.ok) {
        const data = await response.json();
        const categoriesData = data.results || data;
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const fetchSubCategories = async () => {
    try {
      let url = `${apiUrl}/api/subcategories/`;
      if (selectedCategories.length > 0) {
        const categoryParams = selectedCategories.map(cat => `category=${cat}`).join('&');
        url += `?${categoryParams}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const subCategoriesData = data.results || data;
        setSubCategories(Array.isArray(subCategoriesData) ? subCategoriesData : []);
      }
    } catch (err) {
      console.error('Error fetching sub-categories:', err);
      setSubCategories([]);
    }
  };

  const fetchProducts = async () => {
    try {
      // Cancel any in-flight products request
      if (productsAbortRef.current) {
        productsAbortRef.current.abort();
      }
      const controller = new AbortController();
      productsAbortRef.current = controller;
      if (!initialLoadDoneRef.current) {
        setLoading(true);
      }
      let url = `${apiUrl}/api/products/`;
      const params = [];
      if (selectedCategories.length > 0) {
        const categoryParams = selectedCategories.map(cat => `category=${cat}`).join('&');
        params.push(categoryParams);
      }
      if (selectedSubCategories.length > 0) {
        const subCategoryParams = selectedSubCategories.map(subCat => `sub_category=${subCat}`).join('&');
        params.push(subCategoryParams);
      }
      if (searchQuery.trim()) {
        params.push(`search=${encodeURIComponent(searchQuery.trim())}`);
      }
      params.push(`page=${page}`);
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        // Non-paginated fallback
        setProducts(data);
        setTotalCount(data.length);
        setPageCount(Math.max(1, Math.ceil(data.length / 16)));
      } else {
        setProducts(data.results || []);
        setTotalCount(typeof data.count === 'number' ? data.count : (data.results || []).length);
        if (typeof data.count === 'number') {
          setPageCount(Math.max(1, Math.ceil(data.count / 16)));
        } else {
          setPageCount(1);
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setProducts([]);
        setTotalCount(0);
        setPageCount(1);
      }
    } finally {
      if (!initialLoadDoneRef.current) {
        setLoading(false);
        initialLoadDoneRef.current = true;
      }
    }
  };

  // Reset to first page when filters or search change
  useEffect(() => {
    setPage(1);
    // Update URL page parameter to 1
    const params = new URLSearchParams(location.search);
    if (params.get('page') !== '1') {
      params.set('page', '1');
      const newUrl = `${location.pathname}?${params.toString()}${location.hash || ''}`;
      window.history.replaceState(null, '', newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedSubCategories, searchQuery]);

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > pageCount || nextPage === page) return;
    setPage(nextPage);
    const params = new URLSearchParams(location.search);
    params.set('page', String(nextPage));
    const newUrl = `${location.pathname}?${params.toString()}${location.hash || ''}`;
    window.history.pushState(null, '', newUrl);
  };

  // גלול לעוגן בעת טעינת הקומפוננט – פעם אחת בלבד כדי למנוע "רפרוש" בזמן סינון
  useLayoutEffect(() => {
    if (!hasScrolledOnceRef.current && location.hash === '#products' && productsStartRef.current) {
      setTimeout(() => {
        productsStartRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      hasScrolledOnceRef.current = true;
    }
  }, [location.hash]);

  // If data finished loading after mount, perform one-time scroll as well
  useEffect(() => {
    if (!hasScrolledOnceRef.current && !loading && location.hash === '#products' && productsStartRef.current) {
      setTimeout(() => {
        productsStartRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      hasScrolledOnceRef.current = true;
    }
  }, [loading, location.hash]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Removed individual fetchers in favor of bootstrap endpoint

  if (loading) {
    return (
      <div className="shop-section" dir={dir}>
        <div style={{ 
          maxWidth: '950px', 
          margin: '0 auto', 
          padding: '0 20px',
          textAlign: 'center', 
          paddingTop: '50px',
          paddingBottom: '50px'
        }}>
          <div>טוען מוצרים...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shop-section" dir={dir}>
        <div style={{ 
          maxWidth: '950px', 
          margin: '0 auto', 
          padding: '0 20px',
          textAlign: 'center', 
          paddingTop: '50px',
          paddingBottom: '50px',
          color: 'red' 
        }}>
          שגיאה: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="shop-section" dir={dir}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 20px'
      }}>
        {/* כותרת */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: '30px',
          marginTop: '20px'
        }}>
          <h1 style={{ margin: 0 }}>המוצרים שלנו</h1>
          <p style={{ 
            marginTop: '15px',
            fontSize: '16px',
            color: '#666',
            lineHeight: '1.6'
          }}>
            לא מצאתם את מה שחיפשתם? ישנם שלל מוצרים נוספים שאינם נמצאים באתר.<br />
            לבירורים נוספים ויעוץ ניתן לפנות אל: <a href="tel:0505242857" style={{ color: '#388e3c', fontWeight: 'bold', textDecoration: 'none' }}>0505242857</a>
          </p>
        </div>
        <div id="products" ref={productsStartRef} />

        {/* Search and Filter above products - centered */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {/* Search Box */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%'
          }}>
            <div style={{
              maxWidth: '300px',
              width: '100%'
            }}>
              <input
                type="text"
                placeholder="חיפוש אקססוריז, עניבות, פפיונים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  border: '2px solid #c59b27',
                  borderRadius: '10px',
                  fontSize: '16px',
                  outline: 'none',
                  textAlign: 'right',
                  backgroundColor: 'white',
                  boxShadow: '0 4px 12px rgba(197, 155, 39, 0.15)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {products.map((product) => (
              <Link 
                key={product.id} 
                to={`/product/${product.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="product-card" style={{
                  border: '1px solid #f0e6d2',
                  borderRadius: '14px',
                  padding: '18px',
                  textAlign: 'center', 
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  cursor: 'pointer',
                  background: 'white',
                  minHeight: '430px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxSizing: 'border-box',
                  position: 'relative',
                  boxShadow: '0 4px 15px rgba(10, 25, 47, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(197, 155, 39, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(10, 25, 47, 0.05)';
                }}
                >
                  {/* תג "מוצר מומלץ" */}
                  {product.featured && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'linear-gradient(135deg, #c59b27, #f6e07b)',
                      color: '#071224',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 8px rgba(197, 155, 39, 0.4)'
                    }}>
                      ✦ נבחר לאירוע
                    </div>
                  )}

                  <div style={{ marginBottom: '15px', flex: '1', overflow: 'hidden', borderRadius: '10px' }}>
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        transition: 'transform 0.3s'
                      }}
                    />
                  </div>

                  <h3 style={{ 
                    margin: '0 0 10px 0',
                    fontSize: '17px',
                    fontWeight: 'bold',
                    color: '#071224'
                  }}>
                    {product.name}
                  </h3>
                  
                  {/* Price Display */}
                  {product.price && (
                    <div style={{
                      margin: '0 0 8px 0',
                      fontSize: '20px',
                      fontWeight: '800',
                      color: '#c59b27'
                    }}>
                      ₪{product.price}
                    </div>
                  )}

                  {/* Category and Sub-Category Display */}
                  <div style={{
                    margin: '0 0 10px 0',
                    fontSize: '12px',
                    color: '#888'
                  }}>
                    <div style={{ marginBottom: '2px' }}>
                      <strong>קולקציה:</strong> {product.category_name}
                    </div>
                  </div>
                  
                  <p style={{ 
                    margin: '0 0 15px 0',
                    color: '#555',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    flex: '1'
                  }}>
                    {product.description.length > 70 
                      ? `${product.description.substring(0, 70)}...` 
                      : product.description
                    }
                  </p>

                  {/* כפתור צפייה בפרטים */}
                  <button
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #c59b27, #aa7c11)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'filter 0.2s',
                      boxShadow: '0 4px 12px rgba(197, 155, 39, 0.25)'
                    }}
                  >
                    צפייה בפריט והזמנה
                  </button>
                </div>
              </Link>
            ))}

          {products.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>אין מוצרים זמינים כרגע בקטגוריה זו</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {pageCount > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            margin: '24px 0'
          }}>
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #bbb',
                background: page <= 1 ? '#f1f1f1' : '#fff',
                color: '#388e3c',
                cursor: page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              הקודם
            </button>
            <span style={{ color: '#666', fontSize: '14px' }}>
              עמוד {page} מתוך {pageCount} ({totalCount} מוצרים)
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= pageCount}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #bbb',
                background: page >= pageCount ? '#f1f1f1' : '#fff',
                color: '#388e3c',
                cursor: page >= pageCount ? 'not-allowed' : 'pointer'
              }}
            >
              הבא
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Shop; 