import { describe, expect, it } from "vitest";

import {
  submitResponsePayloadSchema,
  surveyInputSchema,
  validateAnswersAgainstSurvey,
} from "@/lib/surveys/validators";
import type { SurveyDetail } from "@/lib/surveys/types";

describe("survey validators", () => {
  it("accepts a valid survey draft", () => {
    const result = surveyInputSchema.safeParse({
      title: "活动报名",
      description: "周末活动",
      questions: [
        {
          type: "single_choice",
          title: "是否参加",
          required: true,
          orderIndex: 0,
          options: [
            { label: "参加", value: "yes", orderIndex: 0 },
            { label: "不参加", value: "no", orderIndex: 1 },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects rating question without maxRating", () => {
    const result = surveyInputSchema.safeParse({
      title: "NPS",
      questions: [
        {
          type: "rating",
          title: "请打分",
          required: true,
          orderIndex: 0,
          config: {},
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects response payload without respondent_id", () => {
    const result = submitResponsePayloadSchema.safeParse({
      answers: { question_1: "yes" },
    });

    expect(result.success).toBe(false);
  });

  it("flags required answers that are missing", () => {
    const survey = {
      id: 1,
      title: "活动报名",
      description: null,
      status: "published",
      expiresAt: null,
      createdAt: 0,
      updatedAt: 0,
      questions: [
        {
          id: 11,
          type: "text",
          title: "你的姓名",
          required: true,
          orderIndex: 0,
          config: null,
          options: [],
        },
      ],
    } satisfies SurveyDetail;

    expect(() =>
      validateAnswersAgainstSurvey(survey, { question_11: "" }),
    ).toThrow(/你的姓名/);
  });
});
