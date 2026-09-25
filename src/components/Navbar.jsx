import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Lock,
  LogOut,
  Phone,
  Award,
  Star,
  Globe,
  ShieldCheck,
  CalendarCheck,
  Languages,
} from 'lucide-react';

/* Below this width the main navigation collapses into the mobile drawer (tablets + phones) */
const DESKTOP_BREAKPOINT = 1025;

/* Arabic labels for the seeded studio categories (the database stores English names) */
const CATEGORY_AR = {
  Weddings: 'حفلات الزفاف',
  Portraits: 'البورتريه والأشخاص',
  Landscapes: 'الطبيعة والمعالم',
  Newborn: 'المواليد والعائلات',
  Architecture: 'العمارة والتصميم',
  Products: 'المنتجات والإعلانات',
};

/* Hover dropdowns are only enabled on devices with a real mouse / trackpad */
const supportsHover = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export default function Navbar({
  activeSection,
  onNavigate,
  onOpenAdmin,
  onBookSession,
  onSearch,
  categories = [],
  isAdmin,
  onLogout,
  t,
  lang,
  onToggleLang,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const headerRef = useRef(null);
  const searchInputRef = useRef(null);

  /* Main navigation entries – shared by the desktop nav and the mobile drawer */
  const primaryLinks = [
    { key: 'home', section: 'home', href: '#home' },
    { key: 'about', section: 'about', href: '#about' },
    { key: 'services', section: 'services', href: '#features' },
    { key: 'portfolio', section: 'portfolio', href: '#portfolio', dropdown: 'portfolio' },
    { key: 'gear', section: 'equipment', href: '#equipment' },
    { key: 'pages', section: 'pages', href: '#testimonials', dropdown: 'pages' },
    { key: 'contact', section: 'contact', href: '#contact' },
  ];

  /* Portfolio dropdown – built from the studio categories, every entry opens the
     All Works archive pre-filtered (#/works?cat=<id>) */
  const categoryLabel = (name) => (lang === 'ar' ? CATEGORY_AR[name] || name : name);

  const portfolioMenu = [
    { label: t('all_works'), section: 'portfolio', href: '#/works' },
    ...categories.map((cat) => ({
      label: categoryLabel(cat.name),
      section: 'portfolio',
      href: `#/works?cat=${encodeURIComponent(cat.id)}`,
    })),
  ];

  const pagesMenu = [
    { label: t('what_clients_say'), section: 'testimonials', href: '#testimonials' },
    { label: t('about_us'), section: 'about', href: '#about' },
    { label: t('studio_arsenal'), section: 'equipment', href: '#equipment' },
  ];

  const mobileDrawerLinks = [
    { key: 'home', section: 'home', href: '#home' },
    { key: 'portfolio', section: 'portfolio', href: '#portfolio' },
    { key: 'gear', section: 'equipment', href: '#equipment' },
    { key: 'contact', section: 'contact', href: '#contact' },
  ];

  const isPanelOpen = mobileMenuOpen || searchOpen;

  /* Close every overlay rendered by the header */
  const closePanels = () => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setOpenDropdown(null);
    /* released synchronously so in-page anchors can scroll straight away */
    document.body.style.overflow = '';
  };

  const handleNavigate = (section) => {
    closePanels();
    onNavigate(section);
  };

  const handleOpenAdmin = () => {
    closePanels();
    onOpenAdmin();
  };

  const handleOpenBooking = () => {
    closePanels();
    if (onBookSession) onBookSession();
  };

  const toggleDropdown = (name) =>
    setOpenDropdown((prev) => (prev === name ? null : name));

  /* Compact header once the visitor starts scrolling */
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Escape key, breakpoint change and in-page navigation close the header panels */
  useEffect(() => {
    if (!mobileMenuOpen && !searchOpen && !openDropdown) return undefined;

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
  }, [mobileMenuOpen, searchOpen, openDropdown]);

  /* Click / tap outside of the header closes an opened dropdown */
  useEffect(() => {
    if (!openDropdown) return undefined;

    const onPointerDown = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [openDropdown]);

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
      ref={headerRef}
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
            {primaryLinks.map((item) =>
              item.dropdown ? (
                <li
                  key={item.key}
                  className={`dropdown-parent${openDropdown === item.dropdown ? ' open' : ''}`}
                  onMouseEnter={() => {
                    if (supportsHover()) setOpenDropdown(item.dropdown);
                  }}
                  onMouseLeave={() => {
                    if (supportsHover()) {
                      setOpenDropdown((prev) => (prev === item.dropdown ? null : prev));
                    }
                  }}
                >
                  <a
                    href={item.href}
                    className={`nav-link dropdown-trigger${activeSection === item.section ? ' active' : ''}`}
                    aria-haspopup="true"
                    aria-expanded={openDropdown === item.dropdown}
                    onClick={(event) => {
                      event.preventDefault();
                      toggleDropdown(item.dropdown);
                    }}
                  >
                    {t(item.key)} <ChevronDown size={14} className="dropdown-caret" />
                  </a>

                  {openDropdown === item.dropdown && (
                    <div className="nav-dropdown-menu">
                      {(item.dropdown === 'portfolio' ? portfolioMenu : pagesMenu).map((entry) => (
                        <a
                          key={entry.label}
                          href={entry.href}
                          onClick={() => handleNavigate(entry.section)}
                        >
                          {entry.label}
                        </a>
                      ))}
                      {item.dropdown === 'pages' && (
                        <button
                          type="button"
                          onClick={handleOpenAdmin}
                          className="dropdown-admin-btn"
                        >
                          {isAdmin ? t('admin_active') : t('admin_portal')}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ) : (
                <li key={item.key}>
                  <a
                    href={item.href}
                    className={`nav-link${activeSection === item.section ? ' active' : ''}`}
                    onClick={() => handleNavigate(item.section)}
                  >
                    {t(item.key)}
                  </a>
                </li>
              ),
            )}
          </ul>
        </nav>

        {/* Right Action Icons */}
        <div className="nav-actions">
          <button type="button" className="nav-cta-btn" onClick={handleOpenBooking}>
            <CalendarCheck size={16} />
            <span>{t('book_session')}</span>
          </button>

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

          {isAdmin ? (
            <button type="button" onClick={onLogout} className="nav-logout-btn" title={t('logout')}>
              <LogOut size={16} />
              <span className="hide-on-mobile">{t('logout')}</span>
            </button>
          ) : (
            <button type="button" onClick={handleOpenAdmin} className="nav-login-icon-btn" title={t('login')}>
              <Lock size={16} />
              <span className="hide-on-mobile">{t('login')}</span>
            </button>
          )}

          <button
            type="button"
            className={`nav-icon-btn search-toggle${searchOpen ? ' active' : ''}`}
            aria-label={t('search_btn')}
            aria-expanded={searchOpen}
            onClick={() => {
              setOpenDropdown(null);
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
              setOpenDropdown(null);
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
