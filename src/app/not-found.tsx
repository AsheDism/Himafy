import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-gray-200">404</h1>
        <p className="text-gray-500 text-sm">
          ページが見つかりませんでした。
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
