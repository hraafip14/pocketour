-- ==============================================================================
-- POCKETOUR DATABASE SCHEMA & SEED SCRIPT (PostgreSQL / Supabase)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Profiles Table (1-to-1 with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Create Salaries Table
CREATE TABLE IF NOT EXISTS public.salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  year int NOT NULL,
  base_salary numeric(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (profile_id, month, year)
);

-- 4. Create Incentives Table (insentif / tunjangan)
CREATE TABLE IF NOT EXISTS public.incentives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_id uuid NOT NULL REFERENCES public.salaries(id) ON DELETE CASCADE,
  label text NOT NULL,
  amount numeric(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. Create Pockets Table (3 kantong default: Kebutuhan, Jajan, Investasi)
CREATE TABLE IF NOT EXISTS public.pockets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_id uuid NOT NULL REFERENCES public.salaries(id) ON DELETE CASCADE,
  name text NOT NULL,
  percentage numeric(5,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (salary_id, name)
);

-- 6. Create Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pocket_id uuid NOT NULL REFERENCES public.pockets(id) ON DELETE CASCADE,
  label text NOT NULL,
  amount numeric(15,2) DEFAULT 0,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- TABLE PERMISSIONS (GRANT TO ROLES)
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pockets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policy Profiles: Semua user login bisa melihat daftar profil (untuk fitur pilih profil & viewer)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy Salaries: Semua user login bisa membaca salary siapa pun (pelihat / viewer)
CREATE POLICY "Salaries are viewable by authenticated users"
  ON public.salaries FOR SELECT
  TO authenticated
  USING (true);

-- Hanya pemilik profil yang bisa INSERT / UPDATE / DELETE salary
CREATE POLICY "Users can insert own salary"
  ON public.salaries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own salary"
  ON public.salaries FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own salary"
  ON public.salaries FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);

-- Policy Incentives:
CREATE POLICY "Incentives are viewable by authenticated users"
  ON public.incentives FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert incentives for own salary"
  ON public.incentives FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.salaries
      WHERE salaries.id = salary_id AND salaries.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update incentives for own salary"
  ON public.incentives FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.salaries
      WHERE salaries.id = salary_id AND salaries.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete incentives for own salary"
  ON public.incentives FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.salaries
      WHERE salaries.id = salary_id AND salaries.profile_id = auth.uid()
    )
  );

-- Policy Pockets:
CREATE POLICY "Pockets are viewable by authenticated users"
  ON public.pockets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert pockets for own salary"
  ON public.pockets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.salaries
      WHERE salaries.id = salary_id AND salaries.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pockets for own salary"
  ON public.pockets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.salaries
      WHERE salaries.id = salary_id AND salaries.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pockets for own salary"
  ON public.pockets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.salaries
      WHERE salaries.id = salary_id AND salaries.profile_id = auth.uid()
    )
  );

-- Policy Expenses:
CREATE POLICY "Expenses are viewable by authenticated users"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert expenses for own pockets"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pockets
      JOIN public.salaries ON salaries.id = pockets.salary_id
      WHERE pockets.id = pocket_id AND salaries.profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expenses for own pockets"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pockets
      JOIN public.salaries ON salaries.id = pockets.salary_id
      WHERE pockets.id = pocket_id AND salaries.profile_id = auth.uid()
    )
  );

-- Policy Expenses Delete:
CREATE POLICY "Users can delete expenses for own pockets"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pockets
      JOIN public.salaries ON salaries.id = pockets.salary_id
      WHERE pockets.id = pocket_id AND salaries.profile_id = auth.uid()
    )
  );

-- ==============================================================================
-- TRIGGER TO SYNC NEW AUTH USERS TO PROFILES
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      CASE 
        WHEN NEW.email = 'hasajalah74@gmail.com' THEN 'Hasby Muhammad Raafi Prasetyo'
        WHEN NEW.email = 'nidaliyana14@gmail.com' THEN 'Nida Liyana Nurrohmah'
        ELSE split_part(NEW.email, '@', 1)
      END
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
