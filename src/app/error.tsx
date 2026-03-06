"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-4 max-w-sm">
        <h1 className="text-xl font-bold text-gray-900">
          エラーが発生しました
        </h1>
        <p className="text-sm text-gray-500">
          {error.message || "予期しないエラーが発生しました。もう一度お試しください。"}
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          再試行
        </button>
      </div>
    </div>
  );
}
