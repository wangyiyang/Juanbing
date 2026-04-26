import { describe, expect, it } from "vitest";

import {
  submitResponsePayloadSchema,
  surveyInputSchema,
  validateAnswersAgainstSurvey,
} from "@/lib/surveys/validators";
import type { SurveyDetail } from "@/lib/surveys/types";

function createSurvey(questions: SurveyDetail["questions"]): SurveyDetail {
  return {
    id: 1,
    title: "测试问卷",
    description: null,
    status: "published",
    expiresAt: null,
    createdAt: 0,
    updatedAt: 0,
    questions,
  };
}

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

describe("validateAnswersAgainstSurvey", () => {
  it("accepts valid dropdown answer", () => {
    const survey = createSurvey([
      {
        id: 1,
        type: "dropdown",
        title: "城市",
        required: true,
        orderIndex: 0,
        config: null,
        options: [{ id: 1, label: "北京", value: "beijing", orderIndex: 0 }],
      },
    ]);

    expect(() =>
      validateAnswersAgainstSurvey(survey, { question_1: "beijing" }),
    ).not.toThrow();
  });

  it("rejects invalid dropdown answer", () => {
    const survey = createSurvey([
      {
        id: 1,
        type: "dropdown",
        title: "城市",
        required: true,
        orderIndex: 0,
        config: null,
        options: [{ id: 1, label: "北京", value: "beijing", orderIndex: 0 }],
      },
    ]);

    expect(() =>
      validateAnswersAgainstSurvey(survey, { question_1: "shanghai" }),
    ).toThrow("选择题答案格式错误");
  });

  it("accepts valid date answer", () => {
    const survey = createSurvey([
      {
        id: 1,
        type: "date",
        title: "日期",
        required: true,
        orderIndex: 0,
        config: null,
        options: [],
      },
    ]);

    expect(() =>
      validateAnswersAgainstSurvey(survey, { question_1: "2026-05-01" }),
    ).not.toThrow();
  });

  it("rejects non-string date answer", () => {
    const survey = createSurvey([
      {
        id: 1,
        type: "date",
        title: "日期",
        required: true,
        orderIndex: 0,
        config: null,
        options: [],
      },
    ]);

    expect(() =>
      validateAnswersAgainstSurvey(survey, { question_1: 123 as unknown as string }),
    ).toThrow("文本题答案格式错误");
  });
});
