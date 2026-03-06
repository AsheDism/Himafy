# プロジェクト指示書 (Project Rules)

このプロジェクトにおける開発ルールおよび指示事項をここに記載します。

## プロジェクト概要
- **プロジェクト名:** Himafy（ヒマフィ）
- **コンセプト:** 「暇な時間を、あなたらしい時間へ。」— AIがユーザーの空き時間に最適な予定を提案するスケジュールアプリ
- **技術スタック:** Next.js (App Router) + TypeScript + Tailwind CSS + Supabase + GPT-4o mini / Gemini 2.0 Flash

## 開発方針
- 全てのタイムスタンプは `JST (Asia/Tokyo)` を基準にしてください。
- UIは日本語、変数名・コメントは英語で記述してください。
- モバイルファーストで設計してください（PWA前提）。
- 個人開発のため、できるだけシンプルな構成を維持してください。

## コミット・ドキュメント
- `README.md` を最新の状態に保ってください。
- 重要な変更がある場合は、必ず `docs/task.md` や `docs/implementation_plan.md` を更新してください。
- **`docs/walkthrough.md` と `docs/implementation_plan.md` は必ず日本語で出力してください。**

## プロンプト履歴

開発者がAIコーディングツール（Claude Code / Anti-Gravity）に入力したプロンプトの履歴を `prompts/` に保存しています。

```
prompts/
 └── YYYY-MM-DD/
     ├── AsheDism.md       # AsheDism（Claude Code使用）のプロンプト履歴
     └── <GitHubName>.md   # もう一人の開発者（Anti-Gravity使用）のプロンプト履歴
```

- 日付ごとにディレクトリを作成
- ファイル名は開発者のGitHubアカウント名
- その日に入力したプロンプトを時系列で記録

## AIプロバイダー

AI提案の生成ロジックは `src/lib/ai/` に配置しています。

- `provider.ts` — 共通インターフェース（AiProvider）
- `openai.ts` — GPT-4o mini 実装（プライマリ）
- `gemini.ts` — Gemini 2.0 Flash 実装（フォールバック）
- `factory.ts` — プロバイダー選択 + 自動フォールバック

プロンプトテンプレートは各プロバイダーファイル内に直接記述しています。

## コーディング規約
- コンポーネントは関数コンポーネント + TypeScriptで記述
- 状態管理は Zustand を使用
- バリデーションは Zod を使用
- APIレスポンスは統一フォーマット `{ data, error }` で返す
- Supabase RLSを全テーブルで有効化し、`auth.uid()` ベースでアクセス制御
