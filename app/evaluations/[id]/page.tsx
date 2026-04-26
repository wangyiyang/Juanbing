import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { ProgressOverview } from "@/components/evaluations/progress-overview";
import { SubjectAssignmentTable } from "@/components/evaluations/subject-assignment-table";
import { requireAdminSession } from "@/lib/auth/session";
import {
  getEvaluationCycleById,
  getAssignmentsByCycleId,
  getSubjectsByCycleId,
} from "@/lib/evaluations/service";
import { listEmployees } from "@/lib/employees/service";

export default async function EvaluationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  const { id } = await params;
  const cycleId = Number(id);
  const cycle = await getEvaluationCycleById(cycleId);

  if (!cycle) {
    redirect("/evaluations");
  }

  const subjects = await getSubjectsByCycleId(cycleId);
  const assignments = await getAssignmentsByCycleId(cycleId);
  const employees = await listEmployees();

  return (
    <AdminShell title={cycle.title}>
      <div className="space-y-6">
        <ProgressOverview
          cycle={cycle}
          subjects={subjects}
          assignments={assignments}
        />
        <SubjectAssignmentTable
          cycleId={cycleId}
          cycleStatus={cycle.status}
          subjects={subjects}
          assignments={assignments}
          employees={employees}
        />
      </div>
    </AdminShell>
  );
}
