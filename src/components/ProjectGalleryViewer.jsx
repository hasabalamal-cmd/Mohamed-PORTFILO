import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  LayoutGrid,
  ExternalLink,
  Share2,
  ImageOff,
  Loader2,
  Check,
} from 'lucide-react';
import { getProjectImages } from '../lib/supabaseClient';

const MAX_SCALE = 4;
const ZOOM_STEP = 1.7;
const DOUBLE_TAP_MS = 300;
const SWIPE_MIN = 45;

const clamp = (value, limit) => Math.min(limit, Math.max(-limit, value));

export default function ProjectGalleryViewer({ project, onClose, t, lang }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);
  const [gridOpen, setGridOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState('center center');
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState('');
  const [hintVisible, setHintVisible] = useState(true);

  const stageRef = useRef(null);
  const thumbsRef = useRef(null);
  const closeBtnRef = useRef(null);
  const gestureRef = useRef({
    pinchStart: 0,
    baseScale: 1,
    startX: 0,
    startY: 0,
    startTime: 0,
    panBase: null,
    lastTap: 0,
    moved: false,
  });

  const isTouch = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: none)').matches,
    [],
  );

  const total = images.length;
  const current = images[index] || null;

  /* ------------------------------------------------------------------ data */
  useEffect(() => {
    const projectId = project?.id;
    if (!projectId) return undefined;

    let mounted = true;

    const fallback = project?.cover_image
      ? [{ id: 'cover', image_url: project.cover_image, sort_order: 0 }]
      : [];

    getProjectImages(projectId)
      .then((data) => {
        if (!mounted) return;
        setImages(data && data.length > 0 ? data : fallback);
      })
      .catch((err) => {
        console.error('Error loading project images:', err);
        if (!mounted) return;
        setImages(fallback);
        setFailed(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [project?.id, project?.cover_image]);

  /* ------------------------------------------------------------- behaviour */
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (closeBtnRef.current) closeBtnRef.current.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!hintVisible) return undefined;
    const timer = setTimeout(() => setHintVisible(false), 4200);
    return () => clearTimeout(timer);
  }, [hintVisible]);

  /* Every fresh photo starts un-zoomed – reset from the actions that change it */
  const resetZoom = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setOrigin('center center');
  }, []);

  /* Preload the neighbouring photos for instant swiping */
  useEffect(() => {
    if (total < 2) return undefined;
    [images[(index + 1) % total], images[(index - 1 + total) % total]].forEach((img) => {
      if (img?.image_url) {
        const preloader = new Image();
        preloader.src = img.image_url;
      }
    });
    return undefined;
  }, [index, images, total]);

  /* Keep the active thumbnail inside the strip */
  useEffect(() => {
    const strip = thumbsRef.current;
    if (!strip) return;
    const active = strip.querySelector('[data-active="true"]');
    if (active && typeof active.scrollIntoView === 'function') {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [index, total]);

  const goTo = useCallback(
    (nextIndex) => {
      if (!total) return;
      setIndex(((nextIndex % total) + total) % total);
      setHintVisible(false);
      resetZoom();
    },
    [total, resetZoom],
  );

  const nextPhoto = useCallback(() => goTo(index + 1), [goTo, index]);
  const prevPhoto = useCallback(() => goTo(index - 1), [goTo, index]);

  const zoomTo = useCallback((nextScale, clientX, clientY) => {
    const stage = stageRef.current;
    const value = Math.min(MAX_SCALE, Math.max(1, nextScale));

    if (value > 1 && stage) {
      const rect = stage.getBoundingClientRect();
      const px = clientX == null ? 50 : ((clientX - rect.left) / rect.width) * 100;
      const py = clientY == null ? 50 : ((clientY - rect.top) / rect.height) * 100;
      setOrigin(`${Math.min(100, Math.max(0, px))}% ${Math.min(100, Math.max(0, py))}%`);
    } else if (value <= 1) {
      setOrigin('center center');
      setOffset({ x: 0, y: 0 });
    }

    setScale(value);
  }, []);

  const zoomIn = useCallback(() => zoomTo(scale * ZOOM_STEP), [scale, zoomTo]);
  const zoomOut = useCallback(() => zoomTo(scale / ZOOM_STEP), [scale, zoomTo]);
  const toggleZoom = useCallback(
    (clientX, clientY) => {
      if (scale > 1) zoomTo(1);
      else zoomTo(2.4, clientX, clientY);
    },
    [scale, zoomTo],
  );

  const applyPan = useCallback(
    (deltaX, deltaY, base) => {
      const stage = stageRef.current;
      if (!stage || !base) return;
      const rect = stage.getBoundingClientRect();
      const maxX = (rect.width * (scale - 1)) / 2;
      const maxY = (rect.height * (scale - 1)) / 2;
      setOffset({
        x: clamp(base.x + deltaX, maxX),
        y: clamp(base.y + deltaY, maxY),
      });
    },
    [scale],
  );

  const shareGallery = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}#/project/${project.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: project.name,
          text: `${project.name} — MFM Photographer`,
          url,
        });
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setToast(t('copied_link'));
        setTimeout(() => setToast(''), 2200);
      }
    } catch {
      /* the visitor dismissed the share sheet – nothing to do */
    }
  }, [project, t]);

  /* --------------------------------------------------------- keyboard nav */
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'ArrowRight') nextPhoto();
      if (event.key === 'ArrowLeft') prevPhoto();
      if (event.key === '+' || event.key === '=') zoomIn();
      if (event.key === '-' || event.key === '_') zoomOut();
      if (event.key.toLowerCase() === 'g') setGridOpen((prev) => !prev);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, nextPhoto, prevPhoto, zoomIn, zoomOut]);

  /* ------------------------ touch (swipe / pinch / double-tap) & mouse pan */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const gesture = gestureRef.current;
    const distance = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

    const onTouchStart = (event) => {
      if (event.touches.length === 2) {
        gesture.pinchStart = distance(event.touches[0], event.touches[1]);
        gesture.baseScale = scale;
        gesture.panBase = null;
        gesture.moved = true;
        return;
      }

      const touch = event.touches[0];
      gesture.startX = touch.clientX;
      gesture.startY = touch.clientY;
      gesture.startTime = Date.now();
      gesture.moved = false;
      gesture.panBase = scale > 1 ? { x: offset.x, y: offset.y } : null;

      const now = Date.now();
      if (now - gesture.lastTap < DOUBLE_TAP_MS) {
        gesture.lastTap = 0;
        toggleZoom(touch.clientX, touch.clientY);
      } else {
        gesture.lastTap = now;
      }
    };

    const onTouchMove = (event) => {
      if (event.touches.length === 2 && gesture.pinchStart) {
        const ratio = distance(event.touches[0], event.touches[1]) / gesture.pinchStart;
        const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
        const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
        zoomTo(gesture.baseScale * ratio, midX, midY);
        return;
      }

      const touch = event.touches[0];
      if (!touch) return;
      const deltaX = touch.clientX - gesture.startX;
      const deltaY = touch.clientY - gesture.startY;

      if (gesture.panBase) {
        setDragging(true);
        applyPan(deltaX, deltaY, gesture.panBase);
      } else if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        gesture.moved = true;
      }
    };

    const onTouchEnd = (event) => {
      setDragging(false);

      if (gesture.pinchStart && event.touches.length < 2) {
        gesture.pinchStart = 0;
        if (scale <= 1.02) resetZoom();
      }

      const touch = event.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - gesture.startX;
      const deltaY = touch.clientY - gesture.startY;

      if (!gesture.panBase && Math.abs(deltaX) > SWIPE_MIN && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) nextPhoto();
        else prevPhoto();
      }

      gesture.panBase = null;
      gesture.startTime = 0;
    };

    const onMouseDown = (event) => {
      if (scale <= 1) return;
      gesture.panBase = { x: offset.x, y: offset.y };
      gesture.startX = event.clientX;
      gesture.startY = event.clientY;
      setDragging(true);
    };

    const onMouseMove = (event) => {
      if (!gesture.panBase) return;
      applyPan(event.clientX - gesture.startX, event.clientY - gesture.startY, gesture.panBase);
    };

    const onMouseUp = () => {
      gesture.panBase = null;
      setDragging(false);
    };

    const onDoubleClick = (event) => toggleZoom(event.clientX, event.clientY);

    const onWheel = (event) => {
      event.preventDefault();
      if (event.deltaY < 0) zoomTo(scale * 1.15, event.clientX, event.clientY);
      else zoomTo(scale / 1.15, event.clientX, event.clientY);
    };

    stage.addEventListener('touchstart', onTouchStart, { passive: true });
    stage.addEventListener('touchmove', onTouchMove, { passive: true });
    stage.addEventListener('touchend', onTouchEnd, { passive: true });
    stage.addEventListener('touchcancel', onTouchEnd, { passive: true });
    stage.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    stage.addEventListener('dblclick', onDoubleClick);
    stage.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchmove', onTouchMove);
      stage.removeEventListener('touchend', onTouchEnd);
      stage.removeEventListener('touchcancel', onTouchEnd);
      stage.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      stage.removeEventListener('dblclick', onDoubleClick);
      stage.removeEventListener('wheel', onWheel);
    };
  }, [scale, offset, zoomTo, applyPan, nextPhoto, prevPhoto, resetZoom, toggleZoom]);

  return (
    <div
      className="pgv-overlay animate-fade-in"
      lang={lang}
      role="dialog"
      aria-modal="true"
      aria-label={`${project.name} — ${t('gallery_of')}`}
    >
      {/* Thin reading-progress bar */}
      <div className="pgv-progress" aria-hidden="true">
        <span style={{ width: total ? `${((index + 1) / total) * 100}%` : '0%' }} />
      </div>

      <header className="pgv-topbar">
        <div className="pgv-title-box">
          <span className="pgv-category">{project.category_name}</span>
          <h2 className="pgv-title">{project.name}</h2>
          <span className="pgv-counter">
            {total ? `${index + 1} / ${total}` : '0 / 0'} <em>{t('photos_unit')}</em>
          </span>
        </div>

        <div className="pgv-tools">
          <button
            type="button"
            className="pgv-tool"
            onClick={() => current?.image_url && window.open(current.image_url, '_blank', 'noopener')}
            disabled={!current}
            aria-label={t('open_original')}
            title={t('open_original')}
          >
            <ExternalLink size={17} />
          </button>

          <button
            type="button"
            className={`pgv-tool${gridOpen ? ' active' : ''}`}
            onClick={() => setGridOpen((prev) => !prev)}
            aria-label={t('all_photos')}
            aria-pressed={gridOpen}
            title={t('all_photos')}
          >
            <LayoutGrid size={17} />
          </button>

          <button
            type="button"
            className="pgv-tool"
            onClick={shareGallery}
            aria-label={t('share_gallery')}
            title={t('share_gallery')}
          >
            <Share2 size={17} />
          </button>

          <button
            ref={closeBtnRef}
            type="button"
            className="pgv-tool pgv-close"
            onClick={onClose}
            aria-label={t('close_gallery')}
            title={t('close_gallery')}
          >
            <X size={19} />
          </button>
        </div>
      </header>

      <div className="pgv-body">
        {/* Main stage – always mounted so the gesture listeners stay bound */}
        <div className={`pgv-stage${gridOpen ? ' is-hidden' : ''}`} ref={stageRef}>
          {loading ? (
            <div className="pgv-state">
              <Loader2 size={32} className="pgv-spin" />
              <p>{t('loading_photos')}</p>
            </div>
          ) : !current ? (
            <div className="pgv-state">
              <ImageOff size={40} />
              <p>{failed ? t('gallery_error') : t('no_photos_project')}</p>
            </div>
          ) : (
            <>
              {total > 1 && (
                <button
                  type="button"
                  className="pgv-arrow pgv-arrow-prev"
                  onClick={prevPhoto}
                  aria-label={t('prev_photo')}
                >
                  <ChevronLeft size={26} className="flip-on-rtl" />
                </button>
              )}

              <div className="pgv-viewport">
                <img
                  key={current.id}
                  className={`pgv-image${scale > 1 ? ' is-zoomed' : ''}`}
                  src={current.image_url}
                  alt={`${project.name} — ${t('photo')} ${index + 1}`}
                  draggable="false"
                  style={{
                    transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                    transformOrigin: origin,
                    transition: dragging ? 'none' : undefined,
                  }}
                />
              </div>

              {total > 1 && (
                <button
                  type="button"
                  className="pgv-arrow pgv-arrow-next"
                  onClick={nextPhoto}
                  aria-label={t('next_photo')}
                >
                  <ChevronRight size={26} className="flip-on-rtl" />
                </button>
              )}

              <div className="pgv-zoom-bar">
                <button
                  type="button"
                  className="pgv-tool"
                  onClick={zoomOut}
                  disabled={scale <= 1}
                  aria-label={t('zoom_out')}
                >
                  <ZoomOut size={16} />
                </button>
                <span className="pgv-zoom-value">{Math.round(scale * 100)}%</span>
                <button
                  type="button"
                  className="pgv-tool"
                  onClick={zoomIn}
                  disabled={scale >= MAX_SCALE}
                  aria-label={t('zoom_in')}
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  className="pgv-tool"
                  onClick={resetZoom}
                  disabled={scale <= 1}
                  aria-label="reset"
                >
                  <RotateCcw size={15} />
                </button>
              </div>

              {hintVisible && total > 1 && (
                <div className="pgv-hint">{isTouch ? t('swipe_hint') : t('keyboard_hint')}</div>
              )}
            </>
          )}
        </div>

        {/* Full project photo grid */}
        {gridOpen && (
          <div className="pgv-grid-panel">
            <div className="pgv-grid-head">
              <span>{t('all_photos')}</span>
              <span className="pgv-grid-count">
                {total} {t('photos_unit')}
              </span>
            </div>
            <div className="pgv-grid">
              {images.map((img, i) => (
                <button
                  type="button"
                  key={img.id}
                  className={`pgv-grid-item${i === index ? ' active' : ''}`}
                  onClick={() => {
                    goTo(i);
                    setGridOpen(false);
                  }}
                  aria-label={`${t('photo')} ${i + 1}`}
                >
                  <img src={img.image_url} alt="" loading="lazy" />
                  <span className="pgv-grid-index">{i + 1}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Thumbnail filmstrip */}
      {!gridOpen && total > 1 && (
        <div className="pgv-thumbs" ref={thumbsRef}>
          {images.map((img, i) => (
            <button
              type="button"
              key={img.id}
              data-active={i === index}
              className={`pgv-thumb${i === index ? ' active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`${t('photo')} ${i + 1}`}
              aria-current={i === index}
            >
              <img src={img.image_url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {toast && (
        <div className="pgv-toast" role="status">
          <Check size={15} /> {toast}
        </div>
      )}

    </div>
  );
}
