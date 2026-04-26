import { eq, like, or } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { employees } from "@/lib/db/schema";
import type {
  EmployeeDetail,
  EmployeeInput,
  EmployeeStatus,
} from "@/lib/employees/types";

export async function insertEmployee(input: EmployeeInput): Promise<number> {
  const now = Math.floor(Date.now() / 1000);

  const result = db
    .insert(employees)
    .values({
      employeeNo: input.employeeNo ?? null,
      name: input.name,
      email: input.email ?? null,
      department: input.department ?? null,
      title: input.title ?? null,
      managerId: input.managerId ?? null,
      status: "active",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return Number(result.lastInsertRowid);
}

export async function updateEmployeeById(
  id: number,
  input: EmployeeInput,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  db.update(employees)
    .set({
      employeeNo: input.employeeNo ?? null,
      name: input.name,
      email: input.email ?? null,
      department: input.department ?? null,
      title: input.title ?? null,
      managerId: input.managerId ?? null,
      updatedAt: now,
    })
    .where(eq(employees.id, id))
    .run();
}

export async function setEmployeeStatus(
  id: number,
  status: EmployeeStatus,
): Promise<void> {
  db.update(employees)
    .set({ status, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(employees.id, id))
    .run();
}

export async function findEmployeeById(
  id: number,
): Promise<EmployeeDetail | null> {
  const row = db.select().from(employees).where(eq(employees.id, id)).get();

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    employeeNo: row.employeeNo,
    name: row.name,
    email: row.email,
    department: row.department,
    title: row.title,
    managerId: row.managerId,
    status: row.status as EmployeeStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function searchEmployees(
  query?: string,
  status?: string,
): Promise<EmployeeDetail[]> {
  let conditions = undefined;

  if (query) {
    const queryPattern = `%${query}%`;
    conditions = or(
      like(employees.name, queryPattern),
      like(employees.email, queryPattern),
      like(employees.employeeNo, queryPattern),
      like(employees.department, queryPattern),
    );
  }

  if (status) {
    const statusCondition = eq(
      employees.status,
      status as "active" | "inactive",
    );
    conditions = conditions ? or(conditions, statusCondition) : statusCondition;
  }

  const rows = conditions
    ? db.select().from(employees).where(conditions).all()
    : db.select().from(employees).all();

  return rows.map((row) => ({
    id: row.id,
    employeeNo: row.employeeNo,
    name: row.name,
    email: row.email,
    department: row.department,
    title: row.title,
    managerId: row.managerId,
    status: row.status as EmployeeStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}
