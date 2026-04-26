import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { created, fromError, ok } from "@/lib/http/responses";
import { createEmployee, listEmployees } from "@/lib/employees/service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    return ok(await listEmployees(query, status));
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    return created(await createEmployee(await request.json()));
  } catch (error) {
    return fromError(error);
  }
}
