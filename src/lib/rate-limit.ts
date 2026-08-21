/* Simple in-memory sliding-window rate limiter. */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

function prune(bucket: Bucket, windowMs: number, now: number) {
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  prune(bucket, windowMs, now);
  if (bucket.timestamps.length >= limit) {
    const retryAfterSeconds = Math.ceil(
      (windowMs - (now - (bucket.timestamps[0] ?? now))) / 1000
    );
    return { ok: false, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { ok: true, retryAfterSeconds: 0 };
}
