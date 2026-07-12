/**
 * Simple in-memory rate limiter.
 *
 * NOTE: This is per-instance (resets on server restart, not shared across
 * serverless replicas). Sufficient for a single-server deployment; for
 * multi-instance setups, swap the Map for Redis or another shared store.
 */
const requests = new Map<string, { count: number; resetTime: number }>();

// Sweep expired entries when the Map gets large
function sweepExpired() {
  if (requests.size < 1000) return
  const now = Date.now()
  for (const [k, v] of requests) {
    if (now > v.resetTime) requests.delete(k)
  }
}

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  sweepExpired()
  const now = Date.now();
  const entry = requests.get(key);

  if (!entry || now > entry.resetTime) {
    requests.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}
