import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { created, fromError, ok } from "@/lib/http/responses";
import {
  createEvaluationTemplate,
  listEvaluationTemplates,
} from "@/lib/evaluations/template-service";
import { evaluationTemplateQuerySchema } from "@/lib/evaluations/template-validators";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const searchParams = request.nextUrl.searchParams;
    const parsed = evaluationTemplateQuerySchema.parse({
      builtin: searchParams.get("builtin") ?? undefined,
    });
    return ok(await listEvaluationTemplates(parsed));
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    return created(await createEvaluationTemplate(await request.json()));
  } catch (error) {
    return fromError(error);
  }
}
