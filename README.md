# Himafy

> 暇な時間を、あなたらしい時間へ。— あなたの時間を最適化するAI

AIがユーザーの空き時間・タグベースプロフィールから最適な予定を提案するスケジュールアプリです。

## 技術スタック

- **フロントエンド:** Next.js (App Router) + TypeScript + Tailwind CSS + PWA
- **バックエンド:** Next.js Route Handlers
- **DB・認証:** Supabase (Auth + PostgreSQL + RLS)
- **AI:** GPT-4o mini / Gemini 2.0 Flash（プラグイン方式で切替可能）
- **外部API:** Google Calendar API
- **状態管理:** Zustand
- **バリデーション:** Zod
- **デプロイ:** Vercel (東京リージョン)

## セットアップ

```bash
# 依存パッケージインストール
npm install

# 環境変数設定
cp .env.local.example .env.local
# → .env.local を編集して各サービスの認証情報を設定

# 開発サーバー起動
npm run dev
```

## ドキュメント

- [実装計画書](docs/implementation_plan.md)
- [ウォークスルー](docs/walkthrough.md)
- [タスク管理](docs/task.md)

## ディレクトリ構成

```
├── prompts/     AIプロンプトテンプレート（日付プレフィックス付き）
├── src/
│   ├── app/     Next.js App Router（ページ + API）
│   ├── components/  UIコンポーネント
│   ├── lib/     コアライブラリ（Supabase, AI, Calendar）
│   ├── stores/  Zustand状態管理
│   └── types/   型定義
├── supabase/    マイグレーション + シードデータ
└── docs/        プロジェクトドキュメント
```
