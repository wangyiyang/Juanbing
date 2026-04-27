import { and, eq } from "drizzle-orm";

import { findEmployeeById } from "@/lib/employees/repository";
import { db } from "@/lib/db/client";
import { evaluationAssignments, surveyResponses } from "@/lib/db/schema";
import { ApiError } from "@/lib/http/api-error";
import {
  findAssignmentBySubjectRaterRelationship,
  findAssignmentByToken,
  findDirectReportsByManagerId,
  findEmployeesByDepartment,
  findEvaluationCycleById,
  insertEvaluationAssignment,
  insertEvaluationCycle,
  insertEvaluationSubject,
  listEvaluationAssignments,
  listEvaluationCycles,
  listEvaluationSubjects,
  setEvaluationCycleStatus,
  updateEvaluationCycleById,
} from "@/lib/evaluations/repository";
import { generateEvaluationToken } from "@/lib/evaluations/token";
import type {
  EvaluationAssignmentInput,
  EvaluationCycleInput,
} from "@/lib/evaluations/types";
import {
  evaluationAssignmentInputSchema,
  evaluationCycleInputSchema,
} from "@/lib/evaluations/validators";
import { getSurveyById } from "@/lib/surveys/service";
import { getEvaluationTemplateById } from "./template-service";
import { submitResponsePayloadSchema, validateAnswersAgainstSurvey } from "@/lib/surveys/validators";
import { sanitizePlainText } from "@/lib/security/sanitize";
import type { SurveyAnswerValue } from "@/lib/surveys/types";

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

export async function createEvaluationCycle(input: EvaluationCycleInput) {
  const parsed = evaluationCycleInputSchema.parse(input);
  const survey = await getSurveyById(parsed.surveyId);
  if (!survey) {
    throw new ApiError(404, "问卷不存在");
  }

  if (parsed.templateId) {
    const template = await getEvaluationTemplateById(parsed.templateId);
    if (!template || template.status !== "active") {
      throw new ApiError(404, "模板不存在或已归档");
    }
  }

  const id = await insertEvaluationCycle(parsed);
  return (await findEvaluationCycleById(id))!;
}

export async function updateEvaluationCycle(
  id: number,
  input: EvaluationCycleInput,
) {
  const existing = await findEvaluationCycleById(id);
  if (!existing) {
    throw new ApiError(404, "评价项目不存在");
  }
  if (existing.status === "closed") {
    throw new ApiError(409, "已关闭的评价项目不能修改");
  }
  const parsed = evaluationCycleInputSchema.parse(input);
  const survey = await getSurveyById(parsed.surveyId);
  if (!survey) {
    throw new ApiError(404, "问卷不存在");
  }
  await updateEvaluationCycleById(id, parsed);
  return (await findEvaluationCycleById(id))!;
}

export async function getEvaluationCycleById(id: number) {
  return findEvaluationCycleById(id);
}

export async function listEvaluationCycleSummaries() {
  return listEvaluationCycles();
}

export async function publishEvaluationCycle(id: number) {
  const existing = await findEvaluationCycleById(id);
  if (!existing) {
    throw new ApiError(404, "评价项目不存在");
  }
  if (existing.status !== "draft") {
    throw new ApiError(409, "只能发布草稿状态的项目");
  }
  await setEvaluationCycleStatus(id, "active");
  return (await findEvaluationCycleById(id))!;
}

export async function closeEvaluationCycle(id: number) {
  const existing = await findEvaluationCycleById(id);
  if (!existing) {
    throw new ApiError(404, "评价项目不存在");
  }
  await setEvaluationCycleStatus(id, "closed");
  return (await findEvaluationCycleById(id))!;
}

export async function addEvaluationSubject(cycleId: number, employeeId: number) {
  const cycle = await findEvaluationCycleById(cycleId);
  if (!cycle) {
    throw new ApiError(404, "评价项目不存在");
  }
  const employee = await findEmployeeById(employeeId);
  if (!employee) {
    throw new ApiError(404, "员工不存在");
  }
  if (employee.status !== "active") {
    throw new ApiError(409, "不能选择已停用员工作为被评人");
  }
  const id = await insertEvaluationSubject(cycleId, employeeId);
  const subjects = await listEvaluationSubjects(cycleId);
  return subjects.find((s) => s.id === id)!;
}

