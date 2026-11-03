# ヤマテツつぶやき

X 風のシンプルなつぶやきアプリ。フロントは静的 HTML/JS、バックエンドは Supabase（Auth + Postgres）。

## ローカルで動かす

1. `config.example.js` を `config.js` にコピーして Supabase の URL と publishable key を入れる
2. `index.html` をブラウザで開く（または `python -m http.server`）

`config.js` は `.gitignore` 済みでリポジトリには含まれません。

## デプロイ

`main` に push すると GitHub Actions が Pages にデプロイします。
接続情報はリポジトリの Secrets（`SUPABASE_URL` / `SUPABASE_KEY`）からビルド時に `config.js` を生成します。

## DB

`posts` テーブル（RLS 有効）：ログインユーザーは全投稿を閲覧でき、自分の投稿だけ作成・編集（本文のみ）・削除できます。未ログインユーザーはアクセス不可。
フロントエンドには Publishable Key のみを使用し、Secret Key / service_role キーは使いません。
