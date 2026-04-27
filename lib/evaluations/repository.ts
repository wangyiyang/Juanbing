import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  employees,
  evaluationAssignments,
  evaluationCycles,
  evaluationSubjects,
} from "@/lib/db/schema";
import type {
  EvaluationAssignmentInput,
  EvaluationAssignmentStatus,
  EvaluationCycleInput,
  EvaluationCycleStatus,
  EvaluationRelationship,
} from "@/lib/evaluations/types";

export async function insertEvaluationCycle(
  input: EvaluationCycleInput,
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);

  const result = db
    .insert(evaluationCycles)
    .values({
      title: input.title,
      description: input.description ?? null,
      status: "draft",
      surveyId: input.surveyId,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      anonymityThreshold: input.anonymityThreshold ?? 3,
      templateId: input.templateId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return Number(result.lastInsertRowid);
}

export async function updateEvaluationCycleById(
  id: number,
  input: EvaluationCycleInput,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  db.update(evaluationCycles)
    .set({
      title: input.title,
      description: input.description ?? null,
      surveyId: input.surveyId,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      anonymityThreshold: input.anonymityThreshold ?? 3,
      updatedAt: now,
    })
    .where(eq(evaluationCycles.id, id))
    .run();
}

export async function findEvaluationCycleById(id: number) {
  return db
    .select()
    .from(evaluationCycles)
    .where(eq(evaluationCycles.id, id))
    .get();
}

export async function listEvaluationCycles() {
  return db
    .select()
    .from(evaluationCycles)
    .orderBy(evaluationCycles.createdAt)
    .all();
}

export async function setEvaluationCycleStatus(
  id: number,
  status: EvaluationCycleStatus,
): Promise<void> {
  db.update(evaluationCycles)
    .set({
      status,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(evaluationCycles.id, id))
    .run();
}

export async function insertEvaluationSubject(
  cycleId: number,
  employeeId: number,
): Promise<number> {
  const result = db
    .insert(evaluationSubjects)
    .values({
      cycleId,
      employeeId,
      status: "active",
      createdAt: Math.floor(Date.now() / 1000),
    })
    .run();

  return Number(result.lastInsertRowid);
}

export async function listEvaluationSubjects(cycleId: number) {
  return db
    .select()
    .from(evaluationSubjects)
    .where(eq(evaluationSubjects.cycleId, cycleId))
    .all();
}

export async function insertEvaluationAssignment(
  cycleId: number,
  input: EvaluationAssignmentInput,
  token: string,
): Promise<number> {
  const result = db
    .insert(evaluationAssignments)
    .values({
      cycleId,
      subjectId: input.subjectId,
      raterEmployeeId: input.raterEmployeeId,
      relationship: input.relationship,
      token,
      status: "pending",
      createdAt: Math.floor(Date.now() / 1000),
    })
    .run();

  return Number(result.lastInsertRowid);
}

export async function listEvaluationAssignments(cycleId: number) {
  return db
    .select()
    .from(evaluationAssignments)
    .where(eq(evaluationAssignments.cycleId, cycleId))
    .all();
}

export async function findAssignmentByToken(token: string) {
  return db
    .select()
    .from(evaluationAssignments)
    .where(eq(evaluationAssignments.token, token))
    .get();
}

export async function markAssignmentSubmitted(
  assignmentId: number,
  responseId: number,
): Promise<void> {
  db.update(evaluationAssignments)
    .set({
      status: "submitted" as EvaluationAssignmentStatus,
      responseId,
      submittedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(evaluationAssignments.id, assignmentId))
    .run();
}

export async function listAssignmentsBySubjectId(subjectId: number) {
  return db
    .select()
    .from(evaluationAssignments)
    .where(eq(evaluationAssignments.subjectId, subjectId))
    .all();
}

export async function findAssignmentBySubjectRaterRelationship(
  subjectId: number,
  raterEmployeeId: number | null,
  relationship: EvaluationRelationship,
) {
  const conditions = [
    eq(evaluationAssignments.subjectId, subjectId),
    eq(evaluationAssignments.relationship, relationship),
  ];

  if (raterEmployeeId === null) {
    conditions.push(isNull(evaluationAssignments.raterEmployeeId));
  } else {
    conditions.push(eq(evaluationAssignments.raterEmployeeId, raterEmployeeId));
  }

  return db
    .select()
    .from(evaluationAssignments)
    .where(and(...conditions))
    .get();
}

export async function findEmployeesByDepartment(
  department: string,
  excludeEmployeeId: number,
) {
  const rows = db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.department, department),
        eq(employees.status, "active"),
      ),
    )
    .all();
  return rows.filter((r) => r.id !== excludeEmployeeId);
}

export async function findDirectReportsByManagerId(managerId: number) {
  return db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.managerId, managerId),
        eq(employees.status, "active"),
      ),
    )
    .all();
}
