import Papa from "papaparse";

import { db } from "@/lib/db/client";
import { employees } from "@/lib/db/schema";

export type EmployeeImportRow = {
  name: string;
  email?: string | null;
  department?: string | null;
  title?: string | null;
  managerEmail?: string | null;
  employeeNo?: string | null;
};

export type EmployeeImportResult = {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
  importedIds: number[];
};

export function parseEmployeeCsv(csvText: string): {
  rows: Array<Record<string, string>>;
  error?: string;
} {
  const normalized = csvText.replace(/^\uFEFF/, "");
  const parsed = Papa.parse<Record<string, string>>(normalized, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    return { rows: [], error: parsed.errors[0].message };
  }

  return { rows: parsed.data };
}

export async function importEmployees(
  rows: Array<Record<string, string>>,
): Promise<EmployeeImportResult> {
  const result: EmployeeImportResult = {
    success: 0,
    failed: 0,
    errors: [],
    importedIds: [],
  };

  const allEmployees = db.select().from(employees).all();
  const emailToId = new Map(
    allEmployees
      .filter((e) => e.email)
      .map((e) => [e.email!.toLowerCase(), e.id]),
  );
  const noToId = new Map(
    allEmployees
      .filter((e) => e.employeeNo)
      .map((e) => [e.employeeNo!.toLowerCase(), e.id]),
  );

  const toImport: EmployeeImportRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const name = row.name?.trim();

    if (!name) {
      result.failed++;
      result.errors.push({ row: rowNum, message: "姓名为必填项" });
      continue;
    }

    const email = row.email?.trim() || undefined;
    if (email) {
      const existingId = emailToId.get(email.toLowerCase());
      if (existingId !== undefined) {
        result.failed++;
        result.errors.push({ row: rowNum, message: `邮箱 ${email} 已存在` });
        continue;
      }
    }

    const employeeNo = row.employee_no?.trim() || row.employeeno?.trim() || undefined;
    if (employeeNo) {
      const existingId = noToId.get(employeeNo.toLowerCase());
      if (existingId !== undefined) {
        result.failed++;
        result.errors.push({ row: rowNum, message: `编号 ${employeeNo} 已存在` });
        continue;
      }
    }

    const managerEmail = row.manager_email?.trim() || row.manageremail?.trim() || undefined;

    toImport.push({
      name,
      email: email || null,
      department: row.department?.trim() || null,
      title: row.title?.trim() || null,
      managerEmail: managerEmail || null,
      employeeNo: employeeNo || null,
    });
  }

  if (toImport.length === 0) {
    return result;
  }

  const now = Math.floor(Date.now() / 1000);

  for (const item of toImport) {
    let managerId: number | null = null;
    if (item.managerEmail) {
      managerId = emailToId.get(item.managerEmail.toLowerCase()) ?? null;
    }

    try {
      const insertResult = db
        .insert(employees)
        .values({
          name: item.name,
          email: item.email,
          department: item.department,
          title: item.title,
          employeeNo: item.employeeNo,
          managerId,
          status: "active",
          createdAt: now,
          updatedAt: now,
        })
        .run();

      const id = Number(insertResult.lastInsertRowid);
      result.importedIds.push(id);
      result.success++;

      if (item.email) {
        emailToId.set(item.email.toLowerCase(), id);
      }
      if (item.employeeNo) {
        noToId.set(item.employeeNo.toLowerCase(), id);
      }
    } catch {
      result.failed++;
      result.errors.push({
        row: 0,
        message: `导入失败：${item.name}（可能是邮箱或编号重复）`,
      });
    }
  }

  return result;
}
