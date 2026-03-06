"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type TagCategory = {
  id: number;
  slug: string;
  display_name: string;
  display_order: number;
  icon: string | null;
};

type Tag = {
  id: number;
  slug: string;
  display_name: string;
  category_id: number;
};

export default function OnboardingPage() {
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/tags");
      const json = await res.json();
      if (json.data) {
        setCategories(json.data.categories);
        setTags(json.data.tags);
      }
      setLoading(false);
    }
    load();
  }, []);

  const currentCategory = categories[step] || null;
  const isLastStep = step === categories.length - 1;
  const isSummaryStep = step === categories.length;

  const currentTags = currentCategory
    ? tags.filter((t) => t.category_id === currentCategory.id)
    : [];

  const selectedCountForStep = currentCategory
    ? currentTags.filter((t) => selectedTagIds.has(t.id)).length
    : 0;

  const toggleTag = useCallback((tagId: number) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }, []);

  function handleNext() {
    if (step < categories.length) {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  function handleSkip() {
    setStep(step + 1);
  }

  async function handleComplete() {
    setSaving(true);
    setError(null);

    if (selectedTagIds.size > 0) {
      const res = await fetch("/api/tags/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagIds: Array.from(selectedTagIds),
          source: "onboarding",
        }),
      });

      if (!res.ok) {
        setError("タグの保存に失敗しました。");
        setSaving(false);
        return;
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);

      if (profileError) {
        setError("プロフィールの更新に失敗しました。");
        setSaving(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent" />
      </div>
    );
  }

  // Summary step
  if (isSummaryStep) {
    const selectedTags = tags.filter((t) => selectedTagIds.has(t.id));
    const groupedByCategory = categories
      .map((cat) => ({
        category: cat,
        tags: selectedTags.filter((t) => t.category_id === cat.id),
      }))
      .filter((g) => g.tags.length > 0);

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">&#x2728;</div>
            <h1 className="text-2xl font-bold text-gray-900">
              あなたのプロフィール
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              {selectedTagIds.size}個のタグを選択しました
            </p>
          </div>

          {/* Selected tags grouped by category */}
          <div className="space-y-5 mb-8">
            {groupedByCategory.map(({ category, tags: catTags }) => (
              <div key={category.id}>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {category.icon} {category.display_name}
                </div>
                <div className="flex flex-wrap gap-2">
                  {catTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className="rounded-full bg-indigo-100 text-indigo-700 px-4 py-2 text-sm font-medium flex items-center gap-1.5 active:scale-95 transition-transform"
                    >
                      {tag.display_name}
                      <span className="text-indigo-400 text-xs">x</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selectedTagIds.size === 0 && (
            <p className="text-center text-gray-400 text-sm mb-8">
              まだタグが選択されていません
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 text-center mb-4">{error}</p>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {selectedTagIds.size > 0 ? (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-4 text-base font-semibold text-white hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {saving ? "保存中..." : "はじめる"}
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="w-full rounded-2xl bg-indigo-600 px-4 py-4 text-base font-semibold text-white hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {saving ? "保存中..." : "スキップしてはじめる"}
              </button>
            )}
            <button
              onClick={handleBack}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              戻って編集する
            </button>
            <p className="text-center text-xs text-gray-400">
              タグは後からいつでも設定ページで変更できます
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Category step
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col">
      {/* Progress bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-1.5">
            {categories.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  i < step
                    ? "bg-indigo-600"
                    : i === step
                      ? "bg-indigo-400"
                      : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={handleBack}
              className={`text-sm text-gray-400 hover:text-gray-600 ${step === 0 ? "invisible" : ""}`}
            >
              &#8592; 戻る
            </button>
            <span className="text-xs text-gray-400">
              {step + 1} / {categories.length}
            </span>
            <div className="w-10" />
          </div>
        </div>
      </div>

      {/* Category header */}
      <div className="text-center px-4 pt-4 pb-6">
        <div className="text-5xl mb-3">{currentCategory?.icon}</div>
        <h1 className="text-2xl font-bold text-gray-900">
          {currentCategory?.display_name}
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          あてはまるものをタップ
        </p>
      </div>

      {/* Tag grid - Netflix/matching app style */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          <div className="grid grid-cols-2 gap-3">
            {currentTags.map((tag) => {
              const selected = selectedTagIds.has(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`relative rounded-2xl px-4 py-4 text-sm font-medium transition-all duration-200 active:scale-95 ${
                    selected
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:shadow-sm"
                  }`}
                >
                  {/* Checkmark */}
                  {selected && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                  )}
                  {tag.display_name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent px-4 pb-6 pt-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={handleNext}
            className={`flex-1 rounded-2xl px-4 py-4 text-base font-semibold transition-all active:scale-[0.98] ${
              selectedCountForStep > 0
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {isLastStep
              ? selectedCountForStep > 0
                ? `確認する (${selectedTagIds.size}個選択中)`
                : "確認する"
              : selectedCountForStep > 0
                ? `次へ (${selectedCountForStep}個選択)`
                : "次へ"}
          </button>
          <button
            onClick={handleSkip}
            className="shrink-0 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all active:scale-[0.98]"
          >
            スキップ
          </button>
        </div>
      </div>
    </div>
  );
}
