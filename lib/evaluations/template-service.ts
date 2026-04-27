import { ApiError } from "@/lib/http/api-error";
import { getSurveyById } from "@/lib/surveys/service";
import {
  archiveEvaluationTemplate as archiveTemplateRepo,
  findEvaluationTemplateById,
  insertEvaluationTemplate,
  listEvaluationTemplates as listTemplatesRepo,
  updateEvaluationTemplate as updateTemplateRepo,
} from "./template-repository";
import type {
  EvaluationTemplate,
  EvaluationTemplateInput,
  RelationshipRule,
  TimeRule,
} from "./template-types";
import { evaluationTemplateInputSchema } from "./template-validators";

function parseTemplateRow(row: {
  relationshipRules: string;
  timeRule: string;
  [key: string]: unknown;
}): Omit<typeof row, "relationshipRules" | "timeRule"> & {
  relationshipRules: RelationshipRule[];
  timeRule: TimeRule;
} {
  const { relationshipRules, timeRule, ...rest } = row;
  return {
    ...rest,
    relationshipRules: JSON.parse(relationshipRules) as RelationshipRule[],
    timeRule: JSON.parse(timeRule) as TimeRule,
  };
}

export async function createEvaluationTemplate(
  input: EvaluationTemplateInput & { isBuiltin?: boolean; createdBy?: number | null }
): Promise<EvaluationTemplate> {
  const parsed = evaluationTemplateInputSchema.parse(input);
  const survey = await getSurveyById(parsed.surveyId);
  if (!survey) {
    throw new ApiError(404, "问卷不存在");
  }

  const id = await insertEvaluationTemplate({
    name: parsed.name,
    description: parsed.description ?? null,
    surveyId: parsed.surveyId,
    anonymityThreshold: parsed.anonymityThreshold,
    relationshipRules: JSON.stringify(parsed.relationshipRules),
    timeRule: JSON.stringify(parsed.timeRule),
    isBuiltin: input.isBuiltin ?? false,
    createdBy: input.createdBy ?? null,
  });

  const row = await findEvaluationTemplateById(id);
  return parseTemplateRow(row!) as EvaluationTemplate;
}

export async function getEvaluationTemplateById(id: number): Promise<EvaluationTemplate | null> {
  const row = await findEvaluationTemplateById(id);
  if (!row) return null;
  return parseTemplateRow(row) as EvaluationTemplate;
}

export async function listEvaluationTemplates(filters?: { builtin?: boolean }): Promise<EvaluationTemplate[]> {
  const rows = await listTemplatesRepo(filters);
  return rows.map((row) => parseTemplateRow(row) as EvaluationTemplate);
}

export async function updateEvaluationTemplate(
  id: number,
  input: EvaluationTemplateInput
): Promise<EvaluationTemplate> {
  const existing = await findEvaluationTemplateById(id);
  if (!existing) {
    throw new ApiError(404, "模板不存在");
  }
  if (existing.isBuiltin) {
    throw new ApiError(403, "系统内置模板不能编辑");
  }

  const parsed = evaluationTemplateInputSchema.parse(input);
  const survey = await getSurveyById(parsed.surveyId);
  if (!survey) {
    throw new ApiError(404, "问卷不存在");
  }

  await updateTemplateRepo(id, {
    name: parsed.name,
    description: parsed.description ?? null,
    surveyId: parsed.surveyId,
    anonymityThreshold: parsed.anonymityThreshold,
    relationshipRules: JSON.stringify(parsed.relationshipRules),
    timeRule: JSON.stringify(parsed.timeRule),
  });

  const row = await findEvaluationTemplateById(id);
  return parseTemplateRow(row!) as EvaluationTemplate;
}

export async function archiveEvaluationTemplate(id: number): Promise<void> {
  const existing = await findEvaluationTemplateById(id);
  if (!existing) {
    throw new ApiError(404, "模板不存在");
  }
  if (existing.isBuiltin) {
    throw new ApiError(403, "系统内置模板不能归档");
  }
  await archiveTemplateRepo(id);
}

export async function cloneEvaluationTemplate(id: number): Promise<EvaluationTemplate> {
  const existing = await getEvaluationTemplateById(id);
  if (!existing) {
    throw new ApiError(404, "模板不存在");
  }

  return createEvaluationTemplate({
    name: `${existing.name} 副本`,
    description: existing.description,
    surveyId: existing.surveyId,
    anonymityThreshold: existing.anonymityThreshold,
    relationshipRules: existing.relationshipRules,
    timeRule: existing.timeRule,
  });
}
