-- ===================================
-- suggestions: 予算情報（min/max）の追加
-- ===================================
ALTER TABLE public.suggestions
  ADD COLUMN budget_min INTEGER DEFAULT 0,
  ADD COLUMN budget_max INTEGER DEFAULT 0;

COMMENT ON COLUMN public.suggestions.budget_min IS '最低予算（円）';
COMMENT ON COLUMN public.suggestions.budget_max IS '最高予算（円）';
