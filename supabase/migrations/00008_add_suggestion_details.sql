-- ===================================
-- suggestions: 住所・最寄り駅・画像URL追加
-- ===================================
ALTER TABLE public.suggestions
  ADD COLUMN address TEXT,
  ADD COLUMN nearest_station TEXT,
  ADD COLUMN image_url TEXT;
