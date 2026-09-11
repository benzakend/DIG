import { useState, useEffect } from 'react';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function NextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <button
      className={className + " custom-arrow next-arrow"}
      style={{ ...style, display: "block" }}
      onClick={onClick}
      aria-label="הבא"
    >
      <FaChevronRight size={28} />
    </button>
  );
}

function PrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <button
      className={className + " custom-arrow prev-arrow"}
      style={{ ...style, display: "block" }}
      onClick={onClick}
      aria-label="הקודם"
    >
      <FaChevronLeft size={28} />
    </button>
  );
}

function Carousel({ id }) {
  const [productImages, setProductImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const sectionRef = useRef(null);
  const location = useLocation();

  // גלול לסקשן אם יש hash
  useLayoutEffect(() => {
    if (location.hash === `#${id}` && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.hash, id]);

  // בחירת URL לפי סביבה
  const apiUrl = import.meta.env.DEV 
    ? 'http://localhost:8000' 
    : '';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('Fetching gallery products for carousel...');
        const response = await fetch(`${apiUrl}/api/products/gallery/`);
        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Fetched gallery data:', data);

          // The backend returns an object with results
          const products = data.results || data;
          console.log('Gallery products array:', products);

          // Take images of products with images
          const imagesWithProducts = products
            .filter(product => {
              console.log(`Product ${product.name}: image_url = "${product.image_url}"`);
              return product.image_url && product.image_url.trim() !== '';
            })
            .map(product => ({
              src: product.image_url.startsWith('http') ? product.image_url : `${apiUrl}${product.image_url}`,
              alt: product.name,
              productId: product.id
            }));

          console.log('Gallery product images found:', imagesWithProducts);

          if (imagesWithProducts.length > 0) {
            setProductImages(imagesWithProducts);
            console.log('Using gallery product images');
          } else {
            console.log('No gallery product images found, using fallback');
            // Only if there are no images at all, return to fallback
            const fallbackImages = [
              { src: "/480752047_1144442474048513_7393127402444032343_n.jpg", alt: "חלקי חילוף לטרקטורים ג'ון דיר במחסן אחים שאובי" },
              { src: "/480814480_1144433450716082_2311819371979960248_n.jpg", alt: "מגוון כלים חקלאיים וחלקי חילוף איכותיים" },
              { src: "/475327048_1124686409357453_2320466538876514635_n.jpg", alt: "שירות מקצועי ואמין לחלקי חילוף לכלים חקלאיים" }
            ];
            setProductImages(fallbackImages);
          }
        } else {
          console.log('Backend not available, using fallback images');
          const fallbackImages = [
            { src: "/480752047_1144442474048513_7393127402444032343_n.jpg", alt: "חלקי חילוף לטרקטורים ג'ון דיר במחסן אחים שאובי" },
            { src: "/480814480_1144433450716082_2311819371979960248_n.jpg", alt: "מגוון כלים חקלאיים וחלקי חילוף איכותיים" },
            { src: "/475327048_1124686409357453_2320466538876514635_n.jpg", alt: "שירות מקצועי ואמין לחלקי חילוף לכלים חקלאיים" }
          ];
          setProductImages(fallbackImages);
        }
      } catch (error) {
        console.error('Error fetching gallery products:', error);
        const fallbackImages = [
          { src: "/480752047_1144442474048513_7393127402444032343_n.jpg", alt: "חלקי חילוף לטרקטורים ג'ון דיר במחסן אחים שאובי" },
          { src: "/480814480_1144433450716082_2311819371979960248_n.jpg", alt: "מגוון כלים חקלאיים וחלקי חילוף איכותיים" },
          { src: "/475327048_1124686409357453_2320466538876514635_n.jpg", alt: "שירות מקצועי ואמין לחלקי חילוף לכלים חקלאיים" }
        ];
        setProductImages(fallbackImages);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [apiUrl]);

  const handleImageClick = (productId) => {
    if (productId) {
      navigate(`/product/${productId}`);
    }
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          autoplaySpeed: 3000,
        }
      }
    ]
  };

  if (loading) {
    return (
      <section id="carousel" className="carousel-section">
        <div className="loading">
          <div className="spinner"></div>
          <p>טוען תמונות...</p>
        </div>
      </section>
    );
  }

  return (
    <section id={id} className="carousel-section" ref={sectionRef}>
      <Slider {...settings}>
        {productImages.map((image, index) => (
          <div key={index}>
            <img
              src={image.src}
              alt={image.alt}
              loading="lazy"
              onClick={() => handleImageClick(image.productId)}
              style={{ cursor: image.productId ? 'pointer' : 'default' }}
            />
          </div>
        ))}
      </Slider>
    </section>
  );
}

export default Carousel; 