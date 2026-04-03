import 'dotenv/config';
import { config, validateSummaryConfig } from '../src/config.js';
import { getPendingMessages, markProcessed, saveReport } from '../src/db.js';
import { logError, logInfo } from '../src/logger.js';
import { summarizeMessages } from '../src/summarize.js';

const missing = validateSummaryConfig();
if (missing.length > 0) {
  logError(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const nowTs = Math.floor(Date.now() / 1000);
const lookbackSeconds = config.summaryLookbackHours * 60 * 60;
const startTs = nowTs - lookbackSeconds;
const endTs = nowTs;

try {
  const messages = getPendingMessages(startTs, endTs, config.maxMessagesPerSummary);

  if (messages.length === 0) {
    logInfo('No pending messages to summarize.');
    process.exit(0);
  }

  logInfo(`Summarizing ${messages.length} messages.`);

  const summary = await summarizeMessages(messages, startTs, endTs);
  const reportId = saveReport(startTs, endTs, summary, messages.length);

  markProcessed(
    messages.map((m) => m.id),
    reportId
  );

  logInfo(`Summary saved successfully. reportId=${reportId}`);
  process.exit(0);
} catch (error) {
  logError('Summary job failed', error);
  process.exit(1);
}
