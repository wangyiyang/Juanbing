import { beforeEach, describe, expect, it } from "vitest";

import { createEmployee } from "@/lib/employees/service";
import {
  addEvaluationAssignment,
  addEvaluationSubject,
  closeEvaluationCycle,
  createEvaluationCycle,
  getEvaluationCycleById,
  publishEvaluationCycle,
  submitEvaluationAssignmentResponse,
} from "@/lib/evaluations/service";
import { createSurvey } from "@/lib/surveys/service";
import { resetDatabase } from "@/tests/helpers/reset-db";

async function createCycleWithEmployees() {
  const survey = await createSurvey({
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

  const subjectEmployee = await createEmployee({
    name: "张三",
    email: "zhangsan@example.com",
    department: "研发部",
    title: "工程师",
  });

  const peerEmployee = await createEmployee({
    name: "李四",
    email: "lisi@example.com",
    department: "研发部",
    title: "工程师",
  });

  const cycle = await createEvaluationCycle({
    title: "2026 Q2 360",
    description: "管理干部环评",
    surveyId: survey.id,
    startsAt: null,
    endsAt: null,
    anonymityThreshold: 3,
  });

  return { survey, subjectEmployee, peerEmployee, cycle };
}

describe("evaluation service", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("creates a draft evaluation cycle bound to a survey", async () => {
    const survey = await createSurvey({
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

    const cycle = await createEvaluationCycle({
      title: "2026 Q2 360",
      description: "管理干部环评",
      surveyId: survey.id,
      startsAt: null,
      endsAt: null,
      anonymityThreshold: 3,
    });

    expect(cycle.status).toBe("draft");
    expect(cycle.surveyId).toBe(survey.id);
  });

  it("assigns a rater to a subject with a unique token", async () => {
    const context = await createCycleWithEmployees();
    const subject = await addEvaluationSubject(
      context.cycle.id,
      context.subjectEmployee.id,
    );

    const assignment = await addEvaluationAssignment(context.cycle.id, {
      subjectId: subject.id,
      raterEmployeeId: context.peerEmployee.id,
      relationship: "peer",
    });

    expect(assignment.token).toHaveLength(32);
    expect(assignment.status).toBe("pending");
  });

  it("publishes and closes an evaluation cycle", async () => {
    const context = await createCycleWithEmployees();

    await publishEvaluationCycle(context.cycle.id);
    expect((await getEvaluationCycleById(context.cycle.id))?.status).toBe(
      "active",
    );

    await closeEvaluationCycle(context.cycle.id);
    expect((await getEvaluationCycleById(context.cycle.id))?.status).toBe(
      "closed",
    );
  });

  it("rejects token submission for non-active cycle", async () => {
    const context = await createCycleWithEmployees();
    const subject = await addEvaluationSubject(
      context.cycle.id,
      context.subjectEmployee.id,
    );
    const assignment = await addEvaluationAssignment(context.cycle.id, {
      subjectId: subject.id,
      raterEmployeeId: context.peerEmployee.id,
      relationship: "peer",
    });

    await expect(
      submitEvaluationAssignmentResponse(assignment.token, {
        answers: { "question_1": 4 },
        respondent_id: "test",
        duration_seconds: 10,
      }),
    ).rejects.toThrow("评价项目尚未开始");
  });

  it("rejects duplicate token submission", async () => {
    const context = await createCycleWithEmployees();
    const subject = await addEvaluationSubject(
      context.cycle.id,
      context.subjectEmployee.id,
    );
    const assignment = await addEvaluationAssignment(context.cycle.id, {
      subjectId: subject.id,
      raterEmployeeId: context.peerEmployee.id,
      relationship: "peer",
    });

    await publishEvaluationCycle(context.cycle.id);

    await submitEvaluationAssignmentResponse(assignment.token, {
      answers: { "question_1": 4 },
      respondent_id: "test",
      duration_seconds: 10,
    });

    await expect(
      submitEvaluationAssignmentResponse(assignment.token, {
        answers: { "question_1": 4 },
        respondent_id: "test",
        duration_seconds: 10,
      }),
    ).rejects.toThrow("该评价任务已完成");
  });
});

import { createEvaluationTemplate } from "@/lib/evaluations/template-service";

describe("create cycle from template", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("should create cycle with templateId", async () => {
    const survey = await createSurvey({
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

    const template = await createEvaluationTemplate({
      name: "季度 360",
      surveyId: survey.id,
      anonymityThreshold: 5,
      relationshipRules: [{ type: "self", count: 1, required: true }],
      timeRule: { type: "relative", durationDays: 14 },
    });

    const cycle = await createEvaluationCycle({
      title: "2026 Q2",
      surveyId: survey.id,
      templateId: template.id,
    });

    expect(cycle.templateId).toBe(template.id);
  });

  it("should reject inactive template", async () => {
    const survey = await createSurvey({
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

    const template = await createEvaluationTemplate({
      name: "季度 360",
      surveyId: survey.id,
      anonymityThreshold: 5,
      relationshipRules: [{ type: "self", count: 1, required: true }],
      timeRule: { type: "relative", durationDays: 14 },
    });

    // Archive the template
    const { archiveEvaluationTemplate } = await import("@/lib/evaluations/template-service");
    await archiveEvaluationTemplate(template.id);

    await expect(
      createEvaluationCycle({
        title: "2026 Q2",
        surveyId: survey.id,
        templateId: template.id,
      })
    ).rejects.toThrow("模板不存在或已归档");
  });
});
