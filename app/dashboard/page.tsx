'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Zap, Clock, Heart, ShoppingBag, Store, CreditCard, User, Settings, Gift, Bell, Shirt, Scissors, Sparkles, Wind, Footprints, Glasses, HardHat, Gem, Images, RotateCw, Tag, Trash2, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

interface KombinPart {
  outfitName: string;
  brand: string;
  price: string;
  link?: string;
  img: string;
  category: string;
}

interface TryonRecord {
  id: number;
  resultImg: string;
  outfitImg: string;
  outfitName: string;
  brand: string;
  price: string;
  link?: string;
  category: string;
  date: string;
  liked: boolean;
  isKombin?: boolean;
  kombinParts?: KombinPart[];
}

export default function DashboardPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [category, setCategory] = useState('Üst');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [kombinProgress, setKombinProgress] = useState('');
  const [credits, setCredits] = useState(0);
  const [creditsLoaded, setCreditsLoaded] = useState(false);
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
  const [aiComment, setAiComment] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+90 5XX XXX XX XX');
  const [profilePhoto, setProfilePhoto] = useState('');
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [notifyDone, setNotifyDone] = useState(true);
  const [notifyCredit, setNotifyCredit] = useState(true);
  const [notifyNews, setNotifyNews] = useState(false);
  const [favorites, setFavorites] = useState<Outfit[]>([]);
  const [wardrobe, setWardrobe] = useState<Outfit[]>([]);
  const [history, setHistory] = useState<{id: number, date: string, photo: string, outfit: string, result: string, outfitName: string}[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<{id: number, date: string, photo: string, outfit: string, result: string, outfitName: string} | null>(null);
  const [isKombin, setIsKombin] = useState(false);
  const [kombinItems, setKombinItems] = useState<{outfitId: number, category: string}[]>([]);
  const [hoveredPhotoId, setHoveredPhotoId] = useState<number | null>(null);
  const [hoveredOutfitId, setHoveredOutfitId] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [tryons, setTryons] = useState<TryonRecord[]>([]);
  const [currentTryonId, setCurrentTryonId] = useState<number | null>(null);
  const [wardrobeFilter, setWardrobeFilter] = useState<'Tümü' | 'Beğendiklerim' | 'Kombinler'>('Tümü');
  const [tryonSelectMode, setTryonSelectMode] = useState(false);
  const [selectedTryonIds, setSelectedTryonIds] = useState<Set<number>>(new Set());
  const [hoveredTryonId, setHoveredTryonId] = useState<number | null>(null);
  const [expandedTryonId, setExpandedTryonId] = useState<number | null>(null);
  const [likeToast, setLikeToast] = useState(false);
  const [bucketPhotos, setBucketPhotos] = useState<{name: string, url: string}[]>([]);
  const [loadingBucketPhotos, setLoadingBucketPhotos] = useState(false);
  const [uyumScore, setUyumScore] = useState(0);
  const [colorSuggestion, setColorSuggestion] = useState('');
  const [styleTip, setStyleTip] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const outfitRef = useRef<HTMLInputElement>(null);
  const outfitCamRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        const meta = data.user.user_metadata;
        setUserName(meta?.full_name || meta?.name || data.user.email?.split('@')[0] || 'Kullanıcı');
        setUserEmail(data.user.email || '');
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits, referral_code')
          .eq('id', data.user.id)
          .single();
        if (profile?.credits != null) setCredits(profile.credits);
        if (profile?.referral_code) setReferralCode(profile.referral_code);
        setCreditsLoaded(true);
        // Davet sayısını getir (RLS: referred_by = auth.uid() izni gerekir)
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('referred_by', data.user.id)
          .then(({ count }) => setReferralCount(count ?? 0));
      } else { window.location.href = '/login'; }
    });
    const saved = localStorage.getItem('cabin_photos_v2');
    if (saved) setPhotos(JSON.parse(saved));
    const savedOutfits = localStorage.getItem('cabin_outfits');
    if (savedOutfits) setOutfits(JSON.parse(savedOutfits));
    const savedFavorites = localStorage.getItem('cabin_favorites');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    const savedWardrobe = localStorage.getItem('cabin_wardrobe');
    if (savedWardrobe) setWardrobe(JSON.parse(savedWardrobe));
    const savedTryons = localStorage.getItem('cabin_tryons');
    if (savedTryons) setTryons(JSON.parse(savedTryons));
    const savedHistory = localStorage.getItem('cabin_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    if (activeMenu === 'Fotoğraflarım') fetchBucketPhotos();
  }, [activeMenu]);

  function savePhotos(p: Photo[]) {
    setPhotos(p);
    try { localStorage.setItem('cabin_photos_v2', JSON.stringify(p.map(photo => ({ ...photo, url: photo.url })))); } catch {}
  }

  function saveOutfits(o: Outfit[]) {
    const limited = o.slice(0, 120);
    setOutfits(limited);
    safeSet('cabin_outfits', limited, 120);
  }

  function deleteOutfit(id: number) {
    const updated = outfits.filter(o => o.id !== id);
    saveOutfits(updated);
    if (selectedOutfit?.id === id) setSelectedOutfit(updated.length > 0 ? updated[0] : null);
  }

  function deleteSelected() {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`${selectedIds.size} ürün silinecek, emin misiniz?`)) return;
    const updated = outfits.filter(o => !selectedIds.has(o.id));
    saveOutfits(updated);
    if (selectedOutfit && selectedIds.has(selectedOutfit.id)) setSelectedOutfit(updated.length > 0 ? updated[0] : null);
    setSelectedIds(new Set());
    setSelectMode(false);
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

  function saveTryons(t: TryonRecord[]) {
    const limited = t.slice(0, 250);
    setTryons(limited);
    safeSet('cabin_tryons', limited, 250);
  }

  function deleteTryon(id: number) {
    saveTryons(tryons.filter(t => t.id !== id));
  }

  function deleteSelectedTryons() {
    if (selectedTryonIds.size === 0) return;
    if (!window.confirm(`${selectedTryonIds.size} deneme silinecek, emin misiniz?`)) return;
    saveTryons(tryons.filter(t => !selectedTryonIds.has(t.id)));
    setSelectedTryonIds(new Set());
    setTryonSelectMode(false);
  }

  async function downloadImage(url: string, filename: string) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch { window.open(url, '_blank'); }
  }

  function deletePhoto(photo: Photo) {
    const updated = photos.filter(p => p.id !== photo.id);
    savePhotos(updated);
    if (selectedPhoto?.id === photo.id) {
      setSelectedPhoto(updated.length > 0 ? updated[0] : null);
    }
    setHoveredPhotoId(null);
  }

  async function fetchBucketPhotos() {
    setLoadingBucketPhotos(true);
    try {
      const { data, error } = await supabase.storage.from('user-photos').list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
      if (!error && data) {
        const filtered = data.filter(f => f.id && !f.name.startsWith('.'));
        setBucketPhotos(filtered.map(f => ({
          name: f.name,
          url: supabase.storage.from('user-photos').getPublicUrl(f.name).data.publicUrl,
        })));
      }
    } catch {}
    setLoadingBucketPhotos(false);
  }

  function addBucketPhotoToActive(url: string, name: string) {
    if (photos.length >= 8) {
      setPhotoStatus('⚠️ Aktif listede max 8 fotoğraf var');
      setTimeout(() => setPhotoStatus(''), 3000);
      return;
    }
    if (photos.find(p => p.url === url)) {
      setPhotoStatus('Bu fotoğraf zaten listede');
      setTimeout(() => setPhotoStatus(''), 2000);
      return;
    }
    addPhoto(url, name);
    setActiveMenu('CaBin');
  }

  async function deleteBucketPhoto(filename: string) {
    await supabase.storage.from('user-photos').remove([decodeURIComponent(filename)]);
    setBucketPhotos(prev => prev.filter(p => p.name !== filename));
    const publicUrl = supabase.storage.from('user-photos').getPublicUrl(filename).data.publicUrl;
    const updated = photos.filter(p => p.url !== publicUrl);
    if (updated.length !== photos.length) {
      savePhotos(updated);
      if (selectedPhoto && selectedPhoto.url === publicUrl) {
        setSelectedPhoto(updated.length > 0 ? updated[0] : null);
      }
    }
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
    if (outfits.length >= 120) {
      setStatus('⚠️ Yeni ürün eklemek için önce bazılarını sil (maks. 120)');
      setTimeout(() => setStatus(''), 4000);
      return;
    }
    setStatus('⏳ Yükleniyor...');
    try {
      const r = await fetch('/api/fetch-product?url=' + encodeURIComponent(link.trim()));
      const d = await r.json();
      if (d.image) {
        const o: Outfit = { id: Date.now(), name: d.name || 'Kıyafet', brand: d.brand || '—', price: d.price || '—', img: d.image, link: link.trim() };
        saveOutfits([o, ...outfits]);
        setSelectedOutfit(o);
        setStatus('✅ Eklendi!');
        setLink('');
        setTimeout(() => setStatus(''), 3000);
      } else { setStatus('❌ Ürün görseli alınamadı'); setTimeout(() => setStatus(''), 3000); }
    } catch { setStatus('❌ Bağlantı hatası'); setTimeout(() => setStatus(''), 3000); }
  }

  function normalizeCategory(cat: string): string {
    return cat.replace(/ü/g,'u').replace(/Ü/g,'U').replace(/ş/g,'s').replace(/Ş/g,'S')
              .replace(/ı/g,'i').replace(/İ/g,'I').replace(/ğ/g,'g').replace(/Ğ/g,'G')
              .replace(/ç/g,'c').replace(/Ç/g,'C').replace(/ö/g,'o').replace(/Ö/g,'O');
  }

  function kombinPartCost(cat: string): number {
    return ['Ayakkabi','Canta','Gozluk','Aksesuar','Taki','Sapka'].includes(normalizeCategory(cat)) ? 2 : 1;
  }

  async function doTry() {
    const doSequential = isKombin && kombinItems.length > 0;
    if (!selectedPhoto) return;
    if (!doSequential && !selectedOutfit) return;

    // Kredi yoksa yönlendir
    if (credits <= 0) {
      setStatus('❌ Krediniz bitti! Kredi yükleyin.');
      setTimeout(() => { setStatus(''); setActiveMenu('Krediler'); }, 2000);
      return;
    }

    // Auth token — sunucuda JWT doğrulaması için gerekli
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = '/login'; return; }
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` };

    const accessoryCatNorm = ['Ayakkabi','Canta','Gozluk','Aksesuar','Taki','Sapka'];

    setLoading(true);
    setResult(null);
    setCombinations([]);
    setUyumScore(0);
    setColorSuggestion('');
    setStyleTip('');
    setKombinProgress('');
    setStatus(doSequential ? '⏳ Kombin başlatılıyor...' : '⏳ AI çalışıyor...');

    try {
      let finalOutput: string | null = null;

      if (doSequential) {
        // Clothes first, accessories last — so accessories layer on top
        const sorted = [...kombinItems].sort((a, b) =>
          Number(accessoryCatNorm.includes(normalizeCategory(a.category))) -
          Number(accessoryCatNorm.includes(normalizeCategory(b.category)))
        );
        let currentModelImg = selectedPhoto.url;
        for (let i = 0; i < sorted.length; i++) {
          const ki = sorted[i];
          const outfit = outfits.find(o => o.id === ki.outfitId);
          if (!outfit) continue;
          setKombinProgress(`(${i + 1}/${sorted.length} parça)`);
          const res = await fetch('/api/tryon', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ modelImage: currentModelImg, garmentImage: outfit.img, category: ki.category }),
          });
          if (res.status === 402) {
            setStatus('❌ Yetersiz kredi! Kredi yükleyin.');
            setTimeout(() => { setStatus(''); setActiveMenu('Krediler'); }, 2500);
            break;
          }
          const data = await res.json();
          if (data.output) {
            currentModelImg = data.output;
            finalOutput = data.output;
          }
        }
      } else {
        const res = await fetch('/api/tryon', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ modelImage: selectedPhoto.url, garmentImage: selectedOutfit!.img, category }),
        });
        if (res.status === 402) {
          setStatus('❌ Yetersiz kredi! Kredi yükleyin.');
          setTimeout(() => { setStatus(''); setActiveMenu('Krediler'); }, 2500);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.output) {
          finalOutput = data.output;
        } else {
          setStatus('❌ ' + (data.error || 'Hata oluştu'));
          setTimeout(() => setStatus(''), 5000);
        }
      }

      if (finalOutput) {
        setResult(finalOutput);
        setLiked(false);
        setCurrentTryonId(null);
        setUyumScore(Math.floor(Math.random() * 21) + 80);
        setKombinProgress('');
        if (!doSequential) {
          fetch('/api/ai-comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ outfitName: selectedOutfit!.name, category, brand: selectedOutfit!.brand }),
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
        }
        const historyItem = {
          id: Date.now(),
          date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          photo: selectedPhoto.url,
          outfit: doSequential ? (outfits.find(o => o.id === kombinItems[0]?.outfitId)?.img ?? '') : selectedOutfit!.img,
          result: finalOutput,
          outfitName: doSequential ? `Kombin (${kombinItems.length} parça)` : selectedOutfit!.name,
        };
        const updatedHistory = [historyItem, ...history].slice(0, 50);
        setHistory(updatedHistory);
        safeSet('cabin_history', updatedHistory, 30);
        // Kredileri sunucudan taze oku (sunucu zaten düşürdü)
        supabase.from('profiles').select('credits').eq('id', session.user.id).single()
          .then(({ data: p }) => { if (p?.credits != null) setCredits(p.credits); });
        setStatus('✅ Tamamlandı!');
        setTimeout(() => setStatus(''), 3000);
        // Upload result image to Supabase for permanent storage (FASHN URLs expire in 72h)
        if (tryons.length < 250) {
          const capturedOutfit = selectedOutfit ?? (outfits.find(x => x.id === kombinItems[0]?.outfitId) ?? null);
          const capturedCategory = category;
          const capturedIsKombin = isKombin;
          const capturedKombinParts: KombinPart[] = kombinItems
            .map(ki => { const o = outfits.find(x => x.id === ki.outfitId); return o ? { outfitName: o.name, brand: o.brand || '—', price: o.price || '—', link: o.link, img: o.img, category: ki.category } : null; })
            .filter(Boolean) as KombinPart[];
          const capturedFinalOutput = finalOutput;
          ;(async () => {
            try {
              const resp = await fetch(capturedFinalOutput);
              const blob = await resp.blob();
              const ts = Date.now();
              const filename = `tryons/${ts}.jpg`;
              await supabase.storage.from('user-photos').upload(filename, blob, { contentType: 'image/jpeg', upsert: false });
              const { data: urlData } = supabase.storage.from('user-photos').getPublicUrl(filename);
              const record: TryonRecord = {
                id: ts,
                resultImg: urlData.publicUrl,
                outfitImg: capturedOutfit?.img ?? '',
                outfitName: capturedIsKombin && capturedKombinParts.length > 0 ? `Kombin (${capturedKombinParts.length} parça)` : (capturedOutfit?.name ?? 'Kombin'),
                brand: capturedOutfit?.brand ?? '—',
                price: capturedOutfit?.price ?? '—',
                link: capturedOutfit?.link,
                category: capturedCategory,
                date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                liked: false,
                isKombin: capturedIsKombin && capturedKombinParts.length > 0,
                kombinParts: capturedIsKombin && capturedKombinParts.length > 0 ? capturedKombinParts : undefined,
              };
              setTryons(prev => {
                const updated = [record, ...prev].slice(0, 250);
                try { localStorage.setItem('cabin_tryons', JSON.stringify(updated)); } catch {}
                return updated;
              });
              setCurrentTryonId(ts);
            } catch { /* silent — result still shows even if save fails */ }
          })();
        } else {
          setStatus('⚠️ Gardırop dolu (250/250). Yer açmak için Gardırobum\'dan bazılarını sil.');
          setTimeout(() => setStatus(''), 5000);
        }
      } else {
        setKombinProgress('');
        if (doSequential) {
          setStatus('❌ Kombin oluşturulamadı');
          setTimeout(() => setStatus(''), 5000);
        }
      }
    } catch {
      setKombinProgress('');
      setStatus('❌ Bağlantı hatası');
      setTimeout(() => setStatus(''), 3000);
    }
    finally { setLoading(false); }
  }

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
        .link-input-wrapper { border: 2px solid #c4b5fd !important; transition: border-color .15s, box-shadow .15s; }
        .link-input-wrapper:focus-within { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.15) !important; }
        .gift-btn:hover { opacity: 0.88; }
        @media (max-width: 640px) { .gift-btn-label { display: none; } }
        .action-btn:hover { background: #ede9fe !important; border-color: #c4b5fd !important; color: #6d28d9 !important; }
        .action-btn-liked:hover { background: #fce7f3 !important; border-color: #fbcfe8 !important; }
        .buy-btn:hover { background: #f97316 !important; }
        .rotate-icon { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(0deg); transition: transform .5s ease; pointer-events: none; }
        .try-btn:not(:disabled):hover .rotate-icon { transform: translate(-50%, -50%) rotate(360deg); }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ height: 60, background: '#fff', borderBottom: '1px solid #ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <div onClick={() => setActiveMenu('CaBin')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg,#7c3aed,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CaBin</div>
          <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 500 }}>See it. Try it. Love it.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div onClick={() => setActiveMenu('Krediler')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: '#f5f3ff', border: '1px solid #ede9fe' }}>
            <span style={{ fontSize: 13 }}>⚡</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>{creditsLoaded ? `${credits} Kredi` : '... Kredi'}</span>
          </div>
          <button onClick={() => setActiveMenu('Davet Et')} className="gift-btn" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#ec4899)', cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit', transition: 'opacity .15s' }}>
            <Gift size={13} />
            <span className="gift-btn-label">40 Kredi Kazan</span>
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
              <div style={{ overflowY: 'auto', flex: 1, padding: '16px 10px' }}>

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

                  {photos.length >= 8 && (
                    <div style={{ fontSize: 10, color: '#f59e0b', background: '#fef3c7', borderRadius: 8, padding: '6px 10px', marginBottom: 6 }}>
                      ⚠️ Max 8 fotoğraf. Yeni eklemek için birini kaldır.
                    </div>
                  )}

                  {photos.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                      {photos.slice(0, 8).map(p => (
                        <div key={p.id} style={{ position: 'relative' }}
                          onMouseEnter={() => setHoveredPhotoId(p.id)}
                          onMouseLeave={() => setHoveredPhotoId(null)}
                        >
                          <div onClick={() => setSelectedPhoto(p)} style={{ aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden', border: `2px solid ${selectedPhoto?.id === p.id ? '#3b82f6' : '#e5e7eb'}`, cursor: 'pointer', transition: 'border-color .15s' }}>
                            <img src={p.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          {hoveredPhotoId === p.id && (
                            <button
                              onClick={e => { e.stopPropagation(); deletePhoto(p); }}
                              style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', border: '2px solid #fff', fontSize: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: 0, lineHeight: 1, fontWeight: 700 }}
                            >✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ height: 1, background: '#f3f4f6', marginBottom: 28 }} />

                {/* STEP 2 */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#7c3aed', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Ürünü Seç</span>
                  </div>

                  <div className="link-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, background: '#fff', marginBottom: 8 }}>
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
                              <option>Elbise</option>
                              <option>Ceket</option>
                              <option>Dış Giyim</option>
                              <option>Ayakkabı</option>
                              <option>Çanta</option>
                              <option>Gözlük</option>
                              <option>Şapka</option>
                              <option>Takı</option>
                              <option>Aksesuar</option>
                            </select>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, background: kombinPartCost(ki.category) === 2 ? '#fdf2f8' : '#f5f3ff', color: kombinPartCost(ki.category) === 2 ? '#ec4899' : '#7c3aed', whiteSpace: 'nowrap' }}>
                              {kombinPartCost(ki.category)} ⚡
                            </span>
                            <button onClick={() => setKombinItems(prev => prev.filter((_, idx) => idx !== i))} style={{ width: 18, height: 18, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', border: 'none', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                          </div>
                        ) : null;
                      })}
                      {kombinItems.length < 4 && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>Aşağıdan ürün seç ({4 - kombinItems.length} yer kaldı)</div>}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ── MIDDLE COLUMN (flex) ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden', padding: 16, gap: 12 }}>

              {/* Sonuç alanı */}
              <div style={{ flex: 1, borderRadius: 16, border: '2px solid #ddd6fe', overflow: 'hidden', position: 'relative', background: '#fafafa', minHeight: 0, display: 'flex', flexDirection: 'column' }}>

                {/* Kategori barı */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px', borderBottom: '1px solid #f0eef8', flexShrink: 0, background: '#fff', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', marginRight: 2 }}>Kategori Seç</span>
                  <div style={{ width: 1, height: 16, background: '#e5e7eb', marginRight: 2, flexShrink: 0 }} />
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
                    ✨ Kombin {isKombin ? `(${kombinItems.length > 0 ? kombinItems.reduce((s, ki) => s + kombinPartCost(ki.category), 0) : '?'} Kredi)` : 'Modu'}
                  </button>
                </div>

                {/* Önce / Sonra alanı */}
                <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

                  {/* ÖNCE - Kişi fotoğrafı */}
                  <div style={{ flex: 1, position: 'relative', borderRight: '1px solid #f0eef8', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 8px', flexShrink: 0, gap: 4 }}>
                    <button onClick={doTry} disabled={loading || !selectedPhoto || (isKombin ? kombinItems.length === 0 : !selectedOutfit)} className="try-btn" style={{ width: 48, height: 48, border: 'none', background: 'none', cursor: (loading || !selectedPhoto || !selectedOutfit) ? 'not-allowed' : 'pointer', flexShrink: 0, padding: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
                      <RotateCw size={68} strokeWidth={1.5} className="rotate-icon" style={{ color: (loading || !selectedPhoto || !selectedOutfit) ? '#d1d5db' : '#fb923c' }} />
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: (loading || !selectedPhoto || !selectedOutfit) ? '#e5e7eb' : 'linear-gradient(135deg,#8b5cf6,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, boxShadow: (loading || !selectedPhoto || !selectedOutfit) ? 'none' : '0 4px 14px rgba(124,58,237,.4)', flexShrink: 0 }}>
                        {loading
                          ? <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,.3)', borderTop: '2px solid #fff', animation: 'spin 1s linear infinite' }} />
                          : <span style={{ color: '#fff', fontSize: 20, fontWeight: 800, fontFamily: 'Georgia, serif', lineHeight: 1 }}>C</span>
                        }
                      </div>
                    </button>
                    {/* Maliyet etiketi */}
                    <span style={{ fontSize: 10, fontWeight: 700, color: credits > 0 ? '#7c3aed' : '#ef4444', whiteSpace: 'nowrap' }}>
                      {loading ? '...' : credits <= 0 ? '0 kr' : isKombin
                        ? `${kombinItems.reduce((s, ki) => s + kombinPartCost(ki.category), 0)} kr`
                        : `${kombinPartCost(category)} kr`}
                    </span>
                  </div>

                  {/* SONRA - Sonuç */}
                  <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>{kombinProgress ? `Kombin hazırlanıyor... ${kombinProgress}` : 'Giydiriliyor...'}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{isKombin && kombinItems.length > 1 ? `${kombinItems.length} parça × ~20sn` : 'HD Kalite: 15-25 saniye sürebilir'}</div>
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
                        {outfits.slice(0, 4).map((o: Outfit, i: number) => (
                          <div key={o.id} onClick={() => setSelectedOutfit(o)} style={{ position: 'absolute', width: 80, height: 100, borderRadius: 10, overflow: 'hidden', border: '2px solid #e5e7eb', cursor: 'pointer', transform: `rotate(${(i - 1.5) * 8}deg) translateY(${i * 2}px)`, left: i * 8, top: i * 4, boxShadow: '0 2px 8px rgba(0,0,0,.1)', background: '#fff', zIndex: i }}>
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
                    <button className="action-btn" onClick={() => { if (selectedOutfit && !cart.find(c => c.id === selectedOutfit.id)) { setCart(prev => [...prev, selectedOutfit]); setStatus('🛒 Sepete eklendi!'); setTimeout(() => setStatus(''), 2000); }}} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: '1.5px solid #ddd6fe', background: '#f5f3ff', color: '#6d28d9', fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      Sepete Ekle
                    </button>
                    <button onClick={() => {
                      const newLiked = !liked;
                      setLiked(newLiked);
                      if (currentTryonId !== null) {
                        setTryons(prev => {
                          const updated = prev.map(t => t.id === currentTryonId ? { ...t, liked: newLiked } : t);
                          try { localStorage.setItem('cabin_tryons', JSON.stringify(updated)); } catch {}
                          return updated;
                        });
                      }
                      if (result && selectedOutfit) {
                        const fav = { ...selectedOutfit, resultImg: result };
                        const updatedFavs = [fav, ...favorites.filter((f: any) => f.id !== selectedOutfit.id)];
                        setFavorites(updatedFavs);
                        safeSet('cabin_favorites', updatedFavs, 30);
                        if (newLiked) { setLikeToast(true); setTimeout(() => setLikeToast(false), 2500); }
                      }
                    }} className={liked ? 'action-btn-liked' : 'action-btn'} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: '1.5px solid #ddd6fe', background: liked ? '#fdf2f8' : '#f5f3ff', color: liked ? '#ec4899' : '#6d28d9', fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? '#ec4899' : 'none'} stroke={liked ? '#ec4899' : 'currentColor'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      Beğen
                    </button>
                    <button className="action-btn" onClick={() => { const url = (currentTryonId != null ? tryons.find(t => t.id === currentTryonId)?.resultImg : null) ?? result; if (url) downloadImage(url, 'cabin-deneme.jpg'); }} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: '1.5px solid #ddd6fe', background: '#f5f3ff', color: '#6d28d9', fontSize: 10, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Download size={13} />
                      İndir
                    </button>
                    <button onClick={() => { setResult(null); setSelectedOutfit(null); setAiComment(''); setColorSuggestion(''); setStyleTip(''); setCombinations([]); setLiked(false); setCurrentTryonId(null); }} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#f472b6)', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
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
                    {outfits.slice(0, 20).map(o => (
                      <div key={o.id}
                        onMouseEnter={() => setHoveredOutfitId(o.id)}
                        onMouseLeave={() => setHoveredOutfitId(null)}
                        onClick={() => { if (!isKombin) setSelectedOutfit(o); }}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: isKombin ? 'default' : 'pointer', flexShrink: 0, width: 70 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', border: `2px solid ${selectedOutfit?.id === o.id ? '#7c3aed' : '#e5e7eb'}`, position: 'relative' }}>
                          <img src={o.img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {!isKombin && hoveredOutfitId === o.id && (
                            <button onClick={e => { e.stopPropagation(); deleteOutfit(o.id); }} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: '#dc2626', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, fontWeight: 700 }}>×</button>
                          )}
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
                            {Math.round(parseFloat(String(o.price).replace(/[^\d.]/g, '')) || 0).toLocaleString('tr-TR')} ₺
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
                    <a href={selectedOutfit.link} target="_blank" rel="noreferrer" className="buy-btn" style={{ display: 'block', padding: '10px', borderRadius: 12, background: '#fb923c', color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'center', textDecoration: 'none', transition: 'background .15s' }}>🛒 Ürünü Satın Al</a>
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

            {activeMenu === 'Ürünlerim' && (
              <div style={{ padding: 24 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  {selectMode ? (
                    <>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#374151', paddingTop: 2 }}>{selectedIds.size} ürün seçildi</span>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button onClick={() => setSelectedIds(new Set(outfits.map(o => o.id)))} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Tümünü Seç</button>
                        <button onClick={deleteSelected} disabled={selectedIds.size === 0} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: selectedIds.size === 0 ? '#f3f4f6' : '#dc2626', color: selectedIds.size === 0 ? '#9ca3af' : '#fff', fontSize: 12, fontWeight: 600, cursor: selectedIds.size === 0 ? 'default' : 'pointer', fontFamily: 'inherit' }}>Seçilenleri Sil</button>
                        <button onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>İptal</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}><Tag size={20} /> Ürünlerim</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{outfits.length} / 120 ürün</div>
                      </div>
                      {outfits.length > 0 && (
                        <button onClick={() => setSelectMode(true)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}><Trash2 size={14} />Seç</button>
                      )}
                    </>
                  )}
                </div>

                {outfits.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 13 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🏷️</div>
                    Henüz ürün eklemediniz. Ana ekrandan ürün linki yapıştırın.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                    {outfits.map((o: Outfit) => {
                      const isSelected = selectedIds.has(o.id);
                      return (
                        <div key={o.id}
                          onClick={() => {
                            if (selectMode) {
                              setSelectedIds(prev => {
                                const next = new Set(prev);
                                next.has(o.id) ? next.delete(o.id) : next.add(o.id);
                                return next;
                              });
                            }
                          }}
                          style={{ background: '#fff', border: `2px solid ${isSelected ? '#7c3aed' : '#ede9fe'}`, borderRadius: 12, overflow: 'hidden', boxShadow: isSelected ? '0 0 0 3px rgba(124,58,237,0.15)' : '0 2px 8px rgba(0,0,0,.05)', cursor: selectMode ? 'pointer' : 'default' }}>
                          <div style={{ aspectRatio: '3/4', overflow: 'hidden', position: 'relative' }}>
                            <img src={o.img} alt={o.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                            {o.brand && o.brand !== '—' && (
                              <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {o.brand}
                              </div>
                            )}
                            {selectMode && (
                              <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: isSelected ? '#7c3aed' : 'rgba(0,0,0,0.25)', border: isSelected ? 'none' : '2px solid rgba(255,255,255,0.7)', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isSelected ? '✓' : ''}
                              </div>
                            )}
                          </div>
                          <div style={{ padding: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{o.name}</div>
                            {o.price && o.price !== '—' && !isNaN(parseFloat(o.price)) && (
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>
                                {parseFloat(o.price).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₺
                              </div>
                            )}
                            {!selectMode && (o.link ? (
                              <a href={o.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 8, padding: '6px', borderRadius: 8, background: 'linear-gradient(135deg,#fb923c,#f97316)', color: '#fff', fontSize: 11, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>
                                Satın Al
                              </a>
                            ) : (
                              <button onClick={() => { setSelectedOutfit(o); setActiveMenu('CaBin'); }} style={{ marginTop: 8, width: '100%', padding: '6px', borderRadius: 8, border: 'none', background: '#f5f3ff', color: '#7c3aed', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                ⚡ Dene
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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

            {activeMenu === 'Gardırobum' && (() => {
              const filtered = wardrobeFilter === 'Beğendiklerim' ? tryons.filter(t => t.liked) : wardrobeFilter === 'Kombinler' ? tryons.filter(t => t.isKombin) : tryons;
              return (
                <div style={{ padding: 24 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    {tryonSelectMode ? (
                      <>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#374151', paddingTop: 2 }}>{selectedTryonIds.size} deneme seçildi</span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button onClick={() => setSelectedTryonIds(new Set(filtered.map(t => t.id)))} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Tümünü Seç</button>
                          <button onClick={deleteSelectedTryons} disabled={selectedTryonIds.size === 0} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: selectedTryonIds.size === 0 ? '#f3f4f6' : '#dc2626', color: selectedTryonIds.size === 0 ? '#9ca3af' : '#fff', fontSize: 12, fontWeight: 600, cursor: selectedTryonIds.size === 0 ? 'default' : 'pointer', fontFamily: 'inherit' }}>Seçilenleri Sil</button>
                          <button onClick={() => { setTryonSelectMode(false); setSelectedTryonIds(new Set()); }} style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>İptal</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>👗 Gardırobum</div>
                          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{tryons.length} / 250 deneme</div>
                        </div>
                        {tryons.length > 0 && (
                          <button onClick={() => setTryonSelectMode(true)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Trash2 size={14} />Seç
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Filter tabs */}
                  {!tryonSelectMode && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                      {([
                        { key: 'Tümü',         label: `Tümü (${tryons.length})` },
                        { key: 'Beğendiklerim', label: `❤️ Beğendiklerim (${tryons.filter(t => t.liked).length})` },
                        { key: 'Kombinler',     label: `⭐ Kombinler (${tryons.filter(t => t.isKombin).length})` },
                      ] as { key: 'Tümü' | 'Beğendiklerim' | 'Kombinler'; label: string }[]).map(({ key, label }) => (
                        <button key={key} onClick={() => setWardrobeFilter(key)} style={{ padding: '5px 14px', borderRadius: 20, border: `1.5px solid ${wardrobeFilter === key ? '#7c3aed' : '#e5e7eb'}`, background: wardrobeFilter === key ? '#f5f3ff' : '#fff', color: wardrobeFilter === key ? '#7c3aed' : '#6b7280', fontSize: 12, fontWeight: wardrobeFilter === key ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {tryons.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 13 }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>👗</div>
                      Henüz deneme yapılmadı. Dene butonuna basınca sonuç buraya kaydedilir.
                    </div>
                  ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 13 }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>❤️</div>
                      Henüz beğendiğin deneme yok.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                      {filtered.map((t: TryonRecord) => {
                        const isSel = selectedTryonIds.has(t.id);
                        const isExpanded = expandedTryonId === t.id;
                        const totalPrice = t.isKombin && t.kombinParts
                          ? t.kombinParts.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0)
                          : null;
                        return (
                          <div key={t.id}
                            onMouseEnter={() => setHoveredTryonId(t.id)}
                            onMouseLeave={() => setHoveredTryonId(null)}
                            onClick={() => {
                              if (tryonSelectMode) {
                                setSelectedTryonIds(prev => { const next = new Set(prev); next.has(t.id) ? next.delete(t.id) : next.add(t.id); return next; });
                              } else if (t.isKombin) {
                                setExpandedTryonId(isExpanded ? null : t.id);
                              }
                            }}
                            style={{ background: '#fff', border: `2px solid ${isSel ? '#7c3aed' : t.isKombin ? '#c4b5fd' : '#ede9fe'}`, borderRadius: 12, overflow: 'hidden', boxShadow: isSel ? '0 0 0 3px rgba(124,58,237,0.15)' : '0 2px 8px rgba(0,0,0,.05)', cursor: tryonSelectMode ? 'pointer' : t.isKombin ? 'pointer' : 'default' }}>
                            <div style={{ aspectRatio: '3/4', overflow: 'hidden', position: 'relative' }}>
                              <img src={t.resultImg} alt={t.outfitName} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                              {/* Kombin badge */}
                              {t.isKombin && !tryonSelectMode && (
                                <div style={{ position: 'absolute', top: 8, left: 8, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
                                  ⭐ Kombin · {t.kombinParts?.length ?? 0} parça
                                </div>
                              )}
                              {t.liked && !tryonSelectMode && (
                                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 16 }}>❤️</div>
                              )}
                              {!tryonSelectMode && hoveredTryonId === t.id && (
                                <button onClick={e => { e.stopPropagation(); deleteTryon(t.id); }} style={{ position: 'absolute', bottom: 6, left: 6, width: 22, height: 22, borderRadius: '50%', background: '#dc2626', color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
                              )}
                              {tryonSelectMode && (
                                <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: isSel ? '#7c3aed' : 'rgba(0,0,0,0.25)', border: isSel ? 'none' : '2px solid rgba(255,255,255,0.7)', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isSel ? '✓' : ''}</div>
                              )}
                            </div>
                            <div style={{ padding: 10 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{t.outfitName}</div>
                              {!t.isKombin && t.brand && t.brand !== '—' && (
                                <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{t.brand}</div>
                              )}
                              {!t.isKombin && t.price && t.price !== '—' && !isNaN(parseFloat(t.price)) && (
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>
                                  {parseFloat(t.price).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₺
                                </div>
                              )}
                              {t.isKombin && totalPrice != null && totalPrice > 0 && (
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>
                                  Toplam: {totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₺
                                </div>
                              )}
                              <div style={{ fontSize: 9, color: '#d1d5db', marginBottom: 6 }}>{t.date}</div>
                              {!tryonSelectMode && (
                                <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                                  {!t.isKombin && t.link && (
                                    <a href={t.link} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'block', padding: '5px', borderRadius: 7, background: 'linear-gradient(135deg,#fb923c,#f97316)', color: '#fff', fontSize: 10, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>Satın Al</a>
                                  )}
                                  {t.isKombin && (
                                    <div style={{ flex: 1, padding: '5px', borderRadius: 7, background: '#f5f3ff', color: '#7c3aed', fontSize: 10, fontWeight: 600, textAlign: 'center' }}>
                                      {isExpanded ? '▲ Kapat' : '▼ Parçaları gör'}
                                    </div>
                                  )}
                                  <button onClick={e => { e.stopPropagation(); downloadImage(t.resultImg, `cabin-${t.outfitName.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}.jpg`); }} style={{ padding: '5px 7px', borderRadius: 7, border: '1px solid #ede9fe', background: '#f5f3ff', color: '#7c3aed', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    <Download size={11} />İndir
                                  </button>
                                </div>
                              )}
                              {/* Kombin parts expanded */}
                              {t.isKombin && isExpanded && t.kombinParts && (
                                <div style={{ marginTop: 8, borderTop: '1px solid #f0eef8', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {t.kombinParts.map((p, pi) => (
                                    <div key={pi} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                      <img src={p.img} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.outfitName}</div>
                                        <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase' }}>{p.brand} · {p.category}</div>
                                        {p.price && p.price !== '—' && !isNaN(parseFloat(p.price)) && (
                                          <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed' }}>{parseFloat(p.price).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₺</div>
                                        )}
                                      </div>
                                      {p.link && (
                                        <a href={p.link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ padding: '4px 7px', borderRadius: 6, background: '#fb923c', color: '#fff', fontSize: 9, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>Al</a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {activeMenu === 'Fotoğraflarım' && (
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><Images size={20} /> Fotoğraflarım</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Yüklediğin tüm fotoğraflar — sol panelden kaldırsan bile burada durur.</div>
                {loadingBucketPhotos ? (
                  <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>⏳ Yükleniyor...</div>
                ) : bucketPhotos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 13 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                    Henüz fotoğraf yüklemediniz
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                    {bucketPhotos.map(photo => {
                      const isActive = photos.some(p => p.url === photo.url);
                      return (
                        <div key={photo.name} style={{ background: '#fff', border: `1.5px solid ${isActive ? '#3b82f6' : '#ede9fe'}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
                          <div style={{ height: 170, overflow: 'hidden', position: 'relative' }}>
                            <img src={photo.url} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                            {isActive && (
                              <div style={{ position: 'absolute', top: 8, right: 8, background: '#3b82f6', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>✓ Aktif</div>
                            )}
                          </div>
                          <div style={{ padding: 10 }}>
                            <div style={{ fontSize: 10, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
                              {photo.name.replace(/^\d+-/, '').substring(0, 24)}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => addBucketPhotoToActive(photo.url, photo.name)}
                                disabled={isActive}
                                style={{ flex: 1, padding: '6px', borderRadius: 8, border: 'none', background: isActive ? '#e5e7eb' : '#7c3aed', color: isActive ? '#9ca3af' : '#fff', fontSize: 11, fontWeight: 600, cursor: isActive ? 'default' : 'pointer', fontFamily: 'inherit' }}
                              >{isActive ? '✓ Listede' : '⚡ Kullan'}</button>
                              <button
                                onClick={() => deleteBucketPhoto(photo.name)}
                                style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fff5f5', color: '#dc2626', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
                              >🗑️</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
              <div style={{ padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: 980, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Başlık */}
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>💳 Krediler</div>

                  {/* Mevcut kredi kartı */}
                  <div style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#ec4899 100%)', borderRadius: 20, padding: '28px 32px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 32px rgba(124,58,237,0.25)' }}>
                    <div>
                      <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 6, fontWeight: 500 }}>Mevcut Krediniz</div>
                      <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>⚡ {credits}</div>
                    </div>
                    <div style={{ fontSize: 72, opacity: 0.12, userSelect: 'none' }}>💳</div>
                  </div>

                  {/* Paket seç */}
                  <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 20, padding: '28px 32px', boxShadow: '0 2px 16px rgba(0,0,0,.05)' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 28 }}>Paket Seç</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 16, alignItems: 'end' }}>
                      {[
                        { credits: 20,  price: '$6.99',   label: 'Starter',  popular: false, storage: 'Galeri 3 ay saklanır' },
                        { credits: 50,  price: '$14.99',  label: 'Standard', popular: false, storage: 'Galeri 3 ay saklanır' },
                        { credits: 120, price: '$29.99',  label: 'Plus',     popular: true,  storage: 'Galeri 4 ay saklanır' },
                        { credits: 300, price: '$59.99',  label: 'Premium',  popular: false, storage: 'Galeri 1 yıl saklanır' },
                        { credits: 700, price: '$119.99', label: 'Pro',      popular: false, storage: 'Galeri 1 yıl saklanır' },
                      ].map(pkg => (
                        <div key={pkg.credits} style={{
                          background: pkg.popular ? '#f5f3ff' : '#fff',
                          border: `${pkg.popular ? '2px' : '1px'} solid ${pkg.popular ? '#7c3aed' : '#e5e7eb'}`,
                          borderRadius: 16,
                          padding: pkg.popular ? '28px 18px 22px' : '22px 18px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          position: 'relative',
                          zIndex: pkg.popular ? 1 : 0,
                          boxShadow: pkg.popular ? '0 12px 40px rgba(124,58,237,0.22)' : '0 2px 8px rgba(0,0,0,.04)',
                          transform: pkg.popular ? 'translateY(-8px)' : 'none',
                          transition: 'box-shadow .2s',
                        }}>
                          {pkg.popular && (
                            <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}>⭐ En Popüler</div>
                          )}
                          <div style={{ fontSize: 11, color: pkg.popular ? '#7c3aed' : '#9ca3af', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{pkg.label}</div>
                          <div style={{ fontSize: pkg.popular ? 40 : 30, fontWeight: 800, color: '#7c3aed', lineHeight: 1, marginBottom: 2 }}>{pkg.credits}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>Kredi</div>
                          <div style={{ fontSize: pkg.popular ? 20 : 17, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 }}>{pkg.price}</div>
                          <div style={{ fontSize: 10, color: '#b0b8c9', marginBottom: 16, lineHeight: 1.5 }}>{pkg.storage}</div>
                          <button style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: pkg.popular ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : '#f3f0ff', color: pkg.popular ? '#fff' : '#7c3aed', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: pkg.popular ? '0 4px 14px rgba(124,58,237,0.32)' : 'none' }}>Satın Al</button>
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
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 20 }}>🎁 Davet Et & Kazan</div>
                <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Hero kart */}
                  <div style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', borderRadius: 18, padding: '22px 24px', color: '#fff', textAlign: 'center' }}>
                    <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, marginBottom: 6 }}>+40 Kredi</div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>Görevleri tamamla, 40 krediye kadar kazan</div>
                  </div>

                  {/* ── DAVET BÖLÜMÜ ── */}
                  <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 16, padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>👥 Arkadaşını Davet Et</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Davet ettiğin arkadaş satın alırsa kredi kazanırsın</div>

                    {/* Kademeli ödüller */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      {[
                        { count: 1, reward: '+5 kredi',  total: null },
                        { count: 3, reward: '+10 kredi', total: '(toplam 15)' },
                        { count: 5, reward: '+15 kredi', total: '(toplam 30)' },
                      ].map(({ count, reward, total }) => (
                        <div key={count} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#faf7ff', border: '1px solid #ede9fe' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{count}</div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>{count} arkadaş satın alırsa</div>
                              {total && <div style={{ fontSize: 10, color: '#9ca3af' }}>{total}</div>}
                            </div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed' }}>{reward}</div>
                        </div>
                      ))}
                    </div>

                    {/* İlerleme */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>İlerleme</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>{referralCount} / 5 arkadaş</div>
                    </div>
                    {referralCount > 0 && (
                      <div style={{ fontSize: 11, color: '#7c3aed', marginBottom: 6 }}>
                        🎉 {referralCount} kişi davetinle kayıt oldu
                      </div>
                    )}
                    <div style={{ height: 6, borderRadius: 4, background: '#ede9fe', marginBottom: 14 }}>
                      <div style={{ height: '100%', width: `${Math.min((referralCount / 5) * 100, 100)}%`, borderRadius: 4, background: 'linear-gradient(90deg,#7c3aed,#ec4899)', transition: 'width .5s ease' }} />
                    </div>

                    {/* Davet linki */}
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e', marginBottom: 6 }}>🔗 Davet Linkin</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #ede9fe', background: '#faf7ff', fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {referralCode ? `cabin.app/login?ref=${referralCode}` : '...'}
                      </div>
                      <button onClick={() => { if (!referralCode) return; navigator.clipboard.writeText(`cabin.app/login?ref=${referralCode}`); setStatus('✅ Link kopyalandı!'); setTimeout(() => setStatus(''), 3000); }} disabled={!referralCode} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: referralCode ? '#7c3aed' : '#e5e7eb', color: '#fff', fontSize: 12, fontWeight: 600, cursor: referralCode ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>Kopyala</button>
                    </div>
                  </div>

                  {/* ── SOSYAL PAYLAŞIM BÖLÜMÜ ── */}
                  <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 16, padding: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>📣 Sosyal Medyada Paylaş</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Platformlarda paylaş, kredi kazan</div>

                    {/* Kademeli sosyal ödüller */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#faf7ff', border: '1px solid #ede9fe' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>En az 2 platformda paylaş</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed' }}>+5 kredi</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#faf7ff', border: '1px solid #ede9fe' }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e' }}>4 platformun hepsinde paylaş</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>(toplam 10 kredi)</div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed' }}>+5 kredi</div>
                      </div>
                    </div>

                    {/* Platform butonları */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'Facebook',  color: '#1877f2', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
                        { label: 'Instagram', color: '#e1306c', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
                        { label: 'TikTok',    color: '#000000', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg> },
                        { label: 'X (Twitter)', color: '#000000', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.849L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg> },
                      ].map(({ label, color, icon }) => (
                        <button key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 10, border: `1px solid ${color}22`, background: `${color}0d`, color, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {icon}
                          {label}
                        </button>
                      ))}
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
          { Icon: Zap,         label: 'Sanal Dene',    menu: 'CaBin' },
          { Icon: Tag,         label: 'Ürünlerim',    menu: 'Ürünlerim' },
          { Icon: Store,       label: 'AVM',          menu: 'AVM' },
          { Icon: ShoppingBag, label: 'Gardırobum',   menu: 'Gardırobum' },
          { Icon: Images,      label: 'Fotoğraflarım', menu: 'Fotoğraflarım' },
          { Icon: CreditCard,  label: 'Kredilerim',   menu: 'Krediler' },
          { Icon: Settings,    label: 'Ayarlar',      menu: 'Ayarlar' },
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

      {/* ── LIKE TOAST ── */}
      {likeToast && (
        <div style={{ position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)', background: '#1a1a2e', color: '#fff', padding: '10px 20px', borderRadius: 24, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, zIndex: 300, boxShadow: '0 4px 20px rgba(0,0,0,.25)', whiteSpace: 'nowrap', animation: 'slideIn .2s ease' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ec4899" stroke="#ec4899" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          Gardırobuna eklendi!
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
