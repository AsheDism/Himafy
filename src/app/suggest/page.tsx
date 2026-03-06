"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import BottomNav from "@/components/layout/BottomNav";

type Step = {
  action: string;
  durationMin: number;
};

type Suggestion = {
  id: string;
  title: string;
  description: string | null;
  estimated_duration_min: number | null;
  location: string | null;
  address: string | null;
  nearest_station: string | null;
  image_url: string | null;
  ai_raw_response: {
    steps?: Step[];
    timeSlot?: string | null;
    relatedTagSlugs?: string[];
  } | null;
};

type SuggestState = {
  sessionId: string | null;
  suggestions: Suggestion[];
  loading: boolean;
  error: string | null;
  accepted: Suggestion | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  work: "仕事",
  hobbies: "趣味",
  romance: "恋愛",
  housework: "家事",
  food: "食事",
  goals: "目標",
  personality: "性格・MBTI",
  lifestyle: "ライフスタイル",
};

function SuggestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const category = searchParams.get("category") || "hobbies";
  const supabase = createClient();

  const [state, setState] = useState<SuggestState>({
    sessionId: null,
    suggestions: [],
    loading: true,
    error: null,
    accepted: null,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [registeringCalendar, setRegisteringCalendar] = useState(false);
  const [calendarDone, setCalendarDone] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [relatedTags, setRelatedTags] = useState<{ slug: string; displayName: string }[]>([]);
  const [addingTags, setAddingTags] = useState(false);

  useEffect(() => {
    async function checkCalendar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("calendar_tokens")
          .select("id")
          .eq("user_id", user.id)
          .single();
        setCalendarConnected(!!data);
      }
    }
    checkCalendar();
  }, []);

  const fetchSuggestions = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setExpandedId(null);

    const res = await fetch("/api/ai/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categorySlug: category, count: 3 }),
    });

    if (!res.ok) {
      const json = await res.json();
      setState((s) => ({
        ...s,
        loading: false,
        error: json.error || "提案の生成に失敗しました",
      }));
      return;
    }

    const json = await res.json();
    setState({
      sessionId: json.data.session.id,
      suggestions: json.data.suggestions,
      loading: false,
      error: null,
      accepted: null,
    });
  }, [category]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  async function handleReplan() {
    if (!state.sessionId) return;

    setState((s) => ({ ...s, loading: true, error: null }));
    setExpandedId(null);

    const res = await fetch("/api/ai/replan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: state.sessionId, count: 3 }),
    });

    if (!res.ok) {
      const json = await res.json();
      setState((s) => ({
        ...s,
        loading: false,
        error: json.error || "再提案に失敗しました",
      }));
      return;
    }

    const json = await res.json();
    setState((s) => ({
      ...s,
      suggestions: json.data.suggestions,
      loading: false,
      error: null,
    }));
  }

  const [accepting, setAccepting] = useState(false);

  async function handleAccept(suggestion: Suggestion) {
    if (accepting) return;
    setAccepting(true);

    const res = await fetch(`/api/suggestions/${suggestion.id}/accept`, {
      method: "POST",
    });

    if (res.ok) {
      setState((s) => ({ ...s, accepted: suggestion }));

      // Check for related tags to suggest
      const tagSlugs = suggestion.ai_raw_response?.relatedTagSlugs || [];
      if (tagSlugs.length > 0) {
        // Fetch tag display names and check which ones the user doesn't have yet
        const { data: existingTags } = await supabase
          .from("user_tags")
          .select("tags(slug)")
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "");

        const existingSlugs = new Set(
          (existingTags || []).map((ut) => {
            const tag = ut.tags as unknown as { slug: string } | null;
            return tag?.slug;
          }).filter(Boolean)
        );

        const newSlugs = tagSlugs.filter((s) => !existingSlugs.has(s));
        if (newSlugs.length > 0) {
          const { data: tagData } = await supabase
            .from("tags")
            .select("slug, display_name")
            .in("slug", newSlugs);

          if (tagData && tagData.length > 0) {
            setRelatedTags(tagData.map((t) => ({ slug: t.slug, displayName: t.display_name })));
            setShowTagModal(true);
          }
        }
      }
    }
    setAccepting(false);
  }

  async function handleAddTags(slugs: string[]) {
    if (slugs.length === 0) {
      setShowTagModal(false);
      return;
    }
    setAddingTags(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAddingTags(false); return; }

    // Get tag IDs
    const { data: tags } = await supabase
      .from("tags")
      .select("id, slug")
      .in("slug", slugs);

    if (tags && tags.length > 0) {
      await supabase
        .from("user_tags")
        .upsert(
          tags.map((t) => ({
            user_id: user.id,
            tag_id: t.id,
            source: "post_selection",
          })),
          { onConflict: "user_id,tag_id" }
        );
    }

    setAddingTags(false);
    setShowTagModal(false);
  }

  async function handleRegisterCalendar() {
    if (!state.accepted) return;
    setRegisteringCalendar(true);

    const now = new Date();
    const durationMin = state.accepted.estimated_duration_min || 60;
    const startTime = new Date(now.getTime() + 30 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + durationMin * 60 * 1000);

    const res = await fetch("/api/calendar/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: state.accepted.title,
        description: state.accepted.description || "",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        suggestionId: state.accepted.id,
      }),
    });

    setRegisteringCalendar(false);
    if (res.ok) {
      setCalendarDone(true);
    }
  }

  const steps = (s: Suggestion) => s.ai_raw_response?.steps || [];
  const timeSlot = (s: Suggestion) => s.ai_raw_response?.timeSlot || null;

  // Accepted state
  if (state.accepted) {
    const acceptedSteps = steps(state.accepted);
    const acceptedTimeSlot = timeSlot(state.accepted);

    return (
      <div className="min-h-screen bg-gray-50 pb-bottom-nav">
        <div className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="text-5xl">&#x1F389;</div>
            <h1 className="text-xl font-bold">予定が決まりました！</h1>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 overflow-hidden text-left">
              {state.accepted.image_url && (
                <div className="w-full h-48 overflow-hidden">
                  <img
                    src={state.accepted.image_url}
                    alt={state.accepted.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6 space-y-3">
                <h2 className="font-bold text-indigo-900">
                  {state.accepted.title}
                </h2>
                {state.accepted.description && (
                  <p className="text-sm text-indigo-700">
                    {state.accepted.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 pt-1">
                  {acceptedTimeSlot && (
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-500 bg-indigo-100 rounded-full px-2.5 py-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {acceptedTimeSlot}
                    </span>
                  )}
                  {state.accepted.estimated_duration_min && (
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-500">
                      約{state.accepted.estimated_duration_min}分
                    </span>
                  )}
                  {state.accepted.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-500">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {state.accepted.location}
                    </span>
                  )}
                </div>
                {(state.accepted.address || state.accepted.nearest_station) && (
                  <div className="border-t border-indigo-200 pt-2 space-y-1">
                    {state.accepted.address && (
                      <p className="text-xs text-indigo-500">{state.accepted.address}</p>
                    )}
                    {state.accepted.nearest_station && (
                      <p className="inline-flex items-center gap-1 text-xs text-indigo-500">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h4m4 6H8a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2z" />
                        </svg>
                        {state.accepted.nearest_station}
                      </p>
                    )}
                  </div>
                )}
                {acceptedSteps.length > 0 && (
                  <div className="border-t border-indigo-200 pt-3">
                    <p className="text-xs font-semibold text-indigo-800 mb-2">ステップ</p>
                    <ol className="space-y-1.5">
                      {acceptedSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-indigo-700">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center text-[10px] font-bold mt-0.5">
                            {i + 1}
                          </span>
                          <span className="flex-1">{step.action}</span>
                          <span className="text-indigo-400 flex-shrink-0">{step.durationMin}分</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </div>

            {/* Tag suggestion modal */}
            {showTagModal && relatedTags.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
                <p className="text-sm font-semibold text-amber-800 mb-2">
                  関連タグを追加しますか？
                </p>
                <p className="text-xs text-amber-600 mb-3">
                  この提案に関連するタグをプロフィールに追加すると、今後の提案がさらにパーソナライズされます。
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {relatedTags.map((tag) => (
                    <span
                      key={tag.slug}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-3 py-1 text-xs text-amber-800"
                    >
                      {tag.displayName}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddTags(relatedTags.map((t) => t.slug))}
                    disabled={addingTags}
                    className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    {addingTags ? "追加中..." : "すべて追加"}
                  </button>
                  <button
                    onClick={() => setShowTagModal(false)}
                    className="flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50"
                  >
                    スキップ
                  </button>
                </div>
              </div>
            )}

            {/* Calendar registration */}
            {calendarConnected && !calendarDone && (
              <button
                onClick={handleRegisterCalendar}
                disabled={registeringCalendar}
                className="w-full rounded-lg border border-indigo-200 bg-white px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {registeringCalendar ? "登録中..." : "Google Calendarに追加"}
              </button>
            )}
            {calendarDone && (
              <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                Google Calendarに登録しました
              </p>
            )}
            {!calendarConnected && (
              <Link
                href="/settings?calendar=connect"
                className="block text-xs text-gray-400 hover:text-indigo-500"
              >
                Google Calendarを連携すると予定を直接登録できます
              </Link>
            )}

            <div className="space-y-3 pt-2">
              <Link
                href={`/feedback/${state.accepted.id}`}
                className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white text-center hover:bg-indigo-700 active:scale-[0.98] transition-all"
              >
                フィードバックを送る
              </Link>
              <div className="flex gap-3">
                <Link
                  href="/dashboard"
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 text-center hover:bg-gray-50"
                >
                  ホームへ
                </Link>
                <button
                  onClick={() => {
                    setState({ sessionId: null, suggestions: [], loading: false, error: null, accepted: null });
                    router.push("/dashboard");
                  }}
                  className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-600 text-center hover:bg-indigo-100"
                >
                  別のカテゴリ
                </button>
              </div>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-bottom-nav">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 戻る
          </Link>
          <h1 className="text-sm font-medium">
            {CATEGORY_LABELS[category] || category}の提案
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {state.loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent" />
            <p className="text-gray-500 text-sm mt-4">AIが提案を考えています...</p>
          </div>
        ) : state.error ? (
          <div className="text-center py-12">
            <p className="text-red-600 text-sm">{state.error}</p>
            <button
              onClick={fetchSuggestions}
              className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              再試行
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 text-center">
              タップして詳細を確認しましょう
            </p>

            {state.suggestions.map((s) => {
              const isExpanded = expandedId === s.id;
              const sSteps = steps(s);
              const sTimeSlot = timeSlot(s);
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden transition-all"
                >
                  {/* Title row - always visible */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900">{s.title}</h3>
                      {sTimeSlot && (
                        <p className="text-xs text-indigo-500 mt-0.5">{sTimeSlot}</p>
                      )}
                    </div>
                    <svg
                      className={`h-5 w-5 text-gray-400 shrink-0 ml-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expandable detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {s.image_url && (
                        <div className="w-full h-44 overflow-hidden">
                          <img
                            src={s.image_url}
                            alt={s.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="px-5 py-4 space-y-3">
                        {s.description && (
                          <p className="text-sm text-gray-600">{s.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3">
                          {sTimeSlot && (
                            <span className="inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-1 font-medium">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {sTimeSlot}
                            </span>
                          )}
                          {s.estimated_duration_min && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                              約{s.estimated_duration_min}分
                            </span>
                          )}
                          {s.location && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {s.location}
                            </span>
                          )}
                        </div>
                        {(s.address || s.nearest_station) && (
                          <div className="space-y-1 text-xs text-gray-400">
                            {s.address && <p>{s.address}</p>}
                            {s.nearest_station && (
                              <p className="inline-flex items-center gap-1">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8m-8 4h4m4 6H8a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2z" />
                                </svg>
                                {s.nearest_station}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Steps */}
                        {sSteps.length > 0 && (
                          <div className="border-t border-gray-100 pt-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2">やることステップ</p>
                            <ol className="space-y-1.5">
                              {sSteps.map((step, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold mt-0.5">
                                    {i + 1}
                                  </span>
                                  <span className="flex-1">{step.action}</span>
                                  <span className="text-gray-400 flex-shrink-0">{step.durationMin}分</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        <button
                          onClick={() => handleAccept(s)}
                          disabled={accepting}
                          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {accepting ? "登録中..." : "この予定にする"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Replan button */}
            <button
              onClick={handleReplan}
              disabled={state.loading || !state.sessionId}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              他の提案を見る
            </button>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function SuggestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      }
    >
      <SuggestContent />
    </Suspense>
  );
}
