import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

fs.mkdirSync(path.dirname(config.sqlitePath), { recursive: true });

export const db = new Database(config.sqlitePath);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_event_type TEXT NOT NULL,
  room_id INTEGER NOT NULL,
  message_id TEXT NOT NULL,
  body TEXT NOT NULL,
  send_time INTEGER NOT NULL,
  update_time INTEGER NOT NULL DEFAULT 0,
  received_at INTEGER NOT NULL,
  processed INTEGER NOT NULL DEFAULT 0,
  report_id INTEGER,
  UNIQUE(message_id, webhook_event_type)
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  summary TEXT NOT NULL,
  message_count INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_processed_send_time
ON messages (processed, send_time);
`);

export function insertMessage({
  webhookEventType,
  roomId,
  messageId,
  body,
  sendTime,
  updateTime,
}) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO messages (
      webhook_event_type,
      room_id,
      message_id,
      body,
      send_time,
      update_time,
      received_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    webhookEventType,
    roomId,
    messageId,
    body,
    sendTime,
    updateTime || 0,
    Math.floor(Date.now() / 1000)
  );
}

export function getPendingMessages(startTs, endTs, limit) {
  return db.prepare(`
    SELECT *
    FROM messages
    WHERE processed = 0
      AND send_time >= ?
      AND send_time < ?
    ORDER BY send_time ASC
    LIMIT ?
  `).all(startTs, endTs, limit);
}

export function saveReport(periodStart, periodEnd, summary, messageCount) {
  const result = db.prepare(`
    INSERT INTO reports (period_start, period_end, summary, message_count, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    periodStart,
    periodEnd,
    summary,
    messageCount,
    Math.floor(Date.now() / 1000)
  );

  return Number(result.lastInsertRowid);
}

export function getLatestReport() {
  return db.prepare(`
    SELECT *
    FROM reports
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  `).get();
}

export function getRecentReports(limit = 10) {
  return db.prepare(`
    SELECT *
    FROM reports
    ORDER BY created_at DESC, id DESC
    LIMIT ?
  `).all(limit);
}

export function markProcessed(ids, reportId) {
  if (!ids.length) return;

  const stmt = db.prepare(`
    UPDATE messages
    SET processed = 1,
        report_id = ?
    WHERE id = ?
  `);

  const tx = db.transaction((messageIds) => {
    for (const id of messageIds) {
      stmt.run(reportId, id);
    }
  });

  tx(ids);
}
