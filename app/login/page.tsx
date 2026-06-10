'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleSubmit() {
    setLoading(true);
    setMsg('');
    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else window.location.href = '/dashboard';
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) setMsg(error.message);
      else setMsg('Kayıt başarılı! E-postanı kontrol et.');
    }
    setLoading(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative',
      background: 'linear-gradient(135deg, #e8e0f8, #f0eaf8, #ede4f5)',
    }}>

      {/* Tam ekran arka plan */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/login-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        zIndex: 0,
      }} />

      {/* Form — ortada üstte */}
      <div style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 380,
        padding: '0 20px',
        zIndex: 10,
      }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '9px 0', borderRadius: 12, border: 'none',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              background: tab === t ? 'linear-gradient(90deg,#7c3cff,#ec4bcf)' : 'rgba(255,255,255,0.85)',
              color: tab === t ? '#fff' : '#7c3cff',
            }}>
              {t === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          ))}
        </div>

        {/* Ad Soyad */}
        {tab === 'register' && (
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', background: 'rgba(255,255,255,0.92)', borderRadius: 14, marginBottom: 8, height: 46 }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ad Soyad"
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: 15, color: '#1b2142', background: 'transparent' }} />
          </div>
        )}

        {/* E-posta */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', background: 'rgba(255,255,255,0.92)', borderRadius: 14, marginBottom: 8, height: 46 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-posta" type="email"
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: 15, color: '#1b2142', background: 'transparent' }} />
        </div>

        {/* Şifre */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', background: 'rgba(255,255,255,0.92)', borderRadius: 14, marginBottom: 10, height: 46 }}>
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Şifre"
            type={showPass ? 'text' : 'password'}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: 15, color: '#1b2142', background: 'transparent' }} />
          <button onClick={() => setShowPass(!showPass)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.5 }}>
            {showPass ? '🙈' : '👁'}
          </button>
        </div>

        {/* Beni Hatırla */}
        {tab === 'login' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#5a4a8a', cursor: 'pointer' }}>
              <input type="checkbox" /> Beni Hatırla
            </label>
            <a href="#" style={{ color: '#8b5cf6', textDecoration: 'none' }}>Şifremi Unuttum?</a>
          </div>
        )}

        {msg && <p style={{ color: msg.includes('başarılı') ? '#22c55e' : '#ef4444', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>{msg}</p>}

        {/* Giriş butonu */}
        <button onClick={handleSubmit} disabled={loading} style={{
          width: '100%', height: 46, borderRadius: 14, border: 'none',
          background: 'linear-gradient(90deg,#7c3cff,#ec4bcf)',
          color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 10,
        }}>
          {loading ? '...' : tab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
        </button>

        {/* Ayraç */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(150,120,210,0.3)' }} />
          <span style={{ fontSize: 12, color: '#9d8ec0' }}>veya</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(150,120,210,0.3)' }} />
        </div>

        {/* Google */}
        <button onClick={handleGoogle} style={{
          width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(180,160,240,0.3)',
          background: 'rgba(255,255,255,0.92)', color: '#1b2142', fontSize: 15, cursor: 'pointer', marginBottom: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 500,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google ile Devam Et
        </button>

        {/* Apple */}
        <button style={{
          width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(180,160,240,0.3)',
          background: 'rgba(255,255,255,0.92)', color: '#1b2142', fontSize: 15, cursor: 'pointer', marginBottom: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 500,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Apple ile Devam Et
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#9d8ec0', margin: 0 }}>
          {tab === 'login' ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
          <a href="#" onClick={e => { e.preventDefault(); setTab(tab === 'login' ? 'register' : 'login'); }}
            style={{ color: '#8b5cf6', fontWeight: 600, textDecoration: 'none' }}>
            {tab === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}
          </a>
        </p>

      </div>
    </div>
  );
}
