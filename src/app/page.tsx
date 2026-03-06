import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-4xl font-bold text-gray-900">Himafy</h1>
        <p className="text-lg text-gray-500 max-w-md">
          暇な時間を、あなたらしい時間へ。
          <br />
          AIがあなたの空き時間に最適な予定を提案します。
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
          >
            ログイン
          </Link>
          <Link
            href="/signup"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            新規登録
          </Link>
        </div>
      </div>
    </div>
  );
}
