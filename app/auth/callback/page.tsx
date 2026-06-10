'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isReset, setIsReset] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsReset(true);
    } else {
      window.location.href = '/dashboard';
    }
  }, []);

  async function handleReset() {
    if (password !== confirm) { setMsg('Şifreler eşleşmiyor!'); return; }
    if (password.length < 6) { setMsg('Şifre en az 6 karakter olmalı!'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMsg('Hata: ' + error.message);
    else { setMsg('Şifre değiştirildi! Yönlendiriliyorsunuz...'); setTimeout(() => window.location.href = '/dashboard', 2000); }
    setLoading(false);
  }

  if (!isReset) return null;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#e8e0f8,#f0eaf8)' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: 380, boxShadow: '0 8px 32px rgba(124,58,237,.15)' }}>
        <div style={{ fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>CaBin</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 20 }}>Yeni Şifre Belirle</div>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Yeni şifre" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #ede9fe', fontSize: 14, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
        <input value={confirm} onChange={e => setConfirm(e.target.value)} type="password" placeholder="Şifreyi tekrarla" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #ede9fe', fontSize: 14, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }} />
        {msg && <div style={{ fontSize: 13, color: msg.includes('değiştirildi') ? '#16a34a' : '#dc2626', marginBottom: 12 }}>{msg}</div>}
        <button onClick={handleReset} disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          {loading ? '...' : 'Şifreyi Değiştir'}
        </button>
      </div>
    </div>
  );
}
