import { beforeEach, describe, expect, it } from "vitest";

import { createEmployee } from "@/lib/employees/service";
import {
  addEvaluationAssignment,
  addEvaluationSubject,
  createEvaluationCycle,
  publishEvaluationCycle,
  submitEvaluationAssignmentResponse,
} from "@/lib/evaluations/service";
import { buildSubjectReport } from "@/lib/evaluations/report-service";
import { createSurvey } from "@/lib/surveys/service";
import { resetDatabase } from "@/tests/helpers/reset-db";

describe("report service", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("aggregates rating answers per relationship and hides below threshold", async () => {
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

    const subject = await addEvaluationSubject(cycle.id, subjectEmployee.id);
    const assignment = await addEvaluationAssignment(cycle.id, {
      subjectId: subject.id,
      raterEmployeeId: peerEmployee.id,
      relationship: "peer",
    });

    await publishEvaluationCycle(cycle.id);

    await submitEvaluationAssignmentResponse(assignment.token, {
      answers: { "question_1": 4 },
      respondent_id: "test",
      duration_seconds: 10,
    });

    const report = await buildSubjectReport(subject.id);
    expect(report).not.toBeNull();
    expect(report!.subject.employeeName).toBe("张三");
    expect(report!.ratingQuestions).toHaveLength(1);

    const groups = report!.ratingQuestions[0].groups;
    const peerGroup = groups.find((g) => g.relationship === "peer");
    expect(peerGroup).toBeDefined();
    expect(peerGroup!.count).toBe(1);
    expect(peerGroup!.hidden).toBe(true); // below threshold 3
    expect(peerGroup!.average).toBe(0); // hidden data is zeroed
  });

  it("returns text answers for visible groups only", async () => {
    const survey = await createSurvey({
      title: "360 评价表",
      questions: [
        {
          type: "text",
          title: "优点与建议",
          required: false,
          orderIndex: 0,
          config: null,
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

    const managerEmployee = await createEmployee({
      name: "王经理",
      email: "wang@example.com",
      department: "研发部",
      title: "研发经理",
    });

    const cycle = await createEvaluationCycle({
      title: "2026 Q2 360",
      description: "管理干部环评",
      surveyId: survey.id,
      startsAt: null,
      endsAt: null,
      anonymityThreshold: 3,
    });

    const subject = await addEvaluationSubject(cycle.id, subjectEmployee.id);
    const assignment = await addEvaluationAssignment(cycle.id, {
      subjectId: subject.id,
      raterEmployeeId: managerEmployee.id,
      relationship: "manager",
    });

    await publishEvaluationCycle(cycle.id);

    await submitEvaluationAssignmentResponse(assignment.token, {
      answers: { "question_1": "工作认真负责" },
      respondent_id: "test",
      duration_seconds: 10,
    });

    const report = await buildSubjectReport(subject.id);
    expect(report).not.toBeNull();
    expect(report!.textQuestions).toHaveLength(1);

    const groups = report!.textQuestions[0].groups;
    const managerGroup = groups.find((g) => g.relationship === "manager");
    expect(managerGroup).toBeDefined();
    expect(managerGroup!.hidden).toBe(false);
    expect(managerGroup!.answers).toContain("工作认真负责");
  });

  it("does not expose rater identity in report output", async () => {
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
      surveyId: survey.id,
      startsAt: null,
      endsAt: null,
      anonymityThreshold: 3,
    });

    const subject = await addEvaluationSubject(cycle.id, subjectEmployee.id);
    const assignment = await addEvaluationAssignment(cycle.id, {
      subjectId: subject.id,
      raterEmployeeId: peerEmployee.id,
      relationship: "peer",
    });

    await publishEvaluationCycle(cycle.id);

    await submitEvaluationAssignmentResponse(assignment.token, {
      answers: { "question_1": 5 },
      respondent_id: "test",
      duration_seconds: 10,
    });

    const report = await buildSubjectReport(subject.id);
    const reportJson = JSON.stringify(report);
    expect(reportJson).not.toContain("李四");
    expect(reportJson).not.toContain("lisi@example.com");
  });
});
