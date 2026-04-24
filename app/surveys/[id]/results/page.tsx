import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buildSurveyOverview, listSurveyResponses, toCsvRows } from "@/lib/analytics/service";
import { requireAdminSession } from "@/lib/auth/session";
import { AdminShell } from "@/components/layout/admin-shell";
import { RawDataTable } from "@/components/survey-results/raw-data-table";
import { ResultsOverview } from "@/components/survey-results/results-overview";
import { TrendChart } from "@/components/survey-results/trend-chart";
import { Button } from "@/components/ui/button";
import { getSurveyById } from "@/lib/surveys/service";

export default async function SurveyResultsPage({
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
  const survey = await getSurveyById(Number(id));

  if (!survey) {
    notFound();
  }

  const responses = await listSurveyResponses(survey.id);
  const overview = buildSurveyOverview(responses);
  const rows = toCsvRows(
    survey.questions.map((question) => ({
      id: question.id,
      title: question.title,
    })),
    responses,
  );

  return (
    <AdminShell
      title={`数据看板：${survey.title}`}
      actions={
        <Button asChild>
          <Link href={`/api/surveys/${survey.id}/export`}>导出 CSV</Link>
        </Button>
      }
    >
      <ResultsOverview
        averageDurationSeconds={overview.averageDurationSeconds}
        totalResponses={overview.totalResponses}
      />
      <TrendChart data={overview.trend} />
      <RawDataTable rows={rows} />
    </AdminShell>
  );
}
