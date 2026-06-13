-- ============================================================
-- CaBin · Referral (davet takip) sistemi
-- Supabase SQL Editor'de çalıştır (Dashboard → SQL Editor → Run)
-- ============================================================

-- 1. Kolonları ekle
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Mevcut kullanıcılar için referral_code backfill
--    (id'nin MD5'inden 8 karakter → benzersiz, büyük harf)
UPDATE public.profiles
SET referral_code = upper(substr(md5(id::text), 1, 8))
WHERE referral_code IS NULL;

-- 3. Yeni RLS politikası:
--    Kullanıcı davet ettiği kişileri sayabilsin (referred_by = kendi id'si olanlar)
CREATE POLICY "Kullanici kendi davetettiklerini gorebilir"
  ON public.profiles
  FOR SELECT
  USING (referred_by = auth.uid());

-- 4. Trigger güncelle: her yeni kullanıcıya otomatik referral_code üret
--    ve URL'den gelen ?ref=KOD varsa referred_by'ı doldur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_ref_code    text;
  v_referrer_id uuid;
  v_new_code    text;
BEGIN
  v_new_code := upper(substr(md5(NEW.id::text), 1, 8));

  v_ref_code := NEW.raw_user_meta_data->>'ref_code';
  IF v_ref_code IS NOT NULL THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = v_ref_code
      AND id <> NEW.id;
  END IF;

  INSERT INTO public.profiles (id, credits, referral_code, referred_by)
  VALUES (NEW.id, 2, v_new_code, v_referrer_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
