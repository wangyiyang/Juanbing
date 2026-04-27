import { beforeEach, describe, expect, it } from "vitest";

import {
  archiveEvaluationTemplate,
  cloneEvaluationTemplate,
  createEvaluationTemplate,
  getEvaluationTemplateById,
  listEvaluationTemplates,
  updateEvaluationTemplate,
} from "@/lib/evaluations/template-service";
import { createSurvey } from "@/lib/surveys/service";
import { resetDatabase } from "@/tests/helpers/reset-db";

async function makeSurvey() {
  return createSurvey({
    title: "360 评价表",
    questions: [
      {
        type: "rating",
        title: "沟通协作",
        required: true,
        orderIndex: 0,
        config: { maxRating: 5 },
        options: [],
      },
    ],
  });
}

describe("template service", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("should create a template", async () => {
    const survey = await makeSurvey();
    const template = await createEvaluationTemplate({
      name: "季度 360",
      surveyId: survey.id,
      anonymityThreshold: 3,
      relationshipRules: [{ type: "self", count: 1, required: true }],
      timeRule: { type: "relative", durationDays: 14 },
    });

    expect(template.name).toBe("季度 360");
    expect(template.relationshipRules).toEqual([{ type: "self", count: 1, required: true }]);
    expect(template.isBuiltin).toBe(false);
  });

  it("should get template by id", async () => {
    const survey = await makeSurvey();
    const created = await createEvaluationTemplate({
      name: "季度 360",
      surveyId: survey.id,
      anonymityThreshold: 3,
      relationshipRules: [{ type: "self", count: 1, required: true }],
      timeRule: { type: "relative", durationDays: 14 },
    });

    const found = await getEvaluationTemplateById(created.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe("季度 360");
  });

  it("should list templates", async () => {
    const survey = await makeSurvey();
    await createEvaluationTemplate({
      name: "T1",
      surveyId: survey.id,
      anonymityThreshold: 3,
      relationshipRules: [{ type: "self", count: 1, required: true }],
      timeRule: { type: "relative", durationDays: 14 },
    });

    const list = await listEvaluationTemplates();
    expect(list).toHaveLength(1);
  });

  it("should clone a template", async () => {
    const survey = await makeSurvey();
    const original = await createEvaluationTemplate({
      name: "季度 360",
      surveyId: survey.id,
      anonymityThreshold: 3,
      relationshipRules: [{ type: "self", count: 1, required: true }],
      timeRule: { type: "relative", durationDays: 14 },
    });

    const clone = await cloneEvaluationTemplate(original.id);
    expect(clone.name).toBe("季度 360 副本");
    expect(clone.surveyId).toBe(original.surveyId);
    expect(clone.isBuiltin).toBe(false);
  });

  it("should reject updating a builtin template", async () => {
    const survey = await makeSurvey();
    const template = await createEvaluationTemplate({
      name: "系统模板",
      surveyId: survey.id,
      anonymityThreshold: 3,
      relationshipRules: [{ type: "self", count: 1, required: true }],
      timeRule: { type: "relative", durationDays: 14 },
      isBuiltin: true,
    });

    await expect(
      updateEvaluationTemplate(template.id, {
        name: "改名",
        surveyId: survey.id,
        anonymityThreshold: 3,
        relationshipRules: [{ type: "self", count: 1, required: true }],
        timeRule: { type: "relative", durationDays: 14 },
      })
    ).rejects.toThrow("系统内置模板不能编辑");
  });

  it("should archive a custom template", async () => {
    const survey = await makeSurvey();
    const template = await createEvaluationTemplate({
      name: "季度 360",
      surveyId: survey.id,
      anonymityThreshold: 3,
      relationshipRules: [{ type: "self", count: 1, required: true }],
      timeRule: { type: "relative", durationDays: 14 },
    });

    await archiveEvaluationTemplate(template.id);
    const found = await getEvaluationTemplateById(template.id);
    expect(found!.status).toBe("archived");
  });

  it("should reject archiving a builtin template", async () => {
    const survey = await makeSurvey();
    const template = await createEvaluationTemplate({
      name: "系统模板",
      surveyId: survey.id,
      anonymityThreshold: 3,
      relationshipRules: [{ type: "self", count: 1, required: true }],
      timeRule: { type: "relative", durationDays: 14 },
      isBuiltin: true,
    });

    await expect(archiveEvaluationTemplate(template.id)).rejects.toThrow("系统内置模板不能归档");
  });
});
