import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/http/responses";
import {
  deactivateEmployee,
  updateEmployee,
} from "@/lib/employees/service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const { id } = await params;
    return ok(await updateEmployee(Number(id), await request.json()));
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
    await deactivateEmployee(Number(id));
    return ok({ success: true });
  } catch (error) {
    return fromError(error);
  }
}
