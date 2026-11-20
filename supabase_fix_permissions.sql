-- ==============================================================================
-- POCKETOUR: FIX PERMISSIONS & SYNC PROFILES SQL SCRIPT
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Berikan hak akses tabel ke role authenticated dan anon
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

-- 2. Sinkronkan profil pengguna yang sudah ada di auth.users ke tabel public.profiles
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  id, 
  email, 
  CASE 
    WHEN email = 'hasajalah74@gmail.com' THEN 'Hasby Muhammad Raafi Prasetyo'
    WHEN email = 'nidaliyana14@gmail.com' THEN 'Nida Liyana Nurrohmah'
    ELSE split_part(email, '@', 1)
  END
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

-- 3. Inisialisasi kartu gaji awal November 2026 & kantong untuk Hasby & Nida di database
DO $$
DECLARE
  hasby_id uuid;
  nida_id uuid;
  hasby_sal_id uuid;
  nida_sal_id uuid;
BEGIN
  SELECT id INTO hasby_id FROM auth.users WHERE email = 'hasajalah74@gmail.com' LIMIT 1;
  SELECT id INTO nida_id FROM auth.users WHERE email = 'nidaliyana14@gmail.com' LIMIT 1;

  -- ── Gaji Hasby (November 2026) ──
  IF hasby_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.salaries WHERE profile_id = hasby_id AND month = 11 AND year = 2026
  ) THEN
    INSERT INTO public.salaries (profile_id, month, year, base_salary)
    VALUES (hasby_id, 11, 2026, 8000000)
    RETURNING id INTO hasby_sal_id;

    -- 3 Kantong Default Hasby
    INSERT INTO public.pockets (salary_id, name, percentage) VALUES
      (hasby_sal_id, 'Kebutuhan', 50),
      (hasby_sal_id, 'Jajan', 30),
      (hasby_sal_id, 'Investasi', 20);

    -- Insentif Hasby
    INSERT INTO public.incentives (salary_id, label, amount) VALUES
      (hasby_sal_id, 'Tunjangan Transport', 750000),
      (hasby_sal_id, 'Bonus Performa', 1250000);

    -- Contoh Pengeluaran Hasby
    INSERT INTO public.expenses (pocket_id, label, amount, date)
    SELECT id, 'Belanja Bulanan & Supermarket', 1500000, '2026-11-05'
    FROM public.pockets WHERE salary_id = hasby_sal_id AND name = 'Kebutuhan' LIMIT 1;

    INSERT INTO public.expenses (pocket_id, label, amount, date)
    SELECT id, 'Listrik & Internet Rumah', 650000, '2026-11-08'
    FROM public.pockets WHERE salary_id = hasby_sal_id AND name = 'Kebutuhan' LIMIT 1;

    INSERT INTO public.expenses (pocket_id, label, amount, date)
    SELECT id, 'Kopi & Hangout Akhir Pekan', 350000, '2026-11-12'
    FROM public.pockets WHERE salary_id = hasby_sal_id AND name = 'Jajan' LIMIT 1;

    INSERT INTO public.expenses (pocket_id, label, amount, date)
    SELECT id, 'Reksadana Pasar Uang', 1000000, '2026-11-02'
    FROM public.pockets WHERE salary_id = hasby_sal_id AND name = 'Investasi' LIMIT 1;
  END IF;

  -- ── Gaji Nida (November 2026) ──
  IF nida_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.salaries WHERE profile_id = nida_id AND month = 11 AND year = 2026
  ) THEN
    INSERT INTO public.salaries (profile_id, month, year, base_salary)
    VALUES (nida_id, 11, 2026, 7500000)
    RETURNING id INTO nida_sal_id;

    -- 3 Kantong Default Nida
    INSERT INTO public.pockets (salary_id, name, percentage) VALUES
      (nida_sal_id, 'Kebutuhan', 50),
      (nida_sal_id, 'Jajan', 30),
      (nida_sal_id, 'Investasi', 20);

    -- Insentif Nida
    INSERT INTO public.incentives (salary_id, label, amount) VALUES
      (nida_sal_id, 'Tunjangan Makan', 600000);
  END IF;
END $$;
