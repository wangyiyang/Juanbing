import {
  findEmployeeById,
  insertEmployee,
  searchEmployees,
  setEmployeeStatus,
  updateEmployeeById,
} from "@/lib/employees/repository";
import type { EmployeeInput } from "@/lib/employees/types";
import { employeeInputSchema } from "@/lib/employees/validators";
import { ApiError } from "@/lib/http/api-error";

export async function createEmployee(input: EmployeeInput) {
  const parsed = employeeInputSchema.parse(input);
  const id = await insertEmployee(parsed);
  return (await findEmployeeById(id))!;
}

export async function updateEmployee(id: number, input: EmployeeInput) {
  const existing = await findEmployeeById(id);
  if (!existing) {
    throw new ApiError(404, "员工不存在");
  }
  const parsed = employeeInputSchema.parse(input);
  await updateEmployeeById(id, parsed);
  return (await findEmployeeById(id))!;
}

export async function deactivateEmployee(id: number) {
  const existing = await findEmployeeById(id);
  if (!existing) {
    throw new ApiError(404, "员工不存在");
  }
  await setEmployeeStatus(id, "inactive");
}

export async function listEmployees(query?: string, status?: string) {
  return searchEmployees(query, status);
}
