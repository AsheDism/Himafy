"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function FeedbackPage() {
  const { suggestionId } = useParams<{ suggestionId: string }>();
  const [satisfaction, setSatisfaction] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (satisfaction === 0) {
      setError("満足度を選択してください。");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        suggestionId,
        satisfaction,
        comment: comment || undefined,
      }),
    });

    if (!res.ok) {
      setError("フィードバックの送信に失敗しました。");
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center space-y-4">
          <div className="text-4xl">🙏</div>
          <h1 className="text-xl font-bold">フィードバックありがとうございます！</h1>
          <p className="text-gray-500 text-sm">
            今後の提案の改善に活用させていただきます。
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            ダッシュボードへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 戻る
          </Link>
          <h1 className="text-sm font-medium">フィードバック</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              提案はいかがでしたか？
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSatisfaction(n)}
                  className={`h-12 w-12 rounded-full text-lg transition-all ${
                    satisfaction >= n
                      ? "bg-yellow-400 text-white scale-110"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {n <= 2 ? "😐" : n <= 4 ? "😊" : "🤩"}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              {satisfaction > 0 ? `${satisfaction}/5` : "タップして選択"}
            </p>
          </div>

          <div>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              コメント（任意）
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="提案について感想を教えてください..."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || satisfaction === 0}
            className="w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "送信中..." : "フィードバックを送信"}
          </button>
        </form>
      </div>
    </div>
  );
}
