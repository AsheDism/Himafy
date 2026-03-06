-- user_tags: upsert に必要な UPDATE ポリシーを追加
CREATE POLICY "user_tags_update_own" ON public.user_tags
  FOR UPDATE USING (auth.uid() = user_id);

-- profiles: クライアントからの INSERT を許可（トリガーで作成されなかった場合のフォールバック）
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
