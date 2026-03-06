-- ===================================
-- Himafy 初期データ投入
-- ===================================

-- タグカテゴリ
INSERT INTO public.tag_categories (slug, display_name, display_order, icon) VALUES
  ('work', '仕事', 1, '💼'),
  ('hobbies', '趣味', 2, '🎮'),
  ('romance', '恋愛', 3, '💕'),
  ('housework', '家事', 4, '🏠'),
  ('food', '食事', 5, '🍽️'),
  ('goals', '目標', 6, '🎯'),
  ('personality', '性格・MBTI', 7, '🧠'),
  ('lifestyle', 'ライフスタイル', 8, '🌿');

-- ===================================
-- 仕事 (work)
-- ===================================
INSERT INTO public.tags (category_id, slug, display_name) VALUES
  (1, 'engineer', 'エンジニア'),
  (1, 'designer', 'デザイナー'),
  (1, 'sales', '営業'),
  (1, 'marketing', 'マーケティング'),
  (1, 'remote_work', 'リモートワーク'),
  (1, 'office_work', 'オフィスワーク'),
  (1, 'freelance', 'フリーランス'),
  (1, 'student', '学生'),
  (1, 'management', 'マネジメント'),
  (1, 'startup', 'スタートアップ'),
  (1, 'creative', 'クリエイティブ職'),
  (1, 'consulting', 'コンサルティング'),
  (1, 'healthcare', '医療・介護'),
  (1, 'education', '教育'),
  (1, 'part_time', 'アルバイト・パート');

-- ===================================
-- 趣味 (hobbies)
-- ===================================
INSERT INTO public.tags (category_id, slug, display_name) VALUES
  (2, 'gaming', 'ゲーム'),
  (2, 'reading', '読書'),
  (2, 'fitness', '筋トレ・フィットネス'),
  (2, 'cooking_hobby', '料理'),
  (2, 'music', '音楽'),
  (2, 'anime_manga', 'アニメ・漫画'),
  (2, 'movie', '映画鑑賞'),
  (2, 'photography', '写真撮影'),
  (2, 'travel', '旅行'),
  (2, 'sports', 'スポーツ'),
  (2, 'running', 'ランニング'),
  (2, 'yoga', 'ヨガ'),
  (2, 'drawing', 'イラスト・お絵描き'),
  (2, 'diy', 'DIY・ものづくり'),
  (2, 'gardening', 'ガーデニング'),
  (2, 'cafe_hopping', 'カフェ巡り'),
  (2, 'sns', 'SNS・動画配信'),
  (2, 'board_games', 'ボードゲーム'),
  (2, 'camping', 'キャンプ'),
  (2, 'fishing', '釣り');

-- ===================================
-- 恋愛 (romance)
-- ===================================
INSERT INTO public.tags (category_id, slug, display_name) VALUES
  (3, 'date_lover', 'デート好き'),
  (3, 'anniversary_oriented', '記念日重視'),
  (3, 'partner_searching', 'パートナー探し中'),
  (3, 'married', '既婚'),
  (3, 'in_relationship', '交際中'),
  (3, 'single', 'シングル'),
  (3, 'outdoor_date', 'アウトドアデート派'),
  (3, 'indoor_date', 'インドアデート派'),
  (3, 'romantic', 'ロマンチスト'),
  (3, 'casual_dating', 'カジュアルな出会い');

-- ===================================
-- 家事 (housework)
-- ===================================
INSERT INTO public.tags (category_id, slug, display_name) VALUES
  (4, 'cooking_lover', '料理好き'),
  (4, 'cleaning', '掃除・整理整頓'),
  (4, 'time_saving', '時短重視'),
  (4, 'chore_sharing', '家事分担'),
  (4, 'laundry', '洗濯好き'),
  (4, 'organizing', '収納・整理'),
  (4, 'pet_care', 'ペットの世話'),
  (4, 'childcare', '育児'),
  (4, 'home_improvement', '住まいの改善'),
  (4, 'meal_prep', '作り置き・食事準備');

