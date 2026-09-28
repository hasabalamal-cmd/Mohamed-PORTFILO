import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Search,
  Menu,
  X,
  ChevronRight,
  CalendarCheck,
  Languages,
} from 'lucide-react';

/* Below this width the main navigation collapses into the mobile drawer (tablets + phones) */
const DESKTOP_BREAKPOINT = 1025;

export default function Navbar({
  activeSection,
  onNavigate,
  onBookSession,
  onSearch,
  t,
  lang,
  onToggleLang,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  const searchInputRef = useRef(null);

  /* Main navigation entries */
  const primaryLinks = [
    { key: 'home', section: 'home', href: '#home' },
    { key: 'about', section: 'about', href: '#about' },
    { key: 'portfolio', section: 'portfolio', href: '#/works' },
    { key: 'gear', section: 'equipment', href: '#equipment' },
  ];

  const mobileDrawerLinks = [
    { key: 'home', section: 'home', href: '#home' },
    { key: 'portfolio', section: 'portfolio', href: '#/works' },
    { key: 'gear', section: 'equipment', href: '#equipment' },
    { key: 'contact', section: 'contact', href: '#contact' },
  ];

  const isPanelOpen = mobileMenuOpen || searchOpen;

  /* Close every overlay rendered by the header */
  const closePanels = () => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    /* released synchronously so in-page anchors can scroll straight away */
    document.body.style.overflow = '';
  };

  const handleNavigate = (section) => {
    closePanels();
    onNavigate(section);
  };

  const handleOpenBooking = () => {
    closePanels();
    if (onBookSession) onBookSession();
  };

  /* Compact header once the visitor starts scrolling */
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Escape key, breakpoint change and in-page navigation close the header panels */
  useEffect(() => {
    if (!mobileMenuOpen && !searchOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closePanels();
    };
    const onResize = () => {
      if (window.innerWidth >= DESKTOP_BREAKPOINT) setMobileMenuOpen(false);
    };
    const onHashChange = () => closePanels();

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('hashchange', onHashChange);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, [mobileMenuOpen, searchOpen]);

  /* Lock the page behind the opened drawer / search panel */
  useEffect(() => {
    if (!isPanelOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPanelOpen]);

  /* Focus the search field as soon as the panel opens */
  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  return (
    <header
      className={`lenso-navbar-header${isScrolled ? ' is-scrolled' : ''}${isPanelOpen ? ' panel-open' : ''}`}
    >
      {/* Dimmed backdrop shared by the drawer & the search panel */}
      <button
        type="button"
        tabIndex={isPanelOpen ? 0 : -1}
        className="nav-panel-backdrop"
        aria-label={lang === 'ar' ? 'إغلاق القائمة' : 'Close menu'}
        onClick={closePanels}
      />

      <div className="container navbar-container">
        {/* Brand Logo */}
        <a href="#home" className="lenso-logo" onClick={() => handleNavigate('home')}>
          <span className="logo-camera-icon">
            <Camera size={24} strokeWidth={1.8} />
          </span>
          <span className="logo-text-block">
            <span className="logo-title">MFM</span>
            <span className="logo-subtitle">PHOTOGRAPHER</span>
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav
          className="desktop-nav"
          aria-label={lang === 'ar' ? 'التنقل الرئيسي' : 'Primary navigation'}
        >
          <ul className="nav-links-list">
            {primaryLinks.map((item) => (
              <li key={item.key}>
                <a
                  href={item.href}
                  className={`nav-link${activeSection === item.section ? ' active' : ''}`}
                  onClick={() => handleNavigate(item.section)}
                >
                  {t(item.key)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Action Icons */}
        <div className="nav-actions">
          <button
            type="button"
            className="btn-lang-switcher nav-lang-btn"
            onClick={onToggleLang}
            title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
            aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          >
            <Languages size={15} />
            <span className="lang-switcher-label">{lang === 'en' ? 'العربية' : 'English'}</span>
          </button>

          <button
            type="button"
            className={`nav-icon-btn search-toggle${searchOpen ? ' active' : ''}`}
            aria-label={t('search_btn')}
            aria-expanded={searchOpen}
            onClick={() => {
              setMobileMenuOpen(false);
              setSearchOpen((prev) => !prev);
            }}
          >
            <Search size={20} />
          </button>

          <button
            type="button"
            className="nav-icon-btn mobile-menu-toggle"
            aria-label={lang === 'ar' ? 'فتح القائمة' : 'Toggle menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            onClick={() => {
              setSearchOpen(false);
              setMobileMenuOpen((prev) => !prev);
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Floating Search Panel */}
      <div className={`navbar-search-overlay${searchOpen ? ' open' : ''}`} aria-hidden={!searchOpen}>
        <form
          className="navbar-search-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (onSearch) onSearch(searchTerm.trim());
            setSearchOpen(false);
            setSearchTerm('');
          }}
        >
          <Search size={18} className="navbar-search-icon" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t('search_works_placeholder')}
            aria-label={t('search_works_placeholder')}
            className="navbar-search-input"
          />
          <button type="submit" className="btn-gold btn-search-go">
            {t('search_btn')}
          </button>
          <button
            type="button"
            className="nav-icon-btn search-close-btn"
            onClick={() => setSearchOpen(false)}
            aria-label={lang === 'ar' ? 'إغلاق البحث' : 'Close search'}
          >
            <X size={20} />
          </button>
        </form>
      </div>

      {/* Mobile / Tablet Navigation Drawer */}
      <div
        id="mobile-nav-drawer"
        className={`mobile-drawer${mobileMenuOpen ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileMenuOpen}
        aria-label={lang === 'ar' ? 'قائمة التنقل' : 'Navigation menu'}
      >
        <div className="drawer-head">
          <span className="drawer-heading">
            {lang === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}
          </span>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={closePanels}
            aria-label={lang === 'ar' ? 'إغلاق القائمة' : 'Close menu'}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="drawer-nav" aria-label={lang === 'ar' ? 'روابط الصفحات' : 'Page links'}>
          {mobileDrawerLinks.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={`drawer-link${activeSection === item.section ? ' active' : ''}`}
              onClick={() => handleNavigate(item.section)}
            >
              <span>{t(item.key)}</span>
              <ChevronRight size={16} className="drawer-link-arrow flip-on-rtl" />
            </a>
          ))}
        </nav>

        <button type="button" className="btn-gold drawer-booking-btn" onClick={handleOpenBooking}>
          <CalendarCheck size={16} />
          <span>{t('book_session')}</span>
        </button>

        <button
          type="button"
          className="drawer-language-btn"
          onClick={() => {
            onToggleLang();
            closePanels();
          }}
        >
          <Languages size={18} />
          <span>{lang === 'en' ? 'العربية' : 'English'}</span>
        </button>
      </div>
    </header>
  );
}
