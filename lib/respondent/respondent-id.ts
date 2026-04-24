const STORAGE_KEY = "juanbing.respondent_id";

export function getRespondentId() {
  const existing = window.localStorage.getItem(STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const next = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, next);
  return next;
}
