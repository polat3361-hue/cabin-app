'use client';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
const CATEGORIES = ['Üst','Alt','Elbise','Ceket','Dış Giyim','Ayakkabı','Çanta','Gözlük','Aksesuar'];

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
  const [isDark, setIsDark] = useState(true);
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
  const [galleryWarning, setGalleryWarning] = useState('');
  const [sharedPlatforms, setSharedPlatforms] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('cabin_shared_platforms');
    const savedDate = localStorage.getItem('cabin_share_date');
    if (saved && savedDate) {
      const shareDate = new Date(savedDate);
      const now = new Date();
      const diffMonths = (now.getFullYear() - shareDate.getFullYear()) * 12 + (now.getMonth() - shareDate.getMonth());
      if (diffMonths < 4) return JSON.parse(saved);
      else { localStorage.removeItem('cabin_shared_platforms'); localStorage.removeItem('cabin_share_date'); return []; }
    }
    return [];
  });
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [facebookConnected, setFacebookConnected] = useState(false);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [xConnected, setXConnected] = useState(false);
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [aiComment, setAiComment] = useState('');
  const [uyumScore, setUyumScore] = useState(92);
  const [colorSuggestion, setColorSuggestion] = useState('');
  const [styleTip, setStyleTip] = useState('');
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
  const [selectedFavorite, setSelectedFavorite] = useState<any>(null);
  const [photoMenuOpen, setPhotoMenuOpen] = useState<number | null>(null);
  const [outfitMenuOpen, setOutfitMenuOpen] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Siyah');
  const [referredCount] = useState(3);
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
        if (remainingDays <= 7 && remainingDays > 0) setGalleryWarning(`⚠️ Galeriniz ${remainingDays} gün sonra silinecek! Fotoğraflarınızı indirin.`);
        else if (remainingDays <= 0) setGalleryWarning('❌ Galeri süreniz doldu! Fotoğraflarınız silinmiş olabilir.');
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
    try { localStorage.setItem('cabin_outfits', JSON.stringify(o)); } catch {}
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
      setWardrobe(updatedWardrobe);
      localStorage.setItem('cabin_wardrobe', JSON.stringify(updatedWardrobe));
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
      setWardrobe(updatedWardrobe);
      localStorage.setItem('cabin_wardrobe', JSON.stringify(updatedWardrobe));
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
        fetch('/api/ai-comment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outfitName: selectedOutfit.name, category, brand: selectedOutfit.brand }),
        }).then(r => r.json()).then(d => {
          if (d.comment) setAiComment(d.comment);
          if (d.score) setUyumScore(d.score);
          else setUyumScore(Math.floor(Math.random() * 20) + 80);
          if (d.colorSuggestion) setColorSuggestion(d.colorSuggestion);
          if (d.styleTip) setStyleTip(d.styleTip);
          if (d.combinations) setCombinations(d.combinations);
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
        localStorage.setItem('cabin_history', JSON.stringify(updatedHistory));
        setCredits(c => c - 1);
        setStatus('✅ Tamamlandı!');
        setTimeout(() => setStatus(''), 3000);
      } else { setStatus('❌ ' + (data.error || 'Hata oluştu')); setTimeout(() => setStatus(''), 5000); }
    } catch { setStatus('❌ Bağlantı hatası'); setTimeout(() => setStatus(''), 3000); }
    finally { setLoading(false); }
  }

  const bg = isDark ? '#0f0a1e' : '#f5f3ff';
  const panelBg = isDark ? '#1a1230' : '#ffffff';
  const border = isDark ? '#4c3580' : '#c4b5fd';
  const textPrimary = isDark ? '#e2e0f0' : '#1a1a2e';
  const textMuted = isDark ? '#9ca3af' : '#6b7280';
  const sidebarBg = isDark ? '#13102b' : '#ffffff';

  const menuItems = [
    { icon: '⚡', label: 'CaBin' },
    { icon: '⏱', label: 'Geçmiş' },
    { icon: '❤️', label: 'Beğendiklerim' },
    { icon: '🏪', label: 'Gardırobum' },
    { icon: '🛍️', label: 'AVM', badge: 'Yeni' },
    { icon: '💳', label: 'Krediler' },
    { icon: '👤', label: 'Profil' },
    { icon: '⚙️', label: 'Ayarlar' },
    { icon: '🎁', label: 'Davet Et' },
  ];

  const aiMetrics = [
    { label: 'Renk uyumu', pct: 32, color: '#ec4899' },
    { label: 'Stil uyumu', pct: 28, color: '#7c3aed' },
    { label: 'Genel görünüm', pct: 35, color: '#06b6d4' },
    { label: 'Özgüven etkisi', pct: 25, color: '#10b981' },
  ];

  return (
    <div onClick={() => { setCartOpen(false); setPhotoMenuOpen(null); setOutfitMenuOpen(null); setUserMenuOpen(false); }} style={{ fontFamily: "'Inter', sans-serif", background: bg, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: textPrimary }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#4c3580;border-radius:2px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .menu-btn:hover{background:${isDark ? '#2d2550' : '#f5f3ff'} !important;}
        select{background:${isDark ? '#1a1230' : '#fff'};color:${textPrimary};border:1px solid ${border};border-radius:7px;padding:5px 7px;font-size:11px;cursor:pointer;outline:none;}
      `}</style>

      {/* HEADER */}
      <div style={{ height: 56, background: panelBg, borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 800, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CaBin</div>
          <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 500 }}>See it. Try it. Love it.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b' }}>⚡ {credits} Kredi</div>
            <div style={{ fontSize: 10, color: textMuted }}>≈ {credits} deneme kaldı</div>
          </div>
          <button style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Kredi Yükle</button>
          <button onClick={() => setIsDark(!isDark)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${border}`, background: panelBg, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isDark ? '☀️' : '🌙'}</button>
          <button onClick={e => { e.stopPropagation(); setActiveMenu('Davet Et'); }} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${border}`, background: panelBg, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎁</button>
          <div style={{ position: 'relative', width: 32, height: 32, borderRadius: 8, border: `1px solid ${border}`, background: panelBg, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            🔔
            <div style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: '#ec4899' }} />
          </div>
          <div onClick={e => { e.stopPropagation(); setCartOpen(!cartOpen); }} style={{ position: 'relative', width: 32, height: 32, borderRadius: 8, border: `1px solid ${border}`, background: panelBg, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            🛒
            {cart.length > 0 && <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#ec4899', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cart.length}</div>}
          </div>
          <div style={{ position: 'relative' }}>
            <div onClick={e => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>{userName ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) : 'ÖY'}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{userName || 'Kullanıcı'}</span>
            </div>
            {userMenuOpen && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 40, right: 0, background: panelBg, border: `1px solid ${border}`, borderRadius: 12, padding: 8, minWidth: 160, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,.3)' }}>
                <button onClick={() => { setActiveMenu('Profil'); setUserMenuOpen(false); }} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', color: textPrimary, fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>👤 Profil</button>
                <button onClick={() => { setActiveMenu('Ayarlar'); setUserMenuOpen(false); }} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', color: textPrimary, fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>⚙️ Ayarlar</button>
                <div style={{ height: 1, background: border, margin: '4px 0' }} />
                <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', color: '#dc2626', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>🚪 Çıkış Yap</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {galleryWarning && (
        <div style={{ background: '#fef3c7', borderBottom: '1px solid #f59e0b', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 9 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>{galleryWarning}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setActiveMenu('Krediler')} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: '#f59e0b', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Premium'a Geç</button>
            <button onClick={() => setGalleryWarning('')} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #f59e0b', background: 'transparent', color: '#92400e', fontSize: 12, cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}

      {cartOpen && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: 56, right: 0, width: 320, height: 'calc(100vh - 56px)', background: panelBg, borderLeft: `1px solid ${border}`, zIndex: 100, padding: 16, overflowY: 'auto', boxShadow: '-4px 0 20px rgba(0,0,0,.3)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>🛒 Sepetim ({cart.length})</div>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: textMuted, fontSize: 13, marginTop: 40 }}>Sepetiniz boş</div>
          ) : cart.map(item => (
            <div key={item.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${border}` }}>
              <img src={item.img} style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary }}>{item.name}</div>
                <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>{item.price}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button onClick={() => window.open(item.link || `https://www.trendyol.com/sr?q=${encodeURIComponent(item.name)}`, '_blank')} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Satın Al</button>
                <button onClick={() => setCart(prev => prev.filter(c => c.id !== item.id))} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${border}`, background: 'none', color: textMuted, fontSize: 10, cursor: 'pointer' }}>Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedHistory && (
        <div onClick={() => setSelectedHistory(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: panelBg, borderRadius: 20, padding: 24, maxWidth: 600, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary }}>{selectedHistory.outfitName}</div>
              <button onClick={() => setSelectedHistory(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#fee2e2', color: '#dc2626', fontSize: 14, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 8, height: 300, marginBottom: 16 }}>
              <div style={{ flex: 1, position: 'relative', borderRadius: 12, overflow: 'hidden', background: isDark ? '#0f0a1e' : '#f0f0f0', border: `1px solid ${border}` }}>
                <img src={selectedHistory.photo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,.6)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>ÖNCE</div>
              </div>
              <div style={{ flex: 1, position: 'relative', borderRadius: 12, overflow: 'hidden', background: isDark ? '#0f0a1e' : '#f0f0f0', border: `1px solid ${border}` }}>
                <img src={selectedHistory.result} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                <div style={{ position: 'absolute', top: 8, right: 8, background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>SONRA</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: textMuted, marginBottom: 12 }}>{selectedHistory.date}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setCart(prev => [...prev, { id: Date.now(), name: selectedHistory.outfitName, brand: '—', price: '—', img: selectedHistory.outfit }]); setCartOpen(true); setSelectedHistory(null); }} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>🛒 Sepete Ekle</button>
              <button onClick={async () => { const res = await fetch(selectedHistory.result); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'cabin-sonuc.jpg'; a.click(); }} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${border}`, background: panelBg, color: textPrimary, fontSize: 13, cursor: 'pointer' }}>⬇ İndir</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* SIDEBAR */}
        <div style={{ width: 170, background: sidebarBg, borderRight: `1px solid ${border}`, display: 'flex', flexDirection: 'column', padding: '12px 8px', flexShrink: 0 }}>
          {menuItems.map((item, i) => (
            <button key={i} className="menu-btn" onClick={() => setActiveMenu(item.label)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: activeMenu === item.label ? (isDark ? '#2d2550' : '#f5f3ff') : 'transparent', color: activeMenu === item.label ? '#7c3aed' : textMuted, fontSize: 13, fontWeight: activeMenu === item.label ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left', marginBottom: 2, transition: 'all .15s' }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {item.badge && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#fef3c7', color: '#d97706', fontWeight: 700, marginLeft: 'auto' }}>{item.badge}</span>}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {/* Referral progress */}
          <div style={{ background: isDark ? '#2d2550' : '#f5f3ff', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: textPrimary, marginBottom: 3 }}>🎁 Davet Durumu</div>
            <div style={{ fontSize: 10, color: textMuted, marginBottom: 7 }}>{referredCount}/5 kişi davet edildi</div>
            <div style={{ height: 6, borderRadius: 3, background: isDark ? '#1a1230' : '#e5e7eb', overflow: 'hidden', marginBottom: 5 }}>
              <div style={{ height: '100%', width: `${(referredCount / 5) * 100}%`, background: 'linear-gradient(90deg,#7c3aed,#ec4899)', borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginBottom: 8 }}>+{referredCount * 20} Kredi Kazandın!</div>
            <button onClick={() => setActiveMenu('Davet Et')} style={{ width: '100%', padding: '7px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Davet Et</button>
          </div>
          <div style={{ fontSize: 10, color: textMuted, textAlign: 'center', marginTop: 8 }}>CaBin v1.0.0</div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {activeMenu === 'CaBin' && (<>

          {/* SOL — Fotoğraf Seç */}
          <div style={{ width: 240, background: panelBg, borderRight: `1px solid ${border}`, display: 'flex', flexDirection: 'column', padding: 14, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 3 }}>Fotoğrafını Seç</div>
            <div style={{ fontSize: 10, color: textMuted, marginBottom: 10 }}>Net ve tam boy fotoğraf kullan.</div>
            <div
              ref={dropRef}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f && f.type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onloadend = () => addPhoto(reader.result as string, f.name);
                  reader.readAsDataURL(f);
                }
              }}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${border}`, borderRadius: 10, padding: 12, textAlign: 'center', cursor: 'pointer', marginBottom: 8, background: isDark ? '#13102b' : '#faf8ff' }}
            >
              <div style={{ fontSize: 22, marginBottom: 4, color: '#a78bfa' }}>+</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed' }}>Yeni Fotoğraf Yükle</div>
              <div style={{ fontSize: 9, color: textMuted, marginTop: 1 }}>veya sürükle bırak</div>
            </div>
            <button onClick={() => camRef.current?.click()} style={{ width: '100%', padding: '6px', borderRadius: 7, border: '1px solid #bbf7d0', background: isDark ? '#052e16' : '#f0fdf4', color: '#16a34a', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>📷 Kamera ile Çek</button>
            {photoStatus && <div style={{ fontSize: 10, color: '#7c3aed', marginBottom: 6 }}>{photoStatus}</div>}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={loadPhotoFile} />
            <input ref={galleryRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={loadPhotoFile} />
            <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={loadPhotoFile} />
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {photos.map(photo => (
                <div key={photo.id} onClick={() => { setSelectedPhoto(photo); setPhotoMenuOpen(null); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 9, border: `1.5px solid ${selectedPhoto?.id === photo.id ? '#2563eb' : border}`, background: selectedPhoto?.id === photo.id ? (isDark ? 'rgba(37,99,235,0.12)' : '#eff6ff') : panelBg, cursor: 'pointer', transition: 'all .2s', position: 'relative' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={photo.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.name}</div>
                    {selectedPhoto?.id === photo.id && <div style={{ fontSize: 9, color: '#2563eb', marginTop: 1 }}>Seçili</div>}
                  </div>
                  {selectedPhoto?.id === photo.id ? (
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>✓</div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <button onClick={e => { e.stopPropagation(); setPhotoMenuOpen(photoMenuOpen === photo.id ? null : photo.id); }} style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'transparent', color: textMuted, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⋮</button>
                      {photoMenuOpen === photo.id && (
                        <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: 24, background: panelBg, border: `1px solid ${border}`, borderRadius: 8, padding: 4, zIndex: 50, minWidth: 100, boxShadow: '0 4px 12px rgba(0,0,0,.4)' }}>
                          <button onClick={() => { const updated = photos.filter(p => p.id !== photo.id); savePhotos(updated); if (selectedPhoto?.id === photo.id) setSelectedPhoto(null); setPhotoMenuOpen(null); }} style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: 'none', background: 'none', color: '#dc2626', fontSize: 11, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>🗑️ Sil</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ORTA — Kıyafet Seç */}
          <div style={{ width: 280, background: panelBg, borderRight: `1px solid ${border}`, display: 'flex', flexDirection: 'column', padding: 14, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 3 }}>Kıyafetini Seç</div>
            <div style={{ fontSize: 10, color: textMuted, marginBottom: 10 }}>Kategoriye göre filtrele veya link ekle.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} style={{ padding: '4px 9px', borderRadius: 20, border: `1.5px solid ${category === cat ? '#7c3aed' : border}`, background: category === cat ? '#7c3aed' : panelBg, color: category === cat ? '#fff' : textMuted, fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>{cat}</button>
              ))}
            </div>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={async e => {
                e.preventDefault();
                const files = e.dataTransfer.files;
                if (files.length && files[0].type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onloadend = () => { const o: Outfit = { id: Date.now(), name: 'Sürüklenen Kıyafet', brand: '—', price: '—', img: reader.result as string }; saveOutfits([o, ...outfits]); setSelectedOutfit(o); };
                  reader.readAsDataURL(files[0]);
                  return;
                }
                const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
                if (url?.startsWith('http')) { setLink(url); fetchLink(); }
              }}
              style={{ border: '2px dashed #d8b4fe', borderRadius: 8, padding: 10, textAlign: 'center', background: isDark ? '#2d2550' : '#faf8ff', marginBottom: 6, cursor: 'pointer' }}
            >
              <div style={{ fontSize: 16 }}>🖱️</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', marginTop: 2 }}>Görsel veya link sürükle bırak</div>
              <div style={{ fontSize: 9, color: '#f59e0b', marginTop: 1 }}>⚠️ Her sitede çalışmayabilir</div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input value={link} onChange={e => setLink(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchLink()} placeholder="🔗 Trendyol, Zara linki..." style={{ flex: 1, padding: '7px 9px', borderRadius: 7, border: `1px solid ${border}`, fontSize: 10, color: textPrimary, outline: 'none', fontFamily: 'inherit', background: isDark ? '#2d2550' : '#fff' }} />
              <button onClick={fetchLink} style={{ padding: '7px 10px', borderRadius: 7, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Ekle</button>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <button onClick={() => outfitRef.current?.click()} style={{ flex: 1, padding: '6px', borderRadius: 7, border: `1px solid ${border}`, background: panelBg, color: textMuted, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>🖼️ Galeriden</button>
              <button onClick={() => outfitCamRef.current?.click()} style={{ flex: 1, padding: '6px', borderRadius: 7, border: '1px solid #bbf7d0', background: isDark ? '#052e16' : '#f0fdf4', color: '#16a34a', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>📷 Kamera</button>
            </div>
            <input ref={outfitRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={loadOutfitFile} />
            <input ref={outfitCamRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={loadOutfitFile} />
            {status && <div style={{ fontSize: 10, color: '#7c3aed', marginBottom: 6 }}>{status}</div>}
            <div style={{ fontSize: 11, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>Eklenen Kıyafetler</div>
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {outfits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: textMuted, fontSize: 11 }}>Henüz kıyafet eklenmedi</div>
              ) : outfits.map(o => (
                <div key={o.id} onClick={() => { setSelectedOutfit(o); setOutfitMenuOpen(null); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 9px', borderRadius: 9, border: `1.5px solid ${selectedOutfit?.id === o.id ? '#7c3aed' : border}`, background: selectedOutfit?.id === o.id ? (isDark ? '#2d2550' : '#f5f3ff') : panelBg, cursor: 'pointer', transition: 'all .2s' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={o.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</div>
                    <div style={{ fontSize: 9, color: textMuted }}>{o.brand}</div>
                    {o.price !== '—' && <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>{o.price}</div>}
                  </div>
                  <button onClick={e => { e.stopPropagation(); if (!cart.find(c => c.id === o.id)) setCart(prev => [...prev, o]); }} title="Sepete ekle" style={{ width: 22, height: 22, borderRadius: 5, background: cart.find(c => c.id === o.id) ? '#7c3aed' : (isDark ? '#2d2550' : '#f5f3ff'), color: cart.find(c => c.id === o.id) ? '#fff' : '#7c3aed', border: 'none', fontSize: 11, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🛒</button>
                  <button onClick={e => { e.stopPropagation(); const updated = [o, ...wardrobe.filter(w => w.id !== o.id)]; setWardrobe(updated); localStorage.setItem('cabin_wardrobe', JSON.stringify(updated)); setStatus('👗 Gardıroba eklendi!'); setTimeout(() => setStatus(''), 3000); }} title="Gardıroba ekle" style={{ width: 22, height: 22, borderRadius: 5, background: isDark ? '#052e1644' : '#f0fdf4', color: '#16a34a', border: 'none', fontSize: 11, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👗</button>
                  <div style={{ position: 'relative' }}>
                    <button onClick={e => { e.stopPropagation(); setOutfitMenuOpen(outfitMenuOpen === o.id ? null : o.id); }} style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'transparent', color: textMuted, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⋮</button>
                    {outfitMenuOpen === o.id && (
                      <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: 24, background: panelBg, border: `1px solid ${border}`, borderRadius: 8, padding: 4, zIndex: 50, minWidth: 100, boxShadow: '0 4px 12px rgba(0,0,0,.4)' }}>
                        <button onClick={() => { const updated = outfits.filter(x => x.id !== o.id); saveOutfits(updated); if (selectedOutfit?.id === o.id) setSelectedOutfit(null); setOutfitMenuOpen(null); }} style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: 'none', background: 'none', color: '#dc2626', fontSize: 11, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>🗑️ Sil</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={() => outfitRef.current?.click()} style={{ width: '100%', padding: 7, borderRadius: 7, border: `1px dashed ${border}`, background: 'none', color: '#7c3aed', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>+ Kıyafet Ekle</button>
            </div>
          </div>

          {/* SAĞ — Sonuç */}
          <div style={{ flex: 1, background: bg, display: 'flex', flexDirection: 'column', padding: '10px 14px', overflow: 'hidden', gap: 8 }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>Sanal Deneme Sonucu</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {result && (
                  <button onClick={async () => {
                    try {
                      const response = await fetch(result);
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = 'cabin-sonuc.jpg'; a.click();
                      URL.revokeObjectURL(url);
                    } catch { window.open(result, '_blank'); }
                  }} style={{ padding: '5px 12px', borderRadius: 7, border: `1px solid ${border}`, background: panelBg, color: textPrimary, fontSize: 11, cursor: 'pointer' }}>⬇ İndir</button>
                )}
              </div>
            </div>

            {loading ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 16, border: `1px solid ${border}`, background: isDark ? '#1a1230' : '#f8f7ff' }}>
                <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 16 }}>
                  <svg style={{ position: 'absolute', inset: 0, animation: 'spin 1.5s linear infinite' }} width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" fill="none" stroke="#2d2550" strokeWidth="4"/>
                    <circle cx="40" cy="40" r="36" fill="none" stroke="#7c3aed" strokeWidth="4" strokeDasharray="60 170" strokeLinecap="round"/>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#7c3aed', letterSpacing: 1 }}>CaBin</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#7c3aed' }}>Giydiriliyor...</div>
                <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>20-40 saniye sürebilir</div>
              </div>
            ) : result && selectedPhoto ? (
              <>
                {/* Images + AI panel */}
                <div style={{ flex: 1, display: 'flex', gap: 10, minHeight: 0 }}>
                  {/* Before/After */}
                  <div style={{ flex: 3, display: 'flex', position: 'relative', borderRadius: 14, overflow: 'hidden', border: `1px solid ${border}`, minHeight: 0 }}>
                    <div style={{ flex: 1, position: 'relative', background: isDark ? '#0a0618' : '#f0f0f0', overflow: 'hidden' }}>
                      <img src={selectedPhoto.url} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,.65)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5 }}>ÖNCE</div>
                    </div>
                    <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, zIndex: 10, boxShadow: '0 4px 16px rgba(124,58,237,.5)' }}>→</div>
                    <div style={{ flex: 1, position: 'relative', background: isDark ? '#0a0618' : '#f0f0f0', overflow: 'hidden', borderLeft: `1px solid ${border}` }}>
                      <img src={result} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                      <div style={{ position: 'absolute', top: 10, right: 10, background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5 }}>SONRA</div>
                    </div>
                  </div>

                  {/* AI Analysis + Combinations */}
                  <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0, overflowY: 'auto' }}>
                    {/* AI Analysis card */}
                    <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 12, padding: '12px 14px', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: textPrimary, marginBottom: 10 }}>✨ AI Analizi</div>
                      {aiMetrics.map(({ label, pct, color }) => (
                        <div key={label} style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                            <div style={{ fontSize: 10, color: textMuted }}>{label}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, color }}>+{pct}%</div>
                          </div>
                          <div style={{ height: 5, borderRadius: 3, background: isDark ? '#2d2550' : '#f3f4f6', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct * 2.5}%`, background: color, borderRadius: 3 }} />
                          </div>
                        </div>
                      ))}
                      <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'linear-gradient(135deg,rgba(16,185,129,.15),rgba(6,182,212,.1))', border: '1px solid rgba(16,185,129,.3)', textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: '#10b981' }}>+30%</div>
                        <div style={{ fontSize: 10, color: textMuted, marginTop: 2 }}>Daha iyi bir kombin</div>
                      </div>
                      {aiComment && <div style={{ fontSize: 11, color: textMuted, marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' }}>"{aiComment}"</div>}
                      {colorSuggestion && <div style={{ fontSize: 10, color: '#7c3aed', marginTop: 4 }}>🎨 {colorSuggestion}</div>}
                      {styleTip && <div style={{ fontSize: 10, color: '#ec4899', marginTop: 2 }}>✨ {styleTip}</div>}
                    </div>

                    {/* Combinations */}
                    <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 12, padding: '10px 12px', flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: textPrimary, marginBottom: 8 }}>✨ Kombin Önerileri</div>
                      {combinations.length === 0 ? (
                        <div style={{ fontSize: 10, color: textMuted }}>Yükleniyor...</div>
                      ) : combinations.map((c, i) => {
                        const storeList = [
                          { name: 'Trendyol', url: `https://www.trendyol.com/sr?q=${encodeURIComponent(c.search)}`, color: '#f27a1a' },
                          { name: 'Hepsiburada', url: `https://www.hepsiburada.com/ara?q=${encodeURIComponent(c.search)}`, color: '#ff6000' },
                          { name: 'Zara', url: `https://www.zara.com/tr/tr/search?searchTerm=${encodeURIComponent(c.search)}`, color: '#111111' },
                          { name: 'LC Waikiki', url: `https://www.lcwaikiki.com/tr-TR/TR/arama?q=${encodeURIComponent(c.search)}`, color: '#e30613' },
                          { name: 'Mango', url: `https://shop.mango.com/tr/kadin?q=${encodeURIComponent(c.search)}`, color: '#333' },
                        ];
                        const store = storeList[i % storeList.length];
                        const icons = ['👗','👟','👜','🧣','💍'];
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < combinations.length - 1 ? `1px solid ${border}` : 'none' }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: isDark ? '#2d2550' : '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{icons[i % icons.length]}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.item}</div>
                              <div style={{ fontSize: 9, color: textMuted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.reason}</div>
                            </div>
                            <a href={store.url} target="_blank" rel="noreferrer" style={{ padding: '4px 9px', borderRadius: 20, background: store.color, color: '#fff', fontSize: 9, fontWeight: 700, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>{store.name} →</a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Purchase card */}
                {selectedOutfit && (
                  <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 12, padding: '10px 14px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <img src={selectedOutfit.img} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedOutfit.name}</div>
                        <div style={{ fontSize: 10, color: textMuted }}>{selectedOutfit.brand}</div>
                        {selectedOutfit.price !== '—' && <div style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b' }}>{selectedOutfit.price}</div>}
                      </div>
                      <select value={selectedSize} onChange={e => setSelectedSize(e.target.value)}>
                        {['XS','S','M','L','XL','XXL'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select value={selectedColor} onChange={e => setSelectedColor(e.target.value)}>
                        {['Siyah','Beyaz','Lacivert','Kırmızı','Bej','Gri'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select>
                        {['Standart Kargo','Hızlı Kargo','Ücretsiz Kargo'].map(k => <option key={k}>{k}</option>)}
                      </select>
                      <button onClick={() => { setLiked(!liked); if (selectedOutfit) { const fav = { ...selectedOutfit } as Outfit; const updated = [fav, ...favorites.filter(f => f.id !== selectedOutfit.id)]; setFavorites(updated); localStorage.setItem('cabin_favorites', JSON.stringify(updated)); } }} style={{ width: 38, height: 38, borderRadius: 9, border: `1px solid ${border}`, background: liked ? '#fdf2f8' : panelBg, color: liked ? '#ec4899' : textMuted, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>♥</button>
                      <button onClick={() => { if (selectedOutfit?.link) window.open(selectedOutfit.link, '_blank'); else window.open(`https://www.trendyol.com/sr?q=${encodeURIComponent(selectedOutfit.name)}`, '_blank'); }} style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: '#f97316', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 12px rgba(249,115,22,.35)' }}>Satın Al 🛒</button>
                    </div>
                  </div>
                )}

                {/* Action bar */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => { setResult(null); setCombinations([]); setSelectedOutfit(null); setAiComment(''); setColorSuggestion(''); setStyleTip(''); setLiked(false); }} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✨ Yeni Deneme</button>
                  <button onClick={() => { if (selectedOutfit && !cart.find(c => c.id === selectedOutfit.id)) setCart(prev => [...prev, selectedOutfit]); setCartOpen(true); }} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: `1px solid ${border}`, background: panelBg, color: textPrimary, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>🛒 Sepete Ekle</button>
                  <button onClick={() => { setLiked(!liked); if (result && selectedOutfit) { const fav = { ...selectedOutfit } as Outfit; const updated = [fav, ...favorites.filter(f => f.id !== selectedOutfit.id)]; setFavorites(updated); localStorage.setItem('cabin_favorites', JSON.stringify(updated)); setStatus('❤️ Beğendiklere eklendi!'); setTimeout(() => setStatus(''), 3000); } }} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: `1px solid ${border}`, background: liked ? '#fdf2f8' : panelBg, color: liked ? '#ec4899' : textPrimary, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>❤️ Beğendim</button>
                  <button onClick={() => { if (navigator.share) { navigator.share({ title: 'CaBin', text: 'CaBin ile kıyafet denedim!', url: window.location.href }); } else { navigator.clipboard.writeText(window.location.href); setStatus('✅ Link kopyalandı!'); setTimeout(() => setStatus(''), 3000); } }} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: `1px solid ${border}`, background: panelBg, color: textPrimary, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>📤 Paylaş</button>
                  <button onClick={() => setActiveMenu('AVM')} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none', background: isDark ? '#2d2550' : '#f5f3ff', color: '#7c3aed', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🏪 AVM'ye Git</button>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 16, border: `1px solid ${border}`, background: isDark ? 'radial-gradient(ellipse at center,#2d1b4e 0%,#1a1230 70%)' : 'radial-gradient(ellipse at center,#f0e8ff 0%,#f8f7ff 70%)' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: textMuted }}>Sonuç burada görünecek</div>
                <div style={{ fontSize: 12, color: isDark ? '#4b5563' : '#d1d5db', textAlign: 'center', lineHeight: 1.5 }}>Fotoğraf seç → kıyafet seç → dene</div>
                <button onClick={doTry} style={{ marginTop: 8, padding: '11px 28px', borderRadius: 50, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(124,58,237,.25)' }}>⚡ Denemeye Başla</button>
              </div>
            )}
          </div>

          </>)}

          {activeMenu === 'Geçmiş' && (
            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>⏱ Geçmiş Denemelerim</div>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: textMuted }}>Henüz deneme yapılmadı</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {history.map(h => (
                    <div key={h.id} onClick={() => setSelectedHistory(h)} style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', height: 180 }}>
                        <img src={h.photo} style={{ flex: 1, objectFit: 'cover' }} />
                        <div style={{ width: 4, background: border }} />
                        <img src={h.result} style={{ flex: 1, objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{h.outfitName}</div>
                        <div style={{ fontSize: 11, color: textMuted, marginTop: 4 }}>{h.date}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <button onClick={e => { e.stopPropagation(); const item = cart.find(c => c.name === h.outfitName); if (!item) { const o: Outfit = { id: Date.now(), name: h.outfitName, brand: '—', price: '—', img: h.outfit }; setCart(prev => [...prev, o]); } setCartOpen(true); }} style={{ flex: 1, padding: '7px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🛒 Sepete Ekle</button>
                          <button onClick={async e => { e.stopPropagation(); const res = await fetch(h.result); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'cabin-sonuc.jpg'; a.click(); }} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${border}`, background: panelBg, color: textMuted, fontSize: 12, cursor: 'pointer' }}>⬇</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeMenu === 'Beğendiklerim' && (
            <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: bg }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>❤️ Beğendiklerim</div>
              {favorites.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: textMuted, fontSize: 13 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
                  Henüz beğendiğiniz bir şey yok
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  {favorites.map((f: any) => (
                    <div key={f.id} onClick={() => setSelectedFavorite(f)} style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
                      <div style={{ height: 200, position: 'relative' }}>
                        <img src={f.resultImg || f.img} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                        <div style={{ position: 'absolute', top: 8, right: 8, background: '#ec4899', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>❤️ Beğenildi</div>
                      </div>
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                        <div style={{ fontSize: 11, color: textMuted }}>{f.brand}</div>
                        {f.price !== '—' && <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginTop: 2 }}>{f.price}</div>}
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <button onClick={() => { setCart(prev => [...prev, f]); setCartOpen(true); }} style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>🛒 Sepete Ekle</button>
                          <button onClick={() => { const updated = favorites.filter((x: any) => x.id !== f.id); setFavorites(updated); localStorage.setItem('cabin_favorites', JSON.stringify(updated)); }} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${border}`, background: panelBg, color: '#dc2626', fontSize: 11, cursor: 'pointer' }}>🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedFavorite && (
                <div onClick={() => setSelectedFavorite(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                  <div onClick={e => e.stopPropagation()} style={{ background: panelBg, borderRadius: 20, overflow: 'hidden', maxWidth: 500, width: '100%' }}>
                    <div style={{ height: 350, position: 'relative' }}>
                      <img src={selectedFavorite.resultImg || selectedFavorite.img} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                      <div style={{ position: 'absolute', top: 8, right: 8, background: '#ec4899', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>❤️ Beğenildi</div>
                    </div>
                    <div style={{ padding: 20 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary, marginBottom: 2 }}>{selectedFavorite.name}</div>
                      <div style={{ fontSize: 12, color: textMuted, marginBottom: 4 }}>{selectedFavorite.brand}</div>
                      {selectedFavorite.price !== '—' && <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginBottom: 12 }}>{selectedFavorite.price}</div>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setCart(prev => [...prev, selectedFavorite]); setCartOpen(true); setSelectedFavorite(null); }} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🛒 Sepete Ekle</button>
                        <button onClick={async () => { const res = await fetch(selectedFavorite.resultImg || selectedFavorite.img); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'cabin-begendim.jpg'; a.click(); }} style={{ padding: 12, borderRadius: 10, border: `1px solid ${border}`, background: panelBg, color: textPrimary, fontSize: 13, cursor: 'pointer' }}>⬇ İndir</button>
                        <button onClick={() => setSelectedFavorite(null)} style={{ padding: 12, borderRadius: 10, border: `1px solid ${border}`, background: panelBg, color: textMuted, fontSize: 13, cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMenu === 'Gardırobum' && (
            <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: bg }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: textPrimary, marginBottom: 8 }}>👗 Gardırobum</div>
              <div style={{ fontSize: 12, color: textMuted, marginBottom: 16 }}>CaBin'de eklediğin kıyafetler otomatik buraya gelir.</div>
              {wardrobe.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: textMuted, fontSize: 13 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>👗</div>
                  Gardırobunuz boş — kıyafet ekleyin
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  {wardrobe.map((w: Outfit) => (
                    <div key={w.id} onClick={() => { setSelectedOutfit(w); setActiveMenu('CaBin'); }} style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s' }} onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')} onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
                      <div style={{ height: 200, overflow: 'hidden' }}>
                        <img src={w.img} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                      </div>
                      <div style={{ padding: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                        <div style={{ fontSize: 10, color: textMuted }}>{w.brand}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <button onClick={e => { e.stopPropagation(); setSelectedOutfit(w); setActiveMenu('CaBin'); }} style={{ flex: 1, padding: '5px', borderRadius: 7, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>⚡ Dene</button>
                          <button onClick={e => { e.stopPropagation(); const updated = wardrobe.filter(x => x.id !== w.id); setWardrobe(updated); localStorage.setItem('cabin_wardrobe', JSON.stringify(updated)); }} style={{ padding: '5px 8px', borderRadius: 7, border: `1px solid ${border}`, background: panelBg, color: '#dc2626', fontSize: 10, cursor: 'pointer' }}>🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeMenu === 'AVM' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
              <div style={{ textAlign: 'center', maxWidth: 500, padding: 40 }}>
                <div style={{ fontSize: 64, marginBottom: 20 }}>🛍️</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, fontWeight: 800, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 8 }}>CaBin AVM</div>
                <div style={{ fontSize: 15, color: textMuted, marginBottom: 32, lineHeight: 1.6 }}>AI ile deneyip beğendiğin kıyafetleri tek tıkla satın alabileceğin alışveriş merkezi çok yakında!</div>
                <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary, marginBottom: 12 }}>🔔 Açılıştan haberdar ol</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input placeholder="E-posta adresin" style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${border}`, fontSize: 13, color: textPrimary, background: isDark ? '#2d2550' : '#fff', outline: 'none', fontFamily: 'inherit' }} />
                    <button style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Bildir</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {[['🏷️','Özel Fiyatlar','En iyi fırsatlar'],['⚡','Hızlı Teslimat','Kapına kadar'],['✨','AI Önerileri','Sana özel']].map(([icon, title, desc]) => (
                    <div key={title} style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: textPrimary }}>{title}</div>
                      <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'Profil' && (
            <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: bg }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: textPrimary, marginBottom: 24 }}>👤 Profilim</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, maxWidth: 800 }}>
                <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 16, padding: 24, textAlign: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: profilePhoto ? 'transparent' : 'linear-gradient(135deg,#7c3aed,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 auto 12px', overflow: 'hidden' }}>
                    {profilePhoto ? <img src={profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (userName ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) : 'ÖP')}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary }}>{userName}</div>
                  <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>{userEmail}</div>
                  <div style={{ marginTop: 16, padding: '6px 16px', borderRadius: 20, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 11, fontWeight: 600, display: 'inline-block' }}>⚡ {credits} Kredi</div>
                  <button onClick={() => profilePhotoRef.current?.click()} style={{ marginTop: 12, width: '100%', padding: 8, borderRadius: 8, border: `1px solid ${border}`, background: panelBg, color: textMuted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>📷 Fotoğraf Değiştir</button>
                  <input ref={profilePhotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { const reader = new FileReader(); reader.onloadend = () => setProfilePhoto(reader.result as string); reader.readAsDataURL(f); }}} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 14 }}>Kişisel Bilgiler</div>
                    {[['Ad Soyad', userName], ['E-posta', userEmail]].map(([label, value]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${border}` }}>
                        <div style={{ fontSize: 12, color: textMuted }}>{label}</div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: textPrimary }}>{value}</div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${border}` }}>
                      <div style={{ fontSize: 12, color: textMuted }}>Telefon</div>
                      {editMode ? (
                        <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${border}`, fontSize: 12, color: textPrimary, background: isDark ? '#2d2550' : '#fff', outline: 'none', textAlign: 'right' }} />
                      ) : (
                        <div style={{ fontSize: 12, fontWeight: 500, color: textPrimary }}>{phoneNumber}</div>
                      )}
                    </div>
                    <button onClick={() => setEditMode(!editMode)} style={{ marginTop: 14, width: '100%', padding: 10, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {editMode ? '✅ Kaydet' : '✏️ Düzenle'}
                    </button>
                  </div>
                  <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 14 }}>İstatistikler</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                      {[['⏱', history.length, 'Deneme'], ['❤️', favorites.length, 'Beğeni'], ['👗', wardrobe.length, 'Gardırop']].map(([icon, count, label]) => (
                        <div key={String(label)} style={{ background: isDark ? '#2d2550' : '#f5f3ff', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                          <div style={{ fontSize: 20 }}>{icon}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed' }}>{count}</div>
                          <div style={{ fontSize: 11, color: textMuted }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 14 }}>Sosyal Medya Hesapları</div>
                    {[
                      { icon: '📸', name: 'Instagram' },
                      { icon: '🎵', name: 'TikTok' },
                      { icon: '🐦', name: 'X (Twitter)' },
                      { icon: '👥', name: 'Facebook' },
                    ].map(item => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ fontSize: 20 }}>{item.icon}</div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: textPrimary }}>{item.name}</div>
                        </div>
                        <button style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${border}`, background: panelBg, color: '#7c3aed', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Bağla</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 14 }}>Hesap</div>
                    <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #fee2e2', background: '#fff5f5', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🚪 Çıkış Yap</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'Ayarlar' && (
            <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: bg }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: textPrimary, marginBottom: 24 }}>⚙️ Ayarlar</div>
              <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 14 }}>🎨 Görünüm</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${border}` }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: textPrimary }}>Karanlık Mod</div>
                      <div style={{ fontSize: 11, color: textMuted }}>Koyu tema kullan</div>
                    </div>
                    <div onClick={() => setIsDark(!isDark)} style={{ width: 44, height: 24, borderRadius: 12, background: isDark ? '#7c3aed' : '#e5e7eb', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
                      <div style={{ position: 'absolute', top: 2, left: isDark ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
                    </div>
                  </div>
                </div>
                <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 14 }}>🔔 Bildirimler</div>
                  {([
                    ['Deneme tamamlandığında bildir', notifyDone, setNotifyDone],
                    ['Kredi azaldığında uyar', notifyCredit, setNotifyCredit],
                    ['Yeni özellikler hakkında bilgi ver', notifyNews, setNotifyNews],
                  ] as [string, boolean, (v: boolean) => void][]).map(([label, val, setter], i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 2 ? `1px solid ${border}` : 'none' }}>
                      <div style={{ fontSize: 13, color: textPrimary }}>{label}</div>
                      <div onClick={() => setter(!val)} style={{ width: 44, height: 24, borderRadius: 12, background: val ? '#7c3aed' : '#e5e7eb', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
                        <div style={{ position: 'absolute', top: 2, left: val ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 14 }}>🔒 Güvenlik</div>
                  <button onClick={async () => { const { error } = await supabase.auth.resetPasswordForEmail(userEmail); if (!error) alert('Şifre sıfırlama emaili gönderildi!'); else alert('Hata: ' + error.message); }} style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${border}`, background: panelBg, color: textPrimary, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8, textAlign: 'left' }}>🔑 Şifre Değiştir</button>
                  <button style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${border}`, background: panelBg, color: textPrimary, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>📱 İki Faktörlü Doğrulama</button>
                </div>
                <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 14 }}>🗑️ Hesap</div>
                  <button onClick={async () => { if (confirm('Hesabınızı silmek istediğinize emin misiniz?')) { await supabase.auth.signOut(); window.location.href = '/login'; } }} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #fee2e2', background: '#fff5f5', color: '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Hesabı Sil</button>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'Krediler' && (
            <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: bg }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: textPrimary, marginBottom: 24 }}>💳 Krediler</div>
              <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', borderRadius: 20, padding: 24, color: '#fff' }}>
                  <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>Mevcut Krediniz</div>
                  <div style={{ fontSize: 48, fontWeight: 800, marginBottom: 4 }}>⚡ {credits}</div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>≈ {credits} deneme hakkı kaldı</div>
                  <button style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, border: '2px solid rgba(255,255,255,.4)', background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>⚡ Kredi Yükle</button>
                </div>
                <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>Paket Seç</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                    {[
                      { credits: 20, price: '$5.99', label: 'Starter', noteText: '📁 Galeri 3 ay', notePurple: false },
                      { credits: 50, price: '$11.99', label: 'Standard', noteText: '📁 Galeri 3 ay', notePurple: false },
                      { credits: 120, price: '$24.99', label: 'Plus', popular: true, noteText: '📁 Galeri 4 ay', notePurple: true },
                      { credits: 300, price: '$49.99', label: 'Premium', noteText: '📁 Galeri 1 yıl ⭐', notePurple: true },
                      { credits: 700, price: '$99.99', label: 'Pro', noteText: '📁 Galeri 1 yıl ⭐', notePurple: true },
                    ].map(pkg => (
                      <div key={pkg.credits} style={{ background: pkg.popular ? 'linear-gradient(135deg,rgba(124,58,237,.1),rgba(236,72,153,.1))' : (isDark ? '#2d2550' : '#f8f7ff'), border: `1.5px solid ${pkg.popular ? '#7c3aed' : border}`, borderRadius: 12, padding: 14, textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                        {pkg.popular && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#7c3aed', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 10px', borderRadius: 10, whiteSpace: 'nowrap' }}>⭐ En Popüler</div>}
                        <div style={{ fontSize: 11, color: textMuted, marginBottom: 2 }}>{pkg.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#7c3aed' }}>{pkg.credits}</div>
                        <div style={{ fontSize: 10, color: textMuted, marginBottom: 8 }}>Kredi</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>{pkg.price}</div>
                        <div style={{ fontSize: 9, color: pkg.notePurple ? '#7c3aed' : textMuted, fontWeight: pkg.notePurple ? 600 : 400, marginBottom: 8 }}>{pkg.noteText}</div>
                        <button style={{ width: '100%', padding: '6px', borderRadius: 8, border: 'none', background: pkg.popular ? 'linear-gradient(135deg,#7c3aed,#ec4899)' : (isDark ? '#3d3060' : '#ede9fe'), color: pkg.popular ? '#fff' : '#7c3aed', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Satın Al</button>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>📋 Kredi Geçmişi</div>
                  {history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: textMuted, fontSize: 13 }}>Henüz işlem yapılmadı</div>
                  ) : history.slice(0, 10).map(h => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${border}` }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: textPrimary }}>Deneme — {h.outfitName}</div>
                        <div style={{ fontSize: 11, color: textMuted }}>{h.date}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>-1 Kredi</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'Davet Et' && (
            <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: bg }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: textPrimary, marginBottom: 24 }}>🎁 Davet Et & Kazan</div>
              <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', borderRadius: 20, padding: 24, color: '#fff', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>Toplam Kazanabileceğin</div>
                  <div style={{ fontSize: 48, fontWeight: 800 }}>20 Kredi</div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>Tüm görevleri tamamla</div>
                </div>
                <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 6 }}>🔗 Davet Linkin</div>
                  <div style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>5 kişi kayıt olup yükleme yaparsa 10 kredi kazan!</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${border}`, background: isDark ? '#2d2550' : '#f8f7ff', fontSize: 12, color: textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      localhost:3000/login?ref={referralCode}
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(`localhost:3000/login?ref=${referralCode}`); setStatus('✅ Link kopyalandı!'); setTimeout(() => setStatus(''), 3000); }} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Kopyala</button>
                  </div>
                </div>
                <div style={{ background: panelBg, border: `1px solid ${border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>📱 Sosyal Medyada Paylaş</div>
                  {[
                    { platform: 'Instagram', icon: '📸', url: 'https://www.instagram.com' },
                    { platform: 'Facebook', icon: '👥', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('localhost:3000')}` },
                    { platform: 'TikTok', icon: '🎵', url: 'https://www.tiktok.com' },
                    { platform: 'X', icon: '🐦', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent('CaBin ile kıyafetleri giymeden önce deniyorum! 🛍️ localhost:3000')}` },
                    { platform: 'WhatsApp Durum', icon: '💬', url: `https://wa.me/?text=${encodeURIComponent('CaBin ile kıyafetleri giymeden önce deniyorum! 🛍️ localhost:3000/login')}` },
                  ].map(item => (
                    <div key={item.platform} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 24 }}>{item.icon}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{item.platform}</div>
                          <div style={{ fontSize: 11, color: textMuted }}>+2 kredi</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (credits < 2) { setStatus('❌ Paylaşım için önce en az 2 kredi satın almalısınız!'); setTimeout(() => setStatus(''), 4000); return; }
                          if (purchaseCount < 5) { setStatus('❌ Paylaşım için en az 5 paket satın almış olmanız gerekiyor!'); setTimeout(() => setStatus(''), 4000); return; }
                          if (!sharedPlatforms.includes(item.platform)) {
                            window.open(item.url, '_blank');
                            setSharedPlatforms(prev => [...prev, item.platform]);
                            localStorage.setItem('cabin_shared_platforms', JSON.stringify([...sharedPlatforms, item.platform]));
                            if (!localStorage.getItem('cabin_share_date')) localStorage.setItem('cabin_share_date', new Date().toISOString());
                            setCredits(c => c + 2);
                            setStatus(`✅ ${item.platform} paylaşımı için 2 kredi eklendi!`);
                            setTimeout(() => setStatus(''), 3000);
                          }
                        }}
                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: sharedPlatforms.includes(item.platform) ? '#e5e7eb' : 'linear-gradient(135deg,#7c3aed,#ec4899)', color: sharedPlatforms.includes(item.platform) ? '#9ca3af' : '#fff', fontSize: 12, fontWeight: 600, cursor: sharedPlatforms.includes(item.platform) ? 'not-allowed' : 'pointer' }}>
                        {sharedPlatforms.includes(item.platform) ? '✓ Paylaşıldı' : 'Paylaş +2'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
