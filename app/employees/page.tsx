import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { EmployeeList } from "@/components/employees/employee-list";
import { requireAdminSession } from "@/lib/auth/session";
import { listEmployees } from "@/lib/employees/service";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  const { query, status } = await searchParams;
  const employees = await listEmployees(query, status);

  return (
    <AdminShell title="员工档案">
      <EmployeeList employees={employees} />
    </AdminShell>
  );
}
