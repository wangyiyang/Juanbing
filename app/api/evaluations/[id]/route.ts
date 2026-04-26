import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/http/responses";
import {
  getEvaluationCycleById,
  updateEvaluationCycle,
} from "@/lib/evaluations/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const cycle = await getEvaluationCycleById(Number(id));
    if (!cycle) {
      return fromError(new Error("评价项目不存在"));
    }
    return ok(cycle);
  } catch (error) {
    return fromError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await params;
    return ok(await updateEvaluationCycle(Number(id), await request.json()));
  } catch (error) {
    return fromError(error);
  }
}
