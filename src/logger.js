export function logInfo(message, meta = undefined) {
  if (meta) {
    console.log(`[INFO] ${message}`, meta);
    return;
  }
  console.log(`[INFO] ${message}`);
}

export function logWarn(message, meta = undefined) {
  if (meta) {
    console.warn(`[WARN] ${message}`, meta);
    return;
  }
  console.warn(`[WARN] ${message}`);
}

export function logError(message, meta = undefined) {
  if (meta) {
    console.error(`[ERROR] ${message}`, meta);
    return;
  }
  console.error(`[ERROR] ${message}`);
}
