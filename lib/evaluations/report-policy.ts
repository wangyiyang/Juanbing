import type { EvaluationRelationship } from "@/lib/evaluations/types";

export function canShowRelationshipGroup(
  relationship: EvaluationRelationship,
  count: number,
  threshold: number,
) {
  if (relationship === "self" || relationship === "manager") {
    return count > 0;
  }
  return count >= threshold;
}
