-- ===================================
-- suggestion_sessions & suggestions: AI提案
-- ===================================
CREATE TABLE public.suggestion_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL,
  target_time_start TIMESTAMPTZ,
  target_time_end TIMESTAMPTZ,
  attempt_count INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suggestion_sessions_user ON public.suggestion_sessions(user_id);

CREATE TRIGGER suggestion_sessions_updated_at
  BEFORE UPDATE ON public.suggestion_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.suggestion_sessions(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  estimated_duration_min INT,
  location TEXT,
  ai_provider TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  ai_raw_response JSONB,
  is_selected BOOLEAN NOT NULL DEFAULT FALSE,
  calendar_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suggestions_session ON public.suggestions(session_id);

-- RLS
ALTER TABLE public.suggestion_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_own" ON public.suggestion_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON public.suggestion_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON public.suggestion_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "suggestions_select_own" ON public.suggestions
  FOR SELECT USING (
    session_id IN (SELECT id FROM public.suggestion_sessions WHERE user_id = auth.uid())
  );
CREATE POLICY "suggestions_insert_own" ON public.suggestions
  FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM public.suggestion_sessions WHERE user_id = auth.uid())
  );
CREATE POLICY "suggestions_update_own" ON public.suggestions
  FOR UPDATE USING (
    session_id IN (SELECT id FROM public.suggestion_sessions WHERE user_id = auth.uid())
  );
