const STORAGE_KEY = "juanbing.respondent_id";

export function getRespondentId() {
  const existing = window.localStorage.getItem(STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const next =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
  window.localStorage.setItem(STORAGE_KEY, next);
  return next;
}
