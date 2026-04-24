import { beforeEach, describe, expect, it } from "vitest";

import { createSurvey, setSurveyStatus } from "@/lib/surveys/service";
import { submitSurveyResponse } from "@/lib/surveys/response-service";
import { resetDatabase } from "@/tests/helpers/reset-db";

beforeEach(() => {
  resetDatabase();
});

describe("submitSurveyResponse", () => {
  it("accepts preview submission without writing duplicate records", async () => {
    const survey = await createSurvey({
      title: "客户回访",
      questions: [
        {
          type: "text",
          title: "你的名字",
          required: true,
          orderIndex: 0,
          options: [],
          config: null,
        },
      ],
    });
    const questionKey = `question_${survey.questions[0]!.id}`;

    const result = await submitSurveyResponse({
      surveyId: survey.id,
      payload: {
        answers: { [questionKey]: "Alice" },
        respondent_id: "preview-user",
        duration_seconds: 12,
      },
      preview: true,
      isAdminPreview: true,
    });

    expect(result.preview).toBe(true);
  });

  it("rejects duplicate respondent_id on published surveys", async () => {
    const survey = await createSurvey({
      title: "活动报名",
      questions: [
        {
          type: "text",
          title: "姓名",
          required: true,
          orderIndex: 0,
          options: [],
          config: null,
        },
      ],
    });
    const questionKey = `question_${survey.questions[0]!.id}`;

    await setSurveyStatus(survey.id, "published");

    await submitSurveyResponse({
      surveyId: survey.id,
      payload: {
        answers: { [questionKey]: "Alice" },
        respondent_id: "same-device",
      },
      preview: false,
      isAdminPreview: false,
    });

    await expect(
      submitSurveyResponse({
        surveyId: survey.id,
        payload: {
          answers: { [questionKey]: "Bob" },
          respondent_id: "same-device",
        },
        preview: false,
        isAdminPreview: false,
      }),
    ).rejects.toThrow(/重复提交/);
  });
});
