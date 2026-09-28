import React, { useState } from 'react';
import { Lock, Mail, Key, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess, t, lang }) {
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
      if (!isSupabaseConfigured || !supabase) {
        throw new Error(t('auth_not_configured'));
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error(t('invalid_credentials'));
      }

      onLoginSuccess(data.user);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || t('invalid_credentials'));
    } finally {
      setLoading(false);
    }
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
                  type="email"
                  required
                  placeholder={lang === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter your email'}
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

        </div>
      </div>
    </div>
  );
}
