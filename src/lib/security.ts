/**
 * RestivAdisyon Security & Anti-Flood / Anti-Bot Utility
 * Provides client-side rate limiting, payload deduplication, input sanitization, and token validation.
 */

interface RateLimitRecord {
  lastActionTime: number;
  attemptCount: number;
}

const memoryRateLimitMap = new Map<string, RateLimitRecord>();
const payloadHashMap = new Map<string, { hash: string; timestamp: number }>();

/**
 * Check if an action is currently throttled by rate limiting.
 * @param actionKey Unique identifier for the action (e.g., `order_create_${tableNo}`)
 * @param cooldownMs Cooldown period in milliseconds
 * @returns { allowed: boolean, remainingSec: number }
 */
export function checkRateLimit(
  actionKey: string,
  cooldownMs: number = 20000
): { allowed: boolean; remainingSec: number } {
  const now = Date.now();

  // Check in-memory store
  const record = memoryRateLimitMap.get(actionKey);

  // Also check sessionStorage to persist across simple in-page re-renders
  let sessionLastTime = 0;
  try {
    const raw = sessionStorage.getItem(`restiva_rl_${actionKey}`);
    if (raw) sessionLastTime = parseInt(raw, 10) || 0;
  } catch {}

  const lastTime = Math.max(record?.lastActionTime || 0, sessionLastTime);

  if (lastTime > 0 && now - lastTime < cooldownMs) {
    const remainingMs = cooldownMs - (now - lastTime);
    const remainingSec = Math.ceil(remainingMs / 1000);
    return { allowed: false, remainingSec };
  }

  return { allowed: true, remainingSec: 0 };
}

/**
 * Record successful execution of a rate-limited action.
 */
export function recordAction(actionKey: string): void {
  const now = Date.now();
  const existing = memoryRateLimitMap.get(actionKey) || { lastActionTime: 0, attemptCount: 0 };
  memoryRateLimitMap.set(actionKey, {
    lastActionTime: now,
    attemptCount: existing.attemptCount + 1,
  });

  try {
    sessionStorage.setItem(`restiva_rl_${actionKey}`, now.toString());
  } catch {}
}

/**
 * Sanitize text input to prevent XSS, script injection, and payload bloat.
 */
export function sanitizeInput(input?: string | null, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip inline JS protocols
    .replace(/data:/gi, '') // Strip data URLs
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '') // Strip null & unprintable control characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Fast deterministic hash string generation for payload deduplication.
 */
export function hashPayload(payload: unknown): string {
  try {
    const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(36);
  } catch {
    return Math.random().toString(36);
  }
}

/**
 * Detects whether the exact same payload is being submitted repeatedly in a short time window.
 * @param actionKey Unique action name
 * @param payload Payload object or string
 * @param windowMs Time window to consider as duplicate (default: 5000ms)
 */
export function isDuplicatePayload(
  actionKey: string,
  payload: unknown,
  windowMs: number = 5000
): boolean {
  const now = Date.now();
  const currentHash = hashPayload(payload);
  const existing = payloadHashMap.get(actionKey);

  if (existing && existing.hash === currentHash && now - existing.timestamp < windowMs) {
    return true; // Duplicate detected
  }

  // Update with current payload
  payloadHashMap.set(actionKey, { hash: currentHash, timestamp: now });
  return false;
}
