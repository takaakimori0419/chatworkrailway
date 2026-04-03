function parseCsvNumbers(value) {
  if (!value || !value.trim()) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));
}

function parseCsvStrings(value) {
  if (!value || !value.trim()) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT || 3000),
  sqlitePath: process.env.SQLITE_PATH || '/data/app.db',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  openAiModel: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
  chatworkWebhookTokenBase64: process.env.CHATWORK_WEBHOOK_TOKEN_BASE64 || '',
  includeEventTypes: parseCsvStrings(
    process.env.INCLUDE_EVENT_TYPES || 'message_created,mention_to_me,message_updated'
  ),
  includeRoomIds: parseCsvNumbers(process.env.INCLUDE_ROOM_IDS || ''),
  excludeRoomIds: parseCsvNumbers(process.env.EXCLUDE_ROOM_IDS || ''),
  summaryLookbackHours: Number(process.env.SUMMARY_LOOKBACK_HOURS || 3),
  maxMessagesPerSummary: Number(process.env.MAX_MESSAGES_PER_SUMMARY || 500),
  latestReportToken: process.env.LATEST_REPORT_TOKEN || '',
};

export function validateBaseConfig() {
  const missing = [];

  if (!config.sqlitePath) missing.push('SQLITE_PATH');
  if (!config.chatworkWebhookTokenBase64) missing.push('CHATWORK_WEBHOOK_TOKEN_BASE64');

  return missing;
}

export function validateSummaryConfig() {
  const missing = [];

  if (!config.openAiApiKey) missing.push('OPENAI_API_KEY');

  return missing;
}
