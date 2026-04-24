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

export function buildSurveyOverview(
  responses: Array<{
    createdAt: number;
    durationSeconds: number | null;
    answers: Record<string, unknown>;
  }>,
) {
  const totalResponses = responses.length;
  const averageDurationSeconds =
    totalResponses === 0
      ? 0
      : Math.round(
          responses.reduce(
            (sum, item) => sum + Number(item.durationSeconds ?? 0),
            0,
          ) / totalResponses,
        );

  const trendMap = new Map<string, number>();

  for (const response of responses) {
    const day = new Date(response.createdAt * 1000).toISOString().slice(0, 10);
    trendMap.set(day, (trendMap.get(day) ?? 0) + 1);
  }

  return {
    totalResponses,
    averageDurationSeconds,
    trend: Array.from(trendMap.entries()).map(([date, count]) => ({
      date,
      count,
    })),
  };
}

function formatAnswerValue(value: SurveyAnswerValue | undefined) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return value ?? "";
}

export function toCsvRows(
  questions: Array<{ id: number; title: string }>,
  responses: Array<{
    id: number;
    createdAt: number;
    respondentId: string;
    answers: Record<string, SurveyAnswerValue>;
  }>,
) {
  return responses.map((response) => ({
    response_id: response.id,
    respondent_id: response.respondentId,
    submitted_at: new Date(response.createdAt * 1000).toISOString(),
    ...Object.fromEntries(
      questions.map((question) => [
        question.title,
        formatAnswerValue(response.answers[`question_${question.id}`]),
      ]),
    ),
  }));
}
