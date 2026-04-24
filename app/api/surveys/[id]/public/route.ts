import { fromError, ok } from "@/lib/http/responses";
import { getSurveyById } from "@/lib/surveys/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const survey = await getSurveyById(Number(id));

    if (!survey || survey.status !== "published") {
      return Response.json({ error: "问卷不可用" }, { status: 404 });
    }

    return ok(survey);
  } catch (error) {
    return fromError(error);
  }
}
