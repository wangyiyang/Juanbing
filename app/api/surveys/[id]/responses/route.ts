import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { listSurveyResponses } from "@/lib/analytics/service";
import { fromError, ok } from "@/lib/http/responses";
import { publicSubmissionLimiter } from "@/lib/security/rate-limit";
import { submitSurveyResponse } from "@/lib/surveys/response-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await params;
    return ok(await listSurveyResponses(Number(id)));
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const preview = request.nextUrl.searchParams.get("preview") === "1";
    let isAdminPreview = false;

    if (preview) {
      await requireAdminSession();
      isAdminPreview = true;
    } else {
      const forwardedFor = request.headers.get("x-forwarded-for");
      const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

      if (!publicSubmissionLimiter.consume(ip)) {
        return Response.json(
          { error: "提交过于频繁，请稍后再试" },
          { status: 429 },
        );
      }
    }

    return ok(
      await submitSurveyResponse({
        surveyId: Number(id),
        payload: await request.json(),
        preview,
        isAdminPreview,
      }),
    );
  } catch (error) {
    return fromError(error);
  }
}
