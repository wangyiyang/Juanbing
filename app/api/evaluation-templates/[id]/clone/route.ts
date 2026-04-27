import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { created, fromError } from "@/lib/http/responses";
import { cloneEvaluationTemplate } from "@/lib/evaluations/template-service";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    return created(await cloneEvaluationTemplate(Number(id)));
  } catch (error) {
    return fromError(error);
  }
}
