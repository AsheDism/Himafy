-- ===================================
-- user_tags: ユーザー × タグ関連
-- ===================================
CREATE TABLE public.user_tags (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id INT NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'onboarding'
    CHECK (source IN ('onboarding', 'post_selection', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tag_id)
);

CREATE INDEX idx_user_tags_user ON public.user_tags(user_id);

-- RLS
ALTER TABLE public.user_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_tags_select_own" ON public.user_tags
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_tags_insert_own" ON public.user_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_tags_delete_own" ON public.user_tags
  FOR DELETE USING (auth.uid() = user_id);
