import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TestimonialsSection({ t, lang }) {
  const [startIndex, setStartIndex] = useState(0);

  const testimonialsEn = [
    {
      id: 1,
      quote: 'Absolutely amazing experience! The photos were beyond our expectations.',
      name: 'Sarah Johnson',
      role: 'Bride',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 2,
      quote: 'Professional, creative and so easy to work with. Highly recommended!',
      name: 'Michael Brown',
      role: 'Business Owner',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 3,
      quote: 'They captured every emotion perfectly. We will cherish these forever.',
      name: 'Emily Davis',
      role: 'Model',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 4,
      quote: 'The architectural lines and lighting they managed to capture in our project were truly breathtaking.',
      name: 'David Wilson',
      role: 'Architect',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
  ];

  const testimonialsAr = [
    {
      id: 1,
      quote: 'تجربة ساحرة تفوق الوصف! الصور التي التقطوها ليوم زفافنا فاقت كل توقعاتنا بجمالها ودقتها.',
      name: 'سارة جونسون',
      role: 'عروس',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 2,
      quote: 'احترافية استثنائية، وحس إبداعي مذهل وسلاسة تامة في التعامل. أنصح بهم بشدة لكل من يبحث عن التميز!',
      name: 'مايكل براون',
      role: 'رائد أعمال',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 3,
      quote: 'استطاعوا التقاط كل انفعال ونظرة بصدق ودفء. هذه الصور ستبقى كنزاً ثميناً نعتز به دائماً.',
      name: 'إميلي ديفيس',
      role: 'عارضة أزياء',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 4,
      quote: 'تجسيد الخطوط الهندسية وتوزيع الإضاءة لمشاريعنا المعمارية كان مبهراً وتجاوز مستوى الإتقان.',
      name: 'ديفيد ويلسون',
      role: 'مهندس معماري',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
  ];

  const testimonials = lang === 'ar' ? testimonialsAr : testimonialsEn;

  const prevSlide = () => {
    setStartIndex((prev) => (prev === 0 ? testimonials.length - 3 : prev - 1));
  };

  const nextSlide = () => {
    setStartIndex((prev) => (prev >= testimonials.length - 3 ? 0 : prev + 1));
  };

  const visibleTestimonials = [
    testimonials[startIndex % testimonials.length],
    testimonials[(startIndex + 1) % testimonials.length],
    testimonials[(startIndex + 2) % testimonials.length],
  ];

  return (
    <section id="testimonials" className="lenso-testimonials-section">
      <div className="container">
        {/* Section Heading with subtle accent line */}
        <div className="testimonials-header text-center">
          <h2 className="testimonials-title">{t('what_clients_say')}</h2>
        </div>

        {/* Carousel Wrapper with Left/Right Arrows */}
        <div className="testimonials-carousel-wrapper">
          <button
            onClick={prevSlide}
            className="carousel-nav-btn btn-prev"
            aria-label="Previous Testimonials"
          >
            <ChevronLeft size={22} className="flip-on-rtl" />
          </button>

          <div className="testimonials-cards-grid">
            {visibleTestimonials.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="testimonial-card">
                {/* Gold Quote Mark */}
                <div className="quote-mark-icon">
                  <span className="quote-glyph">“</span>
                </div>

                {/* Quote Text */}
                <p className="testimonial-text">{item.quote}</p>

                {/* Client Profile */}
                <div className="testimonial-author">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="author-avatar"
                    loading="lazy"
                  />
                  <div className="author-info">
                    <h4 className="author-name">{item.name}</h4>
                    <span className="author-role">{item.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="carousel-nav-btn btn-next"
            aria-label="Next Testimonials"
          >
            <ChevronRight size={22} className="flip-on-rtl" />
          </button>
        </div>
      </div>
    </section>
  );
}
