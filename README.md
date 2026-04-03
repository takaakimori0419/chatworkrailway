# Chatwork → OpenAI 3時間サマリー（最新レポート閲覧版）

Chatwork の Webhook を受け取り、SQLite に保存し、3時間ごとに OpenAI API で要約して `reports` テーブルに保存する構成です。

以前の「Chatwork に要約を返す」版ではなく、**Railway 上の URL で最新レポートを見る** 方式に変更しています。

## できること

- `webhook-api` サービス
  - Chatwork Webhook を受信
  - 署名検証
  - SQLite へ保存
  - すぐに 200 を返す
  - 最新レポートをブラウザ / JSON で表示する
- `summary-job` サービス
  - 3時間ごとに起動
  - 未処理メッセージを取得
  - OpenAI API で要約
  - `reports` テーブルに保存
  - 処理済みに更新

## Railway 推奨設定

### サービス

1. `webhook-api`
   - Start Command: `npm start`
2. `summary-job`
   - Start Command: `npm run summary`
   - Cron Schedule: `0 */3 * * *`

### Volume

- Mount Path: `/data`
- `.env` の `SQLITE_PATH=/data/app.db`

## 環境変数

`.env.example` をコピーして `.env` を作成してください。

```bash
cp .env.example .env
```

最低限必要:

- `OPENAI_API_KEY`
- `CHATWORK_WEBHOOK_TOKEN_BASE64`
- `SQLITE_PATH`

任意:

- `LATEST_REPORT_TOKEN`
  - 入れると `/latest-report` と `/api/latest-report` に簡易認証をかけられます。
  - アクセス時は `?token=あなたの値` を付けるか、`Authorization: Bearer あなたの値` を使います。

## ローカル実行

```bash
npm install
cp .env.example .env
npm start
```

別ターミナルでサマリーを手動実行:

```bash
npm run summary
```

## Chatwork Webhook URL

```text
https://<your-domain>/chatwork/webhook
```

## レポート確認 URL

### ブラウザ表示

```text
https://<your-domain>/latest-report
```

### JSON API

```text
https://<your-domain>/api/latest-report
```

直近複数件を見る:

```text
https://<your-domain>/api/reports?limit=10
```

## ルーム絞り込み

### 特定ルームだけ対象にする

```env
INCLUDE_ROOM_IDS=111111,222222,333333
```

### 特定ルームを除外する

```env
EXCLUDE_ROOM_IDS=444444,555555
```

両方入っている場合は `INCLUDE_ROOM_IDS` を優先します。

## 注意点

- Webhook では重い処理をしないでください。
- SQLite は必ず Volume 上に置いてください。
- `summary-job` と `webhook-api` の両方で同じ `SQLITE_PATH` を使ってください。
- `LATEST_REPORT_TOKEN` を設定しない場合、最新レポート URL は誰でも見られます。公開運用なら設定を推奨します。
