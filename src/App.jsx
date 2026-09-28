import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PortfolioSection from './components/PortfolioSection';
import AboutSection from './components/AboutSection';
import EquipmentSection from './components/EquipmentSection';
import Footer from './components/Footer';
import AllWorksPage from './components/AllWorksPage';
import ProjectGalleryViewer from './components/ProjectGalleryViewer';
import AdminDashboard from './components/AdminDashboard';
import AdminLoginModal from './components/AdminLoginModal';
import {
  getCategories,
  getProjects,
  getEquipment,
  getAllProjectImages,
  getProjectById,
  isSupabaseConfigured,
  supabase,
} from './lib/supabaseClient';
import { translations } from './lib/translations';
import './App.css';

/* ---------------------------------------------------------------------------
   Tiny hash router
   #/works            → all works page
   #/works?cat=…&q=…  → all works page pre-filtered (nav dropdown / search box)
   #/project/<id>     → professional photo gallery of one project
   #home / #about …   → home page + in-page section
   /admin             → administration login and dashboard
--------------------------------------------------------------------------- */
const parseRoute = () => {
  if (typeof window === 'undefined') return { page: 'home' };

  if (window.location.pathname.replace(/\/+$/, '') === '/admin') {
    return { page: 'admin' };
  }

  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path, search] = raw.split('?');
  const params = new URLSearchParams(search || '');

  if (path.startsWith('project/')) {
    return { page: 'project', projectId: decodeURIComponent(path.slice('project/'.length)) };
  }

  if (path === 'works') {
    return {
      page: 'works',
      categoryId: params.get('cat') || 'all',
      query: params.get('q') || '',
    };
  }

  return { page: 'home', section: path || 'home' };
};

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('lenso_lang') || 'ar');
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [imageCounts, setImageCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(parseRoute);
  const [backgroundRoute, setBackgroundRoute] = useState(() => {
    const initial = parseRoute();
    return initial.page === 'project' ? { page: 'works', categoryId: 'all', query: '' } : initial;
  });
  const [remoteProject, setRemoteProject] = useState(null);

  // Auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminAuthLoading, setAdminAuthLoading] = useState(
    () => parseRoute().page === 'admin' && isSupabaseConfigured,
  );

  const [activeSection, setActiveSection] = useState('home');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  const toggleLanguage = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    localStorage.setItem('lenso_lang', nextLang);
  };

  // Sync document direction and lang attribute
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = translations[lang]?.dir || 'ltr';
  }, [lang]);

  const loadData = useCallback(async () => {
    try {
      const [cats, projs, equips, images] = await Promise.all([
        getCategories(),
        getProjects(),
        getEquipment(),
        getAllProjectImages(),
      ]);
      setCategories(cats || []);
      setProjects(projs || []);
      setEquipment(equips || []);

      const counts = (images || []).reduce((acc, image) => {
        acc[image.project_id] = (acc[image.project_id] || 0) + 1;
        return acc;
      }, {});
      setImageCounts(counts);
    } catch (err) {
      console.error('Error loading initial portfolio data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ----------------------------------------------------------- routing */
  const handleHashChange = useCallback(() => {
    const next = parseRoute();
    setRoute(next);
    /* The page that stays mounted behind the gallery keeps the last real route */
    if (next.page !== 'project') setBackgroundRoute(next);
  }, []);

  useEffect(() => {
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, [handleHashChange]);

  useEffect(() => {
    if (route.page !== 'admin') return undefined;
    if (!isSupabaseConfigured || !supabase) return undefined;

    let mounted = true;
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (mounted) setIsAdminLoggedIn(Boolean(data.session?.user));
      })
      .catch((error) => {
        console.error('Error verifying admin session:', error);
        if (mounted) setIsAdminLoggedIn(false);
      })
      .finally(() => {
        if (mounted) setAdminAuthLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [route.page]);

  /* Entering the archive always starts at the top of the page */
  useEffect(() => {
    if (route.page === 'works') window.scrollTo({ top: 0, behavior: 'auto' });
  }, [route.page, route.categoryId, route.query]);

  /* A project may be opened through a deep link – fetch it when it is not loaded yet */
  const activeProject = useMemo(() => {
    if (route.page !== 'project') return null;
    return projects.find((item) => item.id === route.projectId) || remoteProject;
  }, [route.page, route.projectId, projects, remoteProject]);

  useEffect(() => {
    if (route.page !== 'project') return undefined;
    if (projects.some((item) => item.id === route.projectId)) return undefined;

    let mounted = true;
    getProjectById(route.projectId)
      .then((data) => {
        if (mounted) setRemoteProject(data);
      })
      .catch((err) => console.error('Error loading project:', err));

    return () => {
      mounted = false;
    };
  }, [route.page, route.projectId, projects]);

  /* Close the gallery by replacing the current history entry (modal-like behaviour) */
  const closeProjectGallery = useCallback(() => {
    if (backgroundRoute.page === 'works') {
      const params = new URLSearchParams();
      if (backgroundRoute.categoryId && backgroundRoute.categoryId !== 'all') {
        params.set('cat', backgroundRoute.categoryId);
      }
      if (backgroundRoute.query) params.set('q', backgroundRoute.query);
      const suffix = params.toString();
      window.location.replace(`#/works${suffix ? `?${suffix}` : ''}`);
      return;
    }
    window.location.replace('#portfolio');
  }, [backgroundRoute]);

  /* Header search → all works page with the query applied */
  const handleSearch = useCallback((searchTerm) => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    window.location.hash = `#/works${params.toString() ? `?${params.toString()}` : ''}`;
  }, []);

  const handleLogout = () => {
    if (supabase) {
      supabase.auth.signOut().then(({ error }) => {
        if (error) {
          console.error('Error signing out admin:', error);
          return;
        }
        setIsAdminLoggedIn(false);
      });
    } else {
      setIsAdminLoggedIn(false);
    }
    localStorage.removeItem('lenso_admin_logged_in');
  };

  const leaveAdmin = useCallback(() => {
    window.history.pushState(null, '', '/');
    const next = parseRoute();
    setRoute(next);
    setBackgroundRoute(next);
  }, []);

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setBookingSubmitted(true);
    setTimeout(() => {
      setBookingSubmitted(false);
      setShowBookingModal(false);
    }, 2500);
  };

  if (route.page === 'admin') {
    return (
      <div className={`lenso-app-wrapper lang-${lang}`}>
        {adminAuthLoading ? (
          <div className="admin-auth-loading" role="status">{t('checking_admin_session')}</div>
        ) : isAdminLoggedIn ? (
          <AdminDashboard
            onClose={leaveAdmin}
            onDataChanged={loadData}
            onLogout={handleLogout}
            t={t}
            lang={lang}
          />
        ) : (
          <AdminLoginModal
            isOpen
            onClose={leaveAdmin}
            onLoginSuccess={() => setIsAdminLoggedIn(true)}
            t={t}
            lang={lang}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`lenso-app-wrapper lang-${lang}`}>
      {/* 1. Pinned Main Navigation Header */}
      <Navbar
        activeSection={route.page === 'works' ? 'portfolio' : activeSection}
        onNavigate={(sec) => setActiveSection(sec)}
        onBookSession={() => setShowBookingModal(true)}
        onSearch={handleSearch}
        t={t}
        lang={lang}
        onToggleLang={toggleLanguage}
      />

      {backgroundRoute.page === 'works' ? (
        /* All Works archive page (#/works) – keyed by the route filters */
        <AllWorksPage
          key={`${backgroundRoute.categoryId || 'all'}|${backgroundRoute.query || ''}`}
          categories={categories}
          projects={projects}
          imageCounts={imageCounts}
          loading={loading}
          initialCategoryId={backgroundRoute.categoryId || 'all'}
          initialQuery={backgroundRoute.query || ''}
          t={t}
        />
      ) : (
        <main>
          {/* 2. Hero Section */}
          <Hero t={t} />

          {/* 3. Photography Portfolio (2x3 Grid with Categories) */}
          <PortfolioSection
            categories={categories}
            projects={projects}
            imageCounts={imageCounts}
            t={t}
          />

          {/* 4. About Section (Overlapping Photos, Story, Stats) */}
          <AboutSection t={t} />

          {/* 5. Studio Equipment Section */}
          <EquipmentSection equipment={equipment} t={t} />
        </main>
      )}

      {/* 6. Footer (4 Columns & Legal) */}
      <Footer t={t} />

      {/* Professional full-screen project gallery (#/project/<id>) */}
      {route.page === 'project' && activeProject && (
        <ProjectGalleryViewer
          key={activeProject.id}
          project={activeProject}
          onClose={closeProjectGallery}
          t={t}
          lang={lang}
        />
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="sub-modal-backdrop" onClick={() => setShowBookingModal(false)}>
          <div className="sub-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-header">
              <h3>{t('book_session_title')}</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="modal-close-btn"
              >
                ✕
              </button>
            </div>
            {bookingSubmitted ? (
              <div className="p-6 text-center text-gold" style={{ padding: '30px', textAlign: 'center' }}>
                <h4>{t('booking_success_title')}</h4>
                <p>{t('booking_success_desc')}</p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="admin-form">
                <div className="form-group">
                  <label>{t('your_name')}</label>
                  <input type="text" required placeholder="Full name" className="admin-input" />
                </div>
                <div className="form-group">
                  <label>{t('email_address')}</label>
                  <input type="email" required placeholder="name@domain.com" className="admin-input" />
                </div>
                <div className="form-group">
                  <label>{t('session_type')}</label>
                  <select className="admin-select">
                    <option>{lang === 'ar' ? 'تصوير أعراس وزفاف' : 'Wedding Photography'}</option>
                    <option>{lang === 'ar' ? 'بورتريه وأزياء' : 'Portrait & Fashion'}</option>
                    <option>{lang === 'ar' ? 'عمارة وتصميم داخلي' : 'Architecture & Interior'}</option>
                    <option>{lang === 'ar' ? 'مواليد وعائلات' : 'Newborn & Family'}</option>
                    <option>{lang === 'ar' ? 'منتجات تجارية' : 'Commercial Product'}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('date_message')}</label>
                  <textarea rows={3} placeholder={lang === 'ar' ? 'التفاصيل والموعد المقترح...' : 'Tell us about your date and location...'} className="admin-input" />
                </div>
                <div className="sub-modal-footer">
                  <button type="submit" className="btn-gold">{t('confirm_booking')}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
