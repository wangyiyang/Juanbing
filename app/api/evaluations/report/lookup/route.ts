import { NextRequest } from "next/server";

import { db } from "@/lib/db/client";
import { employees, evaluationCycles, evaluationSubjects } from "@/lib/db/schema";
import { fromError, ok } from "@/lib/http/responses";
import { createReportToken } from "@/lib/evaluations/report-token";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { employeeNo: string };
    const employeeNo = body.employeeNo?.trim();

    if (!employeeNo) {
      return fromError(new Error("请输入员工编号"));
    }

    const employee = db
      .select()
      .from(employees)
      .where(eq(employees.employeeNo, employeeNo))
      .get();

    if (!employee) {
      return fromError(new Error("员工编号不存在"));
    }

    const subjects = db
      .select({
        subjectId: evaluationSubjects.id,
        cycleId: evaluationSubjects.cycleId,
        cycleTitle: evaluationCycles.title,
        cycleStatus: evaluationCycles.status,
      })
      .from(evaluationSubjects)
      .innerJoin(
        evaluationCycles,
        eq(evaluationSubjects.cycleId, evaluationCycles.id),
      )
      .where(
        and(
          eq(evaluationSubjects.employeeId, employee.id),
          eq(evaluationCycles.status, "closed"),
        ),
      )
      .all();

    if (subjects.length === 0) {
      return fromError(new Error("该员工暂无已关闭的环评项目报告"));
    }

    const results = await Promise.all(
      subjects.map(async (s) => ({
        subjectId: s.subjectId,
        cycleId: s.cycleId,
        cycleTitle: s.cycleTitle,
        token: await createReportToken(s.subjectId, employeeNo),
      })),
    );

    return ok(results);
  } catch (error) {
    return fromError(error);
  }
}
