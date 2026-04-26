import { findEmployeeById } from "@/lib/employees/repository";
import { db } from "@/lib/db/client";
import { surveyResponses } from "@/lib/db/schema";
import { ApiError } from "@/lib/http/api-error";
import {
  findAssignmentByToken,
  findEvaluationCycleById,
  insertEvaluationAssignment,
  insertEvaluationCycle,
  insertEvaluationSubject,
  listEvaluationAssignments,
  listEvaluationCycles,
  listEvaluationSubjects,
  markAssignmentSubmitted,
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

  const token = generateEvaluationToken();
  const id = await insertEvaluationAssignment(cycleId, parsed, token);
  const assignments = await listEvaluationAssignments(cycleId);
  return assignments.find((a) => a.id === id)!;
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

  if (cycle.endsAt && Math.floor(Date.now() / 1000) > cycle.endsAt) {
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

  const result = db
    .insert(surveyResponses)
    .values({
      surveyId: cycle.surveyId,
      answers: JSON.stringify(answers),
      respondentId: `evaluation-assignment:${assignment.id}`,
      durationSeconds: parsed.duration_seconds ?? null,
      createdAt: Math.floor(Date.now() / 1000),
    })
    .run();

  const responseId = Number(result.lastInsertRowid);
  await markAssignmentSubmitted(assignment.id, responseId);

  return { success: true };
}
