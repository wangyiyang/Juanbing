import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import {
  employees,
  evaluationAssignments,
  evaluationCycles,
  evaluationSubjects,
} from "@/lib/db/schema";
import { fromError, ok } from "@/lib/http/responses";
import { getSurveyById } from "@/lib/surveys/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const assignment = db
      .select()
      .from(evaluationAssignments)
      .where(eq(evaluationAssignments.token, token))
      .get();

    if (!assignment) {
      return fromError(new Error("评价链接不存在"));
    }

    const cycle = db
      .select()
      .from(evaluationCycles)
      .where(eq(evaluationCycles.id, assignment.cycleId))
      .get();

    if (!cycle) {
      return fromError(new Error("评价项目不存在"));
    }

    const subject = db
      .select()
      .from(evaluationSubjects)
      .where(eq(evaluationSubjects.id, assignment.subjectId))
      .get();

    const subjectEmployee = subject
      ? db
          .select()
          .from(employees)
          .where(eq(employees.id, subject.employeeId))
          .get()
      : undefined;

    const survey = await getSurveyById(cycle.surveyId);

    return ok({
      assignment: {
        token: assignment.token,
        status: assignment.status,
        relationship: assignment.relationship,
      },
      cycle: {
        title: cycle.title,
        status: cycle.status,
        endsAt: cycle.endsAt,
      },
      subject: {
        name: subjectEmployee?.name ?? "",
        department: subjectEmployee?.department ?? "",
        title: subjectEmployee?.title ?? "",
      },
      survey,
    });
  } catch (error) {
    return fromError(error);
  }
}
