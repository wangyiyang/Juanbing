import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { created, fromError } from "@/lib/http/responses";
import { addEvaluationSubject } from "@/lib/evaluations/service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = (await request.json()) as { employeeId: number };
    return created(await addEvaluationSubject(Number(id), body.employeeId));
  } catch (error) {
    return fromError(error);
  }
}
