-- ===================================
-- user_preferences: ユーザー設定
-- ===================================
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_ai_provider TEXT DEFAULT 'openai',
  suggestion_count INT NOT NULL DEFAULT 3
    CHECK (suggestion_count BETWEEN 1 AND 5),
  default_activity_duration_min INT DEFAULT 60,
  notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prefs_select_own" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prefs_insert_own" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prefs_update_own" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