export async function addEvaluationAssignment(
  cycleId: number,
  input: EvaluationAssignmentInput,
) {
  const cycle = await findEvaluationCycleById(cycleId);
  if (!cycle) {
    throw new ApiError(404, "评价项目不存在");
  }
  const parsed = evaluationAssignmentInputSchema.parse(input);

  const subjects = await listEvaluationSubjects(cycleId);
  const subject = subjects.find((s) => s.id === parsed.subjectId);
  if (!subject) {
    throw new ApiError(404, "被评人不存在");
  }

  if (parsed.raterEmployeeId !== null) {
    const rater = await findEmployeeById(parsed.raterEmployeeId);
    if (!rater) {
      throw new ApiError(404, "评价人不存在");
    }
    if (rater.status !== "active") {
      throw new ApiError(409, "不能选择已停用员工作为评价人");
    }
  }

  const existing = await findAssignmentBySubjectRaterRelationship(
    parsed.subjectId,
    parsed.raterEmployeeId,
    parsed.relationship,
  );
  if (existing) {
    throw new ApiError(409, "该评价任务已存在");
  }

  const token = generateEvaluationToken();
  const id = await insertEvaluationAssignment(cycleId, parsed, token);
  const assignments = await listEvaluationAssignments(cycleId);
  return assignments.find((a) => a.id === id)!;
}

export type BatchAssignmentRules = {
  self?: boolean;
  manager?: boolean;
  peerCount?: number;
  directReportCount?: number;
};

export type BatchAssignmentResult = {
  created: number;
  skipped: number;
  failed: number;
  details: Array<{
    subjectId: number;
    relationship: string;
    status: "created" | "skipped" | "failed";
    message?: string;
  }>;
};

