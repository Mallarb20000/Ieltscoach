// Sliding-window limiter, in-memory per server instance. On serverless this
// means the cap is per warm instance, which is acceptable as an abuse guard:
// the LLM provider's own rate limits are the hard backstop.

const windows = new Map<string, number[]>();
const MAX_KEYS = 10_000;

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (windows.size > MAX_KEYS) {
    for (const [k, hits] of windows) {
      if (hits.length === 0 || hits[hits.length - 1] < cutoff) windows.delete(k);
    }
  }

  const hits = (windows.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    windows.set(key, hits);
    const retryAfterSeconds = Math.ceil((hits[0] + windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }

  hits.push(now);
  windows.set(key, hits);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}
