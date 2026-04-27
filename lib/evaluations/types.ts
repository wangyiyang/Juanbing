export type EvaluationCycleStatus = "draft" | "active" | "closed";
export type EvaluationSubjectStatus = "active" | "removed";
export type EvaluationRelationship =
  | "self"
  | "manager"
  | "peer"
  | "direct_report"
  | "other";
export type EvaluationAssignmentStatus = "pending" | "submitted" | "expired";

export type EvaluationCycleInput = {
  title: string;
  description?: string | null;
  surveyId: number;
  startsAt?: number | null;
  endsAt?: number | null;
  anonymityThreshold?: number;
  templateId?: number | null;
};

export type EvaluationAssignmentInput = {
  subjectId: number;
  raterEmployeeId: number | null;
  relationship: EvaluationRelationship;
};
