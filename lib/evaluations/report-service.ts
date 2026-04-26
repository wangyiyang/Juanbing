import { eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  employees,
  evaluationAssignments,
  evaluationCycles,
  evaluationSubjects,
  surveyResponses,
} from "@/lib/db/schema";
import { canShowRelationshipGroup } from "@/lib/evaluations/report-policy";
import type { EvaluationRelationship } from "@/lib/evaluations/types";
import { getSurveyById } from "@/lib/surveys/service";

export type SubjectReport = {
  subject: {
    id: number;
    employeeName: string;
    department: string | null;
    title: string | null;
  };
  cycle: {
    id: number;
    title: string;
    anonymityThreshold: number;
  };
  completion: {
    submittedAssignments: number;
    totalAssignments: number;
  };
  ratingQuestions: Array<{
    questionId: number;
    title: string;
    groups: Array<{
      relationship: EvaluationRelationship;
      average: number;
      count: number;
      hidden: boolean;
    }>;
  }>;
  textQuestions: Array<{
    questionId: number;
    title: string;
    groups: Array<{
      relationship: EvaluationRelationship;
      answers: string[];
      hidden: boolean;
    }>;
  }>;
};

export async function buildSubjectReport(
  subjectId: number,
): Promise<SubjectReport | null> {
  const subject = db
    .select()
    .from(evaluationSubjects)
    .where(eq(evaluationSubjects.id, subjectId))
    .get();

  if (!subject) {
    return null;
  }

  const employee = db
    .select()
    .from(employees)
    .where(eq(employees.id, subject.employeeId))
    .get();

  const cycle = db
    .select()
    .from(evaluationCycles)
    .where(eq(evaluationCycles.id, subject.cycleId))
    .get();

  if (!cycle) {
    return null;
  }

  const assignments = db
    .select()
    .from(evaluationAssignments)
    .where(eq(evaluationAssignments.subjectId, subjectId))
    .all();

  const submittedAssignments = assignments.filter(
    (a) => a.status === "submitted",
  );

  const responseIds = submittedAssignments
    .map((a) => a.responseId)
    .filter((id): id is number => id !== null);

  const responses =
    responseIds.length > 0
      ? db
          .select()
          .from(surveyResponses)
          .where(inArray(surveyResponses.id, responseIds))
          .all()
      : [];

  const survey = await getSurveyById(cycle.surveyId);

  const responseMap = new Map(responses.map((r) => [r.id, r]));
  const assignmentMap = new Map(assignments.map((a) => [a.id, a]));

  const ratingQuestions =
    survey?.questions.filter((q) => q.type === "rating") ?? [];
  const textQuestions =
    survey?.questions.filter((q) => q.type === "text") ?? [];

  const ratingResults: SubjectReport["ratingQuestions"] = [];
  const textResults: SubjectReport["textQuestions"] = [];

  for (const question of ratingQuestions) {
    const groups = new Map<
      EvaluationRelationship,
      { sum: number; count: number }
    >();

    for (const assignment of submittedAssignments) {
      const response = responseMap.get(assignment.responseId ?? 0);
      if (!response) continue;

      const answers = JSON.parse(response.answers) as Record<string, unknown>;
      const value = answers[`question_${question.id}`];
      if (typeof value === "number") {
        const rel = assignment.relationship as EvaluationRelationship;
        const existing = groups.get(rel) ?? { sum: 0, count: 0 };
        existing.sum += value;
        existing.count += 1;
        groups.set(rel, existing);
      }
    }

    const groupArray: SubjectReport["ratingQuestions"][0]["groups"] = [];
    for (const [relationship, data] of groups) {
      const visible = canShowRelationshipGroup(
        relationship,
        data.count,
        cycle.anonymityThreshold,
      );
      groupArray.push({
        relationship,
        average: data.count > 0 ? Math.round((data.sum / data.count) * 100) / 100 : 0,
        count: data.count,
        hidden: !visible,
      });
    }

    ratingResults.push({
      questionId: question.id,
      title: question.title,
      groups: groupArray,
    });
  }

  for (const question of textQuestions) {
    const groups = new Map<EvaluationRelationship, string[]>();

    for (const assignment of submittedAssignments) {
      const response = responseMap.get(assignment.responseId ?? 0);
      if (!response) continue;

      const answers = JSON.parse(response.answers) as Record<string, unknown>;
      const value = answers[`question_${question.id}`];
      if (typeof value === "string" && value.trim().length > 0) {
        const rel = assignment.relationship as EvaluationRelationship;
        const existing = groups.get(rel) ?? [];
        existing.push(value);
        groups.set(rel, existing);
      }
    }

    const groupArray: SubjectReport["textQuestions"][0]["groups"] = [];
    for (const [relationship, answers] of groups) {
      const visible = canShowRelationshipGroup(
        relationship,
        answers.length,
        cycle.anonymityThreshold,
      );
      groupArray.push({
        relationship,
        answers,
        hidden: !visible,
      });
    }

    textResults.push({
      questionId: question.id,
      title: question.title,
      groups: groupArray,
    });
  }

  return {
    subject: {
      id: subject.id,
      employeeName: employee?.name ?? "",
      department: employee?.department ?? null,
      title: employee?.title ?? null,
    },
    cycle: {
      id: cycle.id,
      title: cycle.title,
      anonymityThreshold: cycle.anonymityThreshold,
    },
    completion: {
      submittedAssignments: submittedAssignments.length,
      totalAssignments: assignments.length,
    },
    ratingQuestions: ratingResults,
    textQuestions: textResults,
  };
}
