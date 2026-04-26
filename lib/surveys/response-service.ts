import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { surveyResponses } from "@/lib/db/schema";
import { ApiError } from "@/lib/http/api-error";
import { sanitizePlainText } from "@/lib/security/sanitize";
import { getSurveyById } from "@/lib/surveys/service";
import type { SurveyAnswerValue } from "@/lib/surveys/types";
import {
  submitResponsePayloadSchema,
  validateAnswersAgainstSurvey,
} from "@/lib/surveys/validators";

function sanitizeAnswerValue(value: SurveyAnswerValue): SurveyAnswerValue {
  if (typeof value === "string") {
    return sanitizePlainText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizePlainText(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizePlainText(item)]),
    );
  }

  return value;
}

export async function submitSurveyResponse({
  surveyId,
  payload,
  preview,
  isAdminPreview,
}: {
  surveyId: number;
  payload: unknown;
  preview: boolean;
  isAdminPreview: boolean;
}) {
  const parsed = submitResponsePayloadSchema.parse(payload);
  const survey = await getSurveyById(surveyId);

  if (!survey) {
    throw new ApiError(404, "问卷不存在");
  }

  if (preview) {
    if (!isAdminPreview) {
      throw new ApiError(401, "预览提交仅管理员可用");
    }
  } else if (survey.status !== "published") {
    throw new ApiError(409, "问卷尚未发布");
  }

  if (survey.expiresAt && Math.floor(Date.now() / 1000) > survey.expiresAt) {
    throw new ApiError(403, "问卷已过期");
  }

  validateAnswersAgainstSurvey(survey, parsed.answers);

  const answers = Object.fromEntries(
    Object.entries(parsed.answers).map(([key, value]) => [
      key,
      sanitizeAnswerValue(value),
    ]),
  );

  if (!preview) {
    const duplicate = db
      .select()
      .from(surveyResponses)
      .where(
        and(
          eq(surveyResponses.surveyId, surveyId),
          eq(surveyResponses.respondentId, parsed.respondent_id),
        ),
      )
      .get();

    if (duplicate) {
      throw new ApiError(409, "请勿重复提交问卷");
    }

    db.insert(surveyResponses)
      .values({
        surveyId,
        answers: JSON.stringify(answers),
        respondentId: parsed.respondent_id,
        durationSeconds: parsed.duration_seconds ?? null,
      })
      .run();
  }

  return {
    preview,
    surveyId,
  };
}