export async function batchGenerateAssignments(
  cycleId: number,
  subjectIds: number[],
  rules: BatchAssignmentRules,
): Promise<BatchAssignmentResult> {
  const cycle = await findEvaluationCycleById(cycleId);
  if (!cycle) {
    throw new ApiError(404, "评价项目不存在");
  }

  const allSubjects = await listEvaluationSubjects(cycleId);
  const subjects = allSubjects.filter((s) => subjectIds.includes(s.id));
  if (subjects.length === 0) {
    throw new ApiError(400, "没有有效的被评人");
  }

  const result: BatchAssignmentResult = {
    created: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  for (const subject of subjects) {
    const subjectEmployee = await findEmployeeById(subject.employeeId);
    if (!subjectEmployee || subjectEmployee.status !== "active") {
      result.failed++;
      result.details.push({
        subjectId: subject.id,
        relationship: "",
        status: "failed",
        message: "被评人员工不存在或已停用",
      });
      continue;
    }

    // Self evaluation
    if (rules.self) {
      const existing = await findAssignmentBySubjectRaterRelationship(
        subject.id,
        subject.employeeId,
        "self",
      );
      if (existing) {
        result.skipped++;
        result.details.push({
          subjectId: subject.id,
          relationship: "self",
          status: "skipped",
        });
      } else {
        try {
          const token = generateEvaluationToken();
          await insertEvaluationAssignment(
            cycleId,
            { subjectId: subject.id, raterEmployeeId: subject.employeeId, relationship: "self" },
            token,
          );
          result.created++;
          result.details.push({
            subjectId: subject.id,
            relationship: "self",
            status: "created",
          });
        } catch {
          result.failed++;
          result.details.push({
            subjectId: subject.id,
            relationship: "self",
            status: "failed",
            message: "插入失败",
          });
        }
      }
    }

    // Manager evaluation
    if (rules.manager && subjectEmployee.managerId) {
      const existing = await findAssignmentBySubjectRaterRelationship(
        subject.id,
        subjectEmployee.managerId,
        "manager",
      );
      if (existing) {
        result.skipped++;
        result.details.push({
          subjectId: subject.id,
          relationship: "manager",
          status: "skipped",
        });
      } else {
        const manager = await findEmployeeById(subjectEmployee.managerId);
        if (manager && manager.status === "active") {
          try {
            const token = generateEvaluationToken();
            await insertEvaluationAssignment(
              cycleId,
              { subjectId: subject.id, raterEmployeeId: manager.id, relationship: "manager" },
              token,
            );
            result.created++;
            result.details.push({
              subjectId: subject.id,
              relationship: "manager",
              status: "created",
            });
          } catch {
            result.failed++;
            result.details.push({
              subjectId: subject.id,
              relationship: "manager",
              status: "failed",
              message: "插入失败",
            });
          }
        } else {
          result.failed++;
          result.details.push({
            subjectId: subject.id,
            relationship: "manager",
            status: "failed",
            message: "上级不存在或已停用",
          });
        }
      }
    }

    // Peer evaluations
    if (rules.peerCount && rules.peerCount > 0 && subjectEmployee.department) {
      const peers = await findEmployeesByDepartment(
        subjectEmployee.department,
        subject.employeeId,
      );
      const shuffled = peers.sort(() => Math.random() - 0.5);
      const selectedPeers = shuffled.slice(0, rules.peerCount);

      for (const peer of selectedPeers) {
        const existing = await findAssignmentBySubjectRaterRelationship(
          subject.id,
          peer.id,
          "peer",
        );
        if (existing) {
          result.skipped++;
          result.details.push({
            subjectId: subject.id,
            relationship: "peer",
            status: "skipped",
          });
        } else {
          try {
            const token = generateEvaluationToken();
            await insertEvaluationAssignment(
              cycleId,
              { subjectId: subject.id, raterEmployeeId: peer.id, relationship: "peer" },
              token,
            );
            result.created++;
            result.details.push({
              subjectId: subject.id,
              relationship: "peer",
              status: "created",
            });
          } catch {
            result.failed++;
            result.details.push({
              subjectId: subject.id,
              relationship: "peer",
              status: "failed",
              message: "插入失败",
            });
          }
        }
      }

      if (selectedPeers.length < rules.peerCount) {
        result.details.push({
          subjectId: subject.id,
          relationship: "peer",
          status: "failed",
          message: `部门人数不足，实际抽取 ${selectedPeers.length} 人`,
        });
      }
    }

    // Direct report evaluations
    if (rules.directReportCount && rules.directReportCount > 0) {
      const reports = await findDirectReportsByManagerId(subject.employeeId);
      const selectedReports = reports.slice(0, rules.directReportCount);

      for (const report of selectedReports) {
        const existing = await findAssignmentBySubjectRaterRelationship(
          subject.id,
          report.id,
          "direct_report",
        );
        if (existing) {
          result.skipped++;
          result.details.push({
            subjectId: subject.id,
            relationship: "direct_report",
            status: "skipped",
          });
        } else {
          try {
            const token = generateEvaluationToken();
            await insertEvaluationAssignment(
              cycleId,
              { subjectId: subject.id, raterEmployeeId: report.id, relationship: "direct_report" },
              token,
            );
            result.created++;
            result.details.push({
              subjectId: subject.id,
              relationship: "direct_report",
              status: "created",
            });
          } catch {
            result.failed++;
            result.details.push({
              subjectId: subject.id,
              relationship: "direct_report",
              status: "failed",
              message: "插入失败",
            });
          }
        }
      }

      if (selectedReports.length < rules.directReportCount) {
        result.details.push({
          subjectId: subject.id,
          relationship: "direct_report",
          status: "failed",
          message: `下属人数不足，实际抽取 ${selectedReports.length} 人`,
        });
      }
    }
  }

  return result;
}

export async function getAssignmentsByCycleId(cycleId: number) {
  return listEvaluationAssignments(cycleId);
}

export async function getSubjectsByCycleId(cycleId: number) {
  return listEvaluationSubjects(cycleId);
}

export async function getAssignmentByToken(token: string) {
  return findAssignmentByToken(token);
}

export async function submitEvaluationAssignmentResponse(
  token: string,
  payload: unknown,
) {
  const assignment = await findAssignmentByToken(token);
  if (!assignment) {
    throw new ApiError(404, "评价链接不存在");
  }

  const cycle = await findEvaluationCycleById(assignment.cycleId);
  if (!cycle) {
    throw new ApiError(404, "评价项目不存在");
  }

  if (cycle.status !== "active") {
    throw new ApiError(403, "评价项目尚未开始");
  }

  const now = Math.floor(Date.now() / 1000);

  if (cycle.startsAt && now < cycle.startsAt) {
    throw new ApiError(403, "评价项目尚未开始");
  }

  if (cycle.endsAt && now > cycle.endsAt) {
    throw new ApiError(403, "评价项目已结束");
  }

  if (assignment.status === "submitted") {
    throw new ApiError(409, "该评价任务已完成");
  }

  const parsed = submitResponsePayloadSchema.parse(payload);
  const survey = await getSurveyById(cycle.surveyId);
  if (!survey) {
    throw new ApiError(404, "问卷不存在");
  }

  validateAnswersAgainstSurvey(survey, parsed.answers);

  const answers = Object.fromEntries(
    Object.entries(parsed.answers).map(([key, value]) => [
      key,
      sanitizeAnswerValue(value),
    ]),
  );

  return db.transaction((tx) => {
    const result = tx
      .insert(surveyResponses)
      .values({
        surveyId: cycle.surveyId,
        answers: JSON.stringify(answers),
        respondentId: `evaluation-assignment:${assignment.id}`,
        durationSeconds: parsed.duration_seconds ?? null,
        createdAt: now,
      })
      .run();

    const responseId = Number(result.lastInsertRowid);

    const updateResult = tx
      .update(evaluationAssignments)
      .set({
        status: "submitted",
        responseId,
        submittedAt: now,
      })
      .where(
        and(
          eq(evaluationAssignments.id, assignment.id),
          eq(evaluationAssignments.status, "pending"),
        ),
      )
      .run();

    if (updateResult.changes === 0) {
      throw new ApiError(409, "该评价任务已完成");
    }

    return { success: true };
  });
}
