import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { created, fromError, ok } from "@/lib/http/responses";
import {
  createEvaluationCycle,
  listEvaluationCycleSummaries,
} from "@/lib/evaluations/service";

export async function GET() {
  try {
    await requireAdminSession();
    return ok(await listEvaluationCycleSummaries());
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    return created(await createEvaluationCycle(await request.json()));
  } catch (error) {
    return fromError(error);
  }
}
