import { listSurveyResponses, toCsvRows } from "@/lib/analytics/service";
import { requireAdminSession } from "@/lib/auth/session";
import { buildCsv } from "@/lib/export/csv";
import { getSurveyById } from "@/lib/surveys/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdminSession();

  const { id } = await params;
  const survey = await getSurveyById(Number(id));

  if (!survey) {
    return new Response("问卷不存在", { status: 404 });
  }

  const responses = await listSurveyResponses(survey.id);
  const rows = toCsvRows(
    survey.questions.map((question) => ({
      id: question.id,
      title: question.title,
    })),
    responses,
  );
  const csv = buildCsv(rows);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"survey-${survey.id}.csv\"`,
    },
  });
}
