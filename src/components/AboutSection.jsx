import React from 'react';
import { Camera, Star, Heart } from 'lucide-react';
import aboutImage from '../assets/about-ayman.jpeg';

export default function AboutSection({ t }) {
  return (
    <section id="about" className="lenso-about-section">
      <div className="container about-grid-layout">
        {/* 1. Left: Featured Image */}
        <div className="about-visual-column">
          <div className="about-images-wrapper">
            <div className="about-main-image">
              <img
                src={aboutImage}
                alt="Together We Rise event in a photography studio"
                fetchPriority="high"
              />
            </div>
          </div>
        </div>

        {/* 2. Middle: Story, Description & Signature */}
        <div className="about-content-column">
          <span className="section-subtitle">{t('about_us')}</span>
          <h2 className="section-title text-dark about-heading">
            {t('about_title_1')} <br />
            {t('about_title_2')}
          </h2>
          <p className="about-description">
            {t('about_p1')}
          </p>
          <p className="about-sub-description">
            {t('about_p2')}
          </p>

          {/* Founder Signature */}
          <div className="about-signature-block">
            <span className="founder-signature-script">{t('founder_name')}</span>
            <span className="founder-title">{t('founder_role')}</span>
          </div>
        </div>

        {/* 3. Right: 3 Key Statistics with Outlined Icons */}
        <div className="about-stats-column">
          <div className="stat-card">
            <div className="stat-icon-wrapper">
              <Camera size={30} strokeWidth={1.5} className="stat-icon" />
            </div>
            <div className="stat-info">
              <span className="stat-number">{t('stat_1_num')}</span>
              <span className="stat-label">{t('stat_1_label')}</span>
            </div>
          </div>

          <div className="stat-divider-line" />

          <div className="stat-card">
            <div className="stat-icon-wrapper">
              <Star size={30} strokeWidth={1.5} className="stat-icon" />
            </div>
            <div className="stat-info">
              <span className="stat-number">{t('stat_2_num')}</span>
              <span className="stat-label">{t('stat_2_label')}</span>
            </div>
          </div>

          <div className="stat-divider-line" />

          <div className="stat-card">
            <div className="stat-icon-wrapper">
              <Heart size={30} strokeWidth={1.5} className="stat-icon" />
            </div>
            <div className="stat-info">
              <span className="stat-number">{t('stat_3_num')}</span>
              <span className="stat-label">{t('stat_3_label')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
