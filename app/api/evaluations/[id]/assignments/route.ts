import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { created, fromError } from "@/lib/http/responses";
import { addEvaluationAssignment } from "@/lib/evaluations/service";
import type { EvaluationAssignmentInput } from "@/lib/evaluations/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = (await request.json()) as EvaluationAssignmentInput;
    return created(await addEvaluationAssignment(Number(id), body));
  } catch (error) {
    return fromError(error);
  }
}
