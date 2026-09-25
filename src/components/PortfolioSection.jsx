import React, { useState } from 'react';
import { ArrowRight, Eye, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function PortfolioSection({
  categories = [],
  projects = [],
  imageCounts = {},
  t,
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');

  // Filter projects by category if selected
  const displayedProjects =
    selectedCategoryId === 'all'
      ? projects
      : projects.filter((p) => p.category_id === selectedCategoryId);

  const visibleProjects = displayedProjects.slice(0, 6);
  const hasMoreProjects = displayedProjects.length > visibleProjects.length;

  return (
    <section id="portfolio" className="lenso-portfolio-section">
      <div className="container">
        {/* Section Top Header */}
        <div className="portfolio-header-row">
          <div className="portfolio-title-group">
            <span className="section-subtitle">{t('our_work')}</span>
            <h2 className="section-title text-dark">{t('photography_portfolio')}</h2>
          </div>
          <div className="portfolio-action-group">
            <a href="#/works" className="btn-dark">
              {t('view_all_work')} <ArrowRight size={15} className="flip-on-rtl" />
            </a>
          </div>
        </div>

        {/* Category Filter Tabs */}
        {categories.length > 0 && (
          <div className="portfolio-filter-tabs">
            <button
              className={`filter-tab-btn ${selectedCategoryId === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategoryId('all')}
            >
              {t('all_works')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`filter-tab-btn ${selectedCategoryId === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* 6 Cards Grid (2 rows x 3 columns) */}
        <div className="portfolio-cards-grid">
          {visibleProjects.map((proj) => {
            const photos = imageCounts[proj.id] || 0;
            return (
              <a
                key={proj.id}
                href={`#/project/${proj.id}`}
                className="portfolio-card"
                aria-label={`${proj.name} — ${t('view_project_photos')}`}
              >
                {/* Background Image */}
                <span
                  className="card-bg-image"
                  style={{
                    backgroundImage: `url(${proj.cover_image})`,
                  }}
                />

                {/* Dark Vignette Overlay */}
                <span className="card-gradient-overlay" />

                {/* Photo count badge */}
                {photos > 0 && (
                  <span className="card-photos-badge">
                    <ImageIcon size={13} /> {photos}
                  </span>
                )}

                {/* Card Content at bottom */}
                <span className="card-info-content">
                  <span className="card-category-badge">{proj.category_name}</span>
                  <h3 className="card-project-title">{proj.name}</h3>
                  <span className="card-view-gallery-link">
                    <span>{t('view_gallery')}</span>
                    <ArrowRight size={14} className="link-arrow-icon flip-on-rtl" />
                  </span>
                </span>

                {/* Hover zoom eye badge */}
                <span className="card-hover-action">
                  <span className="hover-circle-icon">
                    <Eye size={20} />
                  </span>
                </span>
              </a>
            );
          })}
        </div>

        {hasMoreProjects && (
          <div className="portfolio-more-row">
            <a href="#/works" className="btn-outline-dark">
              {t('load_more')} <ArrowRight size={15} className="flip-on-rtl" />
            </a>
          </div>
        )}

        {displayedProjects.length === 0 && (
          <div className="empty-portfolio-state">
            <Sparkles size={36} className="text-gold" />
            <p>{t('no_projects_found')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
