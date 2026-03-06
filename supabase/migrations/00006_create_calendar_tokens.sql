-- ===================================
-- calendar_tokens: Google Calendar OAuthトークン
-- ===================================
CREATE TABLE public.calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER calendar_tokens_updated_at
  BEFORE UPDATE ON public.calendar_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS: サーバーサイドのみで操作する想定だが、念のためRLSも設定
ALTER TABLE public.calendar_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tokens_select_own" ON public.calendar_tokens
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tokens_insert_own" ON public.calendar_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tokens_update_own" ON public.calendar_tokens
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tokens_delete_own" ON public.calendar_tokens
  FOR DELETE USING (auth.uid() = user_id);
