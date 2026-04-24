import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { surveyResponses } from "@/lib/db/schema";
import type { SurveyAnswerValue } from "@/lib/surveys/types";

export async function listSurveyResponses(surveyId: number) {
  return db
    .select()
    .from(surveyResponses)
    .where(eq(surveyResponses.surveyId, surveyId))
    .orderBy(asc(surveyResponses.createdAt))
    .all()
    .map((response) => ({
      id: response.id,
      respondentId: response.respondentId,
      createdAt: response.createdAt,
      durationSeconds: response.durationSeconds,
      answers: JSON.parse(response.answers) as Record<string, SurveyAnswerValue>,
    }));
}
