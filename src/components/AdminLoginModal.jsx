import React, { useState } from 'react';
import { Lock, Mail, Key, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess, t }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. If Supabase configured, attempt real auth
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          throw error;
        }

        if (data?.user) {
          localStorage.setItem('lenso_admin_logged_in', 'true');
          onLoginSuccess(data.user);
          onClose();
          return;
        }
      }

      // 2. Demo fallback authentication for easy preview & testing
      if (
        (email.trim() === 'admin@mfmvcs.com' && password === 'admin123') ||
        (email.trim() === 'admin' && password === 'admin')
      ) {
        localStorage.setItem('lenso_admin_logged_in', 'true');
        onLoginSuccess({ email: email.trim(), role: 'admin' });
        onClose();
      } else {
        throw new Error(t('invalid_credentials') + ' (جرّب: admin@mfmvcs.com / admin123)');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || t('invalid_credentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('admin@mfmvcs.com');
    setPassword('admin123');
    localStorage.setItem('lenso_admin_logged_in', 'true');
    onLoginSuccess({ email: 'admin@mfmvcs.com', role: 'admin' });
    onClose();
  };

  return (
    <div className="sub-modal-backdrop" onClick={onClose}>
      <div className="sub-modal-dialog login-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="sub-modal-header">
          <div className="login-modal-title-box">
            <ShieldCheck size={22} className="text-gold" />
            <h3>{t('admin_login_title')}</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="login-modal-body">
          <p className="login-modal-desc">{t('admin_login_desc')}</p>

          {errorMsg && (
            <div className="admin-alert alert-error" style={{ marginBottom: '16px', borderRadius: '4px' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-form" style={{ padding: 0 }}>
            <div className="form-group">
              <label>{t('email_label')}</label>
              <div className="login-input-wrapper">
                <Mail size={16} className="login-field-icon" />
                <input
                  type="text"
                  required
                  placeholder="admin@mfmvcs.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="admin-input with-icon"
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t('password_label')}</label>
              <div className="login-input-wrapper">
                <Key size={16} className="login-field-icon" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-input with-icon"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-gold login-submit-btn">
              <Lock size={15} />
              <span>{loading ? t('uploading') : t('sign_in_btn')}</span>
            </button>
          </form>

          <div className="login-demo-helper">
            <div className="demo-credentials-box">
              <span>بيانات الدخول الافتراضية (Demo):</span>
              <code>admin@mfmvcs.com</code> / <code>admin123</code>
            </div>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="btn-demo-quick"
            >
              ⚡ {t('quick_demo_login')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
