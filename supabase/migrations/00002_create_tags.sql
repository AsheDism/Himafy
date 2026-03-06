-- ===================================
-- tag_categories & tags: マスターデータ
-- ===================================
CREATE TABLE public.tag_categories (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.tags (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES public.tag_categories(id),
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_category ON public.tags(category_id);

-- RLS: 全認証ユーザーが読み取り可能（マスターデータ）
ALTER TABLE public.tag_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tag_categories_select_all" ON public.tag_categories
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "tags_select_all" ON public.tags
  FOR SELECT TO authenticated USING (TRUE);
