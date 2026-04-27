import type { EvaluationRelationship } from "./types";

export type TemplateStatus = "active" | "archived";

export type RelationshipRule = {
  type: EvaluationRelationship;
  count: number;
  required: boolean;
};

export type TimeRule = {
  type: "relative";
  durationDays: number;
};

export type EvaluationTemplateInput = {
  name: string;
  description?: string | null;
  surveyId: number;
  anonymityThreshold: number;
  relationshipRules: RelationshipRule[];
  timeRule: TimeRule;
};

export type EvaluationTemplate = {
  id: number;
  name: string;
  description: string | null;
  surveyId: number;
  anonymityThreshold: number;
  relationshipRules: RelationshipRule[];
  timeRule: TimeRule;
  isBuiltin: boolean;
  createdBy: number | null;
  status: TemplateStatus;
  createdAt: number;
  updatedAt: number;
};
