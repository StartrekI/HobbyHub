// Lightweight request deduplication + caching layer
// Prevents duplicate in-flight requests and caches responses for a short TTL

const cache = new Map<string, { data: unknown; timestamp: number }>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL = 3000; // 3 second cache

export async function cachedFetch<T>(
  url: string,
  options?: RequestInit & { ttl?: number }
): Promise<T> {
  const key = `${options?.method || "GET"}:${url}`;
  const ttl = options?.ttl ?? DEFAULT_TTL;

  // Return cached data if fresh
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T;
  }

  // Deduplicate in-flight requests
  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = (async () => {
    try {
      const res = await fetch(url, options);
      const data = await res.json();
      cache.set(key, { data, timestamp: Date.now() });
      return data as T;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

// Fire-and-forget POST with throttling
const lastPost = new Map<string, number>();

export function throttledPost(
  url: string,
  body: unknown,
  minInterval = 10000
): void {
  const now = Date.now();
  const last = lastPost.get(url) || 0;
  if (now - last < minInterval) return;

  lastPost.set(url, now);
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}

// Clear stale cache entries periodically
if (typeof window !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of cache) {
      if (now - val.timestamp > 30000) cache.delete(key);
    }
  }, 30000);
}
