'use client';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = '/dashboard';
      } else {
        supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            window.location.href = '/dashboard';
          } else {
            window.location.href = '/login';
          }
        });
      }
    });
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#e8e0f8,#f0eaf8)' }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: '#7c3aed' }}>Yükleniyor...</div>
    </div>
  );
}
