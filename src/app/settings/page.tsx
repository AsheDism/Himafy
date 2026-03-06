"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/layout/BottomNav";

type TagCategory = {
  id: number;
  slug: string;
  display_name: string;
  icon: string | null;
};

type Tag = {
  id: number;
  slug: string;
  display_name: string;
  category_id: number;
};

type UserTag = {
  id: number;
  tag_id: number;
  tags: {
    display_name: string;
    tag_categories: {
      display_name: string;
      icon: string | null;
    };
  };
};

function SettingsContent() {
  const [displayName, setDisplayName] = useState("");
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingCalendar, setConnectingCalendar] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [allCategories, setAllCategories] = useState<TagCategory[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [pendingTagIds, setPendingTagIds] = useState<Set<number>>(new Set());
  const [savingTags, setSavingTags] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Show calendar connection result from redirect
    const calendarParam = searchParams.get("calendar");
    const errorParam = searchParams.get("error");
    if (calendarParam === "connected") {
      setMessage("Google Calendarを連携しました。");
      setCalendarConnected(true);
    } else if (errorParam === "calendar_auth_failed") {
      setMessage("カレンダー連携に失敗しました。");
    }
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name);
      }

      // Check calendar connection
      const { data: token } = await supabase
        .from("calendar_tokens")
        .select("id")
        .eq("user_id", user.id)
        .single();

      setCalendarConnected(!!token);

      const res = await fetch("/api/tags/user");
      const json = await res.json();
      if (json.data) {
        setUserTags(json.data);
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) {
        setMessage("保存に失敗しました。");
      } else {
        setMessage("プロフィールを更新しました。");
      }
    }

    setSaving(false);
  }

  async function handleConnectCalendar() {
    setConnectingCalendar(true);
    const res = await fetch("/api/calendar/auth");
    const json = await res.json();
    if (json.data?.url) {
      window.location.href = json.data.url;
    } else {
      setMessage("カレンダー連携URLの取得に失敗しました。");
      setConnectingCalendar(false);
    }
  }

  async function handleDisconnectCalendar() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("calendar_tokens")
        .delete()
        .eq("user_id", user.id);
      setCalendarConnected(false);
      setMessage("Google Calendarの連携を解除しました。");
    }
  }

  async function handleOpenTagModal() {
    if (allCategories.length === 0) {
      const res = await fetch("/api/tags");
      const json = await res.json();
      if (json.data) {
        setAllCategories(json.data.categories);
        setAllTags(json.data.tags);
        if (json.data.categories.length > 0) {
          setSelectedCategoryId(json.data.categories[0].id);
        }
      }
    }
    const existingIds = new Set(userTags.map((ut) => ut.tag_id));
    setPendingTagIds(existingIds);
    setShowTagModal(true);
  }

  async function handleSaveNewTags() {
    const existingIds = new Set(userTags.map((ut) => ut.tag_id));
    const newIds = Array.from(pendingTagIds).filter((id) => !existingIds.has(id));
    if (newIds.length === 0) {
      setShowTagModal(false);
      return;
    }
    setSavingTags(true);
    const res = await fetch("/api/tags/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagIds: newIds, source: "manual" }),
    });
    if (res.ok) {
      // Reload tags
      const tagsRes = await fetch("/api/tags/user");
      const tagsJson = await tagsRes.json();
      if (tagsJson.data) setUserTags(tagsJson.data);
      setMessage("タグを追加しました。");
    } else {
      setMessage("タグの追加に失敗しました。");
    }
    setSavingTags(false);
    setShowTagModal(false);
  }

  async function handleRemoveTag(tagId: number) {
    const res = await fetch("/api/tags/user", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });

    if (res.ok) {
      setUserTags((prev) => prev.filter((t) => t.tag_id !== tagId));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-bottom-nav">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-indigo-600">設定</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {message && (
          <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md px-4 py-2">
            {message}
          </p>
        )}

        {/* Profile */}
        <section>
          <h2 className="text-lg font-bold mb-4">プロフィール</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-700"
              >
                表示名
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </form>
        </section>

        {/* Google Calendar */}
        <section>
          <h2 className="text-lg font-bold mb-4">Google Calendar</h2>
          {calendarConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm text-gray-700">連携済み</span>
              </div>
              <button
                onClick={handleDisconnectCalendar}
                className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                連携を解除
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Google Calendarと連携すると、空き時間の自動検出や予定の登録ができます。
              </p>
              <button
                onClick={handleConnectCalendar}
                disabled={connectingCalendar}
                className="rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {connectingCalendar ? "接続中..." : "Google Calendarを連携"}
              </button>
            </div>
          )}
        </section>

        {/* Tags */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">タグ</h2>
            <button
              onClick={handleOpenTagModal}
              className="text-sm text-indigo-600 hover:underline"
            >
              + タグを追加
            </button>
          </div>
          {userTags.length === 0 ? (
            <div className="text-center py-6 rounded-xl border border-dashed border-gray-300 bg-white">
              <p className="text-sm text-gray-400">タグが設定されていません。</p>
              <button
                onClick={handleOpenTagModal}
                className="mt-2 text-sm text-indigo-600 hover:underline"
              >
                タグを選択する
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {userTags.map((ut) => (
                <span
                  key={ut.id}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
                >
                  {ut.tags.tag_categories?.icon} {ut.tags.display_name}
                  <button
                    onClick={() => handleRemoveTag(ut.tag_id)}
                    className="ml-1 text-gray-400 hover:text-red-500"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Tag selection modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTagModal(false)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col safe-area-bottom">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">タグを追加</h3>
              <button onClick={() => setShowTagModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>

            {/* Category tabs */}
            <div className="flex overflow-x-auto gap-2 px-5 py-3 border-b border-gray-100">
              {allCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedCategoryId === cat.id
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.icon} {cat.display_name}
                </button>
              ))}
            </div>

            {/* Tags grid */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-wrap gap-2">
                {allTags
                  .filter((t) => t.category_id === selectedCategoryId)
                  .map((tag) => {
                    const selected = pendingTagIds.has(tag.id);
                    const alreadyExists = userTags.some((ut) => ut.tag_id === tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => {
                          if (alreadyExists) return;
                          setPendingTagIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(tag.id)) next.delete(tag.id);
                            else next.add(tag.id);
                            return next;
                          });
                        }}
                        disabled={alreadyExists}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                          alreadyExists
                            ? "bg-gray-200 text-gray-400 cursor-default"
                            : selected
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {tag.display_name}
                        {alreadyExists && " (追加済み)"}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Save button */}
            <div className="px-5 py-4 border-t border-gray-200">
              <button
                onClick={handleSaveNewTags}
                disabled={savingTags}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {savingTags ? "保存中..." : "追加する"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">読み込み中...</p>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
