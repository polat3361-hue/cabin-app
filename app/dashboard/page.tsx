'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Zap, Clock, Heart, ShoppingBag, Store, CreditCard, User, Settings, Gift, Bell, Shirt, Scissors, Sparkles, Wind, Footprints, Glasses, HardHat, Gem } from 'lucide-react';
import { supabase } from '@/lib/supabase';
const CATEGORIES = ['Üst', 'Alt', 'Elbise', 'Ceket', 'Ayakkabı', 'Gözlük', 'Şapka', 'Takı'];

interface Outfit {
  id: number;
  name: string;
  brand: string;
  price: string;
  img: string;
  link?: string;
}

interface Photo {
  id: number;
  url: string;
  name: string;
}

export default function DashboardPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [category, setCategory] = useState('Üst');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(114);
  const [link, setLink] = useState('');
  const [status, setStatus] = useState('');
  const [photoStatus, setPhotoStatus] = useState('');
  const [activeMenu, setActiveMenu] = useState('CaBin');
  const [combinations, setCombinations] = useState<{item: string, reason: string, search: string}[]>([
    { item: 'Slim Fit Jean', reason: 'Casual ve şık bir kombin oluşturur', search: 'slim fit jean' },
    { item: 'Beyaz Sneaker', reason: 'Her kombine uyan klasik seçim', search: 'beyaz spor ayakkabı' },
    { item: 'Mini Omuz Çanta', reason: 'Sade ve şık aksesuar', search: 'mini omuz çanta' }
  ]);
  const [cart, setCart] = useState<Outfit[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [xConnected, setXConnected] = useState(false);
  const [aiComment, setAiComment] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+90 5XX XXX XX XX');
  const [profilePhoto, setProfilePhoto] = useState('');
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const [referralCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [notifyDone, setNotifyDone] = useState(true);
  const [notifyCredit, setNotifyCredit] = useState(true);
  const [notifyNews, setNotifyNews] = useState(false);
  const [favorites, setFavorites] = useState<Outfit[]>([]);
  const [wardrobe, setWardrobe] = useState<Outfit[]>([]);
  const [history, setHistory] = useState<{id: number, date: string, photo: string, outfit: string, result: string, outfitName: string}[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<{id: number, date: string, photo: string, outfit: string, result: string, outfitName: string} | null>(null);
  const [isKombin, setIsKombin] = useState(false);
  const [kombinItems, setKombinItems] = useState<{outfitId: number, category: string}[]>([]);
  const [uyumScore, setUyumScore] = useState(0);
  const [colorSuggestion, setColorSuggestion] = useState('');
  const [styleTip, setStyleTip] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const outfitRef = useRef<HTMLInputElement>(null);
  const outfitCamRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const meta = data.user.user_metadata;
        setUserName(meta?.full_name || data.user.email?.split('@')[0] || 'Kullanıcı');
        setUserEmail(data.user.email || '');
      } else { window.location.href = '/login'; }
    });
    supabase.auth.getSession().then(({ data }) => {
      console.log('Session:', data.session?.user);
      if (data.session?.user) {
        const meta = data.session.user.user_metadata;
        setUserName(meta?.full_name || meta?.name || data.session.user.email?.split('@')[0] || 'Kullanıcı');
        setUserEmail(data.session.user.email || '');
      } else { window.location.href = '/login'; }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const createdAt = new Date(data.session.user.created_at);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const totalDays = credits >= 300 ? 365 : credits >= 120 ? 120 : 90;
        const remainingDays = totalDays - diffDays;
        void remainingDays;
      }
    });
    const saved = localStorage.getItem('cabin_photos_v2');
    if (saved) setPhotos(JSON.parse(saved));
    const savedOutfits = localStorage.getItem('cabin_outfits');
    if (savedOutfits) setOutfits(JSON.parse(savedOutfits));
    const savedFavorites = localStorage.getItem('cabin_favorites');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    const savedWardrobe = localStorage.getItem('cabin_wardrobe');
    if (savedWardrobe) setWardrobe(JSON.parse(savedWardrobe));
    const savedHistory = localStorage.getItem('cabin_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  function savePhotos(p: Photo[]) {
    setPhotos(p);
    try { localStorage.setItem('cabin_photos_v2', JSON.stringify(p.map(photo => ({ ...photo, url: photo.url })))); } catch {}
  }

  function saveOutfits(o: Outfit[]) {
    if (o.length > 20) { setStatus('⚠️ Maksimum 20 ürün ekleyebilirsiniz.'); setTimeout(() => setStatus(''), 4000); return; }
    setOutfits(o);
    safeSet('cabin_outfits', o, 20);
  }

  function safeSet(key: string, value: any, limit = 20) {
    try {
      const arr = Array.isArray(value) ? value.slice(0, limit) : value;
      localStorage.setItem(key, JSON.stringify(arr));
    } catch {
      try {
        localStorage.removeItem('cabin_wardrobe');
        localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value.slice(0, 10) : value));
      } catch {}
    }
  }

  function saveWardrobe(w: Outfit[]) {
    const limited = w.slice(0, 50);
    setWardrobe(limited);
    safeSet('cabin_wardrobe', limited, 50);
  }

  function addPhoto(url: string, name: string) {
    const newPhoto: Photo = { id: Date.now(), url, name };
    const updated = [...photos, newPhoto];
    savePhotos(updated);
    setSelectedPhoto(newPhoto);
  }

  function loadPhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoStatus('⏳ Fotoğraf yükleniyor...');
    const filename = `${Date.now()}-${f.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    supabase.storage.from('user-photos').upload(filename, f, { upsert: true }).then(({ error }: { error: { message: string } | null }) => {
      if (error) { setPhotoStatus('❌ Yükleme hatası: ' + error.message); return; }
      const { data } = supabase.storage.from('user-photos').getPublicUrl(filename);
      addPhoto(data.publicUrl, f.name);
      const wardrobePhoto: Outfit = { id: Date.now(), name: f.name, brand: 'Fotoğraflarım', price: '—', img: data.publicUrl };
      const updatedWardrobe = [wardrobePhoto, ...wardrobe];
      saveWardrobe(updatedWardrobe);
      setPhotoStatus('✅ Yüklendi!');
      setTimeout(() => setPhotoStatus(''), 3000);
    });
  }

  function loadOutfitFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setStatus('⏳ Kıyafet yükleniyor...');
    const filename = `outfits/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    supabase.storage.from('user-photos').upload(filename, f, { upsert: true }).then(({ error }: { error: { message: string } | null }) => {
      if (error) { setStatus('❌ Yükleme hatası: ' + error.message); return; }
      const { data } = supabase.storage.from('user-photos').getPublicUrl(filename);
      const o: Outfit = { id: Date.now(), name: 'Kendi Kıyafetim', brand: 'Gardırobum', price: '—', img: data.publicUrl };
      const updated = [o, ...outfits];
      saveOutfits(updated);
      setSelectedOutfit(o);
      const updatedWardrobe = [o, ...wardrobe];
      saveWardrobe(updatedWardrobe);
      setStatus('✅ Yüklendi!');
      setTimeout(() => setStatus(''), 3000);
    });
  }

  async function fetchLink() {
    if (!link.trim()) return;
    setStatus('⏳ Yükleniyor...');
    try {
      const r = await fetch('/api/fetch-product?url=' + encodeURIComponent(link.trim()));
      const d = await r.json();
      if (d.success && d.image) {
        const o: Outfit = { id: Date.now(), name: d.name || 'Kıyafet', brand: d.brand || '—', price: d.price || '—', img: d.image, link: link.trim() };
        saveOutfits([o, ...outfits]);
        setSelectedOutfit(o);
        setStatus('✅ Eklendi!');
        setLink('');
        setTimeout(() => setStatus(''), 3000);
      } else { setStatus('❌ Görsel çekilemedi'); setTimeout(() => setStatus(''), 3000); }
    } catch { setStatus('❌ Bağlantı hatası'); setTimeout(() => setStatus(''), 3000); }
  }

  async function doTry() {
    if (!selectedPhoto || !selectedOutfit || credits <= 0) return;
    setLoading(true);
    setResult(null);
    setCombinations([]);
    setUyumScore(0);
    setColorSuggestion('');
    setStyleTip('');
    setStatus('⏳ AI çalışıyor...');
    try {
      const res = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelImage: selectedPhoto.url, garmentImage: selectedOutfit.img, category }),
      });
      const data = await res.json();
      if (data.output) {
        setResult(data.output);
        setUyumScore(Math.floor(Math.random() * 21) + 80);
        fetch('/api/ai-comment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outfitName: selectedOutfit.name, category, brand: selectedOutfit.brand }),
        }).then(r => r.json()).then(d => {
          if (d.comment) setAiComment(d.comment);
          if (d.combinations) setCombinations(d.combinations);
          if (d.colorSuggestion) setColorSuggestion(d.colorSuggestion);
          if (d.styleTip) setStyleTip(d.styleTip);
          if (d.combinations) {
            d.combinations.forEach(async (c: any, i: number) => {
              const searchTerms = [
                `https://www.trendyol.com/sr?q=${encodeURIComponent(c.search)}&st=${encodeURIComponent(c.search)}`,
                `https://www.hepsiburada.com/ara?q=${encodeURIComponent(c.search)}`,
                `https://www.lcw.com/arama?q=${encodeURIComponent(c.search)}`,
              ];
              const storeNames = ['Trendyol', 'Hepsiburada', 'LCW'];
              const storeColors = ['#f27a1a', '#ff6000', '#e30613'];
              setCombinations((prev: any[]) => prev.map((item: any, idx: number) =>
                idx === i ? {
                  ...item,
                  storeUrl: searchTerms[i % searchTerms.length],
                  storeName: storeNames[i % storeNames.length],
                  storeColor: storeColors[i % storeColors.length],
                } : item
              ));
            });
          }
        });
        const historyItem = {
          id: Date.now(),
          date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          photo: selectedPhoto.url,
          outfit: selectedOutfit.img,
          result: data.output,
          outfitName: selectedOutfit.name,
        };
        const updatedHistory = [historyItem, ...history].slice(0, 50);
        setHistory(updatedHistory);
        safeSet('cabin_history', updatedHistory, 30);
        setCredits(c => c - 1);
        setStatus('✅ Tamamlandı!');
        setTimeout(() => setStatus(''), 3000);
      } else { setStatus('❌ ' + (data.error || 'Hata oluştu')); setTimeout(() => setStatus(''), 5000); }
    } catch { setStatus('❌ Bağlantı hatası'); setTimeout(() => setStatus(''), 3000); }
    finally { setLoading(false); }
  }

  const menuItems = [
    { icon: <Zap size={18} />,         label: 'CaBin' },
    { icon: <Clock size={18} />,       label: 'Geçmiş' },
    { icon: <Heart size={18} />,       label: 'Beğendiklerim' },
    { icon: <ShoppingBag size={18} />, label: 'Gardırobum' },
    { icon: <Store size={18} />,       label: 'AVM', badge: 'Yeni' },
    { icon: <CreditCard size={18} />,  label: 'Krediler' },
    { icon: <User size={18} />,        label: 'Profil' },
    { icon: <Settings size={18} />,    label: 'Ayarlar' },
    { icon: <Gift size={18} />,        label: 'Davet Et' },
  ];

  return (
    <div onClick={() => { setCartOpen(false); setUserMenuOpen(false); }} style={{ fontFamily: "'Inter', sans-serif", background: '#fafafa', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#1a1a2e' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        ::-webkit-scrollbar { width: 4px } ::-webkit-scrollbar-thumb { background: #d4c5f9; border-radius: 2px }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        .tab-btn:hover { background: #f5f3ff !important; color: #7c3aed !important; }
        .size-btn:hover { border-color: #7c3aed !important; color: #7c3aed !important; }
        .upload-zone:hover { border-color: #7c3aed !important; background: #f5f3ff !important; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ height: 60, background: '#fff', borderBottom: '1px solid #ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CaBin</div>
          <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 500 }}>See it. Try it. Love it.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div onClick={() => setActiveMenu('Krediler')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: '#f5f3ff', border: '1px solid #ede9fe' }}>
            <span style={{ fontSize: 13 }}>⚡</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>{credits} Kredi</span>
          </div>
          <button onClick={() => setActiveMenu('Davet Et')} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #ede9fe', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
            <Gift size={17} />
          </button>
          <div style={{ position: 'relative', width: 36, height: 36, borderRadius: 10, border: '1px solid #ede9fe', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
            <Bell size={17} />
            <div style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: '#ec4899' }} />
          </div>
          <div onClick={e => { e.stopPropagation(); setCartOpen(!cartOpen); }} style={{ position: 'relative', width: 36, height: 36, borderRadius: 10, border: '1px solid #f0eef8', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {cart.length > 0 && <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#ec4899', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cart.length}</div>}
          </div>
          <div style={{ position: 'relative' }}>
            <div onClick={e => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 10px', borderRadius: 10, border: '1px solid #ede9fe', background: '#fff' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, overflow: 'hidden' }}>
                {profilePhoto ? <img src={profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userName ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) : 'KU')}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{userName || 'Kullanıcı'}</span>
            </div>
            {userMenuOpen && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 44, right: 0, background: '#fff', border: '1px solid #ede9fe', borderRadius: 12, padding: 8, minWidth: 160, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,.1)' }}>
                <button onClick={() => { setActiveMenu('Profil'); setUserMenuOpen(false); }} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', color: '#1a1a2e', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}><User size={14} /> Profil</button>
                <button onClick={() => { setActiveMenu('Ayarlar'); setUserMenuOpen(false); }} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', color: '#1a1a2e', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}><Settings size={14} /> Ayarlar</button>
                <div style={{ height: 1, background: '#f3f4f6', margin: '4px 0' }} />
                <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', color: '#dc2626', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>🚪 Çıkış Yap</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {activeMenu === 'CaBin' && (
          <>
            {/* ── LEFT COLUMN (260px) ── */}
            <div style={{ width: 260, background: '#fff', borderRight: '1px solid #ede9fe', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ overflowY: 'auto', flex: 1, padding: '16px 14px' }}>

                {/* STEP 1 */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Fotoğrafını Seç</span>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <button onClick={() => camRef.current?.click()} style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#16a34a', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      📷 Kamera
                    </button>
                    <button onClick={() => galleryRef.current?.click()} style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: '1px solid #ede9fe', background: '#faf7ff', color: '#7c3aed', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      🖼️ Galeri
                    </button>
                  </div>

                  {photoStatus && <div style={{ fontSize: 10, color: '#7c3aed', marginBottom: 6, textAlign: 'center' }}>{photoStatus}</div>}

                  {selectedPhoto && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: '1.5px solid #3b82f6', background: '#eff6ff', marginBottom: 6 }}>
                      <img src={selectedPhoto.url} style={{ width: 42, height: 42, borderRadius: 7, objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedPhoto.name}</div>
                        <div style={{ fontSize: 10, color: '#3b82f6' }}>✓ Seçili</div>
                      </div>
                    </div>
                  )}

                  {photos.length >= 6 && (
                    <div style={{ fontSize: 10, color: '#f59e0b', background: '#fef3c7', borderRadius: 8, padding: '6px 10px', marginBottom: 6 }}>
                      ⚠️ Max 6 fotoğraf. Yeni eklemek için birini sil.
                    </div>
                  )}

                  {photos.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {photos.slice(0, 6).map(p => (
                        <div key={p.id} onClick={() => setSelectedPhoto(p)} style={{ width: 46, height: 46, borderRadius: 8, overflow: 'hidden', border: `2px solid ${selectedPhoto?.id === p.id ? '#3b82f6' : '#e5e7eb'}`, cursor: 'pointer', transition: 'border-color .15s' }}>
                          <img src={p.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: '#f3f4f6', marginBottom: 20 }} />

                {/* STEP 2 */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Ürünü Seç</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', marginBottom: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    <input value={link} onChange={e => setLink(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchLink()} placeholder="Trendyol, Hepsiburada linki..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: '#374151', background: 'transparent', fontFamily: 'inherit' }} />
                    {link && <button onClick={fetchLink} style={{ padding: '4px 10px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Getir</button>}
                  </div>

                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={async e => {
                      e.preventDefault();
                      const files = e.dataTransfer.files;
                      if (files.length && files[0].type.startsWith('image/')) {
                        loadOutfitFile({ target: { files } } as any);
                        return;
                      }
                      const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
                      if (url?.startsWith('http')) { setLink(url); }
                    }}
                    style={{ border: '2px dashed #d8b4fe', borderRadius: 12, padding: '20px 12px', textAlign: 'center', background: '#faf8ff', marginBottom: 8, cursor: 'pointer', minHeight: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <div style={{ fontSize: 24 }}>🖱️</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed' }}>Görseli buraya sürükle bırak</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>veya internetten resim sürükle</div>
                  </div>

                  <button onClick={fetchLink} style={{ width: '100%', padding: '8px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6 }}>Ürünü Getir</button>

                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <button onClick={() => outfitCamRef.current?.click()} style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#16a34a', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      📷 Kamera
                    </button>
                    <button onClick={() => outfitRef.current?.click()} style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: '1px solid #ede9fe', background: '#faf7ff', color: '#7c3aed', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      🖼️ Galeriden
                    </button>
                  </div>

                  {status && <div style={{ fontSize: 10, color: status.startsWith('❌') ? '#dc2626' : '#7c3aed', marginBottom: 6, textAlign: 'center' }}>{status}</div>}

                  {selectedOutfit && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: '1.5px solid #7c3aed', background: '#faf7ff' }}>
                      <img src={selectedOutfit.img} style={{ width: 42, height: 42, borderRadius: 7, objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedOutfit.name}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af' }}>{selectedOutfit.brand}</div>
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#7c3aed', color: '#fff', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</div>
                    </div>
                  )}

                  {isKombin && (
                    <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#92400e', marginBottom: 6 }}>✨ Kombin Modu — Max 4 ürün seç</div>
                      <div style={{ fontSize: 10, color: '#92400e' }}>Her ürün için kategori seç:</div>
                      {kombinItems.length > 0 && kombinItems.map((ki, i) => {
                        const outfit = outfits.find(o => o.id === ki.outfitId);
                        return outfit ? (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                            <img src={outfit.img} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', flex: 1 }}>{outfit.name.substring(0, 15)}</div>
                            <select value={ki.category} onChange={e => setKombinItems(prev => prev.map((item, idx) => idx === i ? {...item, category: e.target.value} : item))} style={{ fontSize: 10, borderRadius: 6, border: '1px solid #e5e7eb', padding: '2px 4px', fontFamily: 'inherit' }}>
                              <option>Üst</option>
                              <option>Alt</option>
                              <option>Ayakkabı</option>
                              <option>Takı</option>
                              <option>Dış Giyim</option>
                              <option>Gözlük</option>
                            </select>
                            <button onClick={() => setKombinItems(prev => prev.filter((_, idx) => idx !== i))} style={{ width: 18, height: 18, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', border: 'none', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                          </div>
                        ) : null;
                      })}
                      {kombinItems.length < 4 && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>Aşağıdan ürün seç ({4 - kombinItems.length} yer kaldı)</div>}
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: '#f3f4f6', marginBottom: 20 }} />

                {/* STEP 3 */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Üstünde Gör</span>
                  </div>

                </div>
              </div>
            </div>

            {/* ── MIDDLE COLUMN (flex) ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f5f3ff', overflow: 'hidden', padding: 16, gap: 12 }}>

              {/* Sonuç alanı */}
              <div style={{ flex: 1, borderRadius: 16, border: '2px solid #fb923c', overflow: 'hidden', position: 'relative', background: '#fafafa', minHeight: 0, display: 'flex', flexDirection: 'column' }}>

                {/* Kategori barı */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px', borderBottom: '1px solid #f0eef8', flexShrink: 0, background: '#fff' }}>
                  {[
                    { cat: 'Üst',      icon: <Shirt size={14}/> },
                    { cat: 'Alt',      icon: <Scissors size={14}/> },
                    { cat: 'Elbise',   icon: <Sparkles size={14}/> },
                    { cat: 'Ceket',    icon: <Wind size={14}/> },
                    { cat: 'Ayakkabı', icon: <Footprints size={14}/> },
                    { cat: 'Gözlük',   icon: <Glasses size={14}/> },
                    { cat: 'Şapka',    icon: <HardHat size={14}/> },
                    { cat: 'Takı',     icon: <Gem size={14}/> },
                  ].map(item => (
                    <button key={item.cat} onClick={() => setCategory(item.cat)} style={{ padding: '5px 10px', borderRadius: 20, border: `1.5px solid ${category === item.cat ? '#7c3aed' : '#e5e7eb'}`, background: category === item.cat ? '#7c3aed' : '#fff', color: category === item.cat ? '#fff' : '#6b7280', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      {item.icon}{item.cat}
                    </button>
                  ))}
                  <button onClick={() => setIsKombin(!isKombin)} style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${isKombin ? '#f59e0b' : '#e5e7eb'}`, background: isKombin ? '#fef3c7' : '#fff', color: isKombin ? '#d97706' : '#6b7280', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    ✨ Kombin {isKombin ? '(5 Kredi)' : 'Modu'}
                  </button>
                </div>

                {/* Önce / Sonra alanı */}
                <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

                  {/* ÖNCE - Kişi fotoğrafı */}
                  <div style={{ flex: 1, position: 'relative', borderRight: '1px solid #f0eef8', overflow: 'hidden', background: '#f8f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedPhoto ? (
                      <>
                        <img src={selectedPhoto.url} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} />
                        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5 }}>ÖNCE</div>
                      </>
                    ) : (
                      <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px dashed #d8b4fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d8b4fe" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                    )}
                  </div>

                  {/* Ortada Dene butonu */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0 }}>
                    <button onClick={doTry} disabled={loading || !selectedPhoto || !selectedOutfit} style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', background: (!loading && selectedPhoto && selectedOutfit) ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : '#e5e7eb', color: '#fff', fontSize: 20, cursor: (!loading && selectedPhoto && selectedOutfit) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: (!loading && selectedPhoto && selectedOutfit) ? '0 4px 14px rgba(124,58,237,.4)' : 'none', flexShrink: 0 }}>
                      {loading ? <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTop: '2px solid #fff', animation: 'spin 1s linear infinite' }} /> : '⚡'}
                    </button>
                  </div>

                  {/* SONRA - Sonuç */}
                  <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#f8f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {loading ? (
                      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                        <div style={{ position: 'relative', width: 100, height: 100 }}>
                          <svg style={{ position: 'absolute', inset: 0, animation: 'spin 1.5s linear infinite' }} width="100" height="100" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="44" fill="none" stroke="#ede9fe" strokeWidth="6"/>
                            <circle cx="50" cy="50" r="44" fill="none" stroke="url(#grad)" strokeWidth="6" strokeDasharray="80 200" strokeLinecap="round"/>
                            <defs>
                              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#7c3aed"/>
                                <stop offset="100%" stopColor="#ec4899"/>
                              </linearGradient>
                            </defs>
                          </svg>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 800, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>CaBin</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>Giydiriliyor...</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>20-40 saniye sürebilir</div>
                      </div>
                    ) : result ? (
                      <>
                        <img src={result} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} />
                        <div style={{ position: 'absolute', top: 10, right: 10, background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5 }}>SONRA</div>
                      </>
                    ) : selectedOutfit ? (
                      <>
                        <img src={selectedOutfit.img} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} />
                        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5 }}>ÜRÜN</div>
                      </>
                    ) : (
                      <div style={{ position: 'relative', width: 120, height: 140 }}>
                        {outfits.slice(0, 4).map((o, i) => (
                          <div key={o.id} onClick={() => setSelectedOutfit(o)} style={{ position: 'absolute', width: 80, height: 100, borderRadius: 10, overflow: 'hidden', border: `2px solid ${selectedOutfit?.id === o.id ? '#7c3aed' : '#e5e7eb'}`, cursor: 'pointer', transform: `rotate(${(i - 1.5) * 8}deg) translateY(${i * 2}px)`, left: i * 8, top: i * 4, boxShadow: '0 2px 8px rgba(0,0,0,.1)', background: '#fff', zIndex: i }}>
                            <img src={o.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                        {outfits.length === 0 && (
                          <div style={{ width: 80, height: 100, borderRadius: 10, border: '2px dashed #d8b4fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d8b4fe" strokeWidth="1.5"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>

                {/* Sonuç action butonları */}
                {result && (
                  <div style={{ display: 'flex', gap: 4, padding: '8px 12px', flexShrink: 0, borderTop: '1px solid #f0eef8', background: '#fff' }}>
                    <button onClick={() => { if (selectedOutfit && !cart.find(c => c.id === selectedOutfit.id)) { setCart(prev => [...prev, selectedOutfit]); setStatus('🛒 Sepete eklendi!'); setTimeout(() => setStatus(''), 2000); }}} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      Sepete Ekle
                    </button>
                    <button onClick={() => { setLiked(!liked); if (result && selectedOutfit) { const fav = { ...selectedOutfit, resultImg: result }; const updated = [fav, ...favorites.filter((f: any) => f.id !== selectedOutfit.id)]; setFavorites(updated); safeSet('cabin_favorites', updated, 30); }}} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: '1px solid #e5e7eb', background: liked ? '#fdf2f8' : '#fff', color: liked ? '#ec4899' : '#374151', fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? '#ec4899' : 'none'} stroke={liked ? '#ec4899' : 'currentColor'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      Beğen
                    </button>
                    <button onClick={async () => { if (!result) return; try { const res = await fetch(result); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'cabin-sonuc.jpg'; a.click(); } catch { window.open(result, '_blank'); }}} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      İndir
                    </button>
                    <button onClick={() => { setResult(null); setSelectedOutfit(null); setAiComment(''); setColorSuggestion(''); setStyleTip(''); setCombinations([]); setLiked(false); }} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.12"/></svg>
                      Yeni Dene
                    </button>
                  </div>
                )}
              </div>

              {/* Farklı ürünleri dene */}
              {outfits.length > 0 && (
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 8, letterSpacing: '.3px' }}>Farklı ürünleri dene</div>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {outfits.slice(0, 10).map(o => (
                      <div key={o.id} onClick={() => { if (!isKombin) setSelectedOutfit(o); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: isKombin ? 'default' : 'pointer', flexShrink: 0, width: 70 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', border: `2px solid ${selectedOutfit?.id === o.id ? '#7c3aed' : '#e5e7eb'}`, position: 'relative' }}>
                          <img src={o.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {isKombin && kombinItems.length < 4 && !kombinItems.find(k => k.outfitId === o.id) && (
                            <button onClick={e => { e.stopPropagation(); setKombinItems(prev => [...prev, { outfitId: o.id, category: 'Üst' }]); }} style={{ position: 'absolute', top: 2, right: 2, width: 22, height: 22, borderRadius: '50%', background: '#7c3aed', color: '#fff', border: 'none', fontSize: 14, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          )}
                          {isKombin && kombinItems.find(k => k.outfitId === o.id) && (
                            <div style={{ position: 'absolute', top: 2, right: 2, width: 22, height: 22, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</div>
                          )}
                        </div>
                        {o.brand && o.brand !== '—' && (
                          <div style={{ fontSize: 8, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{o.brand.substring(0, 10)}</div>
                        )}
                        {o.price && o.price !== '—' && (
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#7c3aed' }}>
                            {String(o.price).replace(/[^\d.,]/g, '').split(/[.,]/)[0]} ₺
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN (300px) ── */}
            <div style={{ width: 300, background: '#fff', borderLeft: '1px solid #f0eef8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {result ? (
                <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Uyum Skoru */}
                  <div style={{ background: '#fef9f0', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: '#92400e', marginBottom: 4 }}>🔥 Uyum Skoru</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>{uyumScore}/100</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: '#dcfce7', color: '#16a34a', fontWeight: 600 }}>Boy: Uyumlu</span>
                      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: '#dbeafe', color: '#2563eb', fontWeight: 600 }}>Renk: Çok İyi</span>
                      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: '#fae8ff', color: '#9333ea', fontWeight: 600 }}>Tarz: Mükemmel</span>
                    </div>
                    {aiComment && <div style={{ fontSize: 11, color: '#78716c', marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' }}>"{aiComment}"</div>}
                    {colorSuggestion && <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 4 }}>🎨 {colorSuggestion}</div>}
                    {styleTip && <div style={{ fontSize: 11, color: '#ec4899', marginTop: 4 }}>✨ {styleTip}</div>}
                  </div>
                  {/* Satın Al */}
                  {selectedOutfit?.link && (
                    <a href={selectedOutfit.link} target="_blank" rel="noreferrer" style={{ display: 'block', padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>🛒 Ürünü Satın Al</a>
                  )}
                  {/* Kombin Önerileri */}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>✨ Kombin Önerileri</div>
                    {combinations.length === 0 ? (
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>Yükleniyor...</div>
                    ) : combinations.map((c: any, i: number) => {
                      const fallbackUrls = [
                        `https://www.trendyol.com/sr?q=${encodeURIComponent(c.search)}`,
                        `https://www.hepsiburada.com/ara?q=${encodeURIComponent(c.search)}`,
                        `https://www.lcw.com/arama?q=${encodeURIComponent(c.search)}`,
                      ];
                      const fallbackNames = ['Trendyol', 'Hepsiburada', 'LCW'];
                      const fallbackColors = ['#f27a1a', '#ff6000', '#e30613'];
                      const url = c.storeUrl || fallbackUrls[i % 3];
                      const name = c.storeName || fallbackNames[i % 3];
                      const color = c.storeColor || fallbackColors[i % 3];
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < combinations.length - 1 ? '1px solid #f0eef8' : 'none' }}>
                          {c.productImg && (
                            <img src={c.productImg} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{c.item}</div>
                            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{c.reason}</div>
                            {c.productPrice && c.productPrice !== '—' && (
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginTop: 2 }}>{c.productPrice}</div>
                            )}
                          </div>
                          <a href={url} target="_blank" rel="noreferrer" style={{ padding: '4px 10px', borderRadius: 20, background: color, color: '#fff', fontSize: 10, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>{name} →</a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, padding: 16 }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>✨</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 1.5 }}>Deneme sonrası AI yorumu ve kombin önerileri burada görünecek</div>
                </div>
              )}
            </div>
          </>
        )}

        {activeMenu !== 'CaBin' && (
          <div style={{ flex: 1, overflowY: 'auto', background: '#fafafa' }}>

            {activeMenu === 'Geçmiş' && (
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={20} /> Geçmiş Denemelerim</div>
                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>Henüz deneme yapılmadı</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {history.map(h => (
                      <div key={h.id} onClick={() => setSelectedHistory(h)} style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
                        <div style={{ display: 'flex', height: 180 }}>
                          <img src={h.photo} style={{ flex: 1, objectFit: 'cover', width: '50%' }} />
                          <div style={{ width: 2, background: '#ede9fe' }} />
                          <img src={h.result} style={{ flex: 1, objectFit: 'cover', width: '50%' }} />
                        </div>
                        <div style={{ padding: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{h.outfitName}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{h.date}</div>
                          <button onClick={async e => { e.stopPropagation(); const res = await fetch(h.result); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'cabin-sonuc.jpg'; a.click(); }} style={{ marginTop: 8, padding: '6px 12px', borderRadius: 8, border: '1px solid #ede9fe', background: '#faf7ff', color: '#7c3aed', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>⬇ İndir</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeMenu === 'Beğendiklerim' && (
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>❤️ Beğendiklerim</div>
                {favorites.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 13 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
                    Henüz beğendiğiniz bir şey yok
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {favorites.map((f: any) => (
                      <div key={f.id} style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
                        <div style={{ height: 200, position: 'relative' }}>
                          <img src={f.img} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                        </div>
                        <div style={{ padding: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>{f.name}</div>
                          {f.price !== '—' && <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', marginTop: 2 }}>{f.price}</div>}
                          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                            <button onClick={() => { setCart(prev => [...prev, f]); setCartOpen(true); }} style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>🛒 Sepete Ekle</button>
                            <button onClick={() => { const updated = favorites.filter((x: any) => x.id !== f.id); setFavorites(updated); safeSet('cabin_favorites', updated, 30); }} style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fff5f5', color: '#dc2626', fontSize: 11, cursor: 'pointer' }}>🗑️</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeMenu === 'Gardırobum' && (
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>👗 Gardırobum</div>
                {wardrobe.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 13 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>👗</div>
                    Gardırobunuz boş
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                    {wardrobe.map((w: Outfit) => (
                      <div key={w.id} onClick={() => { setSelectedOutfit(w); setActiveMenu('CaBin'); }} style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
                        <div style={{ height: 180, overflow: 'hidden' }}>
                          <img src={w.img} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                        </div>
                        <div style={{ padding: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                          <button onClick={e => { e.stopPropagation(); setSelectedOutfit(w); setActiveMenu('CaBin'); }} style={{ marginTop: 6, width: '100%', padding: '5px', borderRadius: 7, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>⚡ Dene</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeMenu === 'AVM' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={{ textAlign: 'center', maxWidth: 500, padding: 40 }}>
                  <div style={{ fontSize: 64, marginBottom: 20 }}>🛍️</div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 800, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>CaBin AVM</div>
                  <div style={{ fontSize: 15, color: '#9ca3af', marginBottom: 24 }}>AI ile deneyip beğendiğin kıyafetleri tek tıkla satın alabileceğin alışveriş merkezi çok yakında!</div>
                </div>
              </div>
            )}

            {activeMenu === 'Krediler' && (
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 24 }}>💳 Krediler</div>
                <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', borderRadius: 20, padding: 24, color: '#fff' }}>
                    <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>Mevcut Krediniz</div>
                    <div style={{ fontSize: 48, fontWeight: 800, marginBottom: 4 }}>⚡ {credits}</div>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>≈ {credits} deneme hakkı kaldı</div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 16, padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>Paket Seç</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                      {[
                        { credits: 20, price: '$5.99', label: 'Starter', popular: false },
                        { credits: 50, price: '$11.99', label: 'Standard', popular: false },
                        { credits: 120, price: '$24.99', label: 'Plus', popular: true },
                        { credits: 300, price: '$49.99', label: 'Premium', popular: false },
                      ].map(pkg => (
                        <div key={pkg.credits} style={{ background: pkg.popular ? '#f5f3ff' : '#fafafa', border: `1.5px solid ${pkg.popular ? '#7c3aed' : '#e5e7eb'}`, borderRadius: 12, padding: 14, textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                          {pkg.popular && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#7c3aed', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>⭐ Popüler</div>}
                          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>{pkg.label}</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#7c3aed' }}>{pkg.credits}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 8 }}>Kredi</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{pkg.price}</div>
                          <button style={{ width: '100%', padding: '6px', borderRadius: 8, border: 'none', background: pkg.popular ? '#7c3aed' : '#ede9fe', color: pkg.popular ? '#fff' : '#7c3aed', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Satın Al</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'Profil' && (
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 24 }}>👤 Profilim</div>
                <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                      {profilePhoto ? <img src={profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userName ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) : 'KU')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>{userName}</div>
                      <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{userEmail}</div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 16 }}>
                        {([
                          [Clock,       history.length,   'Deneme'],
                          [Heart,       favorites.length, 'Beğeni'],
                          [ShoppingBag, wardrobe.length,  'Gardırop'],
                        ] as [React.ElementType, number, string][]).map(([Icon, count, label]) => (
                          <div key={label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><Icon size={13} /> {count}</div>
                            <div style={{ fontSize: 10, color: '#9ca3af' }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => profilePhotoRef.current?.click()} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #ede9fe', background: '#faf7ff', color: '#7c3aed', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>📷 Değiştir</button>
                    <input ref={profilePhotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { const reader = new FileReader(); reader.onloadend = () => setProfilePhoto(reader.result as string); reader.readAsDataURL(f); } }} />
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 16, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 }}>Kişisel Bilgiler</div>
                    {[['Ad Soyad', userName], ['E-posta', userEmail]].map(([label, value]) => (
                      <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{label}</div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1a2e' }}>{value}</div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>Telefon</div>
                      {editMode ? (
                        <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid #ede9fe', fontSize: 12, color: '#1a1a2e', background: '#faf7ff', outline: 'none' }} />
                      ) : (
                        <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1a2e' }}>{phoneNumber}</div>
                      )}
                    </div>
                    <button onClick={() => setEditMode(!editMode)} style={{ marginTop: 12, width: '100%', padding: 10, borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{editMode ? '✅ Kaydet' : '✏️ Düzenle'}</button>
                  </div>
                  <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #fee2e2', background: '#fff5f5', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🚪 Çıkış Yap</button>
                </div>
              </div>
            )}

            {activeMenu === 'Ayarlar' && (
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 24 }}>⚙️ Ayarlar</div>
                <div style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 16, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>🔔 Bildirimler</div>
                    {([
                      ['Deneme tamamlandığında bildir', notifyDone, setNotifyDone],
                      ['Kredi azaldığında uyar', notifyCredit, setNotifyCredit],
                      ['Yeni özellikler hakkında bilgi ver', notifyNews, setNotifyNews],
                    ] as [string, boolean, (v: boolean) => void][]).map(([label, val, setter], i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
                        <div style={{ fontSize: 13, color: '#1a1a2e' }}>{label}</div>
                        <div onClick={() => setter(!val)} style={{ width: 44, height: 24, borderRadius: 12, background: val ? '#7c3aed' : '#e5e7eb', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                          <div style={{ position: 'absolute', top: 2, left: val ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 16, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>🔒 Güvenlik</div>
                    <button onClick={async () => { const { error } = await supabase.auth.resetPasswordForEmail(userEmail); if (!error) alert('Şifre sıfırlama emaili gönderildi!'); else alert('Hata: ' + error.message); }} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ede9fe', background: '#faf7ff', color: '#7c3aed', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>🔑 Şifre Değiştir</button>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 16, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>🗑️ Hesap</div>
                    <button onClick={async () => { if (confirm('Hesabınızı silmek istediğinize emin misiniz?')) { await supabase.auth.signOut(); window.location.href = '/login'; } }} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #fee2e2', background: '#fff5f5', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Hesabı Sil</button>
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'Davet Et' && (
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 24 }}>🎁 Davet Et & Kazan</div>
                <div style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', borderRadius: 16, padding: 24, color: '#fff', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 4 }}>+50 Kredi</div>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>Her davet için kazan</div>
                  </div>
                  <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 16, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>🔗 Davet Linkin</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>5 kişi kayıt olup yükleme yaparsa +50 kredi kazan!</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #ede9fe', background: '#faf7ff', fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>cabin.app/login?ref={referralCode}</div>
                      <button onClick={() => { navigator.clipboard.writeText(`cabin.app/login?ref=${referralCode}`); setStatus('✅ Link kopyalandı!'); setTimeout(() => setStatus(''), 3000); }} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Kopyala</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── BOTTOM TAB BAR ── */}
      <div style={{ height: 56, background: '#fff', borderTop: '1px solid #ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexShrink: 0, boxShadow: '0 -2px 8px rgba(0,0,0,.05)' }}>
        {[
          { Icon: Zap,         label: 'Sanal Dene',  menu: 'CaBin' },
          { Icon: Heart,       label: 'Kombinlerim', menu: 'Beğendiklerim' },
          { Icon: Store,       label: 'AVM',         menu: 'AVM' },
          { Icon: ShoppingBag, label: 'Gardırobum',  menu: 'Gardırobum' },
          { Icon: CreditCard,  label: 'Kredilerim',  menu: 'Krediler' },
          { Icon: Settings,    label: 'Ayarlar',     menu: 'Ayarlar' },
        ].map(({ Icon, label, menu }) => (
          <button key={menu} className="tab-btn" onClick={() => setActiveMenu(menu)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', color: activeMenu === menu ? '#7c3aed' : '#9ca3af' }}>
            <Icon size={18} strokeWidth={activeMenu === menu ? 2.5 : 1.8} />
            <span style={{ fontSize: 9, fontWeight: activeMenu === menu ? 700 : 400, whiteSpace: 'nowrap' }}>{label}</span>
            {activeMenu === menu && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#7c3aed', marginTop: 1 }} />}
          </button>
        ))}
      </div>

      {/* ── HISTORY MODAL ── */}
      {selectedHistory && (
        <div onClick={() => setSelectedHistory(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: 24, maxWidth: 600, width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{selectedHistory.outfitName}</div>
              <button onClick={() => setSelectedHistory(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 14, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 8, height: 280, marginBottom: 12 }}>
              <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', position: 'relative', border: '1px solid #ede9fe' }}>
                <img src={selectedHistory.photo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>ÖNCE</div>
              </div>
              <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', position: 'relative', border: '1px solid #ede9fe' }}>
                <img src={selectedHistory.result} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <div style={{ position: 'absolute', top: 8, right: 8, background: '#7c3aed', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>SONRA</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>{selectedHistory.date}</div>
            <button onClick={async () => { const res = await fetch(selectedHistory.result); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'cabin-sonuc.jpg'; a.click(); }} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>⬇ İndir</button>
          </div>
        </div>
      )}

      {/* ── CART DRAWER ── */}
      {cartOpen && (
        <div onClick={() => setCartOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 100 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, width: 320, height: '100%', background: '#fff', borderLeft: '1px solid #ede9fe', padding: 16, overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,.1)', animation: 'slideIn .25s ease' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>🛒 Sepetim ({cart.length})</div>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 40 }}>Sepetiniz boş</div>
            ) : cart.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <img src={item.img} style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>{item.price}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button onClick={() => window.open(item.link || `https://www.trendyol.com/sr?q=${encodeURIComponent(item.name)}`, '_blank')} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Satın Al</button>
                  <button onClick={() => setCart(prev => prev.filter(c => c.id !== item.id))} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'none', color: '#9ca3af', fontSize: 10, cursor: 'pointer' }}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HIDDEN INPUTS ── */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={loadPhotoFile} />
      <input ref={galleryRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={loadPhotoFile} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={loadPhotoFile} />
      <input ref={outfitRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={loadOutfitFile} />
      <input ref={outfitCamRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={loadOutfitFile} />
    </div>
  );
}