-- ===================================
-- 食事 (food)
-- ===================================
INSERT INTO public.tags (category_id, slug, display_name) VALUES
  (5, 'japanese_food', '和食'),
  (5, 'italian', 'イタリアン'),
  (5, 'chinese', '中華'),
  (5, 'korean', '韓国料理'),
  (5, 'ramen', 'ラーメン'),
  (5, 'sushi', '寿司'),
  (5, 'curry', 'カレー'),
  (5, 'cafe_food', 'カフェ飯'),
  (5, 'sweets', 'スイーツ'),
  (5, 'vegetarian', 'ベジタリアン'),
  (5, 'yakiniku', '焼肉'),
  (5, 'fast_food', 'ファストフード'),
  (5, 'home_cooking', '自炊派'),
  (5, 'eating_out', '外食派'),
  (5, 'healthy_food', 'ヘルシー志向');

-- ===================================
-- 目標 (goals)
-- ===================================
INSERT INTO public.tags (category_id, slug, display_name) VALUES
  (6, 'certification', '資格取得'),
  (6, 'diet', 'ダイエット'),
  (6, 'side_job', '副業'),
  (6, 'language_learning', '語学学習'),
  (6, 'investment', '投資・資産形成'),
  (6, 'programming', 'プログラミング学習'),
  (6, 'career_change', '転職・キャリアチェンジ'),
  (6, 'health_improvement', '健康改善'),
  (6, 'skill_up', 'スキルアップ'),
  (6, 'reading_goal', '読書目標'),
  (6, 'saving', '貯金'),
  (6, 'independence', '独立・起業'),
  (6, 'body_building', '筋力アップ'),
  (6, 'meditation', '瞑想・マインドフルネス'),
  (6, 'early_riser', '早起き習慣');

-- ===================================
-- 性格・MBTI (personality)
-- ===================================
INSERT INTO public.tags (category_id, slug, display_name) VALUES
  (7, 'mbti_intj', 'INTJ (建築家)'),
  (7, 'mbti_intp', 'INTP (論理学者)'),
  (7, 'mbti_entj', 'ENTJ (指揮官)'),
  (7, 'mbti_entp', 'ENTP (討論者)'),
  (7, 'mbti_infj', 'INFJ (提唱者)'),
  (7, 'mbti_infp', 'INFP (仲介者)'),
  (7, 'mbti_enfj', 'ENFJ (主人公)'),
  (7, 'mbti_enfp', 'ENFP (運動家)'),
  (7, 'mbti_istj', 'ISTJ (管理者)'),
  (7, 'mbti_isfj', 'ISFJ (擁護者)'),
  (7, 'mbti_estj', 'ESTJ (幹部)'),
  (7, 'mbti_esfj', 'ESFJ (領事)'),
  (7, 'mbti_istp', 'ISTP (巨匠)'),
  (7, 'mbti_isfp', 'ISFP (冒険家)'),
  (7, 'mbti_estp', 'ESTP (起業家)'),
  (7, 'mbti_esfp', 'ESFP (エンターテイナー)'),
  (7, 'extroverted', '外向的'),
  (7, 'introverted', '内向的'),
  (7, 'planner', '計画的'),
  (7, 'adventurous', '冒険好き');

-- ===================================
-- ライフスタイル (lifestyle)
-- ===================================
INSERT INTO public.tags (category_id, slug, display_name) VALUES
  (8, 'morning_person', '朝型'),
  (8, 'night_owl', '夜型'),
  (8, 'minimalist', 'ミニマリスト'),
  (8, 'outdoor_person', 'アウトドア派'),
  (8, 'indoor_person', 'インドア派'),
  (8, 'eco_conscious', 'エコ・サステナブル'),
  (8, 'city_dweller', '都会暮らし'),
  (8, 'suburban', '郊外暮らし'),
  (8, 'social', '社交的'),
  (8, 'solo_time', 'ひとり時間重視'),
  (8, 'work_life_balance', 'ワークライフバランス重視'),
  (8, 'busy_schedule', '多忙'),
  (8, 'flexible_schedule', '柔軟なスケジュール'),
  (8, 'tech_savvy', 'テック好き'),
  (8, 'analog_lover', 'アナログ派');
