import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/http/responses";
import {
  closeEvaluationCycle,
  publishEvaluationCycle,
} from "@/lib/evaluations/service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = (await request.json()) as { status: "active" | "closed" };

    if (body.status === "active") {
      return ok(await publishEvaluationCycle(Number(id)));
    }
    if (body.status === "closed") {
      return ok(await closeEvaluationCycle(Number(id)));
    }

    return fromError(new Error("无效的状态"));
  } catch (error) {
    return fromError(error);
  }
}
