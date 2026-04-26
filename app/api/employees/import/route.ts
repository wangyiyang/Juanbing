import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/session";
import { fromError, ok } from "@/lib/http/responses";
import { importEmployees, parseEmployeeCsv } from "@/lib/employees/import";

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const body = (await request.json()) as { csvText: string };

    const { rows, error } = parseEmployeeCsv(body.csvText);
    if (error) {
      return fromError(new Error(error));
    }

    if (rows.length === 0) {
      return fromError(new Error("CSV 文件没有有效数据"));
    }

    const result = await importEmployees(rows);
    return ok(result);
  } catch (error) {
    return fromError(error);
  }
}
