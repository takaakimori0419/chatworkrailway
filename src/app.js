import 'dotenv/config';
import express from 'express';
import { config, validateBaseConfig } from './config.js';
import { getLatestReport, getRecentReports } from './db.js';
import { logError, logInfo } from './logger.js';
import { handleWebhook } from './webhook.js';

const missing = validateBaseConfig();
if (missing.length > 0) {
  logError(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const app = express();

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

function isAuthorized(req) {
  if (!config.latestReportToken) return true;
  const authHeader = req.header('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const queryToken = String(req.query.token || '');
  return bearer === config.latestReportToken || queryToken === config.latestReportToken;
}

function requireLatestReportAuth(req, res, next) {
  if (isAuthorized(req)) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post('/chatwork/webhook', handleWebhook);

app.get('/latest-report', requireLatestReportAuth, (_req, res) => {
  const report = getLatestReport();

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!report) {
    return res.status(200).send(`<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>最新レポート</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 40px auto; max-width: 900px; padding: 0 16px; line-height: 1.7; }
      .box { border: 1px solid #ddd; border-radius: 12px; padding: 20px; }
      .muted { color: #666; }
    </style>
  </head>
  <body>
    <h1>最新レポート</h1>
    <div class="box">
      <p class="muted">まだレポートは作成されていません。</p>
    </div>
  </body>
</html>`);
  }

  const createdAt = new Date(report.created_at * 1000).toLocaleString('ja-JP');
  const periodStart = new Date(report.period_start * 1000).toLocaleString('ja-JP');
  const periodEnd = new Date(report.period_end * 1000).toLocaleString('ja-JP');
  const escapedSummary = report.summary
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return res.status(200).send(`<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>最新レポート</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 40px auto; max-width: 900px; padding: 0 16px; line-height: 1.7; }
      .box { border: 1px solid #ddd; border-radius: 12px; padding: 20px; }
      .meta { color: #666; margin-bottom: 16px; }
      pre { white-space: pre-wrap; word-break: break-word; margin: 0; font-family: inherit; }
    </style>
  </head>
  <body>
    <h1>最新レポート</h1>
    <div class="box">
      <div class="meta">
        <div>作成日時: ${createdAt}</div>
        <div>対象期間: ${periodStart} - ${periodEnd}</div>
        <div>対象メッセージ数: ${report.message_count}</div>
      </div>
      <pre>${escapedSummary}</pre>
    </div>
  </body>
</html>`);
});

app.get('/api/latest-report', requireLatestReportAuth, (_req, res) => {
  const report = getLatestReport();
  if (!report) {
    return res.status(404).json({ error: 'no_report' });
  }

  return res.json({
    id: report.id,
    periodStart: report.period_start,
    periodEnd: report.period_end,
    messageCount: report.message_count,
    createdAt: report.created_at,
    summary: report.summary,
  });
});

app.get('/api/reports', requireLatestReportAuth, (req, res) => {
  const limit = Math.min(Number(req.query.limit || 10), 50);
  return res.json({ reports: getRecentReports(limit) });
});

app.use((err, _req, res, _next) => {
  logError('Unhandled express error', err);
  res.status(500).send('internal error');
});

app.listen(config.port, () => {
  logInfo(`Webhook API listening on port ${config.port}`);
});
