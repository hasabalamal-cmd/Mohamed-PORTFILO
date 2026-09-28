import React, { useMemo, useState } from 'react';
import {
  Search,
  X,
  ArrowRight,
  ChevronDown,
  Grid2x2,
  Grid3x3,
  Camera,
  Image as ImageIcon,
  ImageOff,
} from 'lucide-react';

const PAGE_SIZE = 9;

export default function AllWorksPage({
  categories = [],
  projects = [],
  imageCounts = {},
  loading = false,
  initialCategoryId = 'all',
  initialQuery = '',
  t,
}) {
  const [categoryId, setCategoryId] = useState(initialCategoryId || 'all');
  const [query, setQuery] = useState(initialQuery || '');
  const [sort, setSort] = useState('newest');
  const [columns, setColumns] = useState(3);
  const [visible, setVisible] = useState(PAGE_SIZE);

  /* The page is remounted (keyed by the route filters) whenever the visitor
     arrives from the nav dropdown or the header search, so the local state above
     is always in sync – no state syncing effects needed. */
  const applyCategory = (nextCategoryId) => {
    setCategoryId(nextCategoryId);
    setVisible(PAGE_SIZE);
  };

  const applyQuery = (nextQuery) => {
    setQuery(nextQuery);
    setVisible(PAGE_SIZE);
  };

  const applySort = (nextSort) => {
    setSort(nextSort);
    setVisible(PAGE_SIZE);
  };

  const filteredProjects = useMemo(() => {
    const term = query.trim().toLowerCase();

    const list = projects.filter((project) => {
      if (categoryId !== 'all' && project.category_id !== categoryId) return false;
      if (!term) return true;
      return (
        (project.name || '').toLowerCase().includes(term) ||
        (project.category_name || '').toLowerCase().includes(term)
      );
    });

    const sorted = [...list];
    if (sort === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sort === 'oldest') {
      sorted.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return sorted;
  }, [projects, categoryId, query, sort]);

  const shownProjects = filteredProjects.slice(0, visible);
  const hasFilters = categoryId !== 'all' || query.trim() !== '';

  const clearFilters = () => {
    setCategoryId('all');
    setQuery('');
    setVisible(PAGE_SIZE);
  };

  return (
    <main className="works-page">
      {/* ---------------- Page hero ---------------- */}
      <header className="works-hero">
        <div className="container">
          <nav className="works-breadcrumb" aria-label="Breadcrumb">
            <a href="#home">{t('breadcrumb_home')}</a>
            <span aria-hidden="true">/</span>
            <span>{t('breadcrumb_works')}</span>
          </nav>

        </div>
      </header>

      {/* ---------------- Sticky filter toolbar ---------------- */}
      <div className="works-toolbar">
        <div className="container works-toolbar-inner">
          <label className="works-search">
            <Search size={17} className="works-search-icon" />
            <input
              type="search"
              value={query}
              onChange={(event) => applyQuery(event.target.value)}
              placeholder={t('search_works_placeholder')}
              aria-label={t('search_works_placeholder')}
            />
            {query && (
              <button
                type="button"
                className="works-search-clear"
                onClick={() => applyQuery('')}
                aria-label={t('clear_filters')}
              >
                <X size={15} />
              </button>
            )}
          </label>

          <div className="works-sort">
            <select value={sort} onChange={(event) => applySort(event.target.value)} aria-label={t('sort_label')}>
              <option value="newest">{t('sort_newest')}</option>
              <option value="oldest">{t('sort_oldest')}</option>
              <option value="az">{t('sort_az')}</option>
            </select>
            <ChevronDown size={15} className="works-sort-caret" aria-hidden="true" />
          </div>

          <div className="works-density" role="group" aria-label={t('grid_size')}>
            <button
              type="button"
              className={columns === 2 ? 'active' : ''}
              onClick={() => setColumns(2)}
              aria-label="2 columns"
              aria-pressed={columns === 2}
            >
              <Grid2x2 size={16} />
            </button>
            <button
              type="button"
              className={columns === 3 ? 'active' : ''}
              onClick={() => setColumns(3)}
              aria-label="3 columns"
              aria-pressed={columns === 3}
            >
              <Grid3x3 size={16} />
            </button>
          </div>
        </div>

        {/* Category pills */}
        <div className="container">
          <div className="works-categories">
            <button
              type="button"
              className={`filter-tab-btn${categoryId === 'all' ? ' active' : ''}`}
              onClick={() => applyCategory('all')}
            >
              {t('all_works')}
            </button>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                className={`filter-tab-btn${categoryId === cat.id ? ' active' : ''}`}
                onClick={() => applyCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* ---------------- Results ---------------- */}
      <section className="works-results">
        <div className="container">
          <div className="works-results-row">
            <p className="works-results-text">
              {t('showing_results')} <strong>{shownProjects.length}</strong> {t('results_of')}{' '}
              <strong>{filteredProjects.length}</strong> {t('projects_total')}
            </p>
            {hasFilters && (
              <button type="button" className="works-clear-btn" onClick={clearFilters}>
                <X size={14} /> {t('clear_filters')}
              </button>
            )}
          </div>

          {loading ? (
            <div className={`works-grid cols-${columns}`} aria-busy="true">
              {[0, 1, 2, 3, 4, 5].map((key) => (
                <div className="work-card-skeleton" key={key}>
                  <span className="skeleton-media" />
                  <span className="skeleton-line skeleton-w-60" />
                  <span className="skeleton-line skeleton-w-40" />
                </div>
              ))}
            </div>
          ) : shownProjects.length === 0 ? (
            <div className="works-empty">
              <ImageOff size={42} className="text-gold" />
              <h3>{t('no_results_title')}</h3>
              <p>{t('no_results_desc')}</p>
              <button type="button" className="btn-dark" onClick={clearFilters}>
                {t('clear_filters')}
              </button>
            </div>
          ) : (
            <div className={`works-grid cols-${columns}`}>
              {shownProjects.map((project) => {
                const photos = imageCounts[project.id] || 0;
                return (
                  <a
                    key={project.id}
                    href={`#/project/${project.id}`}
                    className="work-card"
                    aria-label={`${project.name} — ${t('view_project_photos')}`}
                  >
                    <span className="work-card-media">
                      <img src={project.cover_image} alt={project.name} loading="lazy" />
                      <span className="work-card-count">
                        <ImageIcon size={13} /> {photos}
                      </span>
                      <span className="work-card-hover">
                        <span className="work-card-cta">
                          <Camera size={16} /> {t('view_project_photos')}
                        </span>
                      </span>
                    </span>

                    <span className="work-card-body">
                      <span className="work-card-category">{project.category_name}</span>
                      <h3 className="work-card-title">{project.name}</h3>
                      <span className="work-card-meta">
                        {photos} {t('photos_unit')}
                        <ArrowRight size={14} className="flip-on-rtl" />
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          )}

          {!loading && shownProjects.length < filteredProjects.length && (
            <div className="works-more">
              <button
                type="button"
                className="btn-gold works-more-btn"
                onClick={() => setVisible((value) => value + PAGE_SIZE)}
              >
                {t('load_more')} <ArrowRight size={15} className="flip-on-rtl" />
              </button>
            </div>
          )}
        </div>
      </section>

    </main>
  );
}
