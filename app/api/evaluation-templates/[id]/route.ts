import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { fromError, noContent, ok } from "@/lib/http/responses";
import {
  archiveEvaluationTemplate,
  getEvaluationTemplateById,
  updateEvaluationTemplate,
} from "@/lib/evaluations/template-service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const template = await getEvaluationTemplateById(Number(id));
    if (!template) {
      return fromError({ status: 404, message: "模板不存在" });
    }
    return ok(template);
  } catch (error) {
    return fromError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    return ok(await updateEvaluationTemplate(Number(id), await request.json()));
  } catch (error) {
    return fromError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await archiveEvaluationTemplate(Number(id));
    return noContent();
  } catch (error) {
    return fromError(error);
  }
}
