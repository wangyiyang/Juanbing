import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/lib/db/client";
import { surveys } from "@/lib/db/schema";
import {
  archiveEvaluationTemplate,
  findEvaluationTemplateById,
  insertEvaluationTemplate,
  listEvaluationTemplates,
  updateEvaluationTemplate,
} from "@/lib/evaluations/template-repository";
import { resetDatabase } from "@/tests/helpers/reset-db";

function createSurvey() {
  const result = db
    .insert(surveys)
    .values({
      title: "测试问卷",
      status: "published",
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .run();
  return Number(result.lastInsertRowid);
}

describe("template repository", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("should insert and find a template", async () => {
    const surveyId = createSurvey();
    const id = await insertEvaluationTemplate({
      name: "季度 360",
      description: "季度员工评价",
      surveyId,
      anonymityThreshold: 3,
      relationshipRules: JSON.stringify([{ type: "self", count: 1, required: true }]),
      timeRule: JSON.stringify({ type: "relative", durationDays: 14 }),
      isBuiltin: false,
      createdBy: null,
    });

    const found = await findEvaluationTemplateById(id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe("季度 360");
  });

  it("should list active templates", async () => {
    const surveyId = createSurvey();
    await insertEvaluationTemplate({
      name: "T1",
      description: null,
      surveyId,
      anonymityThreshold: 3,
      relationshipRules: "[]",
      timeRule: JSON.stringify({ type: "relative", durationDays: 14 }),
      isBuiltin: true,
      createdBy: null,
    });

    const list = await listEvaluationTemplates();
    expect(list).toHaveLength(1);
  });

  it("should filter templates by builtin", async () => {
    const surveyId = createSurvey();
    await insertEvaluationTemplate({
      name: "Builtin",
      description: null,
      surveyId,
      anonymityThreshold: 3,
      relationshipRules: "[]",
      timeRule: JSON.stringify({ type: "relative", durationDays: 14 }),
      isBuiltin: true,
      createdBy: null,
    });
    await insertEvaluationTemplate({
      name: "Custom",
      description: null,
      surveyId,
      anonymityThreshold: 3,
      relationshipRules: "[]",
      timeRule: JSON.stringify({ type: "relative", durationDays: 14 }),
      isBuiltin: false,
      createdBy: null,
    });

    const builtinList = await listEvaluationTemplates({ builtin: true });
    expect(builtinList).toHaveLength(1);
    expect(builtinList[0].name).toBe("Builtin");

    const customList = await listEvaluationTemplates({ builtin: false });
    expect(customList).toHaveLength(1);
    expect(customList[0].name).toBe("Custom");
  });

  it("should update a template", async () => {
    const surveyId = createSurvey();
    const id = await insertEvaluationTemplate({
      name: "T1",
      description: null,
      surveyId,
      anonymityThreshold: 3,
      relationshipRules: "[]",
      timeRule: JSON.stringify({ type: "relative", durationDays: 14 }),
      isBuiltin: false,
      createdBy: null,
    });

    await updateEvaluationTemplate(id, {
      name: "T1 Updated",
      description: "Updated desc",
      surveyId,
      anonymityThreshold: 5,
      relationshipRules: "[]",
      timeRule: JSON.stringify({ type: "relative", durationDays: 21 }),
    });

    const found = await findEvaluationTemplateById(id);
    expect(found!.name).toBe("T1 Updated");
    expect(found!.anonymityThreshold).toBe(5);
  });

  it("should archive a template", async () => {
    const surveyId = createSurvey();
    const id = await insertEvaluationTemplate({
      name: "T1",
      description: null,
      surveyId,
      anonymityThreshold: 3,
      relationshipRules: "[]",
      timeRule: JSON.stringify({ type: "relative", durationDays: 14 }),
      isBuiltin: false,
      createdBy: null,
    });

    await archiveEvaluationTemplate(id);
    const found = await findEvaluationTemplateById(id);
    expect(found!.status).toBe("archived");
  });

  it("should not list archived templates", async () => {
    const surveyId = createSurvey();
    const id = await insertEvaluationTemplate({
      name: "T1",
      description: null,
      surveyId,
      anonymityThreshold: 3,
      relationshipRules: "[]",
      timeRule: JSON.stringify({ type: "relative", durationDays: 14 }),
      isBuiltin: false,
      createdBy: null,
    });

    await archiveEvaluationTemplate(id);
    const list = await listEvaluationTemplates();
    expect(list).toHaveLength(0);
  });
});
