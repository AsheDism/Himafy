-- Variation hints for parallel AI suggestion generation
CREATE TABLE public.variation_hints (
  id SERIAL PRIMARY KEY,
  hint TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Allow all authenticated users to read
ALTER TABLE public.variation_hints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "variation_hints_select" ON public.variation_hints
  FOR SELECT TO authenticated USING (true);

-- Seed data
INSERT INTO public.variation_hints (hint) VALUES
  ('定番・人気スポット'),
  ('穴場・ユニーク体験'),
  ('のんびり・リラックス系'),
  ('アクティブ・体を動かす'),
  ('クリエイティブ・ものづくり'),
  ('学び・スキルアップ'),
  ('ソーシャル・人と交流'),
  ('ソロ活・一人で楽しむ'),
  ('インドア・室内で楽しむ'),
  ('アウトドア・自然を感じる'),
  ('グルメ・食べ歩き'),
  ('文化・アート鑑賞'),
  ('トレンド・話題のスポット'),
  ('レトロ・昔ながらの'),
  ('コスパ重視・お手頃'),
  ('ちょっと贅沢・ご褒美'),
  ('朝活・早朝向け'),
  ('夜活・夕方以降向け'),
  ('短時間・サクッと'),
  ('じっくり・時間をかけて'),
  ('写真映え・SNS向き'),
  ('癒し・ヒーリング'),
  ('冒険・新しい発見'),
  ('地元密着・ローカル'),
  ('季節を感じる・旬の体験');
