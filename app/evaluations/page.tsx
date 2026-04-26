import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { EvaluationList } from "@/components/evaluations/evaluation-list";
import { Button } from "@/components/ui/button";
import { requireAdminSession } from "@/lib/auth/session";
import { listEvaluationCycleSummaries } from "@/lib/evaluations/service";

export default async function EvaluationsPage() {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  const cycles = await listEvaluationCycleSummaries();

  return (
    <AdminShell
      title="360 环评"
      actions={
        <Button
          asChild
          className="bg-gradient-to-r from-indigo-500 to-violet-600 shadow-md hover:from-indigo-600 hover:to-violet-700"
        >
          <Link href="/evaluations/new">新建项目</Link>
        </Button>
      }
    >
      <EvaluationList cycles={cycles} />
    </AdminShell>
  );
}
