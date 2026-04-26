import { NextRequest } from "next/server";

import { fromError, ok } from "@/lib/http/responses";
import { submitEvaluationAssignmentResponse } from "@/lib/evaluations/service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const body = await request.json();
    await submitEvaluationAssignmentResponse(token, body);
    return ok({ success: true });
  } catch (error) {
    return fromError(error);
  }
}
