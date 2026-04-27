import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { evaluationTemplates } from "@/lib/db/schema";

export async function insertEvaluationTemplate(data: {
  name: string;
  description: string | null;
  surveyId: number;
  anonymityThreshold: number;
  relationshipRules: string;
  timeRule: string;
  isBuiltin: boolean;
  createdBy: number | null;
}): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const result = db
    .insert(evaluationTemplates)
    .values({
      name: data.name,
      description: data.description,
      surveyId: data.surveyId,
      anonymityThreshold: data.anonymityThreshold,
      relationshipRules: data.relationshipRules,
      timeRule: data.timeRule,
      isBuiltin: data.isBuiltin,
      createdBy: data.createdBy,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return Number(result.lastInsertRowid);
}

export async function findEvaluationTemplateById(id: number) {
  return db
    .select()
    .from(evaluationTemplates)
    .where(eq(evaluationTemplates.id, id))
    .get();
}

export async function listEvaluationTemplates(filters?: { builtin?: boolean }) {
  const conditions = [eq(evaluationTemplates.status, "active")];
  if (filters?.builtin !== undefined) {
    conditions.push(eq(evaluationTemplates.isBuiltin, filters.builtin));
  }

  return db
    .select()
    .from(evaluationTemplates)
    .where(and(...conditions))
    .orderBy(evaluationTemplates.isBuiltin, evaluationTemplates.updatedAt)
    .all();
}

export async function updateEvaluationTemplate(
  id: number,
  data: {
    name: string;
    description: string | null;
    surveyId: number;
    anonymityThreshold: number;
    relationshipRules: string;
    timeRule: string;
  }
) {
  const now = Math.floor(Date.now() / 1000);
  db.update(evaluationTemplates)
    .set({
      name: data.name,
      description: data.description,
      surveyId: data.surveyId,
      anonymityThreshold: data.anonymityThreshold,
      relationshipRules: data.relationshipRules,
      timeRule: data.timeRule,
      updatedAt: now,
    })
    .where(eq(evaluationTemplates.id, id))
    .run();
}

export async function archiveEvaluationTemplate(id: number) {
  const now = Math.floor(Date.now() / 1000);
  db.update(evaluationTemplates)
    .set({ status: "archived", updatedAt: now })
    .where(eq(evaluationTemplates.id, id))
    .run();
}
