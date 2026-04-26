import { requireAdminSession } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/http/responses";
import { buildSubjectReport } from "@/lib/evaluations/report-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ subjectId: string }> },
) {
  try {
    await requireAdminSession();
    const { subjectId } = await params;
    const report = await buildSubjectReport(Number(subjectId));
    if (!report) {
      return fromError(new Error("报告不存在"));
    }
    return ok(report);
  } catch (error) {
    return fromError(error);
  }
}
