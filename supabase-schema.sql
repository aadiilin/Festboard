-- FestBoard Database Schema for Supabase
-- Run this in the Supabase SQL Editor to set up your database

-- 0. TENANTS TABLE (for site rental management)
CREATE TABLE tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  login_type TEXT NOT NULL DEFAULT 'google' CHECK (login_type IN ('google', 'email_password', 'magic_link', 'none')),
  rental_start DATE NOT NULL DEFAULT CURRENT_DATE,
  rental_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenants_all" ON tenants FOR ALL USING (true);

-- 1. PROFILES TABLE
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'event_admin' CHECK (role IN ('super_admin', 'event_admin', 'judge', 'student', 'public')),
  organization_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EVENTS TABLE
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  venue TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  languages TEXT[] DEFAULT '{en}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES TABLE
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TEAMS TABLE
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PARTICIPANTS TABLE
CREATE TABLE participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  chest_number TEXT NOT NULL,
  mobile TEXT,
  email TEXT,
  address TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, chest_number)
);

-- 6. POINT SYSTEMS TABLE
CREATE TABLE point_systems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  first INT DEFAULT 10,
  second INT DEFAULT 7,
  third INT DEFAULT 5,
  participation INT DEFAULT 1,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. COMPETITIONS TABLE
CREATE TABLE competitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  venue TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  max_marks DOUBLE PRECISION DEFAULT 100,
  instructions TEXT,
  point_system_id UUID REFERENCES point_systems(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. COMPETITION JUDGES TABLE
CREATE TABLE competition_judges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
  judge_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competition_id, judge_id)
);

-- 9. SCORES TABLE
CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  judge_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  marks DOUBLE PRECISION NOT NULL,
  is_draft BOOLEAN DEFAULT TRUE,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competition_id, participant_id, judge_id)
);

-- 10. PENALTIES TABLE
CREATE TABLE penalties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  points DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PENALTY LOGS TABLE
CREATE TABLE penalty_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  penalty_id UUID REFERENCES penalties(id) ON DELETE CASCADE NOT NULL,
  competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. CERTIFICATES TABLE
CREATE TABLE certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('winner', 'runner_up', 'participation', 'merit')),
  template_url TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. POSTERS TABLE
CREATE TABLE posters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  template_url TEXT NOT NULL,
  generated_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. AUDIT LOGS TABLE
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. EVENT SETTINGS TABLE
CREATE TABLE event_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE UNIQUE NOT NULL,
  language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'light',
  projector_auto_refresh INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_categories_event_id ON categories(event_id);
CREATE INDEX idx_teams_event_id ON teams(event_id);
CREATE INDEX idx_participants_event_id ON participants(event_id);
CREATE INDEX idx_participants_category_id ON participants(category_id);
CREATE INDEX idx_participants_team_id ON participants(team_id);
CREATE INDEX idx_participants_chest_number ON participants(chest_number);
CREATE INDEX idx_competitions_event_id ON competitions(event_id);
CREATE INDEX idx_competitions_category_id ON competitions(category_id);
CREATE INDEX idx_scores_competition_id ON scores(competition_id);
CREATE INDEX idx_scores_participant_id ON scores(participant_id);
CREATE INDEX idx_competition_judges_judge_id ON competition_judges(judge_id);
CREATE INDEX idx_certificates_event_id ON certificates(event_id);
CREATE INDEX idx_certificates_participant_id ON certificates(participant_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalty_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE posters ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Profiles: users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Events: event admin can CRUD their own events, super admin can all
CREATE POLICY "Event admins manage own events" ON events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Super admins manage all events" ON events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Categories: event admin can manage categories for their events
CREATE POLICY "Manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM events WHERE id = categories.event_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Teams: event admin can manage teams
CREATE POLICY "Manage teams" ON teams FOR ALL USING (
  EXISTS (SELECT 1 FROM events WHERE id = teams.event_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Participants: event admin can CRUD, judges can read
CREATE POLICY "Manage participants" ON participants FOR ALL USING (
  EXISTS (SELECT 1 FROM events WHERE id = participants.event_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Competitions: event admin manages, judges can read assigned
CREATE POLICY "Manage competitions" ON competitions FOR ALL USING (
  EXISTS (SELECT 1 FROM events WHERE id = competitions.event_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Scores: judges can insert/update their own scores, event admin can approve
CREATE POLICY "Judges manage own scores" ON scores FOR ALL USING (judge_id = auth.uid());
CREATE POLICY "Admins approve scores" ON scores FOR UPDATE USING (
  EXISTS (SELECT 1 FROM competitions c JOIN events e ON c.event_id = e.id WHERE c.id = scores.competition_id AND e.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Public read access for results view
CREATE POLICY "Public view scores" ON scores FOR SELECT USING (is_approved = TRUE);
CREATE POLICY "Public view participants" ON participants FOR SELECT USING (TRUE);
CREATE POLICY "Public view events" ON events FOR SELECT USING (status = 'active');

-- TRIGGER to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'event_admin')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- TRIGGER to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_competitions_updated_at BEFORE UPDATE ON competitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scores_updated_at BEFORE UPDATE ON scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
