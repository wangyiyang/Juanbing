export type EmployeeStatus = "active" | "inactive";

export type EmployeeInput = {
  employeeNo?: string | null;
  name: string;
  email?: string | null;
  department?: string | null;
  title?: string | null;
  managerId?: number | null;
};

export type EmployeeDetail = EmployeeInput & {
  id: number;
  status: EmployeeStatus;
  createdAt: number;
  updatedAt: number;
};
