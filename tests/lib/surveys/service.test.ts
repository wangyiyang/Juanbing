import { beforeEach, describe, expect, it } from "vitest";

import { resetDatabase } from "@/tests/helpers/reset-db";
import {
  createSurvey,
  deleteSurvey,
  getSurveyById,
  listSurveys,
  updateSurvey,
} from "@/lib/surveys/service";

beforeEach(() => {
  resetDatabase();
});

describe("survey service", () => {
  it("creates and lists surveys", async () => {
    const created = await createSurvey({
      title: "员工满意度",
      description: "季度回访",
      questions: [
        {
          type: "text",
          title: "你的建议",
          required: true,
          orderIndex: 0,
          options: [],
          config: null,
        },
      ],
    });

    const list = await listSurveys();

    expect(created.id).toBeGreaterThan(0);
    expect(list[0]?.title).toBe("员工满意度");
  });

  it("updates a survey and keeps question order", async () => {
    const created = await createSurvey({
      title: "原始标题",
      questions: [
        {
          type: "text",
          title: "Q1",
          required: true,
          orderIndex: 0,
          options: [],
          config: null,
        },
      ],
    });

    await updateSurvey(created.id, {
      title: "更新后标题",
      questions: [
        {
          type: "rating",
          title: "打分",
          required: true,
          orderIndex: 0,
          options: [],
          config: { maxRating: 5 },
        },
      ],
    });

    const detail = await getSurveyById(created.id);
    expect(detail?.title).toBe("更新后标题");
    expect(detail?.questions[0]?.type).toBe("rating");
  });

  it("deletes a survey cascade", async () => {
    const created = await createSurvey({
      title: "待删除",
      questions: [
        {
          type: "text",
          title: "Q1",
          required: false,
          orderIndex: 0,
          options: [],
          config: null,
        },
      ],
    });

    await deleteSurvey(created.id);

    await expect(getSurveyById(created.id)).resolves.toBeNull();
  });
});
