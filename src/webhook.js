import { config } from './config.js';
import { insertMessage } from './db.js';
import { logInfo, logWarn } from './logger.js';
import { verifyChatworkSignature } from './signature.js';
import { normalizeChatworkBody } from './chatworkSanitizer.js';

function shouldStoreEvent(eventType, roomId) {
  if (!config.includeEventTypes.includes(eventType)) {
    return false;
  }

  if (config.includeRoomIds.length > 0) {
    return config.includeRoomIds.includes(roomId);
  }

  if (config.excludeRoomIds.length > 0) {
    return !config.excludeRoomIds.includes(roomId);
  }

  return true;
}

export function handleWebhook(req, res) {
  const signature = req.header('x-chatworkwebhooksignature');

  if (!verifyChatworkSignature(req.rawBody, signature)) {
    logWarn('Invalid webhook signature');
    return res.status(401).send('invalid signature');
  }

  const { webhook_event_type: eventType, webhook_event: event } = req.body || {};

  if (!eventType || !event) {
    return res.status(400).send('bad request');
  }

  const roomId = Number(event.room_id);

  if (!shouldStoreEvent(eventType, roomId)) {
    return res.status(200).send('ignored');
  }

  insertMessage({
    webhookEventType: eventType,
    roomId,
    messageId: String(event.message_id),
    body: normalizeChatworkBody(event.body || ''),
    sendTime: Number(event.send_time || Math.floor(Date.now() / 1000)),
    updateTime: Number(event.update_time || 0),
  });

  logInfo('Stored webhook event', {
    eventType,
    roomId,
    messageId: event.message_id,
  });

  return res.status(200).send('ok');
}
