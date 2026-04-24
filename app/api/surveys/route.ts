import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { created, fromError, ok } from "@/lib/http/responses";
import { createSurvey, listSurveys } from "@/lib/surveys/service";

export async function GET() {
  try {
    await requireAdminSession();
    return ok(await listSurveys());
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    return created(await createSurvey(await request.json()));
  } catch (error) {
    return fromError(error);
  }
}
