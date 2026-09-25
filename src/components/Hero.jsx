import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function Hero({ t }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: 'https://wallpapers.com/images/hd/dslr-background-xxpxqsnnl0hybp29.jpg',
    },
    {
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80',
    },
    {
      image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80',
    },
  ];

  const active = slides[currentSlide];

  return (
    <section id="home" className="lenso-hero-section">
      {/* Background with Dark Vignette & Photographer image */}
      <div
        className="hero-backdrop"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(13, 13, 13, 0.95) 15%, rgba(13, 13, 13, 0.65) 55%, rgba(13, 13, 13, 0.25) 100%), url(${active.image})`,
        }}
      />

      <div className="container hero-content-container">
        <div className="hero-text-block">
          {/* Tagline */}
          <span className="hero-tagline">{t('hero_tagline')}</span>

          {/* Large Serif Title */}
          <h1 className="hero-main-title">
            {t('hero_title_1')} <br />
            {t('hero_title_2')}
            <em className="hero-italic-gold">{t('hero_title_italic')}</em>
          </h1>

          {/* Description: intentionally omitted – the hero carries a single, focused call to action */}

          {/* Actions */}
          <div className="hero-cta-group">
            <a href="#portfolio" className="btn-gold hero-btn-primary">
              {t('view_portfolio')} <ArrowRight size={16} className="flip-on-rtl" />
            </a>
          </div>

          {/* Slide Indicator (01 —— 02 — 03) */}
          <div className="hero-slider-pagination">
            {slides.map((_, idx) => {
              const formattedNum = String(idx + 1).padStart(2, '0');
              const isActive = idx === currentSlide;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`slide-num-btn ${isActive ? 'active' : ''}`}
                >
                  <span className="num-text">{formattedNum}</span>
                  <span className={`slide-bar ${isActive ? 'active-bar' : ''}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
