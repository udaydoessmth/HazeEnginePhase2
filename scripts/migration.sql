-- ============================================================
-- HAZE PUBLISHING MIGRATION
-- Run in: https://supabase.com/dashboard/project/yofultqswneduesnvpzl/sql/new
-- ============================================================

-- 1. Add publishing columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS creator_name TEXT;

-- 2. Add publishing columns to audio_tracks table
ALTER TABLE audio_tracks ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE audio_tracks ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE audio_tracks ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
ALTER TABLE audio_tracks ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE audio_tracks ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE audio_tracks ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE audio_tracks ADD COLUMN IF NOT EXISTS creator_name TEXT;

-- 3. Create profiles table (stores display names for creator attribution)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read profiles (for creator names on public pages)
DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
CREATE POLICY "Public can read profiles"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow users to insert/update their own profile
DROP POLICY IF EXISTS "Users can upsert own profile" ON profiles;
CREATE POLICY "Users can upsert own profile"
  ON profiles FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 5. Trigger: auto-create profile row on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. Backfill profiles for existing users (run once)
INSERT INTO profiles (id, username)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 7. Storage buckets: run these if buckets don't exist yet
-- (Do this in Storage > Buckets in the dashboard instead if preferred)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', true) ON CONFLICT DO NOTHING;

-- Done!
SELECT 'Migration complete' AS status;
