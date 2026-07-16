import "server-only";

/**
 * Simple in-memory fixed-window rate limiter for the AI endpoint.
 *
 * Suitable for a single-region MVP deployment; swap for a shared store
 * (e.g. Upstash/Redis or Postgres) when running multiple serverless regions.
 */

interface Window {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60 * 60 * 1000;
const windows = new Map<string, Window>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, limit: number): RateLimitResult {
  const now = Date.now();
  let w = windows.get(key);
  if (!w || w.resetAt <= now) {
    w = { count: 0, resetAt: now + WINDOW_MS };
    windows.set(key, w);
  }
  if (windows.size > 10_000) {
    // Prevent unbounded growth under many unique keys.
    for (const [k, v] of windows) {
      if (v.resetAt <= now) windows.delete(k);
    }
  }
  if (w.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: w.resetAt };
  }
  w.count += 1;
  return { allowed: true, remaining: limit - w.count, resetAt: w.resetAt };
}
