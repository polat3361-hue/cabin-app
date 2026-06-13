-- ============================================================
-- CaBin · Profiles tablosu + RLS + Trigger
-- Supabase SQL Editor'de çalıştır (Dashboard → SQL Editor → Run)
-- ============================================================

-- 1. Tablo
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits    INTEGER     NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Politika: kullanıcı SADECE kendi satırını okuyabilir
CREATE POLICY "Kullanici kendi profilini okuyabilir"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- UPDATE/DELETE politikası YOK → istemci tarafından değiştirilemiyor.
-- Kredi güncellemesi yalnızca service_role (sunucu) ile yapılacak.

-- 4. Trigger fonksiyonu: yeni kayıt → otomatik 2 başlangıç kredisi
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, credits)
  VALUES (NEW.id, 2)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 5. Trigger'ı auth.users'a bağla
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Mevcut kullanıcılar için geriye dönük profil satırı
--    (trigger yeni kayıtlara bakar, bu satır var olan kullanıcıları kapsar)
INSERT INTO public.profiles (id, credits)
SELECT id, 2
FROM auth.users
ON CONFLICT (id) DO NOTHING;
