import { error } from "./response";

const store = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store) {
    if (now > value.resetAt) {
      store.delete(key);
    }
  }
}, 60_000);

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;

export function rateLimit(request: Request): Response | null {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return error("Too many requests", 429);
  }

  return null;
}
