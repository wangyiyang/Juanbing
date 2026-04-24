export function createRateLimiter({
  windowMs,
  max,
}: {
  windowMs: number;
  max: number;
}) {
  const store = new Map<string, number[]>();

  return {
    consume(key: string) {
      const now = Date.now();
      const history = (store.get(key) ?? []).filter(
        (timestamp) => now - timestamp < windowMs,
      );

      if (history.length >= max) {
        store.set(key, history);
        return false;
      }

      history.push(now);
      store.set(key, history);
      return true;
    },
  };
}

export const publicSubmissionLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 10,
});
