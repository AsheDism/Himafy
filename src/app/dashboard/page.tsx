"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";

type Profile = {
  display_name: string;
  onboarding_completed: boolean;
};

type RecentSuggestion = {
  id: string;
  title: string;
  description: string | null;
  is_selected: boolean;
  created_at: string;
};

type AiLearningStats = {
  totalFeedbacks: number;
  avgSatisfaction: number | null;
  totalTags: number;
  totalSuggestions: number;
};

const CATEGORY_OPTIONS = [
  { slug: "work", label: "仕事", icon: "💼" },
  { slug: "hobbies", label: "趣味", icon: "🎮" },
  { slug: "romance", label: "恋愛", icon: "💕" },
  { slug: "housework", label: "家事", icon: "🏠" },
  { slug: "food", label: "食事", icon: "🍽️" },
  { slug: "goals", label: "目標", icon: "🎯" },
  { slug: "personality", label: "性格・MBTI", icon: "🧠" },
  { slug: "lifestyle", label: "ライフスタイル", icon: "🌿" },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "おはようございます";
  if (hour < 18) return "こんにちは";
  return "こんばんは";
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentSuggestions, setRecentSuggestions] = useState<RecentSuggestion[]>([]);
  const [aiStats, setAiStats] = useState<AiLearningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profileData) {
        if (!profileData.onboarding_completed) {
          router.push("/onboarding");
          return;
        }
        setProfile(profileData);
      }

      // Load recent suggestions
      const { data: sessions } = await supabase
        .from("suggestion_sessions")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map((s) => s.id);
        const { data: suggestions } = await supabase
          .from("suggestions")
          .select("id, title, description, is_selected, created_at")
          .in("session_id", sessionIds)
          .eq("is_selected", true)
          .order("created_at", { ascending: false })
          .limit(5);

        if (suggestions) {
          setRecentSuggestions(suggestions);
        }
      }

      // Load AI learning stats
      const [feedbackResult, tagsResult, suggestionsCountResult] = await Promise.all([
        supabase
          .from("feedback")
          .select("satisfaction")
          .eq("user_id", user.id),
        supabase
          .from("user_tags")
          .select("id", { count: "exact" })
          .eq("user_id", user.id),
        supabase
          .from("suggestion_sessions")
          .select("id", { count: "exact" })
          .eq("user_id", user.id),
      ]);

      const feedbacks = feedbackResult.data || [];
      const totalFeedbacks = feedbacks.length;
      const avgSatisfaction = totalFeedbacks > 0
        ? feedbacks.reduce((sum, f) => sum + f.satisfaction, 0) / totalFeedbacks
        : null;

      setAiStats({
        totalFeedbacks,
        avgSatisfaction,
        totalTags: tagsResult.count || 0,
        totalSuggestions: suggestionsCountResult.count || 0,
      });

      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-bottom-nav">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-indigo-600">Himafy</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ログアウト
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="text-xl font-bold">
            {getGreeting()}、{profile?.display_name || "ゲスト"}さん
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            何をして過ごしますか？カテゴリを選んでAIに提案してもらいましょう。
          </p>
        </div>

        {/* Category picker */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            カテゴリを選択
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORY_OPTIONS.map((cat) => (
              <Link
                key={cat.slug}
                href={`/suggest?category=${cat.slug}`}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-md active:scale-[0.98] transition-all"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-sm font-medium text-gray-700">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* AI Learning widget */}
        {aiStats && aiStats.totalFeedbacks > 0 && (
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
            <h3 className="text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AIの学習状況
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-indigo-600">
                  {aiStats.avgSatisfaction?.toFixed(1) ?? "-"}
                </p>
                <p className="text-[10px] text-indigo-400">平均満足度</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-indigo-600">
                  {aiStats.totalFeedbacks}
                </p>
                <p className="text-[10px] text-indigo-400">フィードバック</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-indigo-600">
                  {aiStats.totalTags}
                </p>
                <p className="text-[10px] text-indigo-400">登録タグ</p>
              </div>
            </div>
            <p className="text-[11px] text-indigo-500 mt-3 text-center">
              フィードバックが増えるほど、AIの提案精度が向上します
            </p>
          </div>
        )}

        {/* Recent accepted suggestions */}
        {recentSuggestions.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              最近の予定
            </h3>
            <div className="space-y-2">
              {recentSuggestions.map((s) => (
                <Link
                  key={s.id}
                  href={`/feedback/${s.id}`}
                  className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-200 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{s.title}</p>
                  {s.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {s.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-400">
                      {new Date(s.created_at).toLocaleDateString("ja-JP")}
                    </p>
                    <span className="text-xs text-indigo-500">フィードバック &rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 rounded-xl border border-dashed border-gray-300 bg-white">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-sm text-gray-500">まだ予定がありません</p>
            <p className="text-xs text-gray-400 mt-1">上のカテゴリから最初の提案を受けてみましょう</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
