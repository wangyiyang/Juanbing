import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/http/responses";
import {
  deleteSurvey,
  getSurveyById,
  updateSurvey,
} from "@/lib/surveys/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await params;
    return ok(await getSurveyById(Number(id)));
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
    return ok(await updateSurvey(Number(id), await request.json()));
  } catch (error) {
    return fromError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await params;
    await deleteSurvey(Number(id));
    return ok({ success: true });
  } catch (error) {
    return fromError(error);
  }
}
