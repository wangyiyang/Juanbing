import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { SurveyList } from "@/components/surveys/survey-list";
import { Button } from "@/components/ui/button";
import { requireAdminSession } from "@/lib/auth/session";
import { listSurveys } from "@/lib/surveys/service";

export default async function SurveysPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  const { query, status } = await searchParams;
  const surveys = await listSurveys(query, status);

  return (
    <AdminShell
      title="问卷列表"
      actions={
        <Button
          asChild
          className="bg-gradient-to-r from-indigo-500 to-violet-600 shadow-md hover:from-indigo-600 hover:to-violet-700"
        >
          <Link href="/surveys/new">新建问卷</Link>
        </Button>
      }
    >
      <SurveyList surveys={surveys} />
    </AdminShell>
  );
}
