import React, { useState } from 'react';
import {
  Camera,
  MapPin,
  Phone,
  Mail,
  Globe,
  CheckCircle,
} from 'lucide-react';

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2H21.5l-7.11 8.13L22.75 22h-6.56l-5.14-6.72L5.17 22H1.91l7.6-8.69L1.5 2h6.73l4.65 6.15L18.244 2Zm-1.15 17.8h1.81L7.23 4.1H5.29L17.094 19.8Z"/>
  </svg>
);

const SnapchatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.2c-3.3 0-5.7 2.3-5.7 5.8v2.1c0 .7-.3 1.3-.9 1.7-.5.3-.8.6-.7 1 .1.6 1.1.8 2 1 .5.1.8.3 1 .8.3.8 1.3 1.4 2.3 1.4.7 0 1.3-.2 2-.6.7.4 1.3.6 2 .6 1 0 2-.6 2.3-1.4.2-.5.5-.7 1-.8.9-.2 1.9-.4 2-1 .1-.4-.2-.7-.7-1-.6-.4-.9-1-.9-1.7V9c0-3.5-2.4-5.8-5.7-5.8Z"/>
    <path d="M8.5 19.2c1.2.9 2.3 1.4 3.5 1.4s2.3-.5 3.5-1.4"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.5 5.9L0 24l6.4-1.6c1.7.9 3.6 1.3 5.5 1.3h.1c6.5 0 11.8-5.3 11.8-11.9 0-3.1-1.2-6.1-3.3-8.3Z"/>
    <path d="M8.2 6.7c-.3-.7-.6-.7-.9-.7h-.7c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.8s1.2 3.2 1.4 3.4c.2.2 2.3 3.6 5.6 4.9 2.8 1.1 3.4.9 4 .8.6-.1 2-.8 2.3-1.6.3-.8.3-1.5.2-1.6-.1-.1-.3-.2-.7-.4-.4-.2-2-.9-2.3-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.7.1-.4-.2-1.4-.5-2.7-1.7-1-.9-1.7-2-1.9-2.4-.2-.3 0-.5.1-.7.2-.2.4-.4.5-.6.2-.2.2-.4.3-.6.1-.2 0-.4-.1-.6-.1-.2-.7-1.8-1-2.4Z"/>
  </svg>
);

export default function Footer({ t }) {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setTimeout(() => {
        setNewsletterEmail('');
        setSubscribed(false);
      }, 4000);
    }
  };

  return (
    <footer id="contact" className="lenso-footer-section">
      <div className="container footer-main-content">
        <div className="footer-columns-grid">

          {/* Column 1: Brand & Social */}
          <div className="footer-col col-brand">
            <a href="#home" className="footer-logo">
              <div className="footer-camera-box">
                <Camera size={26} strokeWidth={1.8} />
              </div>

              <div className="footer-logo-title">
                <span>MFM</span>
                <span className="sub">PHOTOGRAPHER</span>
              </div>
            </a>

            <p className="footer-brand-bio">
              {t('brand_bio')}
            </p>

            <div className="footer-social-icons">

              {/* Facebook */}
              <a
                href="https://www.facebook.com/share/1DPiyoj2V2/"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/mohammedfuad.go"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>

              {/* X / Twitter */}
              <a
                href="https://x.com/mohammedfuad178?s=21"
                target="_blank"
                rel="noreferrer"
                aria-label="X"
              >
                <XIcon />
              </a>

              {/* Snapchat */}
              <a
                href="https://snapchat.com/t/PK7kW8XD"
                target="_blank"
                rel="noreferrer"
                aria-label="Snapchat"
              >
                <SnapchatIcon />
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/966557439682"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon />
              </a>

            </div>
          </div>

          {/* Column 2: Newsletter */}
          <div className="footer-col col-newsletter">
            <h4 className="footer-heading">{t('newsletter')}</h4>

            <p className="newsletter-subtitle">
              {t('newsletter_desc')}
            </p>

            {subscribed ? (
              <div className="newsletter-success">
                <CheckCircle size={18} className="text-gold" />
                <span>{t('sub_thank_you')}</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="newsletter-form">
                <input
                  type="email"
                  required
                  placeholder={t('enter_email')}
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="newsletter-input"
                />

                <button type="submit" className="btn-gold btn-subscribe">
                  {t('subscribe')}
                </button>
              </form>
            )}
          </div>

          {/* Column 3: Quick Links */}
          <div className="footer-col col-links">
            <h4 className="footer-heading">{t('quick_links')}</h4>

            <ul className="footer-links-list">
              <li><a href="#about">{t('about')}</a></li>
              <li><a href="#portfolio">{t('portfolio')}</a></li>
              <li><a href="#equipment">{t('gear')}</a></li>
              <li><a href="#contact">{t('contact')}</a></li>
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div className="footer-col col-contact">
            <h4 className="footer-heading">{t('contact_info_title')}</h4>

            <ul className="footer-contact-details">
              <li>
                <MapPin size={17} className="contact-icon text-gold" />
                <span>
                   Riyadh , Saudi Arabia
                </span>
              </li>

              <li>
                <Phone size={17} className="contact-icon text-gold" />
                <a href="tel:+966557439682">
                  +966 557439682
                </a>
              </li>

              <li>
                <Mail size={17} className="contact-icon text-gold" />
                <a href="mailto:mohammedfuad17.8@gmail.com">
                  mohammedfuad17.8@gmail.com
                </a>
              </li>

              <li>
                <Globe size={17} className="contact-icon text-gold" />
                <a
                  href="https://mfmvcs.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  www.mfmvcs.com
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom-bar">
        <div className="container footer-bottom-inner">

          <p className="copyright-text">
            © {new Date().getFullYear()} Ayman Dammag.{' '}
            {t('all_rights_reserved')}
          </p>

          {/* <div className="legal-links">
            <a href="#privacy">{t('privacy_policy')}</a>
Riyadh , Saudi Arabia
            <span className="legal-separator">|</span>

            <a href="#terms">{t('terms_conditions')}</a>

            <span className="legal-separator">|</span>

          </div> */}

        </div>
      </div>
    </footer>
  );
}