import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { surveys } from "@/lib/db/schema";
import { ApiError } from "@/lib/http/api-error";
import {
  findSurveyById,
  insertSurvey,
  listSurveySummaries,
  removeSurvey,
  replaceSurvey,
} from "@/lib/surveys/repository";
import type { SurveyInput, SurveyStatus } from "@/lib/surveys/types";
import { surveyInputSchema } from "@/lib/surveys/validators";

export async function createSurvey(input: SurveyInput) {
  const parsed = surveyInputSchema.parse(input);
  const id = await insertSurvey(parsed);

  return (await findSurveyById(id))!;
}

export async function updateSurvey(id: number, input: SurveyInput) {
  const parsed = surveyInputSchema.parse(input);
  const existing = await findSurveyById(id);

  if (!existing) {
    throw new ApiError(404, "问卷不存在");
  }

  await replaceSurvey(id, parsed);
  return (await findSurveyById(id))!;
}

export async function getSurveyById(id: number) {
  return findSurveyById(id);
}

export async function listSurveys() {
  return listSurveySummaries();
}

export async function deleteSurvey(id: number) {
  const existing = await findSurveyById(id);

  if (!existing) {
    throw new ApiError(404, "问卷不存在");
  }

  await removeSurvey(id);
}

export async function setSurveyStatus(id: number, status: SurveyStatus) {
  const existing = await findSurveyById(id);

  if (!existing) {
    throw new ApiError(404, "问卷不存在");
  }

  db.update(surveys)
    .set({
      status,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(surveys.id, id))
    .run();

  return (await findSurveyById(id))!;
}
