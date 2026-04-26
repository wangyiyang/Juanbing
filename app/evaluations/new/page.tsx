import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { EvaluationForm } from "@/components/evaluations/evaluation-form";
import { requireAdminSession } from "@/lib/auth/session";
import { listSurveys } from "@/lib/surveys/service";

export default async function NewEvaluationPage() {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  const surveys = await listSurveys();

  return (
    <AdminShell title="新建 360 环评项目">
      <EvaluationForm surveys={surveys.map((s) => ({ id: s.id, title: s.title }))} />
    </AdminShell>
  );
}
