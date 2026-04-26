import crypto from "node:crypto";

export function generateEvaluationToken() {
  return crypto.randomBytes(24).toString("base64url").slice(0, 32);
}
