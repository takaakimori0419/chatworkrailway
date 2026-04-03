export function normalizeChatworkBody(body) {
  if (!body) return '';

  return body
    .replace(/\[info\][\s\S]*?\[\/info\]/gi, ' ')
    .replace(/\[code\][\s\S]*?\[\/code\]/gi, ' ')
    .replace(/\[quote\][\s\S]*?\[\/quote\]/gi, ' ')
    .replace(/\[To:\d+\]/gi, ' ')
    .replace(/\[rp aid=\d+ to=\d+-\d+\]/gi, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
