import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { SubjectReport } from "@/components/evaluations/subject-report";
import { requireAdminSession } from "@/lib/auth/session";
import { buildSubjectReport } from "@/lib/evaluations/report-service";

export default async function SubjectReportPage({
  params,
}: {
  params: Promise<{ id: string; subjectId: string }>;
}) {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  const { subjectId } = await params;
  const report = await buildSubjectReport(Number(subjectId));

  if (!report) {
    redirect("/evaluations");
  }

  return (
    <AdminShell title={`${report.subject.employeeName} - 360 报告`}>
      <SubjectReport report={report} />
    </AdminShell>
  );
}
