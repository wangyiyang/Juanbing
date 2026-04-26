import { eq } from "drizzle-orm";

import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { employees, evaluationAssignments, evaluationCycles, evaluationSubjects } from "@/lib/db/schema";
import { buildCsv } from "@/lib/export/csv";
import { ApiError } from "@/lib/http/api-error";
import { fromError } from "@/lib/http/responses";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const cycleId = Number(id);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type !== "assignments") {
      throw new ApiError(400, "不支持的导出类型");
    }

    const cycle = db
      .select()
      .from(evaluationCycles)
      .where(eq(evaluationCycles.id, cycleId))
      .get();

    if (!cycle) {
      throw new ApiError(404, "评价项目不存在");
    }

    const assignments = db
      .select()
      .from(evaluationAssignments)
      .where(eq(evaluationAssignments.cycleId, cycleId))
      .all();

    const allSubjects = db
      .select()
      .from(evaluationSubjects)
      .where(eq(evaluationSubjects.cycleId, cycleId))
      .all();

    // Workaround: drizzle orm in this version may not support inArray for sqlite
    // We'll query all and filter in memory
    const allEmployees = db.select().from(employees).all();
    const employeeMap = new Map(allEmployees.map((e) => [e.id, e]));
    const subjectMap = new Map(allSubjects.map((s) => [s.id, s]));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const rows = assignments.map((a) => {
      const subject = subjectMap.get(a.subjectId);
      const subjectEmployee = subject
        ? employeeMap.get(subject.employeeId)
        : undefined;
      const rater = a.raterEmployeeId
        ? employeeMap.get(a.raterEmployeeId)
        : undefined;

      return {
        cycle_id: cycleId,
        cycle_title: cycle.title,
        subject_name: subjectEmployee?.name ?? "",
        rater_name: rater?.name ?? "",
        relationship: a.relationship,
        status: a.status,
        submitted_at: a.submittedAt
          ? new Date(a.submittedAt * 1000).toISOString()
          : "",
        fill_url: `${baseUrl}/evaluations/fill/${a.token}`,
      };
    });

    const csv = buildCsv(rows);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="evaluation-${cycleId}-assignments.csv"`,
      },
    });
  } catch (error) {
    return fromError(error);
  }
}
