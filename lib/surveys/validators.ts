import { z } from "zod";

import type {
  SurveyAnswerValue,
  SurveyDetail,
  SurveyQuestionDetail,
} from "@/lib/surveys/types";

const optionSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
  orderIndex: z.number().int().min(0),
});

const baseQuestionSchema = z.object({
  title: z.string().trim().min(1),
  required: z.boolean(),
  orderIndex: z.number().int().min(0),
});

const choiceQuestionSchema = baseQuestionSchema.extend({
  type: z.enum(["single_choice", "multiple_choice", "dropdown"]),
  options: z.array(optionSchema).min(2),
  config: z.null().optional(),
});

const textQuestionSchema = baseQuestionSchema.extend({
  type: z.enum(["text"]),
  config: z.null().optional(),
  options: z.array(optionSchema).optional().default([]),
});

const dateQuestionSchema = baseQuestionSchema.extend({
  type: z.enum(["date"]),
  config: z.null().optional(),
  options: z.array(optionSchema).optional().default([]),
});

const ratingQuestionSchema = baseQuestionSchema.extend({
  type: z.enum(["rating"]),
  options: z.array(optionSchema).optional().default([]),
  config: z.object({
    maxRating: z.number().int().min(3).max(10),
  }),
});

const matrixQuestionSchema = baseQuestionSchema.extend({
  type: z.enum(["matrix"]),
  options: z.array(optionSchema).optional().default([]),
  config: z.object({
    rows: z.array(z.string().trim().min(1)).min(1),
    columns: z.array(z.string().trim().min(1)).min(1),
  }),
});

export const surveyInputSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  expiresAt: z.number().int().nullable().optional(),
  questions: z
    .array(
      z.union([
        choiceQuestionSchema,
        textQuestionSchema,
        dateQuestionSchema,
        ratingQuestionSchema,
        matrixQuestionSchema,
      ]),
    )
    .min(1),
});

export const submitResponsePayloadSchema = z.object({
  answers: z.record(
    z.string(),
    z.union([
      z.string(),
      z.array(z.string()),
      z.number(),
      z.record(z.string(), z.string()),
      z.null(),
    ]),
  ),
  respondent_id: z.string().trim().min(1),
  duration_seconds: z.number().int().min(0).optional(),
});

function isEmptyAnswer(value: SurveyAnswerValue | undefined) {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0)
  );
}

function ensureRequiredAnswer(
  question: SurveyQuestionDetail,
  value: SurveyAnswerValue | undefined,
) {
  if (question.required && isEmptyAnswer(value)) {
    throw new Error(`必填题未作答：${question.title}`);
  }
}

function validateChoiceQuestion(
  question: SurveyQuestionDetail,
  value: SurveyAnswerValue | undefined,
) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  const allowed = new Set((question.options ?? []).map((option) => option.value));

  if (question.type === "multiple_choice") {
    if (!Array.isArray(value)) {
      throw new Error(`多选题答案格式错误：${question.title}`);
    }

    for (const item of value) {
      if (!allowed.has(item)) {
        throw new Error(`多选题包含非法选项：${question.title}`);
      }
    }
    return;
  }

  if (typeof value !== "string" || !allowed.has(value)) {
    throw new Error(`选择题答案格式错误：${question.title}`);
  }
}

function validateRatingQuestion(
  question: SurveyQuestionDetail,
  value: SurveyAnswerValue | undefined,
) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (typeof value !== "number") {
    throw new Error(`评分题答案格式错误：${question.title}`);
  }

  const maxRating = Number(
    (question.config as { maxRating?: number } | null)?.maxRating ?? 5,
  );
  if (value < 1 || value > maxRating) {
    throw new Error(`评分题超出范围：${question.title}`);
  }
}

function validateTextLikeQuestion(
  question: SurveyQuestionDetail,
  value: SurveyAnswerValue | undefined,
) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (typeof value !== "string") {
    throw new Error(`文本题答案格式错误：${question.title}`);
  }
}

function validateMatrixQuestion(
  question: SurveyQuestionDetail,
  value: SurveyAnswerValue | undefined,
) {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`矩阵题答案格式错误：${question.title}`);
  }

  const config = (question.config ?? {}) as {
    rows?: string[];
    columns?: string[];
  };
  const rows = new Set(config.rows ?? []);
  const columns = new Set(config.columns ?? []);

  for (const [row, column] of Object.entries(value)) {
    if (!rows.has(row) || !columns.has(column)) {
      throw new Error(`矩阵题包含非法项：${question.title}`);
    }
  }
}

export function validateAnswersAgainstSurvey(
  survey: SurveyDetail,
  answers: Record<string, SurveyAnswerValue>,
) {
  for (const question of survey.questions) {
    const value = answers[`question_${question.id}`];
    ensureRequiredAnswer(question, value);

    switch (question.type) {
      case "single_choice":
      case "multiple_choice":
      case "dropdown":
        validateChoiceQuestion(question, value);
        break;
      case "rating":
        validateRatingQuestion(question, value);
        break;
      case "text":
      case "date":
        validateTextLikeQuestion(question, value);
        break;
      case "matrix":
        validateMatrixQuestion(question, value);
        break;
      default:
        break;
    }
  }
}
